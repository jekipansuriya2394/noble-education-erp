"""Document Ingestion and Local ChromaDB Vector Store Indexing Pipeline."""

import io
import logging
import os
import re
from typing import List, Dict, Any, Optional, Union
import chromadb
import hashlib
import math
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from chromadb.config import Settings as ChromaSettings

from app.core.config import settings
from app.documents.ocr import ocr_engine

logger = logging.getLogger("erp_ingestion")


class LocalZeroCostEmbeddingFunction(EmbeddingFunction[Documents]):
    """100% local, offline feature hashing embedding function with zero network dependency."""

    def __init__(self, dim: int = 128):
        self.dim = dim

    def name(self) -> str:
        return "local_zero_cost_hasher"

    def get_config(self) -> Dict[str, Any]:
        return {"dim": self.dim}

    def __call__(self, input: Documents) -> Embeddings:
        embeddings = []
        for text in input:
            vec = [0.0] * self.dim
            words = text.lower().split()
            for w in words:
                h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16)
                idx = h % self.dim
                sign = 1.0 if (h >> 8) % 2 == 0 else -1.0
                vec[idx] += sign
            norm = math.sqrt(sum(x * x for x in vec)) or 1.0
            embeddings.append([x / norm for x in vec])
        return embeddings


class DocumentIngestionPipeline:
    """Ingests, chunks, and indexes school handbooks, compliance policies, and syllabi into ChromaDB."""

    COLLECTION_NAME = "school_knowledge_base"

    def __init__(self, persist_dir: Optional[str] = None):
        self.persist_dir = persist_dir or settings.CHROMADB_PERSIST_DIR
        os.makedirs(self.persist_dir, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(
            path=self.persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self.embedding_fn = LocalZeroCostEmbeddingFunction()
        self.collection = self.chroma_client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            embedding_function=self.embedding_fn,
            metadata={"description": "School ERP policy, syllabus, and handbook vector repository"},
        )
        logger.info(f"Initialized ChromaDB collection '{self.COLLECTION_NAME}' at: {self.persist_dir}")

    def chunk_text(
        self,
        text: str,
        chunk_size: int = 800,
        chunk_overlap: int = 100,
    ) -> List[str]:
        """Split raw text into semantic overlapping chunks."""
        if not text or not text.strip():
            return []

        clean_text = re.sub(r"\s+", " ", text).strip()
        if len(clean_text) <= chunk_size:
            return [clean_text]

        chunks: List[str] = []
        start = 0
        while start < len(clean_text):
            end = start + chunk_size

            # If not at the very end of the text, try breaking at a sentence boundary or space
            if end < len(clean_text):
                # Search backwards from 'end' for sentence end (. or ? or !)
                period_idx = clean_text.rfind(". ", start, end)
                if period_idx != -1 and period_idx > start + (chunk_size // 2):
                    end = period_idx + 1
                else:
                    space_idx = clean_text.rfind(" ", start, end)
                    if space_idx != -1 and space_idx > start + (chunk_size // 2):
                        end = space_idx

            chunk = clean_text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            start = end - chunk_overlap

        return chunks

    def ingest_pdf(
        self,
        file_source: Union[str, bytes, io.BytesIO],
        file_name: str,
        category: str = "handbook",
    ) -> Dict[str, Any]:
        """Process an uploaded PDF and upsert its chunked embeddings into ChromaDB.
        
        Args:
            file_source: Filepath, bytes, or file stream.
            file_name: Base name of the file (e.g., 'Attendance_Policy_2026.pdf').
            category: Classification tag ('handbook', 'syllabus', 'guidelines', 'statutory').
            
        Returns:
            Dict containing ingestion statistics (chunk count, pages).
        """
        logger.info(f"Ingesting document '{file_name}' (Category: {category})...")

        # 1. Dual-layer text & OCR extraction
        pages = ocr_engine.extract_text_from_pdf(file_source)
        if not pages:
            return {"status": "empty", "message": "No readable text extracted", "chunks_indexed": 0}

        all_documents: List[str] = []
        all_metadatas: List[Dict[str, Any]] = []
        all_ids: List[str] = []

        total_chunks = 0
        for page_info in pages:
            page_num = page_info["page_number"]
            raw_text = page_info["text"]
            is_ocr = page_info.get("is_ocr", False)

            if not raw_text.strip():
                continue

            page_chunks = self.chunk_text(raw_text, chunk_size=750, chunk_overlap=100)
            for chunk_idx, chunk_text in enumerate(page_chunks):
                chunk_id = f"{file_name}_p{page_num}_c{chunk_idx}"
                all_documents.append(chunk_text)
                all_ids.append(chunk_id)
                all_metadatas.append({
                    "source_file": file_name,
                    "page_number": page_num,
                    "chunk_index": chunk_idx,
                    "category": category,
                    "is_ocr": is_ocr,
                    "char_count": len(chunk_text),
                })
                total_chunks += 1

        if all_documents:
            # Upsert into ChromaDB
            self.collection.upsert(
                ids=all_ids,
                documents=all_documents,
                metadatas=all_metadatas,
            )
            logger.info(f"Successfully upserted {total_chunks} chunks for '{file_name}'.")

        return {
            "status": "success",
            "file_name": file_name,
            "category": category,
            "pages_processed": len(pages),
            "chunks_indexed": total_chunks,
        }

    def search_knowledge_base(
        self,
        query: str,
        n_results: int = 4,
        category: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Semantic vector query across indexed school documents."""
        where_filter = {"category": category} if category else None

        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter,
        )

        formatted_results: List[Dict[str, Any]] = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
            distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)

            for text, meta, dist in zip(docs, metas, distances):
                formatted_results.append({
                    "text": text,
                    "source_file": meta.get("source_file"),
                    "page_number": meta.get("page_number"),
                    "category": meta.get("category"),
                    "distance": round(float(dist), 4),
                })

        return formatted_results


# Global singleton ingestion pipeline
ingestion_pipeline = DocumentIngestionPipeline()
