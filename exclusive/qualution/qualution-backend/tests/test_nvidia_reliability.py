import pytest
import httpx
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.providers.nvidia_provider import NVIDIAProvider, redact_sensitive
from app.services.providers.groq_provider import GroqProvider
from app.services.ai_orchestrator import AIOrchestrator
from app.core.config import settings

client = TestClient(app)

@pytest.fixture(autouse=True)
def configure_mock_api_key(monkeypatch):
    monkeypatch.setattr(settings, "NVIDIA_API_KEY", "nvapi-mock-test-key")

# 1. NVIDIA Success
def test_1_nvidia_success():
    provider = NVIDIAProvider(api_key="nvapi-mock-test-key")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": "Hadamard creates equal superposition."}}]
    }
    with patch("httpx.Client.post", return_value=mock_resp):
        res = provider.generate_reasoning(
            question="What does H gate do?",
            context={"circuit": {"qubits": 1, "gates": [{"gate": "h", "targets": [0]}]}},
            mode="explain",
            level="beginner"
        )
        assert res["status"] == "success"
        assert res["provider"] == "nvidia"
        assert res["reasoning_provider"] == "nvidia"
        assert "Hadamard creates equal superposition" in res["answer"]
        assert res["fallback_answer"] is None
        assert res["retryable"] is False

# 2. NVIDIA Read Timeout
def test_2_nvidia_read_timeout():
    provider = NVIDIAProvider()
    with patch("httpx.Client.post", side_effect=httpx.ReadTimeout("The read operation timed out")):
        res = provider.generate_reasoning(
            question="Analyze the conceptual misconception in my custom algorithm.",
            context={"circuit": {"qubits": 10, "gates": []}},
            mode="explain",
            level="beginner"
        )
        assert res["status"] == "provider_timeout"
        assert res["retryable"] is True
        assert res["error_code"] == "PROVIDER_TIMEOUT"
        assert res["answer"] is None

# 3. NVIDIA Connection Timeout
def test_3_nvidia_connection_timeout():
    provider = NVIDIAProvider()
    with patch("httpx.Client.post", side_effect=httpx.ConnectTimeout("Connection timed out")):
        res = provider.generate_reasoning(
            question="Analyze the conceptual misconception in my custom algorithm.",
            context={"circuit": {"qubits": 10, "gates": []}},
            mode="explain",
            level="beginner"
        )
        assert res["status"] == "provider_timeout"
        assert res["retryable"] is True
        assert res["error_code"] == "PROVIDER_TIMEOUT"

# 4. NVIDIA Retry Then Success
def test_4_nvidia_retry_then_success():
    provider = NVIDIAProvider()
    mock_success = MagicMock()
    mock_success.status_code = 200
    mock_success.json.return_value = {
        "choices": [{"message": {"content": "Successfully recovered on attempt 2."}}]
    }

    # First attempt raises ReadTimeout, second attempt succeeds
    side_effects = [httpx.ReadTimeout("Read timed out on attempt 1"), mock_success]
    with patch("httpx.Client.post", side_effect=side_effects), patch("time.sleep", return_value=None):
        content, latency_ms, status = provider._call_chat_completions("sys", "user")
        assert status == "success"
        assert content == "Successfully recovered on attempt 2."

# 5. NVIDIA Retry Then Failure
def test_5_nvidia_retry_then_failure():
    provider = NVIDIAProvider()
    # Both attempts fail with ReadTimeout
    side_effects = [
        httpx.ReadTimeout("Timeout 1"),
        httpx.ReadTimeout("Timeout 2"),
        httpx.ReadTimeout("Timeout 3"),
        httpx.ReadTimeout("Timeout 4"),
    ]
    with patch("httpx.Client.post", side_effect=side_effects), patch("time.sleep", return_value=None):
        content, latency_ms, status = provider._call_chat_completions("sys", "user")
        assert status == "provider_timeout"
        assert content is None

# 6. Groq Unavailable After NVIDIA Success
def test_6_groq_unavailable_after_nvidia_success():
    mock_nvidia = MagicMock()
    mock_nvidia.generate_reasoning.return_value = {
        "status": "success",
        "answer": "Raw NVIDIA physics explanation of Bell state.",
        "fallback_answer": None,
        "retryable": False,
        "provider": "nvidia",
        "reasoning_provider": "nvidia",
        "latency_ms": 1200.0,
        "confidence": "high",
        "facts": ["Bell state has maximal entanglement."],
        "actions": [],
        "suggestions": [],
        "context_used": ["circuit"]
    }
    mock_groq = MagicMock()
    mock_groq.optimize_response.side_effect = Exception("Groq service connection reset")

    orchestrator = AIOrchestrator(nvidia=mock_nvidia, groq=mock_groq)
    res = orchestrator.query_tutor(
        question="Explain Bell state",
        context={"circuit": {"qubits": 2, "gates": []}},
        mode="explain",
        level="beginner",
        simplify_for_students=True
    )
    # Status should be degraded because optional Groq failed, but valid NVIDIA answer returned
    assert res["status"] == "degraded"
    assert res["answer"] == "Raw NVIDIA physics explanation of Bell state."
    assert res["reasoning_provider"] == "nvidia"
    assert res["response_optimizer"] is None
    assert res["provider"] == "nvidia"

# 7. NVIDIA Unavailable with Deterministic Supported Fallback
def test_7_nvidia_unavailable_with_supported_fallback():
    provider = NVIDIAProvider()
    with patch.object(provider, "_call_chat_completions", return_value=(None, 100.0, "provider_timeout")):
        res = provider.generate_reasoning(
            question="What does an H gate do?",
            context={"circuit": {"qubits": 1, "gates": [{"gate": "h", "targets": [0]}]}},
            mode="explain",
            level="beginner"
        )
        assert res["status"] == "provider_timeout"
        assert res["retryable"] is True
        assert res["answer"] is None  # Must NOT masquerade as AI answer
        assert res["fallback_answer"] is not None
        assert "superposition" in res["fallback_answer"].lower()
        assert res["reasoning_provider"] == "fallback"

# 8. NVIDIA Unavailable with Unsupported Request
def test_8_nvidia_unavailable_with_unsupported_request():
    provider = NVIDIAProvider()
    with patch.object(provider, "_call_chat_completions", return_value=(None, 100.0, "provider_timeout")):
        res = provider.generate_reasoning(
            question="Analyze the conceptual misconception in my custom 20-gate algorithm.",
            context={"circuit": {"qubits": 20, "gates": []}},
            mode="explain",
            level="advanced"
        )
        assert res["status"] == "provider_timeout"
        assert res["retryable"] is True
        assert res["answer"] is None
        assert res["fallback_answer"] is None
        assert res["reasoning_provider"] == "none"

# 9. Malformed Provider Response
def test_9_malformed_provider_response():
    provider = NVIDIAProvider()
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"invalid": "payload without choices"}

    with patch("httpx.Client.post", return_value=mock_resp):
        content, latency, status = provider._call_chat_completions("sys", "user")
        assert content is None
        assert status == "provider_unavailable"

# 10. Credential Redaction
def test_10_credential_redaction():
    leak_string = "Error at https://integrate.api.nvidia.com auth with nvapi-secret123456789 and Bearer nvapi-abc123xyz"
    redacted = redact_sensitive(leak_string)
    assert "nvapi-secret" not in redacted
    assert "nvapi-abc" not in redacted
    assert "[REDACTED" in redacted

# 11. Explicit Normalized Provider Status
def test_11_explicit_normalized_provider_status():
    mock_nvidia = MagicMock()
    mock_nvidia.generate_reasoning.return_value = {
        "status": "provider_timeout",
        "answer": None,
        "fallback_answer": "### Quantum Lab fallback explanation\nHadamard creates superposition.",
        "retryable": True,
        "error_code": "PROVIDER_TIMEOUT",
        "error_message": "NVIDIA Tutor is taking too long to respond.",
        "provider": "nvidia",
        "reasoning_provider": "fallback",
        "latency_ms": 35000.0,
        "confidence": "high",
        "facts": [],
        "actions": [],
        "suggestions": [],
        "context_used": ["deterministic_rules"]
    }
    orchestrator = AIOrchestrator(nvidia=mock_nvidia)
    res = orchestrator.query_tutor("What does H gate do?", {"circuit": {"qubits": 1, "gates": []}})
    assert res["status"] == "provider_timeout"
    assert res["retryable"] is True
    assert res["error_code"] == "PROVIDER_TIMEOUT"
    assert res["answer"] is None
    assert res["fallback_answer"] is not None
    assert res["reasoning_provider"] == "fallback"

# 12. No Groq Call When NVIDIA Produced No Usable Reasoning
def test_12_no_groq_call_when_nvidia_failed():
    mock_nvidia = MagicMock()
    mock_nvidia.generate_reasoning.return_value = {
        "status": "provider_timeout",
        "answer": None,
        "fallback_answer": None,
        "retryable": True,
        "error_code": "PROVIDER_TIMEOUT",
        "error_message": "NVIDIA Tutor is taking too long to respond.",
        "provider": "nvidia",
        "reasoning_provider": "none",
        "latency_ms": 35000.0,
        "confidence": "low",
        "facts": [],
        "actions": [],
        "suggestions": [],
        "context_used": []
    }
    mock_groq = MagicMock()

    orchestrator = AIOrchestrator(nvidia=mock_nvidia, groq=mock_groq)
    res = orchestrator.query_tutor("Complex question", {"circuit": {"qubits": 2, "gates": []}}, level="beginner")

    # Groq must NEVER be called to refine a non-existent NVIDIA reasoning output
    mock_groq.optimize_response.assert_not_called()
    assert res["status"] == "provider_timeout"
    assert res["response_optimizer"] is None
    assert res["answer"] is None
