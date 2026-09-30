import pytest
from unittest.mock import patch, MagicMock
from app.services.groq_ai_service import GroqAIService
from app.services.nvidia_ai_service import nvidia_ai_service
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_heuristic_student_simplifier_superposition():
    groq = GroqAIService()
    analysis = (
        "Unitary transformation H applied to qubit 0 generates statevector |psi> = 1/sqrt(2)|0> + 1/sqrt(2)|1>. "
        "Measurement collapse projects onto computational basis with 50% probability."
    )
    simplified = groq.heuristic_student_simplifier(analysis, "Why is it 50/50?", level="beginner")
    assert "Student-Friendly Quantum Explanation" in simplified
    assert "spinning coin" in simplified.lower()
    assert "Key Student Takeaway" in simplified

def test_heuristic_student_simplifier_entanglement():
    groq = GroqAIService()
    analysis = (
        "Two-qubit Bell state |Phi+> produced via H and CX. Matrix representation yields maximum quantum entanglement "
        "and non-local correlations violating Bell inequalities."
    )
    simplified = groq.heuristic_student_simplifier(analysis, "What is entanglement?", level="beginner")
    assert "dice" in simplified.lower()
    assert "entangle" in simplified.lower()

def test_groq_simplify_explanation_mocked_success():
    groq = GroqAIService()
    with patch.object(groq, "_call_chat_completions", return_value="Here is an intuitive student explanation with coin flips!"):
        res = groq.simplify_explanation(
            nvidia_analysis="Complex Dirac equation U(t) = exp(-iHt/hbar)",
            question="Can you explain this simply?",
            circuit_context={"circuit": {"qubits": 1, "gates": [{"gate": "h", "targets": [0]}]}},
            level="beginner"
        )
        assert res["simplified_by"] == "groq"
        assert "coin flips" in res["simplified_text"]

def test_groq_simplify_explanation_fallback_on_api_none():
    groq = GroqAIService()
    with patch.object(groq, "_call_chat_completions", return_value=None):
        res = groq.simplify_explanation(
            nvidia_analysis="Hamiltonian evolution on 2 qubits with rotation gate RZ(pi/2)",
            question="What does phase do?",
            circuit_context={"circuit": {"qubits": 2, "gates": []}},
            level="beginner"
        )
        assert res["simplified_by"] == "groq-heuristic-fallback"
        assert "compass needle" in res["simplified_text"].lower()

def test_query_tutor_dual_engine_pipeline():
    circuit_context = {
        "circuit": {
            "qubits": 2,
            "gates": [
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "targets": [0, 1]}
            ]
        }
    }
    with patch("app.services.providers.nvidia_provider.nvidia_provider._call_chat_completions", return_value="NVIDIA: Bell state analysis."), \
         patch("app.services.providers.groq_provider.groq_provider._call_chat_completions", return_value="Groq: Intuitive linked coins explanation."):
        res = nvidia_ai_service.query_tutor(
            question="How does this Bell circuit work?",
            circuit_context=circuit_context,
            mode="explain",
            level="beginner",
            simplify_for_students=True
        )
        assert "answer" in res
        assert "technical_analysis" in res
        assert res["simplified_by"] == "groq"
        assert res["reasoning_provider"] == "nvidia"
        assert res["response_optimizer"] == "groq"
        assert len(res["facts"]) > 0

def test_ai_tutor_api_endpoint_with_groq_simplification():
    payload = {
        "question": "Why does Hadamard create superposition?",
        "context": {
            "circuit": {
                "qubits": 1,
                "gates": [{"gate": "h", "targets": [0]}]
            }
        },
        "mode": "explain",
        "level": "beginner",
        "simplify_for_students": True
    }
    response = client.post("/api/v1/ai/tutor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "technical_analysis" in data
    assert "facts" in data
    assert "actions" in data
    assert "simplified_by" in data
