"""API endpoints for AI Agent operations and tool introspection."""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, status
from app.schemas.agent import AgentRunRequest, AgentRunResponse
from app.services.agent_service import agent_service
from app.services.ollama_client import ollama_client
from app.tools.registry import registry

router = APIRouter(prefix="/agent", tags=["AI Operations Agent"])


@router.post(
    "/run",
    response_model=AgentRunResponse,
    summary="Execute Natural Language ERP Command",
    description=(
        "Submits a natural language command to the autonomous Llama 3 ERP agent. "
        "The agent will execute reasoning, call authorized tools (query_database, "
        "send_notification, generate_report), respect SQL security guards, and return "
        "a consolidated action report with audit trace."
    ),
)
async def run_agent_command(request: AgentRunRequest) -> AgentRunResponse:
    try:
        response = await agent_service.run(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent execution failure: {str(e)}",
        )


@router.get(
    "/tools",
    response_model=List[Dict[str, Any]],
    summary="List Registered AI Agent Tools",
    description="Returns the OpenAI/Ollama-compliant JSON schemas of all registered tools.",
)
async def list_agent_tools() -> List[Dict[str, Any]]:
    return registry.get_ollama_tools()


@router.get(
    "/status",
    summary="Check Ollama LLM Connection & Model Status",
    description="Inspects reachability of the local Ollama instance and verifies model availability.",
)
async def check_ollama_status() -> Dict[str, Any]:
    return await ollama_client.check_health()
