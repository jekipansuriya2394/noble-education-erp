"""Reporting engine tool for analytical and administrative ERP summaries."""

import logging
from typing import Any, Dict
from sqlalchemy import select, func
from app.core.database import async_session, Student, FeeInvoice, Payment, Attendance, Guardian, Course, Enrollment
from app.schemas.tools import GenerateReportInput
from app.tools.registry import registry

logger = logging.getLogger(__name__)


@registry.register(
    name="generate_report",
    description=(
        "Generates structured administrative reports for school leadership. "
        "Supported modules: 'tuition_defaulters', 'attendance_summary', 'financial_reconciliation', 'enrollment_metrics'."
    ),
    input_model=GenerateReportInput,
)
async def generate_report(params: GenerateReportInput) -> Dict[str, Any]:
    """Execute analytical report generation based on the requested module."""
    module_name = params.module_name
    report_params = params.parameters or {}

    async with async_session() as session:
        if module_name == "tuition_defaulters":
            # Query students with positive balance due
            stmt = (
                select(
                    Student.id,
                    Student.first_name,
                    Student.last_name,
                    Student.grade_level,
                    Student.email,
                    FeeInvoice.term,
                    FeeInvoice.balance_due,
                    FeeInvoice.due_date,
                )
                .join(FeeInvoice, Student.id == FeeInvoice.student_id)
                .where(FeeInvoice.balance_due > 0)
                .order_by(FeeInvoice.balance_due.desc())
            )
            result = await session.execute(stmt)
            rows = result.all()

            defaulters = []
            total_outstanding = 0.0

            for r in rows:
                total_outstanding += r.balance_due
                defaulters.append({
                    "student_id": r.id,
                    "student_name": f"{r.first_name} {r.last_name}",
                    "grade_level": r.grade_level,
                    "email": r.email,
                    "term": r.term,
                    "balance_due": r.balance_due,
                    "due_date": r.due_date,
                })

            return {
                "status": "success",
                "report_type": "Tuition Defaulters Summary",
                "total_defaulters_count": len(defaulters),
                "total_outstanding_amount": round(total_outstanding, 2),
                "defaulters": defaulters,
            }

        elif module_name == "financial_reconciliation":
            invoices_res = await session.execute(
                select(
                    func.sum(FeeInvoice.total_amount).label("total_billed"),
                    func.sum(FeeInvoice.balance_due).label("total_outstanding"),
                )
            )
            inv_summary = invoices_res.one()
            total_billed = inv_summary.total_billed or 0.0
            total_outstanding = inv_summary.total_outstanding or 0.0

            payments_res = await session.execute(
                select(func.sum(Payment.amount_paid).label("total_collected"))
            )
            total_collected = payments_res.scalar() or 0.0

            collection_rate = (
                (total_collected / total_billed * 100) if total_billed > 0 else 0.0
            )

            return {
                "status": "success",
                "report_type": "Financial Reconciliation",
                "total_billed": round(total_billed, 2),
                "total_collected": round(total_collected, 2),
                "total_outstanding": round(total_outstanding, 2),
                "collection_rate_percentage": round(collection_rate, 2),
            }

        elif module_name == "attendance_summary":
            att_res = await session.execute(
                select(Attendance.status, func.count(Attendance.id))
                .group_by(Attendance.status)
            )
            counts = {row[0]: row[1] for row in att_res.all()}
            total_records = sum(counts.values())

            return {
                "status": "success",
                "report_type": "Attendance Summary",
                "total_records": total_records,
                "breakdown": counts,
            }

        elif module_name == "enrollment_metrics":
            stmt = (
                select(Course.code, Course.title, func.count(Enrollment.id).label("student_count"))
                .outerjoin(Enrollment, Course.id == Enrollment.course_id)
                .group_by(Course.id)
            )
            res = await session.execute(stmt)
            courses = [
                {"course_code": r.code, "title": r.title, "enrolled_students": r.student_count}
                for r in res.all()
            ]

            return {
                "status": "success",
                "report_type": "Enrollment Metrics",
                "total_courses": len(courses),
                "courses": courses,
            }

        else:
            return {
                "status": "error",
                "error": f"Unknown module '{module_name}'",
            }
