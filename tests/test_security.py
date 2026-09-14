"""Tests for SQLSecurityGuard and injection defenses."""

import pytest
from app.core.security import SQLSecurityGuard, SecurityViolation


@pytest.fixture
def guard():
    return SQLSecurityGuard(
        allowed_tables={
            "students",
            "guardians",
            "fee_invoices",
            "payments",
            "attendance",
            "courses",
            "enrollments",
            "audit_notifications",
        }
    )


def test_valid_select_queries(guard):
    """Ensure safe, read-only SELECT queries pass validation."""
    queries = [
        "SELECT * FROM students",
        "SELECT id, first_name, last_name FROM students WHERE grade_level = 'Grade 10'",
        (
            "SELECT s.id, s.first_name, f.balance_due "
            "FROM students s "
            "JOIN fee_invoices f ON s.id = f.student_id "
            "WHERE f.balance_due > 0"
        ),
        (
            "SELECT g.name, g.phone, s.first_name "
            "FROM guardians g "
            "LEFT JOIN students s ON g.student_id = s.id "
            "ORDER BY s.last_name ASC LIMIT 50"
        ),
    ]
    for q in queries:
        cleaned = guard.validate_query(q)
        assert cleaned.startswith("SELECT")


def test_reject_dml_and_ddl_modifications(guard):
    """Ensure all write, delete, and schema modification commands are blocked."""
    malicious_queries = [
        "DROP TABLE students",
        "DELETE FROM fee_invoices WHERE balance_due > 0",
        "UPDATE students SET status = 'graduated'",
        "INSERT INTO students (first_name, last_name) VALUES ('Hacker', 'Bot')",
        "ALTER TABLE students ADD COLUMN hacked TEXT",
        "TRUNCATE TABLE payments",
        "CREATE TABLE backdoor (id INT)",
        "REPLACE INTO students (id, first_name) VALUES (1, 'Evil')",
    ]
    for q in malicious_queries:
        with pytest.raises(SecurityViolation):
            guard.validate_query(q)


def test_reject_stacked_queries(guard):
    """Ensure semicolon-separated stacked queries are blocked."""
    stacked_queries = [
        "SELECT * FROM students; DROP TABLE students;",
        "SELECT * FROM students; DELETE FROM fee_invoices;",
        "SELECT * FROM students; SELECT * FROM guardians;",
    ]
    for q in stacked_queries:
        with pytest.raises(SecurityViolation):
            guard.validate_query(q)


def test_reject_forbidden_system_tables(guard):
    """Ensure internal sqlite catalog and system tables cannot be inspected."""
    forbidden_queries = [
        "SELECT * FROM sqlite_master",
        "SELECT * FROM sqlite_schema",
        "SELECT name FROM sqlite_temp_master",
    ]
    for q in forbidden_queries:
        with pytest.raises(SecurityViolation):
            guard.validate_query(q)


def test_reject_unwhitelisted_tables(guard):
    """Ensure tables outside the allowed ERP schema are rejected."""
    queries = [
        "SELECT * FROM secret_passwords",
        "SELECT * FROM admin_credentials",
        "SELECT u.name FROM users u JOIN passwords p ON u.id = p.user_id",
    ]
    for q in queries:
        with pytest.raises(SecurityViolation):
            guard.validate_query(q)


def test_reject_admin_and_execution_commands(guard):
    """Ensure PRAGMA, ATTACH, and execution procedures are blocked."""
    dangerous = [
        "PRAGMA table_info(students)",
        "ATTACH DATABASE 'malicious.db' AS mal",
        "EXEC sp_executesql 'SELECT 1'",
        "VACUUM",
    ]
    for q in dangerous:
        with pytest.raises(SecurityViolation):
            guard.validate_query(q)
