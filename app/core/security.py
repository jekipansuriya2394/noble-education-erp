"""SQL Security Guard & Query Validation Engine.

Enforces read-only execution, single-statement constraints, AST parsing,
keyword blacklisting, and table whitelisting to safeguard against SQL injection,
tampering, or data exfiltration.
"""

from typing import Any, Dict, List, Optional, Set
import re
import sqlparse
from sqlparse.sql import Identifier, IdentifierList, Statement, Token
from sqlparse.tokens import DML, Keyword

from app.core.config import settings


class SecurityViolation(Exception):
    """Raised when an SQL query violates security guards or policies."""
    pass


class SQLSecurityGuard:
    """Multi-stage validation engine for LLM-generated SQL statements."""

    # Disallowed commands & functions that could modify data, schema, or system state
    FORBIDDEN_KEYWORDS: Set[str] = {
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
        "CREATE", "REPLACE", "MERGE", "UPSERT", "GRANT", "REVOKE",
        "EXEC", "EXECUTE", "CALL", "PRAGMA", "ATTACH", "DETACH",
        "VACUUM", "REINDEX", "SAVEPOINT", "ROLLBACK", "COMMIT",
        "BEGIN", "TRANSACTION", "LOCK", "ALTER TABLE", "INTO OUTFILE",
        "LOAD DATA", "LOAD_FILE", "XP_CMDSHELL", "SYSTEM", "SHUTDOWN"
    }

    # Disallowed system or catalog tables
    FORBIDDEN_TABLES: Set[str] = {
        "sqlite_master", "sqlite_temp_master", "sqlite_schema",
        "sqlite_temp_schema", "sqlite_sequence", "sqlite_stat1",
        "information_schema", "pg_catalog", "mysql"
    }

    def __init__(self, allowed_tables: Optional[Set[str]] = None):
        self.allowed_tables = (
            {t.lower() for t in allowed_tables}
            if allowed_tables is not None
            else {t.lower() for t in settings.ALLOWED_ERP_TABLES}
        )

    def validate_query(self, sql: str, params: Optional[Dict[str, Any]] = None) -> str:
        """Validate an SQL query string before execution.
        
        Args:
            sql: The SQL query string to evaluate.
            params: Optional parameter dictionary for parameterized queries.
            
        Returns:
            Cleaned and validated SQL query string.
            
        Raises:
            SecurityViolation: If the query fails any security rule.
        """
        if not sql or not sql.strip():
            raise SecurityViolation("SQL query cannot be empty.")

        cleaned_sql = sql.strip().rstrip(";")

        # Rule 1: No query chaining / multiple statements
        statements = sqlparse.parse(cleaned_sql)
        if len(statements) != 1:
            raise SecurityViolation(
                f"Multiple SQL statements detected ({len(statements)} found). "
                "Only a single atomic query is permitted."
            )

        statement: Statement = statements[0]

        # Rule 2: Top-level statement type MUST be SELECT
        stmt_type = statement.get_type().upper()
        if stmt_type != "SELECT":
            raise SecurityViolation(
                f"Unauthorized statement type '{stmt_type}'. Only 'SELECT' statements are allowed."
            )

        # Rule 3: Deep AST scan for forbidden keywords across all tokens
        self._inspect_tokens_recursively(statement)

        # Rule 4: Extract and verify referenced tables against whitelist
        referenced_tables = self._extract_tables(statement)
        for table in referenced_tables:
            table_clean = table.lower().strip('"`[]')
            if table_clean in self.FORBIDDEN_TABLES:
                raise SecurityViolation(f"Access to internal system table '{table}' is strictly forbidden.")
            if self.allowed_tables and table_clean not in self.allowed_tables:
                raise SecurityViolation(
                    f"Access to table '{table}' is not permitted. Allowed tables: {sorted(list(self.allowed_tables))}"
                )

        # Rule 5: Check for stacked semicolon injection attempts in string
        if ";" in cleaned_sql:
            raise SecurityViolation("Semicolons within query body are prohibited to prevent stacked injection.")

        return cleaned_sql

    def _inspect_tokens_recursively(self, token_container: Any) -> None:
        """Recursively scan AST tokens for forbidden keywords, CTE modifications, or admin operations."""
        tokens = getattr(token_container, "tokens", [])
        for token in tokens:
            # Check for keyword tokens
            token_val = token.value.upper().strip()
            
            # Direct keyword or DML match
            if token_val in self.FORBIDDEN_KEYWORDS:
                raise SecurityViolation(
                    f"Forbidden keyword '{token_val}' detected in query."
                )

            # Check sub-tokens
            if token.is_group:
                self._inspect_tokens_recursively(token)

    def _extract_tables(self, statement: Statement) -> Set[str]:
        """Extract table names referenced in FROM and JOIN clauses."""
        tables: Set[str] = set()
        sql_text = statement.value

        # Regex targeting: FROM/JOIN <table_name> optionally comma-separated
        # e.g., FROM students, guardians or JOIN fee_invoices ON ...
        pattern = r'\b(?:FROM|JOIN)\s+([a-zA-Z0-9_`"\[\]]+(?:\s*,\s*[a-zA-Z0-9_`"\[\]]+)*)'
        matches = re.finditer(pattern, sql_text, re.IGNORECASE)

        disallowed_clause_words = {
            "SELECT", "WHERE", "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "CROSS",
            "ON", "USING", "AS", "GROUP", "ORDER", "LIMIT", "HAVING", "UNION",
            "WINDOW", "VALUES", "SET"
        }

        for match in matches:
            clause = match.group(1)
            for part in clause.split(','):
                candidate = part.strip().split()[0].strip('"`[]')
                if candidate and candidate.upper() not in disallowed_clause_words:
                    tables.add(candidate)

        return tables


# Global singleton guard instance
security_guard = SQLSecurityGuard()
