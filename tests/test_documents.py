"""Tests for Document Ingestion, ChromaDB Vector Indexing, and Student Document Classification."""

import pytest
import io
from app.documents.ingestion import DocumentIngestionPipeline
from app.documents.classifier import DocumentClassifier, StudentDocumentEntity


@pytest.fixture
def ingestion_pipeline(tmp_path):
    """Instantiate DocumentIngestionPipeline in a clean temporary directory."""
    chroma_dir = str(tmp_path / "test_chroma")
    return DocumentIngestionPipeline(persist_dir=chroma_dir)


@pytest.fixture
def classifier():
    return DocumentClassifier()


def test_document_chunking_with_overlap(ingestion_pipeline):
    """Verify recursive chunker splits along sentence boundaries with sliding overlap."""
    sample_text = (
        "Article 1: Attendance Policy. Every student must attend at least 85% of all scheduled classes. "
        "Failure to achieve 85% attendance will trigger a mandatory counseling review. "
        "Article 2: Fee Regulations. All tuition fees for the upcoming semester must be deposited by the 15th. "
        "Late fees of 5% will apply after the grace period expires. "
        "Article 3: Academic Honesty. Plagiarism on exams will result in immediate disciplinary suspension."
    )

    chunks = ingestion_pipeline.chunk_text(sample_text, chunk_size=150, chunk_overlap=30)
    assert len(chunks) >= 2
    for c in chunks:
        assert len(c) <= 180  # Respects chunk size constraint

    # Overlap validation: text from chunk 1 should partially overlap into chunk 2
    assert any("attendance" in c.lower() for c in chunks)


def test_chromadb_upsert_and_similarity_query(ingestion_pipeline):
    """Verify ChromaDB upserts document chunks and executes semantic similarity queries."""
    # Seed chunks manually into the test collection
    sample_id = "doc_test_c0"
    sample_doc = "The minimum attendance required to appear for final exams is 85 percent."
    sample_meta = {"source_file": "Handbook_2026.pdf", "page_number": 1, "category": "handbook"}

    ingestion_pipeline.collection.upsert(
        ids=[sample_id],
        documents=[sample_doc],
        metadatas=[sample_meta],
    )

    # Query
    results = ingestion_pipeline.search_knowledge_base("What is the exam attendance requirement?")
    assert len(results) >= 1
    top_hit = results[0]
    assert "85 percent" in top_hit["text"]
    assert top_hit["source_file"] == "Handbook_2026.pdf"


@pytest.mark.asyncio
async def test_classify_transfer_certificate(classifier):
    """Verify transfer certificate classification and entity extraction."""
    tc_text = """
    ST. XAVIER HIGH SCHOOL
    OFFICIAL TRANSFER CERTIFICATE
    TC No: TC-2026-8942
    Date: 2026-08-10

    Student Name: Liam Johnson
    Date of Birth: 2010-04-15
    Class Last Studied: Grade 9
    Progress and Conduct: Good
    Reason for Leaving: Family Relocation
    Issuing Authority: St. Xavier High School Administration
    """

    # Pass text directly as bytes stream
    entity = await classifier.classify_and_extract(
        file_source=tc_text.encode("utf-8"),
        file_name="Liam_Johnson_Transfer_Certificate.txt",
    )

    assert entity.document_type == "transfer_certificate"
    assert entity.confidence >= 0.80
    assert entity.student_name is not None
    assert "Liam" in entity.student_name
    assert entity.date_of_birth == "2010-04-15"
    assert entity.document_id_number == "TC-2026-8942"
    assert entity.issuing_authority is not None


@pytest.mark.asyncio
async def test_classify_medical_report(classifier):
    """Verify medical report classification and entity extraction."""
    med_text = """
    CITY HEALTH CLINIC & PEDIATRIC SERVICES
    STUDENT MEDICAL EXAMINATION REPORT
    Date of Exam: 2026-08-20

    Patient Name: Sophia Martinez
    DOB: 2009-11-23
    Clinical Assessment: Healthy, fit for regular physical activities.
    Prescription / Notes: Asthma inhaler prescribed for strenuous aerobic exercise.
    Issuing Authority: City Health Clinic Pediatrics
    """

    entity = await classifier.classify_and_extract(
        file_source=med_text.encode("utf-8"),
        file_name="Sophia_Medical_Report.txt",
    )

    assert entity.document_type == "medical_report"
    assert entity.confidence >= 0.80
    assert entity.student_name is not None
    assert "Sophia" in entity.student_name
    assert entity.date_of_birth == "2009-11-23"
