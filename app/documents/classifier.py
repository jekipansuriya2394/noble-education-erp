"""Automated Student Document Classification and Entity Extraction Pipeline using Vision/OCR and LLM."""

import io
import json
import logging
import re
from typing import Dict, Any, Optional, Literal, Union
from pydantic import BaseModel, Field

from app.services.ollama_client import ollama_client
from app.documents.ocr import ocr_engine

logger = logging.getLogger("erp_classifier")


class StudentDocumentEntity(BaseModel):
    """Normalized, validated student document entity schema ready for database persistence."""
    document_type: Literal[
        "transfer_certificate",
        "medical_report",
        "birth_certificate",
        "report_card",
        "immunization_record",
        "other",
    ] = Field(
        ...,
        description="Categorical document classification",
    )
    confidence: float = Field(
        default=0.95,
        ge=0.0,
        le=1.0,
        description="Model confidence score in classification",
    )
    student_name: Optional[str] = Field(
        default=None,
        description="Full legal name of the student identified in the document",
    )
    date_of_birth: Optional[str] = Field(
        default=None,
        description="Student Date of Birth (normalized or as printed)",
    )
    issuing_authority: Optional[str] = Field(
        default=None,
        description="School, hospital, board, or government department that issued the document",
    )
    document_date: Optional[str] = Field(
        default=None,
        description="Date when the certificate or report was issued",
    )
    document_id_number: Optional[str] = Field(
        default=None,
        description="Official certificate number, admission number, or registration serial",
    )
    key_findings_or_notes: Optional[str] = Field(
        default=None,
        description="Relevant medical notes, previous grade conduct, or transfer clearance details",
    )
    extracted_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Supplemental key-value pairs parsed from the document",
    )


CLASSIFICATION_SYSTEM_PROMPT = """You are an expert AI Document Analysis and NLP Information Extraction Engine for a School ERP.
Your task is to analyze the provided OCR/text extraction of an uploaded student record and output a single, strictly valid JSON object matching this schema:

{
  "document_type": "transfer_certificate" | "medical_report" | "birth_certificate" | "report_card" | "immunization_record" | "other",
  "confidence": 0.95,
  "student_name": "Full Student Name",
  "date_of_birth": "YYYY-MM-DD or DD/MM/YYYY",
  "issuing_authority": "Name of School / Clinic / Authority",
  "document_date": "YYYY-MM-DD or DD/MM/YYYY",
  "document_id_number": "Certificate / TC / Serial Number",
  "key_findings_or_notes": "Summary of conduct, medical flags, or transfer remarks",
  "extracted_metadata": {}
}

Return ONLY the raw JSON object. Do not include markdown codeblocks or conversational text.
"""


class DocumentClassifier:
    """Classifies uploaded student PDFs/images and extracts normalized entities."""

    def __init__(self):
        self.ocr = ocr_engine
        self.ollama = ollama_client

    async def classify_and_extract(
        self,
        file_source: Union[str, bytes, io.BytesIO],
        file_name: str = "document.pdf",
    ) -> StudentDocumentEntity:
        """Extract text/OCR from document and run zero-shot classification and entity extraction.
        
        Args:
            file_source: PDF or image bytes, filepath, or stream.
            file_name: Name of the uploaded file.
            
        Returns:
            Validated StudentDocumentEntity Pydantic object.
        """
        logger.info(f"Classifying student document '{file_name}'...")

        # 1. Extract raw text from document
        raw_text = ""
        is_pdf = (
            file_name.lower().endswith(".pdf")
            or (isinstance(file_source, bytes) and file_source.startswith(b"%PDF"))
            or (isinstance(file_source, str) and file_source.lower().endswith(".pdf"))
        )
        is_txt = (
            file_name.lower().endswith((".txt", ".text", ".csv", ".json", ".md"))
            or (isinstance(file_source, str) and file_source.lower().endswith((".txt", ".text", ".csv", ".json", ".md")))
        )

        if is_pdf:
            pages = self.ocr.extract_text_from_pdf(file_source)
            raw_text = "\n\n".join([p["text"] for p in pages if p.get("text")])
        elif is_txt:
            if isinstance(file_source, bytes):
                raw_text = file_source.decode("utf-8", errors="ignore")
            elif isinstance(file_source, io.BytesIO):
                raw_text = file_source.getvalue().decode("utf-8", errors="ignore")
            elif isinstance(file_source, str) and os.path.exists(file_source):
                with open(file_source, "r", encoding="utf-8", errors="ignore") as f:
                    raw_text = f.read()
            elif isinstance(file_source, str):
                raw_text = file_source
        elif isinstance(file_source, str) and not os.path.exists(file_source):
            # Direct string content passed in
            raw_text = file_source
        else:
            try:
                raw_text = self.ocr.extract_text_from_image(file_source)
            except Exception as ocr_err:
                # If image parsing fails (e.g. text bytes passed with dummy name), fallback to utf-8 decode
                if isinstance(file_source, bytes):
                    raw_text = file_source.decode("utf-8", errors="ignore")
                else:
                    logger.warning(f"OCR extraction failed for '{file_name}': {ocr_err}")
                    raw_text = ""

        if not raw_text.strip():
            logger.warning(f"No legible text could be extracted from '{file_name}'.")
            return StudentDocumentEntity(
                document_type="other",
                confidence=0.1,
                key_findings_or_notes=f"Empty or unreadable document: {file_name}",
            )

        # 2. Call local Ollama Llama 3 for structured entity extraction
        try:
            health = await self.ollama.check_health()
            if health.get("status") == "online":
                user_msg = f"DOCUMENT FILENAME: {file_name}\n\nEXTRACTED OCR TEXT:\n\"\"\"\n{raw_text[:3500]}\n\"\"\""
                response = await self.ollama.chat(
                    messages=[
                        {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT},
                        {"role": "user", "content": user_msg},
                    ],
                    tools=None,
                    temperature=0.1,
                )
                clean_json_str = self._clean_json_response(response.content or "")
                return StudentDocumentEntity.model_validate_json(clean_json_str)
            else:
                logger.warning("Ollama is offline. Executing heuristic rule-based entity extractor.")
                return self._heuristic_extractor(raw_text, file_name)

        except Exception as e:
            logger.exception(f"Error during LLM classification: {e}. Using heuristic entity extractor.")
            return self._heuristic_extractor(raw_text, file_name)

    def _clean_json_response(self, text: str) -> str:
        """Strip markdown fences or conversational preambles from LLM response."""
        text = text.strip()
        # Remove ```json ... ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            return match.group(1).strip()
        # Or locate first { and last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return text[start : end + 1]
        return text

    def _heuristic_extractor(self, text: str, file_name: str) -> StudentDocumentEntity:
        """Deterministic rule-based entity extraction fallback for offline or testing mode."""
        text_lower = text.lower()

        # 1. Document Type Detection
        doc_type: Literal[
            "transfer_certificate",
            "medical_report",
            "birth_certificate",
            "report_card",
            "immunization_record",
            "other",
        ] = "other"
        confidence = 0.85

        if any(k in text_lower for k in ["transfer certificate", "leaving certificate", "school transfer"]):
            doc_type = "transfer_certificate"
            confidence = 0.96
        elif any(k in text_lower for k in ["medical report", "health examination", "physician certificate", "clinical"]):
            doc_type = "medical_report"
            confidence = 0.94
        elif any(k in text_lower for k in ["birth certificate", "date of birth", "register of births"]):
            doc_type = "birth_certificate"
            confidence = 0.95
        elif any(k in text_lower for k in ["report card", "academic progress", "transcript", "term grades"]):
            doc_type = "report_card"
            confidence = 0.92
        elif any(k in text_lower for k in ["immunization", "vaccination record", "vaccine"]):
            doc_type = "immunization_record"
            confidence = 0.95

        # 2. Extract Student Name
        student_name = None
        name_match = re.search(
            r"(?:Student Name|Pupil'?s? Name|Name of Student|Name)\s*[:\-]\s*([A-Za-z\s\.\,\'\-]+)",
            text,
            re.IGNORECASE,
        )
        if name_match:
            candidate = name_match.group(1).split("\n")[0].strip()
            # Clean up candidate
            candidate = re.sub(r"[,;].*", "", candidate).strip()
            if 2 < len(candidate) < 60:
                student_name = candidate

        # 3. Extract Date of Birth
        dob = None
        dob_match = re.search(
            r"(?:Date of Birth|DOB|D\.O\.B\.)\s*[:\-]\s*([0-9]{1,4}[-/.][0-9]{1,2}[-/.][0-9]{1,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})",
            text,
            re.IGNORECASE,
        )
        if dob_match:
            dob = dob_match.group(1).strip()

        # 4. Extract Certificate / Document ID
        doc_id = None
        id_match = re.search(
            r"(?:TC\s*No\.?|Certificate\s*No\.?|Registration\s*No\.?|Serial\s*No\.?|Document\s*ID)\s*[:\-]?\s*([A-Za-z0-9\-_/]+)",
            text,
            re.IGNORECASE,
        )
        if id_match:
            doc_id = id_match.group(1).strip()

        # 5. Extract Issuing Authority
        authority = None
        auth_match = re.search(
            r"(?:School\s*Name|Issuing\s*Authority|Hospital|Clinic|Institution)\s*[:\-]\s*([A-Za-z0-9\s\.,\-]+)",
            text,
            re.IGNORECASE,
        )
        if auth_match:
            authority = auth_match.group(1).split("\n")[0].strip()
        elif "high school" in text_lower or "academy" in text_lower or "public school" in text_lower:
            # Grab first line mentioning school/academy
            for line in text.split("\n")[:5]:
                if any(w in line.lower() for w in ["school", "academy", "hospital", "clinic", "department"]):
                    authority = line.strip()
                    break

        return StudentDocumentEntity(
            document_type=doc_type,
            confidence=confidence,
            student_name=student_name,
            date_of_birth=dob,
            issuing_authority=authority,
            document_id_number=doc_id,
            key_findings_or_notes=f"Extracted via zero-cost NLP pipeline from {file_name}",
            extracted_metadata={"raw_char_count": len(text)},
        )


# Global singleton document classifier
document_classifier = DocumentClassifier()
