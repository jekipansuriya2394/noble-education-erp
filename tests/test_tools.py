"""Unit tests for tool definitions, validation, and safe dispatching."""

import pytest
import asyncio
from pydantic import ValidationError

from app.core.database import init_db, seed_database_if_empty
from app.schemas.tools import QueryDatabaseInput, SendNotificationInput, GenerateReportInput
from app.tools.registry import registry
import app.tools  # Registers query_database, send_notification, generate_report


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """Ensure database schema is ready before testing tools."""
    asyncio.run(init_db())
    asyncio.run(seed_database_if_empty())


def test_registered_tools_exist():
    """Verify all 3 required tools are registered in the registry."""
    tools = registry.get_ollama_tools()
    tool_names = [t["function"]["name"] for t in tools]
    assert "query_database" in tool_names
    assert "send_notification" in tool_names
    assert "generate_report" in tool_names


def test_tool_json_schemas():
    """Check Ollama / OpenAI compliant schema structure."""
    tools = registry.get_ollama_tools()
    for tool in tools:
        assert tool["type"] == "function"
        fn = tool["function"]
        assert "name" in fn
        assert "description" in fn
        assert "parameters" in fn
        assert fn["parameters"]["type"] == "object"
        assert "properties" in fn["parameters"]


def test_schema_validations():
    """Test Pydantic input models enforce constraints."""
    # QueryDatabaseInput rejects empty
    with pytest.raises(ValidationError):
        QueryDatabaseInput(sql_string="   ")

    # SendNotificationInput rejects non-positive user_id or empty body
    with pytest.raises(ValidationError):
        SendNotificationInput(user_id=0, message_body="Test")

    # GenerateReportInput rejects invalid module_name
    with pytest.raises(ValidationError):
        GenerateReportInput(module_name="non_existent_module")


@pytest.mark.asyncio
async def test_execute_query_database_success():
    """Test valid query execution through registry dispatcher."""
    res = await registry.execute(
        "query_database",
        {"sql_string": "SELECT id, first_name, email FROM students WHERE id = 1"},
    )
    assert res["success"] is True
    result_data = res["result"]
    assert result_data["status"] == "success"
    assert result_data["row_count"] == 1
    assert result_data["rows"][0]["first_name"] == "Liam"


@pytest.mark.asyncio
async def test_execute_query_database_security_rejection():
    """Test malicious query is intercepted gracefully by the tool."""
    res = await registry.execute(
        "query_database",
        {"sql_string": "DROP TABLE students"},
    )
    assert res["success"] is True
    result_data = res["result"]
    assert result_data["status"] == "security_violation"
    assert "rejected by security guard" in result_data["error"]


@pytest.mark.asyncio
async def test_execute_send_notification():
    """Test send_notification tool queues notification and returns recipient info."""
    res = await registry.execute(
        "send_notification",
        {
            "user_id": 1,
            "message_body": "Reminder: Tuition payment of $2500 is overdue for Fall 2026.",
            "channel": "email",
        },
    )
    assert res["success"] is True
    result = res["result"]
    assert result["status"] == "queued"
    assert result["recipient"]["student_id"] == 1
    assert result["recipient"]["student_name"] == "Liam Johnson"
    assert len(result["recipient"]["guardians"]) > 0


@pytest.mark.asyncio
async def test_execute_generate_report():
    """Test generate_report tool aggregates tuition defaulters accurately."""
    res = await registry.execute(
        "generate_report",
        {"module_name": "tuition_defaulters"},
    )
    assert res["success"] is True
    result = res["result"]
    assert result["status"] == "success"
    assert result["total_defaulters_count"] >= 2
    assert result["total_outstanding_amount"] > 0
