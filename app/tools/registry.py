"""Tool registration, schema generation, and safe execution dispatcher."""

import inspect
import json
import logging
import time
from typing import Any, Callable, Dict, List, Optional, Type
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)


class ToolDefinition:
    """Encapsulates a registered agent tool."""

    def __init__(
        self,
        name: str,
        description: str,
        input_model: Type[BaseModel],
        handler: Callable[..., Any],
    ):
        self.name = name
        self.description = description
        self.input_model = input_model
        self.handler = handler

    def to_ollama_schema(self) -> Dict[str, Any]:
        """Generate Ollama / OpenAI-compatible tool schema from Pydantic model."""
        schema = self.input_model.model_json_schema()
        
        # Clean schema metadata not needed by LLM
        schema_props = schema.get("properties", {})
        required = schema.get("required", [])

        parameters_schema = {
            "type": "object",
            "properties": schema_props,
            "required": required,
        }

        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": parameters_schema,
            }
        }


class ToolRegistry:
    """Registry managing available tools and their secure invocation."""

    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}

    def register(
        self,
        name: str,
        description: str,
        input_model: Type[BaseModel],
    ):
        """Decorator to register a callable as an agent tool."""
        def decorator(func: Callable[..., Any]):
            self._tools[name] = ToolDefinition(
                name=name,
                description=description,
                input_model=input_model,
                handler=func,
            )
            return func
        return decorator

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def get_ollama_tools(self) -> List[Dict[str, Any]]:
        """Return list of function schemas formatted for Ollama /api/chat."""
        return [tool.to_ollama_schema() for tool in self._tools.values()]

    async def execute(
        self,
        name: str,
        raw_arguments: Any,
    ) -> Dict[str, Any]:
        """Validate input arguments with Pydantic and invoke the tool handler.
        
        Returns a dict containing:
          - success: bool
          - result: Any (if success)
          - error: str (if failed)
          - duration_ms: float
        """
        start_time = time.perf_counter()
        tool = self._tools.get(name)

        if not tool:
            return {
                "success": False,
                "result": None,
                "error": f"Tool '{name}' is not recognized. Available tools: {list(self._tools.keys())}",
                "duration_ms": (time.perf_counter() - start_time) * 1000,
            }

        # Normalize arguments from string or dict
        if isinstance(raw_arguments, str):
            try:
                args_dict = json.loads(raw_arguments)
            except Exception as e:
                return {
                    "success": False,
                    "result": None,
                    "error": f"Invalid JSON arguments: {str(e)}",
                    "duration_ms": (time.perf_counter() - start_time) * 1000,
                }
        elif isinstance(raw_arguments, dict):
            args_dict = raw_arguments
        else:
            args_dict = {}

        # Validate with Pydantic input model
        try:
            validated_input = tool.input_model(**args_dict)
        except ValidationError as val_err:
            return {
                "success": False,
                "result": None,
                "error": f"Tool argument validation failed: {val_err.errors()}",
                "duration_ms": (time.perf_counter() - start_time) * 1000,
            }

        # Execute handler (async or sync)
        try:
            if inspect.iscoroutinefunction(tool.handler):
                result = await tool.handler(validated_input)
            else:
                result = tool.handler(validated_input)

            return {
                "success": True,
                "result": result,
                "error": None,
                "duration_ms": (time.perf_counter() - start_time) * 1000,
            }
        except Exception as exec_err:
            logger.exception(f"Error executing tool '{name}': {exec_err}")
            return {
                "success": False,
                "result": None,
                "error": f"Execution error: {str(exec_err)}",
                "duration_ms": (time.perf_counter() - start_time) * 1000,
            }


# Global tool registry instance
registry = ToolRegistry()
