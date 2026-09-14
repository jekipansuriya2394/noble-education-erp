"""Schemas for Agent requests, execution traces, and Ollama integration."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentRunRequest(BaseModel):
    """User command submitted to the autonomous agent."""
    prompt: str = Field(
        ...,
        description="Natural language instruction for the School ERP Agent.",
        examples=["Find all students who haven't paid tuition and draft reminder emails."]
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Optional session or tracking ID for multi-turn conversational state."
    )
    max_steps: Optional[int] = Field(
        default=None,
        description="Optional custom override for maximum agent execution iterations."
    )


class ToolCallRecord(BaseModel):
    """Execution record for an individual tool invocation."""
    tool_name: str
    arguments: Dict[str, Any]
    result: Any
    success: bool
    error: Optional[str] = None
    duration_ms: float


class AgentStepAudit(BaseModel):
    """Audit representation of an intermediate reasoning and action cycle."""
    step_number: int
    thought: Optional[str] = None
    tool_calls: List[ToolCallRecord] = Field(default_factory=list)


class AgentRunResponse(BaseModel):
    """Complete response returned by the Agent execution service."""
    prompt: str
    final_answer: str
    steps_executed: int
    tool_invocations_count: int
    audit_trail: List[AgentStepAudit] = Field(default_factory=list)
    total_duration_ms: float
    model_used: str


# ---------------------------------------------------------------------------
# Ollama Protocol Schemas
# ---------------------------------------------------------------------------

class OllamaFunctionCall(BaseModel):
    name: str
    arguments: Dict[str, Any]


class OllamaToolCall(BaseModel):
    id: Optional[str] = None
    type: str = "function"
    function: OllamaFunctionCall


class OllamaChatMessage(BaseModel):
    role: str  # "system", "user", "assistant", "tool"
    content: Optional[str] = ""
    tool_calls: Optional[List[OllamaToolCall]] = None


class OllamaChatResponse(BaseModel):
    model: str
    created_at: Optional[str] = None
    message: OllamaChatMessage
    done: bool
    total_duration: Optional[int] = None
