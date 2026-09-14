"""Autonomous Agent Execution Loop for School ERP operations."""

import json
import logging
import time
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.schemas.agent import (
    AgentRunRequest,
    AgentRunResponse,
    AgentStepAudit,
    ToolCallRecord,
)
from app.services.ollama_client import ollama_client, OllamaClientException
from app.tools.registry import registry

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Principal AI Operations Architect and Assistant for an AI-Native School ERP system.
You have access to tools that can query school records, draft notifications, and generate administrative reports.

DATABASE SCHEMA OVERVIEW:
- students: (id, first_name, last_name, email, grade_level, status)
- guardians: (id, student_id, name, email, phone, relationship)
- fee_invoices: (id, student_id, term, total_amount, balance_due, due_date, status)
- payments: (id, invoice_id, amount_paid, payment_date, payment_method)
- attendance: (id, student_id, date, status)
- courses: (id, code, title, department)
- enrollments: (id, student_id, course_id, semester, grade)
- audit_notifications: (id, user_id, message_body, channel, status, created_at)

OPERATIONAL GUIDELINES & POLICY:
1. ALWAYS use the `query_database` tool with a safe, read-only SELECT query to inspect students, invoices, and balances.
2. The database execution guard STRICTLY forbids any INSERT, UPDATE, DELETE, ALTER, or DROP statements in `query_database`.
3. To draft or dispatch reminder emails/messages, ALWAYS use the `send_notification` tool with the student's `user_id` and a professional message body.
4. To view high-level summaries, you may invoke `generate_report(module_name="tuition_defaulters")` or similar modules.
5. Provide helpful, empathetic, and professional communication in drafted reminders.
6. When all tasks are finished, provide an executive summary of the actions taken, the students identified, and the status of drafted notifications.
"""


class AgentService:
    """Orchestrates multi-turn reasoning and tool invocation cycles."""

    def __init__(self):
        self.ollama = ollama_client
        self.registry = registry

    async def run(self, request: AgentRunRequest) -> AgentRunResponse:
        """Execute the agent loop for a natural language user command."""
        start_time = time.perf_counter()
        max_steps = request.max_steps or settings.AGENT_MAX_STEPS
        prompt = request.prompt.strip()

        # Check local Ollama health first to provide clear diagnostics
        health = await self.ollama.check_health()
        if health.get("status") != "online":
            return AgentRunResponse(
                prompt=prompt,
                final_answer=(
                    f"⚠️ Local Ollama is offline or unreachable at {self.ollama.base_url}.\n\n"
                    "Please ensure Ollama is installed and active:\n"
                    "1. Start the service: `ollama serve`\n"
                    f"2. Pull the model if not already present: `ollama pull {self.ollama.model}`\n"
                    f"3. Run inference or verify: `ollama run {self.ollama.model}`\n\n"
                    f"Diagnostic error: {health.get('error')}"
                ),
                steps_executed=0,
                tool_invocations_count=0,
                audit_trail=[],
                total_duration_ms=(time.perf_counter() - start_time) * 1000,
                model_used=self.ollama.model,
            )

        # Prepare messages
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        # Fetch Ollama-compatible tool schemas from registry
        tool_schemas = self.registry.get_ollama_tools()

        step_count = 0
        total_tool_calls = 0
        audit_trail: List[AgentStepAudit] = []
        final_answer = ""

        logger.info(f"Starting Agent loop for prompt: '{prompt}' (max_steps={max_steps})")

        while step_count < max_steps:
            step_count += 1
            logger.info(f"--- Agent Step {step_count}/{max_steps} ---")

            try:
                # Call Ollama /api/chat with current context and tools
                assistant_message = await self.ollama.chat(
                    messages=messages,
                    tools=tool_schemas,
                )
            except OllamaClientException as o_err:
                logger.error(f"Ollama execution error at step {step_count}: {o_err}")
                return AgentRunResponse(
                    prompt=prompt,
                    final_answer=f"Agent terminated due to LLM communication error: {str(o_err)}",
                    steps_executed=step_count,
                    tool_invocations_count=total_tool_calls,
                    audit_trail=audit_trail,
                    total_duration_ms=(time.perf_counter() - start_time) * 1000,
                    model_used=self.ollama.model,
                )

            tool_calls = assistant_message.tool_calls

            # Case A: Model wants to call one or more tools
            if tool_calls and len(tool_calls) > 0:
                step_records: List[ToolCallRecord] = []
                
                # Append assistant's intent to conversation history
                assistant_dict: Dict[str, Any] = {
                    "role": "assistant",
                    "content": assistant_message.content or "",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in tool_calls
                    ],
                }
                messages.append(assistant_dict)

                # Execute each tool in sequence
                for tc in tool_calls:
                    func_name = tc.function.name
                    func_args = tc.function.arguments
                    total_tool_calls += 1

                    logger.info(f"Executing tool '{func_name}' with args: {func_args}")
                    exec_res = await self.registry.execute(func_name, func_args)

                    step_records.append(
                        ToolCallRecord(
                            tool_name=func_name,
                            arguments=func_args,
                            result=exec_res.get("result"),
                            success=exec_res.get("success", False),
                            error=exec_res.get("error"),
                            duration_ms=exec_res.get("duration_ms", 0.0),
                        )
                    )

                    # Append tool execution result back to the model
                    tool_result_content = (
                        json.dumps(exec_res.get("result"))
                        if exec_res.get("success")
                        else json.dumps({"error": exec_res.get("error")})
                    )
                    messages.append({
                        "role": "tool",
                        "content": tool_result_content,
                    })

                audit_trail.append(
                    AgentStepAudit(
                        step_number=step_count,
                        thought=assistant_message.content,
                        tool_calls=step_records,
                    )
                )

            # Case B: Model completed reasoning and gave a final response
            else:
                final_answer = assistant_message.content or "Task completed."
                logger.info(f"Agent finished reasoning at step {step_count}.")
                break

        # Fallback if maximum iterations reached
        if not final_answer and step_count >= max_steps:
            final_answer = (
                f"Agent reached maximum execution limit ({max_steps} iterations). "
                "Review the audit trail for completed intermediate tool actions."
            )

        duration = (time.perf_counter() - start_time) * 1000
        return AgentRunResponse(
            prompt=prompt,
            final_answer=final_answer,
            steps_executed=step_count,
            tool_invocations_count=total_tool_calls,
            audit_trail=audit_trail,
            total_duration_ms=round(duration, 2),
            model_used=self.ollama.model,
        )


agent_service = AgentService()
