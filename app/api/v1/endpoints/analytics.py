"""API endpoints for Educational Predictive Analytics, Risk Assessments, and LLM Interventions."""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.analytics.connection_pool import db_pool
from app.analytics.service import analytics_service
from app.core.database import (
    async_session,
    StudentRiskAssessment,
    StudentIntervention,
    Student,
)

router = APIRouter(prefix="/analytics", tags=["Educational Predictive Analytics"])


@router.post(
    "/run-batch",
    summary="Trigger Daily Predictive Risk Analytics Batch",
    description=(
        "Executes the full predictive analytics pipeline: extracts rolling attendance, "
        "continuous assessment grade drops, and fee delays, runs the Scikit-Learn risk model, "
        "and triggers LLM intervention generation for High Risk students."
    ),
)
async def trigger_analytics_batch() -> Dict[str, Any]:
    try:
        result = await analytics_service.run_daily_predictive_batch()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics batch execution failed: {str(e)}",
        )


@router.get(
    "/pool-status",
    summary="Check Database Connection Pool Health & Metrics",
    description="Reports the connection pool metrics (size, checkouts, latency) for PostgreSQL / Supabase or fallback.",
)
async def check_pool_status() -> Dict[str, Any]:
    return await db_pool.check_health()


@router.get(
    "/assessments",
    summary="List Latest Student Risk Assessments",
    description="Returns all student attrition and academic failure risk scores and breakdown factors.",
)
async def list_risk_assessments() -> List[Dict[str, Any]]:
    async with async_session() as session:
        stmt = (
            select(StudentRiskAssessment, Student)
            .join(Student, StudentRiskAssessment.student_id == Student.id)
            .order_by(StudentRiskAssessment.id.desc())
        )
        res = await session.execute(stmt)
        rows = res.all()
        return [
            {
                "assessment_id": a.id,
                "student_id": s.id,
                "student_name": f"{s.first_name} {s.last_name}",
                "grade_level": s.grade_level,
                "risk_score": a.risk_score,
                "risk_level": a.risk_level,
                "attendance_rate_30d": a.attendance_rate_30d,
                "grade_drop_delta": a.grade_drop_delta,
                "fee_delay_days": a.fee_delay_days,
                "balance_due": a.balance_due,
                "assessed_at": a.assessed_at.isoformat() if a.assessed_at else None,
            }
            for a, s in rows
        ]


@router.get(
    "/interventions",
    summary="List Generated Counselor Briefings & Teacher Outreach Drafts",
    description="Returns guidance counselor briefing sheets and teacher messages generated for High Risk students.",
)
async def list_interventions() -> List[Dict[str, Any]]:
    async with async_session() as session:
        stmt = (
            select(StudentIntervention, Student)
            .join(Student, StudentIntervention.student_id == Student.id)
            .order_by(StudentIntervention.id.desc())
        )
        res = await session.execute(stmt)
        rows = res.all()
        return [
            {
                "intervention_id": i.id,
                "student_id": s.id,
                "student_name": f"{s.first_name} {s.last_name}",
                "status": i.status,
                "counselor_briefing": i.counselor_briefing,
                "teacher_outreach": i.teacher_outreach,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i, s in rows
        ]
