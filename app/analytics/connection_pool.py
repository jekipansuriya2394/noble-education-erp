"""Production Database Connection Pool Manager for PostgreSQL / Supabase with SQLite fallback.

Configured with connection recycling, pre-ping liveness checks, and scoped session lifecycle.
"""

import logging
import time
from typing import AsyncGenerator, Dict, Any, Optional
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine,
)
from sqlalchemy import text
from app.core.config import settings

logger = logging.getLogger("erp_pool")


class DatabasePoolManager:
    """Manages resilient connection pooling to PostgreSQL / Supabase with automatic failover."""

    def __init__(self):
        self._engine: Optional[AsyncEngine] = None
        self._sessionmaker: Optional[async_sessionmaker[AsyncSession]] = None
        self.is_postgres: bool = False
        self._initialize_pool()

    def _initialize_pool(self) -> None:
        """Configure async connection pool with pooling parameters."""
        db_url = settings.POSTGRES_DB_URL or settings.DATABASE_URL
        self.is_postgres = "postgres" in db_url.lower()

        if self.is_postgres:
            logger.info("Initializing high-concurrency PostgreSQL / Supabase connection pool...")
            # Async engine parameters optimized for Supabase / PostgreSQL
            self._engine = create_async_engine(
                db_url,
                echo=settings.DEBUG,
                pool_size=settings.DB_POOL_MIN_SIZE,
                max_overflow=max(0, settings.DB_POOL_MAX_SIZE - settings.DB_POOL_MIN_SIZE),
                pool_timeout=settings.DB_POOL_TIMEOUT,
                pool_recycle=1800,  # 30 mins to avoid Supabase connection dropouts
                pool_pre_ping=True,  # Test connection validity before returning to caller
            )
        else:
            logger.info("Initializing local SQLite database connection pool...")
            self._engine = create_async_engine(
                db_url,
                echo=settings.DEBUG,
                future=True,
            )

        self._sessionmaker = async_sessionmaker(
            self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Provide a transactional session with automatic commit/rollback and connection cleanup."""
        if not self._sessionmaker:
            self._initialize_pool()

        async with self._sessionmaker() as session:
            try:
                yield session
            except Exception as e:
                logger.error(f"Database session error encountered: {e}. Rolling back...")
                await session.rollback()
                raise
            finally:
                await session.close()

    async def check_health(self) -> Dict[str, Any]:
        """Perform pre-flight query to verify connection pool liveness and measure latency."""
        start_time = time.perf_counter()
        try:
            async with self.get_session() as session:
                await session.execute(text("SELECT 1;"))
            latency_ms = (time.perf_counter() - start_time) * 1000
            
            pool_info = {}
            if self._engine and hasattr(self._engine.sync_engine, "pool"):
                pool = self._engine.sync_engine.pool
                pool_info = {
                    "size": pool.size() if hasattr(pool, "size") else "N/A",
                    "checkedin": pool.checkedin() if hasattr(pool, "checkedin") else "N/A",
                    "checkedout": pool.checkedout() if hasattr(pool, "checkedout") else "N/A",
                    "overflow": pool.overflow() if hasattr(pool, "overflow") else "N/A",
                }

            return {
                "status": "healthy",
                "database_type": "PostgreSQL/Supabase" if self.is_postgres else "SQLite",
                "latency_ms": round(latency_ms, 2),
                "pool_metrics": pool_info,
            }
        except Exception as e:
            logger.exception("Database pool health check failed.")
            return {
                "status": "unhealthy",
                "database_type": "PostgreSQL/Supabase" if self.is_postgres else "SQLite",
                "error": str(e),
            }

    async def close(self) -> None:
        """Gracefully dispose all checked-in connections in the pool."""
        if self._engine:
            await self._engine.dispose()
            logger.info("Database connection pool disposed cleanly.")


# Global singleton pool manager instance
db_pool = DatabasePoolManager()
