"""API endpoints for End-of-Term Evaluations and Overnight Batch Queue Service."""

import asyncio
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from sqlalchemy import select

from app.core.database import async_session, ReportCard, Student
from app.evaluations.batch_service import batch_queue

router = APIRouter(prefix="/evaluations", tags=["End-of-Term Evaluations & Report Cards"])


@router.post(
    "/start-batch",
    summary="Trigger Overnight Report Card Batch Queue",
    description=(
        "Launches the memory-bounded, semaphore-controlled overnight batch evaluation queue. "
        "Iterates all students in pages, checks checkpoints, queries footprints, and generates "
        "personalized narrative comments with local Ollama Llama 3."
    ),
)
async def trigger_batch_evaluations(
    background_tasks: BackgroundTasks,
    term: str = "Fall 2026",
) -> Dict[str, Any]:
    # Run batch in background task to return immediately to caller
    background_tasks.add_task(batch_queue.run_overnight_batch, term)
    return {
        "status": "queued",
        "message": f"Overnight evaluation queue initiated for {term}.",
        "concurrency_limit": batch_queue.concurrency,
        "page_size": batch_queue.page_size,
    }


@router.get(
    "/progress",
    summary="Get Overnight Batch Progress & Throughput",
    description="Polls current batch metrics (processed, skipped, failed, throughput/min, estimated time remaining).",
)
async def get_batch_progress() -> Dict[str, Any]:
    if not batch_queue.active_batch_progress:
        return {"status": "idle", "message": "No active batch job is currently running."}
    return {
        "status": "running",
        "progress": batch_queue.active_batch_progress.get_summary(),
    }


@router.get(
    "/report-card/{student_id}",
    summary="Retrieve Student Narrative Report Card",
    description="Fetches the personalized narrative report card generated for a student.",
)
async def get_student_report_card(
    student_id: int,
    term: str = "Fall 2026",
) -> Dict[str, Any]:
    async with async_session() as session:
        stmt = (
            select(ReportCard, Student)
            .join(Student, ReportCard.student_id == Student.id)
            .where(ReportCard.student_id == student_id, ReportCard.term == term)
        )
        res = await session.execute(stmt)
        record = res.first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report card for student ID {student_id} in term {term} not found.",
            )
        rc, student = record
        return {
            "report_card_id": rc.id,
            "student_id": student.id,
            "student_name": f"{student.first_name} {student.last_name}",
            "grade_level": student.grade_level,
            "term": rc.term,
            "attendance_rate": rc.attendance_rate,
            "average_score": rc.average_score,
            "narrative_summary": rc.narrative_summary,
            "growth_recommendations": rc.growth_recommendations,
            "status": rc.status,
            "generated_at": rc.generated_at.isoformat() if rc.generated_at else None,
        }


@router.get(
    "/report-cards",
    summary="List All Generated Report Cards",
    description="Returns all generated end-of-term evaluation records.",
)
async def list_all_report_cards(term: str = "Fall 2026") -> List[Dict[str, Any]]:
    async with async_session() as session:
        stmt = (
            select(ReportCard, Student)
            .join(Student, ReportCard.student_id == Student.id)
            .where(ReportCard.term == term)
            .order_by(ReportCard.id.desc())
        )
        res = await session.execute(stmt)
        rows = res.all()
        return [
            {
                "report_card_id": rc.id,
                "student_id": s.id,
                "student_name": f"{s.first_name} {s.last_name}",
                "grade_level": s.grade_level,
                "term": rc.term,
                "average_score": rc.average_score,
                "status": rc.status,
                "generated_at": rc.generated_at.isoformat() if rc.generated_at else None,
            }
            for rc, s in rows
        ]
