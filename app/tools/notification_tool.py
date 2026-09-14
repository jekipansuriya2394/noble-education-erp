"""Notification dispatch and drafting tool."""

import logging
from typing import Any, Dict
from sqlalchemy import select
from app.core.database import async_session, Student, Guardian, AuditNotification
from app.schemas.tools import SendNotificationInput
from app.tools.registry import registry

logger = logging.getLogger(__name__)


@registry.register(
    name="send_notification",
    description=(
        "Drafts or queues an official school notification or reminder email to a student or their guardian. "
        "Records the communication in the audit log for accountability."
    ),
    input_model=SendNotificationInput,
)
async def send_notification(params: SendNotificationInput) -> Dict[str, Any]:
    """Record and queue a communication message for a student/guardian."""
    user_id = params.user_id
    message_body = params.message_body
    channel = params.channel

    async with async_session() as session:
        # Verify student exists
        stmt = select(Student).where(Student.id == user_id)
        result = await session.execute(stmt)
        student = result.scalar_one_or_none()

        if not student:
            return {
                "status": "not_found",
                "error": f"Student with ID {user_id} was not found in the ERP system.",
            }

        # Fetch guardian details if available
        guard_stmt = select(Guardian).where(Guardian.student_id == user_id)
        guard_res = await session.execute(guard_stmt)
        guardians = guard_res.scalars().all()
        guardian_contacts = [
            {"name": g.name, "email": g.email, "relationship": g.relationship}
            for g in guardians
        ]

        # Record in audit log
        notification = AuditNotification(
            user_id=user_id,
            message_body=message_body,
            channel=channel,
            status="queued",
        )
        session.add(notification)
        await session.commit()
        await session.refresh(notification)

        logger.info(f"Queued notification ID {notification.id} for Student {user_id}")

        return {
            "status": "queued",
            "notification_id": notification.id,
            "recipient": {
                "student_id": student.id,
                "student_name": f"{student.first_name} {student.last_name}",
                "student_email": student.email,
                "guardians": guardian_contacts,
            },
            "channel": channel,
            "message_preview": message_body,
            "audit_timestamp": notification.created_at.isoformat() if notification.created_at else None,
        }
