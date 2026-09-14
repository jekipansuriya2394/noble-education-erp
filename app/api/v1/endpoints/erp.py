"""ERP inspection endpoints for reviewing student records, fees, and audit logs."""

from typing import Any, Dict, List
from fastapi import APIRouter
from sqlalchemy import select
from app.core.database import async_session, Student, FeeInvoice, AuditNotification

router = APIRouter(prefix="/erp", tags=["School ERP Data"])


@router.get("/students", summary="List All Students")
async def list_students() -> List[Dict[str, Any]]:
    async with async_session() as session:
        result = await session.execute(select(Student))
        students = result.scalars().all()
        return [
            {
                "id": s.id,
                "first_name": s.first_name,
                "last_name": s.last_name,
                "email": s.email,
                "grade_level": s.grade_level,
                "status": s.status,
            }
            for s in students
        ]


@router.get("/defaulters", summary="List Students with Overdue Tuition")
async def list_tuition_defaulters() -> List[Dict[str, Any]]:
    async with async_session() as session:
        stmt = (
            select(Student, FeeInvoice)
            .join(FeeInvoice, Student.id == FeeInvoice.student_id)
            .where(FeeInvoice.balance_due > 0)
        )
        result = await session.execute(stmt)
        rows = result.all()
        return [
            {
                "student_id": s.id,
                "name": f"{s.first_name} {s.last_name}",
                "email": s.email,
                "term": inv.term,
                "balance_due": inv.balance_due,
                "due_date": inv.due_date,
                "status": inv.status,
            }
            for s, inv in rows
        ]


@router.get("/notifications", summary="List Audit Notifications")
async def list_notifications() -> List[Dict[str, Any]]:
    async with async_session() as session:
        result = await session.execute(
            select(AuditNotification).order_by(AuditNotification.id.desc())
        )
        notifs = result.scalars().all()
        return [
            {
                "id": n.id,
                "user_id": n.user_id,
                "message_body": n.message_body,
                "channel": n.channel,
                "status": n.status,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifs
        ]
