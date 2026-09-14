"""Tests for End-of-Term Footprint Gathering, Narrative Prompt Building, and Overnight Batch Queue."""

import pytest
from sqlalchemy import select
from app.core.database import (
    init_db,
    seed_database_if_empty,
    async_session,
    ReportCard,
)
from app.evaluations.footprint import footprint_collector
from app.evaluations.prompt_builder import build_evaluation_prompt, EVALUATION_SYSTEM_PROMPT
from app.evaluations.batch_service import OvernightEvaluationQueue


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    import asyncio
    asyncio.run(init_db())
    asyncio.run(seed_database_if_empty())


@pytest.mark.asyncio
async def test_footprint_collection():
    """Verify gathering of student's complete term footprint."""
    async with async_session() as session:
        footprint = await footprint_collector.collect_student_footprint(
            session=session,
            student_id=1,
            term="Fall 2026",
        )

    assert footprint is not None
    assert footprint.student_id == 1
    assert "Liam" in footprint.student_name
    assert footprint.grade_level == "Grade 10"
    assert footprint.total_attendance_days > 0
    assert len(footprint.subject_performances) >= 1
    assert len(footprint.behavioral_notes) >= 1

    # Verify behavioral note content
    note_text = footprint.behavioral_notes[0]["observation"]
    assert "Liam" in note_text or "mathematical" in note_text.lower()


def test_narrative_prompt_construction():
    """Verify prompt builder weaves footprint data and enforces anti-boilerplate guidelines."""
    assert "BAN GENERIC BOILERPLATE" in EVALUATION_SYSTEM_PROMPT
    assert "EVIDENCE-BASED" in EVALUATION_SYSTEM_PROMPT

    # Create dummy footprint
    from app.evaluations.footprint import StudentTermFootprint, SubjectPerformance
    dummy_fp = StudentTermFootprint(
        student_id=1,
        student_name="Liam Johnson",
        grade_level="Grade 10",
        term="Fall 2026",
        attendance_rate=0.60,
        total_attendance_days=20,
        present_days=12,
        absent_days=8,
        term_gpa_average=62.5,
        subject_performances=[
            SubjectPerformance(
                course_code="MATH101",
                course_title="Algebra II",
                scores=[88.0, 70.0, 50.0],
                average_score=69.3,
            )
        ],
        behavioral_notes=[
            {
                "teacher": "Mrs. Sarah Jenkins",
                "category": "participation",
                "observation": "Exhibits strong intuition but struggles with proof retention after absences.",
            }
        ],
    )

    prompt = build_evaluation_prompt(dummy_fp)
    assert "Liam Johnson" in prompt
    assert "Algebra II" in prompt
    assert "60%" in prompt
    assert "Mrs. Sarah Jenkins" in prompt


@pytest.mark.asyncio
async def test_overnight_batch_queue_execution():
    """Verify paged cursor execution, semaphore bounding, and persistence of report cards."""
    # Clean any existing report cards for test term
    async with async_session() as session:
        from sqlalchemy import delete
        await session.execute(delete(ReportCard).where(ReportCard.term == "Test_Fall_2026"))
        await session.commit()

    queue = OvernightEvaluationQueue(concurrency=2, page_size=2)
    summary = await queue.run_overnight_batch(term="Test_Fall_2026")

    assert summary["status"] == "success"
    metrics = summary["metrics"]
    assert metrics["total_students"] >= 5
    assert metrics["processed"] >= 5
    assert metrics["failed"] == 0
    assert metrics["completion_pct"] == 100.0

    # Verify ReportCard records in database
    async with async_session() as session:
        res = await session.execute(
            select(ReportCard).where(ReportCard.term == "Test_Fall_2026")
        )
        report_cards = res.scalars().all()
        assert len(report_cards) >= 5
        rc1 = report_cards[0]
        assert len(rc1.narrative_summary) > 100
        assert "Academic Trajectory" in rc1.narrative_summary or "Actionable" in rc1.narrative_summary


@pytest.mark.asyncio
async def test_idempotent_checkpoint_resumption():
    """Verify that rerunning an interrupted or completed batch safely skips already generated students."""
    queue = OvernightEvaluationQueue(concurrency=2, page_size=2)
    # Run again on the same term
    summary = await queue.run_overnight_batch(term="Test_Fall_2026")

    metrics = summary["metrics"]
    # All students should now be skipped because their report cards already exist!
    assert metrics["skipped_already_done"] >= 5
    assert metrics["processed"] == 0
    assert metrics["failed"] == 0
