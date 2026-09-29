import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.ai_orchestrator import AIOrchestrator, ai_orchestrator
from app.services.providers.nvidia_provider import NVIDIAProvider
from app.services.providers.groq_provider import GroqProvider

client = TestClient(app)

@pytest.fixture
def sample_bell_circuit():
    return {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": True,
        "shots": 1000
    }

@pytest.fixture
def sample_simulation_result():
    return {
        "backend": "qiskit_aer",
        "probabilities": {"00": 0.504, "11": 0.496},
        "counts": {"00": 504, "11": 496}
    }

def test_nvidia_provider_format_circuit_summary(sample_bell_circuit, sample_simulation_result):
    provider = NVIDIAProvider()
    context = {
        "circuit": sample_bell_circuit,
        "simulation": sample_simulation_result,
        "selectedGate": {"gate": "h", "targets": [0]}
    }
    summary = provider.format_circuit_summary(context)
    assert "2 qubit(s)" in summary
    assert "H on q[0]" in summary
    assert "Measurement Probabilities" in summary
    assert "|00>: 50.4%" in summary

def test_nvidia_provider_mocked_chat():
    provider = NVIDIAProvider()
    with patch.object(provider, "_call_chat_completions", return_value="The state is |00> + |11> over sqrt(2)."):
        res = provider.generate_reasoning(
            question="Why are outcomes 00 and 11?",
            context={"circuit": {"qubits": 2, "gates": []}},
            mode="explain",
            level="beginner"
        )
        assert res["provider"] == "nvidia"
        assert "sqrt(2)" in res["answer"]
        assert len(res["facts"]) > 0
        assert len(res["actions"]) > 0

def test_nvidia_provider_fallback_when_unconfigured():
    provider = NVIDIAProvider()
    with patch.object(provider, "is_configured", return_value=False):
        res = provider.generate_reasoning(
            question="Explain entanglement in this Bell state",
            context={
                "circuit": {
                    "qubits": 2,
                    "gates": [{"gate": "h", "targets": [0]}, {"gate": "cx", "targets": [0, 1]}]
                }
            },
            mode="explain",
            level="beginner"
        )
        assert res["provider"] == "local_deterministic_reasoner"
        ans_text = res.get("fallback_answer") or res.get("answer") or ""
        assert "bell state" in ans_text.lower()
        assert len(res["facts"]) > 0

def test_groq_provider_optimizes_for_beginner():
    provider = GroqProvider()
    with patch.object(provider, "_call_chat_completions", return_value="Intuition: A spinning coin in mid-air represents superposition."):
        res = provider.optimize_response(
            nvidia_reasoning="Unitary evolution U|0> produces 1/sqrt(2)(|0>+|1>).",
            question="What is superposition?",
            context={"circuit": {"qubits": 1, "gates": [{"gate": "h", "targets": [0]}]}},
            level="beginner"
        )
        assert res["optimized_by"] == "groq"
        assert "spinning coin" in res["optimized_text"]

def test_groq_provider_fallback_when_offline():
    provider = GroqProvider()
    with patch.object(provider, "_call_chat_completions", return_value=None):
        res = provider.optimize_response(
            nvidia_reasoning="Dense quantum mechanics with Hadamard gate",
            question="Why 50/50 probabilities?",
            context={"circuit": {"qubits": 1, "gates": [{"gate": "h", "targets": [0]}]}},
            level="beginner"
        )
        assert res is None

def test_groq_provider_discards_malformed_empty():
    provider = GroqProvider()
    with patch.object(provider, "_call_chat_completions", return_value="   too short   "):
        res = provider.optimize_response(
            nvidia_reasoning="Dense quantum mechanics with Hadamard gate",
            question="Why 50/50 probabilities?",
            context={"circuit": {"qubits": 1, "gates": [{"gate": "h", "targets": [0]}]}},
            level="beginner"
        )
        assert res is None

def test_nvidia_provider_fallback_unsupported_case():
    provider = NVIDIAProvider()
    with patch.object(provider, "_call_chat_completions", return_value=None):
        res = provider.generate_reasoning(
            question="What is the meaning of life in Hilbert space?",
            context={"circuit": {"qubits": 2, "gates": []}},
            mode="explain",
            level="beginner"
        )
        assert res["provider"] == "ai_unavailable"
        assert res["confidence"] == "low"
        assert res["answer"] is None
        assert res["status"] in ("provider_unavailable", "provider_timeout")


def test_orchestrator_dual_pipeline(sample_bell_circuit, sample_simulation_result):
    mock_nvidia = MagicMock()
    mock_nvidia.generate_reasoning.return_value = {
        "answer": "NVIDIA: The circuit creates maximal entanglement via H and CX.",
        "technical_analysis": "State |Phi+> = (|00>+|11>)/sqrt(2)",
        "confidence": "high",
        "facts": ["Unitary evolution is preserved."],
        "actions": [{"type": "open_state", "label": "Inspect Statevector"}],
        "suggestions": ["Why 00 and 11?"],
        "context_used": ["circuit_structure"],
        "code": None,
        "provider": "nvidia"
    }

    mock_groq = MagicMock()
    mock_groq.optimize_response.return_value = {
        "optimized_text": "Groq: Think of the two qubits as a pair of magically linked dice.",
        "optimized_by": "groq",
        "model": "llama-3.3-70b-versatile"
    }

    orchestrator = AIOrchestrator(nvidia=mock_nvidia, groq=mock_groq)
    res = orchestrator.query_tutor(
        question="How does entanglement work?",
        context={"circuit": sample_bell_circuit, "simulation": sample_simulation_result},
        mode="explain",
        level="beginner",
        simplify_for_students=True
    )

    assert res["reasoning_provider"] == "nvidia"
    assert res["response_optimizer"] == "groq"
    assert "magically linked dice" in res["answer"]
    assert "State |Phi+>" in res["technical_analysis"]
    assert len(res["facts"]) > 0
    assert len(res["actions"]) > 0

def test_orchestrator_nvidia_success_groq_failure_graceful(sample_bell_circuit):
    mock_nvidia = MagicMock()
    mock_nvidia.generate_reasoning.return_value = {
        "answer": "NVIDIA: Rigorous quantum state explanation.",
        "technical_analysis": "Pure state decomposition.",
        "confidence": "high",
        "facts": ["Unitary preservation"],
        "actions": [],
        "suggestions": [],
        "context_used": ["circuit"],
        "code": None,
        "provider": "nvidia"
    }

    mock_groq = MagicMock()
    mock_groq.optimize_response.side_effect = Exception("Groq API rate limit or timeout")

    orchestrator = AIOrchestrator(nvidia=mock_nvidia, groq=mock_groq)
    res = orchestrator.query_tutor(
        question="Explain my circuit",
        context={"circuit": sample_bell_circuit},
        mode="explain",
        level="beginner",
        simplify_for_students=True
    )

    # Must NOT fail the request! Returns NVIDIA reasoning directly
    assert res["answer"] == "NVIDIA: Rigorous quantum state explanation."
    assert res["reasoning_provider"] == "nvidia"
    assert res["response_optimizer"] is None

def test_orchestrator_nvidia_failure_local_fallback(sample_bell_circuit):
    mock_nvidia = MagicMock()
    mock_nvidia.generate_reasoning.side_effect = Exception("NVIDIA NIM 503 Service Unavailable")

    mock_groq = MagicMock()
    mock_groq.optimize_response.return_value = {"optimized_text": "Fallback student text", "optimized_by": "groq"}

    orchestrator = AIOrchestrator(nvidia=mock_nvidia, groq=mock_groq)
    res = orchestrator.query_tutor(
        question="Explain circuit",
        context={"circuit": sample_bell_circuit},
        mode="explain",
        level="beginner",
        simplify_for_students=True
    )

    assert res["reasoning_provider"] == "local_fallback"
    assert len(res["facts"]) > 0

@patch("app.services.providers.nvidia_provider.nvidia_provider._call_chat_completions", return_value="Hadamard creates equal superposition of basis states.")
@patch("app.services.providers.groq_provider.groq_provider._call_chat_completions", return_value="Intuition: A spinning coin in the air.")
def test_api_gateway_tutor_endpoint(mock_groq, mock_nvidia, sample_bell_circuit):
    payload = {
        "question": "What does Hadamard do?",
        "context": {"circuit": sample_bell_circuit},
        "mode": "explain",
        "level": "beginner",
        "simplify_for_students": True
    }
    # Test on both /api/v1/ai/tutor and /api/ai/tutor
    for path in ["/api/v1/ai/tutor", "/api/ai/tutor"]:
        resp = client.post(path, json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "answer" in data
        assert "reasoning_provider" in data
        assert "facts" in data
        assert "actions" in data
        # Ensure no raw secrets in response
        raw_text = resp.text
        assert "nvapi-" not in raw_text
        assert "gsk_" not in raw_text

@patch("app.services.providers.nvidia_provider.nvidia_provider._call_chat_completions", return_value="Circuit debugged: No critical bugs found.")
def test_api_gateway_debug_endpoint(mock_nvidia, sample_bell_circuit):
    payload = {
        "circuit": sample_bell_circuit,
        "error": "Literal error on gate 'p'"
    }
    resp = client.post("/api/v1/ai/debug", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert len(data["facts"]) > 0

@patch("app.services.providers.nvidia_provider.nvidia_provider._call_chat_completions", return_value="Circuit optimization explanation.")
def test_api_gateway_optimize_endpoint(mock_nvidia, sample_bell_circuit):
    payload = {
        "original_circuit": sample_bell_circuit,
        "optimized_circuit": sample_bell_circuit,
        "passes": ["IdentityCancellation"],
        "improvements": {"gate_count_reduction": 0}
    }
    resp = client.post("/api/v1/ai/optimize", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data

@patch("app.services.providers.nvidia_provider.nvidia_provider._call_chat_completions", return_value="Prediction verified.")
def test_api_gateway_predict_and_compare_endpoints(mock_nvidia, sample_bell_circuit, sample_simulation_result):
    predict_payload = {
        "circuit": sample_bell_circuit,
        "proposed_gate": {"gate": "x", "targets": [1]},
        "target_qubit": 1
    }
    resp = client.post("/api/v1/ai/predict", json=predict_payload)
    assert resp.status_code == 200
    assert "answer" in resp.json()

    compare_payload = {
        "circuit": sample_bell_circuit,
        "prediction": "50% 00 and 50% 11",
        "simulation": sample_simulation_result
    }
    resp2 = client.post("/api/v1/ai/compare", json=compare_payload)
    assert resp2.status_code == 200
    assert "answer" in resp2.json()

@patch("app.services.providers.nvidia_provider.nvidia_provider._call_chat_completions", return_value="Next step: Try Quantum Teleportation.")
def test_api_gateway_recommend_endpoint(mock_nvidia):
    payload = {
        "learner_level": "beginner",
        "current_topic": "Bell States",
        "recent_circuit": {"qubits": 2, "gates": []}
    }
    resp = client.post("/api/v1/ai/recommend", json=payload)
    assert resp.status_code == 200
    assert "answer" in resp.json()

@patch("app.services.providers.nvidia_provider.nvidia_provider._call_chat_completions", return_value="Superposition is a fundamental principle.")
def test_api_gateway_stream_tutor_sse(mock_nvidia, sample_bell_circuit):
    payload = {
        "question": "What is superposition?",
        "context": {"circuit": sample_bell_circuit},
        "mode": "explain",
        "level": "beginner"
    }
    with client.stream("POST", "/api/v1/ai/tutor/stream", json=payload) as resp:
        assert resp.status_code == 200
        content = resp.read().decode("utf-8")
        assert "event: status" in content
        assert "stage" in content
        assert "event: delta" in content
        assert "event: done" in content

def test_orchestrator_missing_api_credentials(sample_bell_circuit):
    """When both NVIDIA and Groq have missing credentials, system uses deterministic fallback."""
    provider_nvidia = NVIDIAProvider(api_key="")
    provider_groq = GroqProvider(api_key="")
    orchestrator = AIOrchestrator(nvidia=provider_nvidia, groq=provider_groq)

    res = orchestrator.query_tutor(
        question="Explain this Bell state",
        context={"circuit": sample_bell_circuit},
        mode="explain",
        level="beginner"
    )
    assert res["reasoning_provider"] in ["fallback", "local_deterministic_reasoner", "local_fallback"]
    assert res["response_optimizer"] is None
    assert len(res["facts"]) > 0

def test_orchestrator_provider_timeout(sample_bell_circuit):
    """When NVIDIA provider times out, orchestrator falls back gracefully without unhandled exception."""
    mock_nvidia = MagicMock()
    mock_nvidia.generate_reasoning.side_effect = TimeoutError("Connection to NVIDIA NIM timed out after 10000ms")
    orchestrator = AIOrchestrator(nvidia=mock_nvidia)

    res = orchestrator.query_tutor(
        question="Explain my circuit",
        context={"circuit": sample_bell_circuit},
        mode="explain",
        level="beginner"
    )
    assert res["reasoning_provider"] == "local_fallback"
    assert "answer" in res

def test_orchestrator_credential_redaction(sample_bell_circuit):
    """Verify that credentials (nvapi-, gsk-) are never exposed in answer or metadata."""
    mock_nvidia = MagicMock()
    mock_nvidia.generate_reasoning.return_value = {
        "answer": "Explanation with simulated leaked key nvapi-abc123456789xyz and gsk_fakesecret999.",
        "technical_analysis": "nvapi-secret-analysis",
        "confidence": "high",
        "facts": ["nvapi-fact"],
        "actions": [],
        "suggestions": [],
        "context_used": [],
        "code": None,
        "provider": "nvidia"
    }
    orchestrator = AIOrchestrator(nvidia=mock_nvidia)
    res = orchestrator.query_tutor(
        question="What is my key?",
        context={"circuit": sample_bell_circuit},
        mode="explain",
        level="beginner"
    )
    # Orchestrator redacts any secrets in answer
    raw_str = str(res)
    assert "nvapi-abc123456789xyz" not in raw_str
    assert "gsk_fakesecret999" not in raw_str

