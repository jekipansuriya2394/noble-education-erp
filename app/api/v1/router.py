"""API v1 Router aggregating all sub-routers."""

from fastapi import APIRouter
from app.api.v1.endpoints import agent, erp, analytics, documents, evaluations

api_router = APIRouter()
api_router.include_router(agent.router)
api_router.include_router(erp.router)
api_router.include_router(analytics.router)
api_router.include_router(documents.router)
api_router.include_router(evaluations.router)



