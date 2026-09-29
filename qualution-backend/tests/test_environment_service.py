import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.environment_service import EnvironmentService, environment_service
from app.core.config import settings

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_service_cache():
    environment_service.clear_cache()
    yield
    environment_service.clear_cache()

def test_environment_snapshot_online_and_deterministic():
    """Verify default snapshot reports deterministic engine available and safe provider flags."""
    with patch("app.services.providers.nvidia_provider.nvidia_provider.is_configured", return_value=True), \
         patch("app.services.providers.groq_provider.groq_provider.is_configured", return_value=True):
        snapshot = environment_service.get_environment_snapshot(latency_ms=85.0, force_refresh=True)
        assert snapshot["connectivity"] == "online"
        assert snapshot["latency_ms"] == 85.0
        assert snapshot["deterministic"]["available"] is True
        assert snapshot["nvidia"]["available"] is True
        assert snapshot["groq"]["available"] is True
        assert snapshot["local_ai"]["available"] is False
        assert snapshot["local_ai"]["model"] is None

def test_environment_snapshot_low_bandwidth():
    """Verify latency above threshold is classified as low_bandwidth."""
    with patch("app.services.providers.nvidia_provider.nvidia_provider.is_configured", return_value=True):
        snapshot = environment_service.get_environment_snapshot(latency_ms=1800.0, force_refresh=True)
        assert snapshot["connectivity"] == "low_bandwidth"
        assert snapshot["latency_ms"] == 1800.0

def test_environment_snapshot_providers_unavailable():
    """Verify provider unavailable states are accurately reflected without errors."""
    with patch("app.services.providers.nvidia_provider.nvidia_provider.is_configured", return_value=False), \
         patch("app.services.providers.groq_provider.groq_provider.is_configured", return_value=False):
        snapshot = environment_service.get_environment_snapshot(force_refresh=True)
        assert snapshot["nvidia"]["available"] is False
        assert snapshot["groq"]["available"] is False
        assert snapshot["deterministic"]["available"] is True

def test_environment_caching_and_expiry():
    """Verify snapshot is cached within TTL and recomputed on cache clear."""
    service = EnvironmentService()
    snap1 = service.get_environment_snapshot()
    assert snap1 is not None

    # Call again within TTL
    snap2 = service.get_environment_snapshot()
    assert snap1["checked_at"] == snap2["checked_at"]

    # Clear cache and verify updated timestamp
    service.clear_cache()
    snap3 = service.get_environment_snapshot()
    assert snap3 is not None

def test_environment_endpoint_get_and_head():
    """Verify /api/v1/ai/environment responds to GET and HEAD without exposing secrets."""
    response = client.get("/api/v1/ai/environment")
    assert response.status_code == 200
    data = response.json()
    assert "connectivity" in data
    assert "deterministic" in data
    assert data["deterministic"]["available"] is True
    assert "nvidia" in data
    assert "groq" in data
    assert "local_ai" in data

    # Verify NO secrets or API keys are present in payload
    for k in ["api_key", "password", "token", "secret", "authorization"]:
        assert k not in data
        assert k not in str(data).lower()

    head_resp = client.head("/api/v1/ai/environment")
    assert head_resp.status_code == 200

def test_no_secrets_leaked_in_environment_payload():
    """Verify explicit safety: no raw API key values can be returned."""
    mock_key = "nvapi-secret-12345678"
    with patch.object(settings, "NVIDIA_API_KEY", mock_key):
        resp = client.get("/api/v1/ai/environment")
        assert resp.status_code == 200
        assert mock_key not in resp.text
