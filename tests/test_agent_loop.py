"""Integration test for autonomous Agent execution loop with tool dispatching."""

import pytest
from unittest.mock import AsyncMock, patch

from app.core.database import init_db, seed_database_if_empty
from app.schemas.agent import (
    AgentRunRequest,
    OllamaChatMessage,
    OllamaToolCall,
    OllamaFunctionCall,
)
from app.services.agent_service import AgentService


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    import asyncio
    asyncio.run(init_db())
    asyncio.run(seed_database_if_empty())


@pytest.mark.asyncio
async def test_agent_execution_loop_multi_turn():
    """Verify the multi-turn agent loop queries the DB, drafts notifications, and concludes."""
    service = AgentService()

    # Turn 1: Ollama instructs to call query_database to find students with balance_due > 0
    turn_1_response = OllamaChatMessage(
        role="assistant",
        content="I will query the database to identify students with unpaid tuition balances.",
        tool_calls=[
            OllamaToolCall(
                id="call_1",
                type="function",
                function=OllamaFunctionCall(
                    name="query_database",
                    arguments={
                        "sql_string": "SELECT s.id, s.first_name, s.last_name, f.balance_due, f.term FROM students s JOIN fee_invoices f ON s.id = f.student_id WHERE f.balance_due > 0"
                    },
                ),
            )
        ],
    )

    # Turn 2: Ollama receives query result and calls send_notification for student 1 (Liam)
    turn_2_response = OllamaChatMessage(
        role="assistant",
        content="I found Liam Johnson with an overdue balance of $2500. I am drafting a reminder email.",
        tool_calls=[
            OllamaToolCall(
                id="call_2",
                type="function",
                function=OllamaFunctionCall(
                    name="send_notification",
                    arguments={
                        "user_id": 1,
                        "message_body": "Dear Liam Johnson, this is a reminder that your Fall 2026 tuition balance of $2500.00 is overdue. Please settle your dues.",
                        "channel": "email",
                    },
                ),
            )
        ],
    )

    # Turn 3: Ollama synthesizes final summary
    turn_3_response = OllamaChatMessage(
        role="assistant",
        content=(
            "### Tuition Follow-up Summary\n"
            "- **Identified Defaulters**: Liam Johnson (ID: 1, Balance: $2500.00).\n"
            "- **Action Taken**: Drafted and queued official reminder email to Liam and his guardian.\n"
            "- **Status**: Logged in audit registry for bursar review."
        ),
        tool_calls=None,
    )

    # Mock OllamaClient.check_health and chat
    with patch.object(service.ollama, "check_health", new_callable=AsyncMock) as mock_health, \
         patch.object(service.ollama, "chat", new_callable=AsyncMock) as mock_chat:

        mock_health.return_value = {
            "status": "online",
            "model_available": True,
            "installed_models": ["llama3:latest"],
        }
        mock_chat.side_effect = [turn_1_response, turn_2_response, turn_3_response]

        request = AgentRunRequest(
            prompt="Find all students who haven't paid tuition and draft reminder emails."
        )
        response = await service.run(request)

        assert response.steps_executed == 3
        assert response.tool_invocations_count == 2
        assert len(response.audit_trail) == 2
        
        # Verify first step executed query_database
        step_1 = response.audit_trail[0]
        assert step_1.tool_calls[0].tool_name == "query_database"
        assert step_1.tool_calls[0].success is True
        assert step_1.tool_calls[0].result["row_count"] >= 1

        # Verify second step executed send_notification
        step_2 = response.audit_trail[1]
        assert step_2.tool_calls[0].tool_name == "send_notification"
        assert step_2.tool_calls[0].success is True
        assert step_2.tool_calls[0].result["status"] == "queued"

        # Verify final answer content
        assert "Tuition Follow-up Summary" in response.final_answer
        assert "Liam Johnson" in response.final_answer
