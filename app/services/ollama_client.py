"""Ollama HTTP Client with function calling and tool support."""

import json
import logging
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings
from app.schemas.agent import (
    OllamaChatMessage,
    OllamaChatResponse,
    OllamaToolCall,
    OllamaFunctionCall,
)

logger = logging.getLogger(__name__)


class OllamaClientException(Exception):
    """Raised when communication with Ollama fails."""
    pass


class OllamaClient:
    """Async client communicating with local Ollama daemon for inference & tool calling."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL
        self.timeout = timeout or settings.OLLAMA_TIMEOUT_SECONDS

    async def check_health(self) -> Dict[str, Any]:
        """Check if local Ollama daemon is reachable and list installed models."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(f"{self.base_url}/api/tags")
                resp.raise_for_status()
                data = resp.json()
                installed_models = [m.get("name") for m in data.get("models", [])]
                return {
                    "status": "online",
                    "base_url": self.base_url,
                    "target_model": self.model,
                    "model_available": any(self.model in m for m in installed_models),
                    "installed_models": installed_models,
                }
            except Exception as e:
                return {
                    "status": "offline",
                    "base_url": self.base_url,
                    "target_model": self.model,
                    "error": f"Cannot connect to Ollama at {self.base_url}. Ensure 'ollama serve' is running. Error: {str(e)}",
                }

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: Optional[float] = None,
    ) -> OllamaChatMessage:
        """Send chat messages and tool definitions to Ollama /api/chat.
        
        Args:
            messages: List of chat messages with role and content.
            tools: Optional list of function tool schemas.
            temperature: LLM sampling temperature.
            
        Returns:
            OllamaChatMessage with assistant content and optional tool_calls.
        """
        url = f"{self.base_url}/api/chat"
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature if temperature is not None else settings.OLLAMA_TEMPERATURE,
            },
        }

        if tools:
            payload["tools"] = tools

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                logger.info(f"Dispatching request to Ollama ({self.model}) with {len(messages)} messages...")
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
            except httpx.ConnectError as conn_err:
                msg = (
                    f"Unable to connect to Ollama at '{self.base_url}'. "
                    "Make sure the Ollama service is active. Run 'ollama serve' and 'ollama run llama3'."
                )
                logger.error(msg)
                raise OllamaClientException(msg) from conn_err
            except httpx.HTTPStatusError as http_err:
                msg = f"Ollama HTTP {http_err.response.status_code} error: {http_err.response.text}"
                logger.error(msg)
                raise OllamaClientException(msg) from http_err
            except Exception as err:
                msg = f"Unexpected error communicating with Ollama: {str(err)}"
                logger.error(msg)
                raise OllamaClientException(msg) from err

        msg_data = data.get("message", {})
        raw_tool_calls = msg_data.get("tool_calls")
        parsed_tool_calls: Optional[List[OllamaToolCall]] = None

        if raw_tool_calls:
            parsed_tool_calls = []
            for tc in raw_tool_calls:
                func_data = tc.get("function", {})
                args = func_data.get("arguments", {})
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except Exception:
                        args = {"raw_args": args}

                parsed_tool_calls.append(
                    OllamaToolCall(
                        id=tc.get("id"),
                        type=tc.get("type", "function"),
                        function=OllamaFunctionCall(
                            name=func_data.get("name", "unknown"),
                            arguments=args,
                        ),
                    )
                )

        return OllamaChatMessage(
            role=msg_data.get("role", "assistant"),
            content=msg_data.get("content", ""),
            tool_calls=parsed_tool_calls,
        )


ollama_client = OllamaClient()
