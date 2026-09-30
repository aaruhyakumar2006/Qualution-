import json
import pytest
from unittest.mock import MagicMock, patch
from app.services.providers.nvidia_provider import NVIDIAProvider, redact_sensitive
from app.services.providers.groq_provider import GroqProvider
from app.services.ai_orchestrator import AIOrchestrator
from app.schemas.ai_tutor import NormalizedTutorResponse

@pytest.fixture
def mock_context():
    return {
        "circuit": {
            "qubits": 2,
            "classicalBits": 2,
            "gates": [
                {"id": "g0", "gate": "h", "targets": [0], "column": 0},
                {"id": "g1", "gate": "cx", "targets": [0, 1], "column": 1}
            ],
            "measure": True,
            "shots": 1000
        },
        "simulation": {
            "probabilities": {"00": 0.5, "11": 0.5}
        },
        "learningLevel": "beginner"
    }

class FakeResponse:
    def __init__(self, status_code, lines):
        self.status_code = status_code
        self._lines = lines

    def iter_lines(self):
        for line in self._lines:
            yield line

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

class FakeStreamContext:
    def __init__(self, fake_resp):
        self.fake_resp = fake_resp

    def __enter__(self):
        return self.fake_resp

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

# 1. NVIDIA upstream stream parsing & multiple deltas & ordering
def test_nvidia_upstream_streaming_success(mock_context):
    provider = NVIDIAProvider(api_key="nvapi-testkey123456789")
    
    upstream_lines = [
        'data: {"choices":[{"delta":{"content":"The Hadamard "}}]}',
        'data: {"choices":[{"delta":{"content":"gate transforms |0> "}}]}',
        'data: {"choices":[{"delta":{"content":"into superposition."}}]}',
        'data: [DONE]'
    ]
    
    with patch("httpx.Client.stream", return_value=FakeStreamContext(FakeResponse(200, upstream_lines))):
        events = list(provider.generate_reasoning_stream("Explain H gate", mock_context))
        
        deltas = [e["text"] for e in events if e.get("type") == "delta"]
        assert deltas == ["The Hadamard ", "gate transforms |0> ", "into superposition."]
        
        done_events = [e for e in events if e.get("type") == "done"]
        assert len(done_events) == 1
        assert done_events[0]["content"] == "The Hadamard gate transforms |0> into superposition."
        assert done_events[0]["status"] == "success"
        assert done_events[0]["provider"] == "nvidia"

# 2. Groq upstream stream parsing & multiple deltas & ordering
def test_groq_upstream_streaming_success(mock_context):
    provider = GroqProvider(api_key="gsk-testkey123456789")
    
    upstream_lines = [
        'data: {"choices":[{"delta":{"content":"Think of your "}}]}',
        'data: {"choices":[{"delta":{"content":"qubit as a spinning "}}]}',
        'data: {"choices":[{"delta":{"content":"coin."}}]}',
        'data: [DONE]'
    ]
    
    with patch("httpx.Client.stream", return_value=FakeStreamContext(FakeResponse(200, upstream_lines))):
        events = list(provider.optimize_response_stream("NVIDIA reasoning", "Explain H gate", mock_context))
        
        deltas = [e["text"] for e in events if e.get("type") == "delta"]
        assert deltas == ["Think of your ", "qubit as a spinning ", "coin."]
        
        done_events = [e for e in events if e.get("type") == "done"]
        assert len(done_events) == 1
        assert done_events[0]["content"] == "Think of your qubit as a spinning coin."

# 3. Empty upstream stream
def test_nvidia_empty_stream(mock_context):
    provider = NVIDIAProvider(api_key="nvapi-testkey123456789")
    with patch("httpx.Client.stream", return_value=FakeStreamContext(FakeResponse(200, ['data: [DONE]']))):
        events = list(provider.generate_reasoning_stream("Explain", mock_context))
        assert any(e.get("type") == "error" for e in events)

# 4. Malformed upstream event handling
def test_groq_malformed_upstream_events(mock_context):
    provider = GroqProvider(api_key="gsk-testkey123456789")
    upstream_lines = [
        'data: {broken json',
        'data: {"choices":[]}',
        'data: {"choices":[{"delta":{"content":"Valid token"}}]}',
        'data: [DONE]'
    ]
    with patch("httpx.Client.stream", return_value=FakeStreamContext(FakeResponse(200, upstream_lines))):
        events = list(provider.optimize_response_stream("Reasoning", "Explain", mock_context))
        deltas = [e["text"] for e in events if e.get("type") == "delta"]
        assert deltas == ["Valid token"]

# 5. Upstream HTTP 500 failure fallback
def test_nvidia_http_500_failure(mock_context):
    provider = NVIDIAProvider(api_key="nvapi-testkey123456789")
    with patch("httpx.Client.stream", return_value=FakeStreamContext(FakeResponse(500, []))):
        events = list(provider.generate_reasoning_stream("Explain", mock_context))
        errors = [e for e in events if e.get("type") == "error"]
        assert len(errors) == 1
        assert errors[0]["status"] == "provider_unavailable"

# 6. Complete AI Orchestrator SSE pipeline: NVIDIA reasoning -> Groq streaming deltas -> Normalized done
def test_orchestrator_stream_pipeline_success(mock_context):
    mock_nvidia = MagicMock(spec=NVIDIAProvider)
    mock_nvidia.is_configured.return_value = True
    mock_nvidia.generate_reasoning.return_value = {
        "status": "success",
        "answer": "NVIDIA verified physics reasoning on Bell state.",
        "facts": ["Unitary evolution strictly preserves norm."],
        "actions": [{"type": "open_state", "label": "Inspect Statevector"}],
        "suggestions": ["Why 50/50?"],
        "context_used": ["circuit"],
        "provider": "nvidia",
        "reasoning_provider": "nvidia",
        "latency_ms": 120.0
    }

    mock_groq = MagicMock(spec=GroqProvider)
    mock_groq.is_configured.return_value = True
    mock_groq.optimize_response_stream.return_value = iter([
        {"type": "delta", "text": "Student explanation: "},
        {"type": "delta", "text": "Bell state links two qubits."},
        {"type": "done", "content": "Student explanation: Bell state links two qubits."}
    ])

    orchestrator = AIOrchestrator(nvidia=mock_nvidia, groq=mock_groq)
    events = list(orchestrator.stream_tutor("Explain Bell state", mock_context, mode="explain", level="beginner"))

    event_types = [e["event"] for e in events]
    assert "status" in event_types
    assert "delta" in event_types
    assert "done" in event_types

    deltas = [e["data"]["text"] for e in events if e["event"] == "delta"]
    assert "".join(deltas) == "Student explanation: Bell state links two qubits."

    done_event = next(e for e in events if e["event"] == "done")
    final_payload = done_event["data"]
    assert final_payload["status"] == "success"
    assert final_payload["answer"] == "Student explanation: Bell state links two qubits."
    assert final_payload["provider"] == "groq-nvidia-dual"
    assert final_payload["reasoning_provider"] == "nvidia"
    assert final_payload["response_optimizer"] == "groq"
    assert "Unitary evolution strictly preserves norm." in final_payload["facts"]

# 7. Orchestrator fallback when NVIDIA fails
def test_orchestrator_stream_pipeline_nvidia_failure(mock_context):
    mock_nvidia = MagicMock(spec=NVIDIAProvider)
    mock_nvidia.is_configured.return_value = True
    mock_nvidia.generate_reasoning.return_value = {
        "status": "provider_unavailable",
        "answer": None,
        "fallback_answer": "Deterministic fallback explanation for Bell state.",
        "facts": ["Unitary evolution strictly preserves norm."],
        "provider": "local_fallback",
        "reasoning_provider": "fallback"
    }

    mock_groq = MagicMock(spec=GroqProvider)
    orchestrator = AIOrchestrator(nvidia=mock_nvidia, groq=mock_groq)
    events = list(orchestrator.stream_tutor("Explain Bell state", mock_context))

    # Groq must NOT be called if NVIDIA fails
    mock_groq.optimize_response_stream.assert_not_called()

    status_events = [e["data"]["stage"] for e in events if e["event"] == "status"]
    assert "fallback" in status_events

    deltas = [e["data"]["text"] for e in events if e["event"] == "delta"]
    assert "Deterministic fallback explanation for Bell state." in deltas

    done_event = next(e for e in events if e["event"] == "done")
    assert done_event["data"]["provider"] == "local_fallback"
    assert done_event["data"]["answer"] == "Deterministic fallback explanation for Bell state."
    assert done_event["data"]["fallback_answer"] == "Deterministic fallback explanation for Bell state."

# 8. Secret Redaction across stream
def test_secret_redaction_in_stream():
    leaked_str = "Error with key nvapi-1234567890abcdef and gsk_secrettoken123456"
    sanitized = redact_sensitive(leaked_str)
    assert "nvapi-" not in sanitized
    assert "gsk_" not in sanitized
    assert "[REDACTED_API_KEY]" in sanitized
