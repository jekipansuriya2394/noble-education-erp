"""Database query tool with security guards."""

import logging
from typing import Any, Dict
from app.core.database import execute_safe_readonly_query
from app.core.security import security_guard, SecurityViolation
from app.schemas.tools import QueryDatabaseInput
from app.tools.registry import registry

logger = logging.getLogger(__name__)


@registry.register(
    name="query_database",
    description=(
        "Executes a strictly validated, read-only SQL SELECT query against the School ERP database. "
        "Allowed tables: students, guardians, fee_invoices, payments, attendance, courses, enrollments, audit_notifications. "
        "Data modification statements (INSERT, UPDATE, DELETE, DROP, ALTER) and system tables are strictly rejected."
    ),
    input_model=QueryDatabaseInput,
)
async def query_database(params: QueryDatabaseInput) -> Dict[str, Any]:
    """Validate query with AST security guards and execute in read-only mode."""
    sql = params.sql_string
    query_params = params.params or {}

    try:
        # Validate AST, single-statement, and table whitelist
        validated_sql = security_guard.validate_query(sql, query_params)
        
        # Execute query safely in read-only mode
        rows = await execute_safe_readonly_query(validated_sql, query_params)
        
        return {
            "status": "success",
            "row_count": len(rows),
            "rows": rows,
            "executed_query": validated_sql,
        }
    except SecurityViolation as sec_err:
        logger.warning(f"Security violation caught in query_database: {sec_err}")
        return {
            "status": "security_violation",
            "error": f"Query rejected by security guard: {str(sec_err)}",
            "executed_query": None,
        }
    except Exception as err:
        logger.exception(f"Database query failed: {err}")
        return {
            "status": "error",
            "error": f"Database execution error: {str(err)}",
            "executed_query": sql,
        }
