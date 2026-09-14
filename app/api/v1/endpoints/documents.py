"""API endpoints for Document Ingestion, ChromaDB Semantic Search, and OCR/NLP Classification."""

import io
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from sqlalchemy import select

from app.core.database import async_session, StudentDocument, Student
from app.documents.ingestion import ingestion_pipeline
from app.documents.classifier import document_classifier, StudentDocumentEntity

logger = logging.getLogger("erp_doc_api")
router = APIRouter(prefix="/documents", tags=["Document AI & Vision/NLP"])


@router.post(
    "/ingest",
    summary="Ingest & Index PDF into Local ChromaDB",
    description=(
        "Uploads a school policy, syllabus, or handbook PDF, extracts digital/scanned text, "
        "chunks it with sliding overlap, and stores dense vector embeddings in the local persistent ChromaDB collection."
    ),
)
async def ingest_document(
    file: UploadFile = File(...),
    category: str = Form(default="handbook"),
) -> Dict[str, Any]:
    try:
        content = await file.read()
        file_name = file.filename or "uploaded_document.pdf"
        result = ingestion_pipeline.ingest_pdf(
            file_source=content,
            file_name=file_name,
            category=category,
        )
        return result
    except Exception as e:
        logger.exception(f"Error during document ingestion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest document: {str(e)}",
        )


@router.post(
    "/classify",
    response_model=StudentDocumentEntity,
    summary="Classify Student Document & Extract Structured Entities",
    description=(
        "Uploads a student administrative document (Transfer Certificate, Medical Report, Birth Certificate, etc.), "
        "executes dual-layer OCR/text extraction, classifies document type, and extracts key entities ready for database persistence."
    ),
)
async def classify_student_document(
    file: UploadFile = File(...),
    student_id: Optional[int] = Form(default=None),
    save_to_db: bool = Form(default=True),
) -> StudentDocumentEntity:
    try:
        content = await file.read()
        file_name = file.filename or "student_document.pdf"

        # Run Classification & Entity Extraction
        entity = await document_classifier.classify_and_extract(
            file_source=content,
            file_name=file_name,
        )

        # Optionally persist into database
        if save_to_db:
            async with async_session() as session:
                doc_record = StudentDocument(
                    student_id=student_id,
                    document_type=entity.document_type,
                    file_name=file_name,
                    student_name_extracted=entity.student_name,
                    dob_extracted=entity.date_of_birth,
                    issuing_authority=entity.issuing_authority,
                    document_date=entity.document_date,
                    document_id_number=entity.document_id_number,
                    confidence=entity.confidence,
                    extracted_metadata=json.dumps(entity.extracted_metadata),
                    status="processed",
                )
                session.add(doc_record)
                await session.commit()

        return entity
    except Exception as e:
        logger.exception(f"Error classifying document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to classify document: {str(e)}",
        )


@router.get(
    "/search",
    summary="Semantic RAG Search across School Knowledge Base",
    description="Performs vector similarity search against indexed school handbooks, compliance guidelines, and syllabi.",
)
async def search_knowledge_base(
    query: str,
    n_results: int = 4,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    return ingestion_pipeline.search_knowledge_base(
        query=query,
        n_results=n_results,
        category=category,
    )


@router.get(
    "/records",
    summary="List Classified Student Documents in ERP",
    description="Retrieves all processed student certificates and medical records from the database.",
)
async def list_student_documents() -> List[Dict[str, Any]]:
    async with async_session() as session:
        result = await session.execute(
            select(StudentDocument).order_by(StudentDocument.id.desc())
        )
        docs = result.scalars().all()
        return [
            {
                "id": d.id,
                "student_id": d.student_id,
                "document_type": d.document_type,
                "file_name": d.file_name,
                "student_name": d.student_name_extracted,
                "date_of_birth": d.dob_extracted,
                "issuing_authority": d.issuing_authority,
                "document_id": d.document_id_number,
                "confidence": d.confidence,
                "status": d.status,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            }
            for d in docs
        ]
