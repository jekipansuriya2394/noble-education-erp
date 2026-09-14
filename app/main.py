"""Main entrypoint for AI-Native School ERP Backend."""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, seed_database_if_empty
from app.api.v1.router import api_router
from app.tools.registry import registry
import app.tools  # Ensure all tools are imported and registered

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("erp_agent")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager for database initialization and seed data loading."""
    logger.info("Initializing School ERP Database...")
    await init_db()
    await seed_database_if_empty()
    logger.info(f"Database initialized. Registered tools: {list(registry._tools.keys())}")
    yield
    logger.info("Shutting down School ERP Backend...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-Native School ERP Backend featuring local Ollama (Llama 3) function calling, "
        "autonomous multi-turn agent execution, strict Pydantic schemas, and read-only "
        "SQL security guards."
    ),
    lifespan=lifespan,
)

# Enable CORS for frontend clients or admin dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API V1 routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Health & System"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
        "docs_url": "/docs",
        "ollama_target": {
            "base_url": settings.OLLAMA_BASE_URL,
            "model": settings.OLLAMA_MODEL,
        },
        "registered_tools": list(registry._tools.keys()),
    }
