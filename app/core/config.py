"""Application configuration settings using Pydantic Settings."""

from typing import List, Set, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for AI-Native School ERP Backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    APP_NAME: str = "AI-Native School ERP Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Ollama LLM Settings
    OLLAMA_BASE_URL: str = Field(
        default="http://localhost:11434",
        description="Base URL for local Ollama instance"
    )
    OLLAMA_MODEL: str = Field(
        default="llama3:latest",
        description="Model name to invoke (e.g., llama3, llama3.1, llama3.2)"
    )
    OLLAMA_TEMPERATURE: float = Field(
        default=0.1,
        description="Temperature for agent reasoning and tool calling precision"
    )
    OLLAMA_TIMEOUT_SECONDS: float = Field(
        default=60.0,
        description="Network timeout for Ollama inference responses"
    )

    # Agent Engine Controls
    AGENT_MAX_STEPS: int = Field(
        default=8,
        description="Maximum iterations in the agent loop to prevent runaways"
    )

    # Database & Security
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./school_erp.db",
        description="Async SQLAlchemy database URL (fallback or default)"
    )
    POSTGRES_DB_URL: Optional[str] = Field(
        default=None,
        description="PostgreSQL / Supabase connection URL (e.g., postgresql+asyncpg://user:pass@db.supabase.co:5432/postgres)"
    )
    DB_POOL_MIN_SIZE: int = Field(default=5, description="Minimum pool size for PostgreSQL connection pool")
    DB_POOL_MAX_SIZE: int = Field(default=20, description="Maximum pool size for PostgreSQL connection pool")
    DB_POOL_TIMEOUT: float = Field(default=30.0, description="Connection pool checkout timeout in seconds")

    # Educational Data Mining & ML Risk Thresholds
    RISK_THRESHOLD_HIGH: float = Field(
        default=0.70,
        description="Threshold probability above which a student is flagged as High Risk (triggers automated interventions)"
    )
    RISK_THRESHOLD_MEDIUM: float = Field(
        default=0.35,
        description="Threshold probability for Medium Risk warning tier"
    )
    ANALYTICS_SCHEDULE_HOUR: int = Field(default=2, description="Hour of day (24h) to run daily predictive batch")
    ANALYTICS_SCHEDULE_MINUTE: int = Field(default=0, description="Minute of hour to run daily predictive batch")

    # Document Ingestion & Vision/NLP
    CHROMADB_PERSIST_DIR: str = Field(
        default="./chroma_knowledge_base",
        description="Local persistent directory for ChromaDB vector embeddings"
    )
    TESSERACT_CMD: Optional[str] = Field(
        default=None,
        description="Optional custom path to tesseract binary (e.g. C:\\Program Files\\Tesseract-OCR\\tesseract.exe)"
    )
    DOCUMENT_UPLOAD_DIR: str = Field(
        default="./uploaded_documents",
        description="Directory where uploaded school PDFs and student documents are stored"
    )

    SQL_MAX_ROWS: int = Field(
        default=100,
        description="Maximum rows returned by query_database tool"
    )
    SQL_TIMEOUT_SECONDS: float = Field(
        default=5.0,
        description="Maximum query execution time before cancellation"
    )
    ALLOWED_ERP_TABLES: Set[str] = Field(
        default={
            "students",
            "guardians",
            "fee_invoices",
            "payments",
            "attendance",
            "courses",
            "enrollments",
            "assessments",
            "audit_notifications",
            "student_risk_assessments",
            "student_interventions",
            "student_documents",
            "teacher_behavioral_notes",
            "report_cards",
        },
        description="Permitted table whitelist for AI SQL execution"
    )


settings = Settings()
