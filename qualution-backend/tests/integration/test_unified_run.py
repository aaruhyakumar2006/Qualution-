import pytest
import math
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_unified_run_bell_shots_qiskit():
    """Test 1: Unified workflow on Bell circuit with Qiskit Aer backend."""
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "targets": [0, 1]}
            ],
            "measure": True,
            "shots": 1000
        },
        "mode": "shots",
        "backend": "qiskit_aer",
        "include": {
            "metrics": True,
            "timeline": False,
            "bloch": False
        }
    }
    response = client.post("/api/v1/circuits/run", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["circuit"]["qubits"] == 2
    assert data["circuit"]["gate_count"] == 2
    assert data["routing"]["selected_backend"] == "qiskit_aer"
    assert data["metrics"] is not None
    assert data["metrics"]["gate_count"] == 2
    assert data["metrics"]["depth"] == 2

    sim = data["simulation"]
    assert sim["backend"] == "qiskit_aer"
    assert sim["mode"] == "shots"
    assert "01" not in sim["counts"]
    assert "10" not in sim["counts"]
    assert 0.40 <= sim["probabilities"]["00"] <= 0.60
    assert 0.40 <= sim["probabilities"]["11"] <= 0.60

def test_unified_run_bell_shots_pennylane():
    """Test 2: Unified workflow on Bell circuit with PennyLane backend."""
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "targets": [0, 1]}
            ],
            "measure": True,
            "shots": 1000
        },
        "mode": "shots",
        "backend": "pennylane",
        "include": {"metrics": True, "timeline": False, "bloch": False}
    }
    response = client.post("/api/v1/circuits/run", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["routing"]["selected_backend"] == "pennylane"
    sim = data["simulation"]
    assert sim["backend"] == "pennylane"
    assert "01" not in sim["counts"]
    assert "10" not in sim["counts"]
    assert 0.40 <= sim["probabilities"]["00"] <= 0.60
    assert 0.40 <= sim["probabilities"]["11"] <= 0.60

def test_unified_run_bell_shots_cirq():
    """Test 3: Unified workflow on Bell circuit with Google Cirq backend."""
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "targets": [0, 1]}
            ],
            "measure": True,
            "shots": 1000
        },
        "mode": "shots",
        "backend": "cirq",
        "include": {"metrics": True, "timeline": False, "bloch": False}
    }
    response = client.post("/api/v1/circuits/run", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["routing"]["selected_backend"] == "cirq"
    sim = data["simulation"]
    assert sim["backend"] == "cirq"
    assert "01" not in sim["counts"]
    assert "10" not in sim["counts"]
    assert 0.40 <= sim["probabilities"]["00"] <= 0.60
    assert 0.40 <= sim["probabilities"]["11"] <= 0.60

def test_unified_run_bell_auto_routing():
    """Test 4: Unified workflow with auto-routing selection across eligible local simulators."""
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "targets": [0, 1]}
            ],
            "measure": True,
            "shots": 1000
        },
        "mode": "shots",
        "backend": "auto",
        "include": {"metrics": True}
    }
    response = client.post("/api/v1/circuits/run", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["routing"]["selected_backend"] in ["qiskit_aer", "pennylane", "cirq"]
    assert data["routing"]["reason"] != ""
    assert data["simulation"]["counts"] is not None

def test_unified_run_statevector_and_bloch():
    """Test 5: Single-qubit statevector mode with Bloch sphere inclusion."""
    payload = {
        "circuit": {
            "qubits": 1,
            "classical_bits": 0,
            "gates": [{"gate": "h", "targets": [0]}],
            "measure": False
        },
        "mode": "statevector",
        "backend": "cirq",
        "include": {"metrics": True, "bloch": True, "timeline": False}
    }
    response = client.post("/api/v1/circuits/run", json=payload)
    assert response.status_code == 200
    data = response.json()

    sim = data["simulation"]
    assert sim["mode"] == "statevector"
    assert sim["statevector"] is not None
    assert len(sim["statevector"]) == 2

    # Verify Bloch vector for |+> state
    bloch = data["visualization"]["bloch"]
    assert bloch is not None
    assert math.isclose(bloch["x"], 1.0, abs_tol=1e-4)
    assert math.isclose(bloch["y"], 0.0, abs_tol=1e-4)
    assert math.isclose(bloch["z"], 0.0, abs_tol=1e-4)

from unittest.mock import patch
from app.backends.registry import backend_registry

def test_unified_run_qbraid_unconfigured_error():
    """Test 6: Explicit request to unconfigured qBraid raises clear error."""
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 2,
            "gates": [{"gate": "h", "targets": [0]}],
            "measure": True,
            "shots": 100
        },
        "mode": "shots",
        "backend": "qbraid"
    }
    with patch.object(backend_registry.get("qbraid"), "is_configured", return_value=False):
        response = client.post("/api/v1/circuits/run", json=payload)
        assert response.status_code == 400
        assert "qBraid backend is not configured" in response.json()["detail"]

def test_unified_run_qbraid_statevector_capability_rejection():
    """Test 7: Direct request for statevector on qBraid is rejected by capability check."""
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 0,
            "gates": [{"gate": "h", "targets": [0]}],
            "measure": False
        },
        "mode": "statevector",
        "backend": "qbraid"
    }
    response = client.post("/api/v1/circuits/run", json=payload)
    assert response.status_code == 400
    assert "does not support statevector simulation" in response.json()["detail"]

def test_unified_run_multi_qubit_bloch_null():
    """Test 8: Multi-qubit circuits must not produce a single Bloch vector."""
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 0,
            "gates": [
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "targets": [0, 1]}
            ],
            "measure": False
        },
        "mode": "statevector",
        "include": {"bloch": True}
    }
    response = client.post("/api/v1/circuits/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["visualization"]["bloch"] is None

def test_unified_run_timeline_enabled():
    """Test 9: Timeline inclusion in unified workflow."""
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 0,
            "gates": [
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "targets": [0, 1]}
            ],
            "measure": False
        },
        "mode": "statevector",
        "include": {"timeline": True}
    }
    response = client.post("/api/v1/circuits/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    timeline = data["visualization"]["timeline"]
    assert timeline is not None
    assert timeline["total_steps"] == 3
    assert len(timeline["steps"]) == 3

def test_unified_run_invalid_shots_without_measure():
    """Test 10: Reject shots simulation if circuit has measure=false."""
    payload = {
        "circuit": {
            "qubits": 1,
            "classical_bits": 0,
            "gates": [{"gate": "h", "targets": [0]}],
            "measure": False
        },
        "mode": "shots"
    }
    response = client.post("/api/v1/circuits/run", json=payload)
    assert response.status_code == 400
    assert "requires 'measure=true'" in response.json()["detail"]

def test_unified_run_statevector_qubit_limit_rejection():
    """Test 11: Reject statevector simulation for circuits exceeding safety threshold."""
    payload = {
        "circuit": {
            "qubits": 20,
            "classical_bits": 0,
            "gates": [],
            "measure": False
        },
        "mode": "statevector"
    }
    response = client.post("/api/v1/circuits/run", json=payload)
    assert response.status_code == 400
    assert "exceeds maximum statevector safety limit" in response.json()["detail"]

def test_health_and_readiness_endpoints():
    """Test 12 & 13: Health and readiness checks."""
    resp_health = client.get("/api/v1/health")
    assert resp_health.status_code == 200
    assert resp_health.json()["status"] == "ok"

    resp_ready = client.get("/api/v1/ready")
    assert resp_ready.status_code == 200
    data = resp_ready.json()
    assert data["ready"] is True
    assert "qiskit" in data["dependencies"]
    assert "qiskit-aer" in data["dependencies"]
    assert "pennylane" in data["dependencies"]
    assert "cirq" in data["dependencies"]
    assert "qbraid" in data["dependencies"]
    assert data["dependencies"]["qiskit"]["installed"] is True
    assert data["dependencies"]["cirq"]["installed"] is True
    assert data["dependencies"]["qbraid"]["installed"] is True
