"""API integration tests for FastAPI endpoints."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_api_root():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "query_database" in data["registered_tools"]


@pytest.mark.asyncio
async def test_api_list_tools():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/agent/tools")
        assert response.status_code == 200
        tools = response.json()
        names = [t["function"]["name"] for t in tools]
        assert "query_database" in names
        assert "send_notification" in names
        assert "generate_report" in names


@pytest.mark.asyncio
async def test_api_erp_defaulters():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/erp/defaulters")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["balance_due"] > 0
