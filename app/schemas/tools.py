"""Pydantic schemas for School ERP Agent tool invocations."""

from typing import Any, Dict, Optional, Literal
from pydantic import BaseModel, Field, field_validator


class QueryDatabaseInput(BaseModel):
    """Schema for query_database tool."""
    sql_string: str = Field(
        ...,
        description=(
            "Sanitized, read-only SQL SELECT statement to query ERP tables "
            "(students, guardians, fee_invoices, payments, attendance, courses, audit_notifications). "
            "Never use INSERT, UPDATE, DELETE, or DROP."
        ),
        examples=[
            "SELECT s.id, s.first_name, s.last_name, f.balance_due FROM students s JOIN fee_invoices f ON s.id = f.student_id WHERE f.balance_due > 0;"
        ]
    )
    params: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Optional parameter map for parameterized query binding (e.g. {'min_balance': 500})."
    )

    @field_validator("sql_string")
    @classmethod
    def validate_non_empty_sql(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("SQL query string cannot be empty.")
        return cleaned


class SendNotificationInput(BaseModel):
    """Schema for send_notification tool."""
    user_id: int = Field(
        ...,
        description="The ID of the student/user who is the subject/recipient of this notification.",
        ge=1
    )
    message_body: str = Field(
        ...,
        description="The tailored body content of the email or SMS reminder.",
        min_length=5,
        max_length=2000,
        examples=[
            "Dear Liam Johnson, this is a friendly reminder that your Fall 2026 tuition balance of $2500.00 is overdue. Please contact the bursar office."
        ]
    )
    channel: Literal["email", "sms", "portal"] = Field(
        default="email",
        description="Communication delivery channel."
    )


class GenerateReportInput(BaseModel):
    """Schema for generate_report tool."""
    module_name: str = Field(
        ...,
        description=(
            "The specific ERP analytical reporting module to execute: "
            "'tuition_defaulters', 'attendance_summary', 'financial_reconciliation', or 'enrollment_metrics'."
        ),
        examples=["tuition_defaulters"]
    )
    parameters: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Key-value configuration and filters for report generation (e.g. {'term': 'Fall 2026'})."
    )

    @field_validator("module_name")
    @classmethod
    def validate_module_name(cls, v: str) -> str:
        valid_modules = {
            "tuition_defaulters",
            "attendance_summary",
            "financial_reconciliation",
            "enrollment_metrics",
        }
        clean = v.strip().lower()
        if clean not in valid_modules:
            raise ValueError(
                f"Invalid module_name '{v}'. Supported modules are: {sorted(list(valid_modules))}"
            )
        return clean
