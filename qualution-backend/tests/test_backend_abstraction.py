import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.backends.base import QuantumBackend
from app.backends.qiskit_backend import QiskitAerBackend
from app.backends.pennylane_backend import PennyLaneBackend
from app.backends.registry import backend_registry
from app.schemas.circuit import CircuitRequest, GateRequest

client = TestClient(app)

from app.backends.cirq_backend import CirqBackend
from app.backends.qbraid_backend import QBraidBackend

def test_backends_implement_interface():
    assert issubclass(QiskitAerBackend, QuantumBackend)
    assert issubclass(PennyLaneBackend, QuantumBackend)
    assert issubclass(CirqBackend, QuantumBackend)
    assert issubclass(QBraidBackend, QuantumBackend)

def test_backend_registry_get():
    default_backend = backend_registry.get()
    assert isinstance(default_backend, QiskitAerBackend)

    qiskit_b = backend_registry.get("qiskit_aer")
    assert isinstance(qiskit_b, QiskitAerBackend)

    pl_b = backend_registry.get("pennylane")
    assert isinstance(pl_b, PennyLaneBackend)

    cirq_b = backend_registry.get("cirq")
    assert isinstance(cirq_b, CirqBackend)

    qbraid_b = backend_registry.get("qbraid")
    assert isinstance(qbraid_b, QBraidBackend)

def test_backend_registry_unknown_backend():
    with pytest.raises(ValueError) as exc:
        backend_registry.get("non_existent_backend")
    assert "Unknown backend" in str(exc.value)

def test_api_get_backends_list():
    response = client.get("/api/v1/backends")
    assert response.status_code == 200
    data = response.json()
    assert "backends" in data
    backend_names = [b["name"] for b in data["backends"]]
    assert backend_names == ["qiskit_aer", "pennylane", "cirq", "qbraid"]

    # Check capabilities for Qiskit Aer
    qiskit_meta = next(b for b in data["backends"] if b["name"] == "qiskit_aer")
    assert qiskit_meta["capabilities"]["local_simulator"] is True
    assert qiskit_meta["capabilities"]["remote_provider"] is False
    assert qiskit_meta["capabilities"]["shots"] is True
    assert qiskit_meta["capabilities"]["statevector"] is True
    assert qiskit_meta["capabilities"]["timeline"] is True
    assert qiskit_meta["capabilities"]["hardware"] is False

    # Check capabilities for PennyLane
    pl_meta = next(b for b in data["backends"] if b["name"] == "pennylane")
    assert pl_meta["capabilities"]["local_simulator"] is True
    assert pl_meta["capabilities"]["remote_provider"] is False
    assert pl_meta["capabilities"]["shots"] is True
    assert pl_meta["capabilities"]["statevector"] is True
    assert pl_meta["capabilities"]["timeline"] is False
    assert pl_meta["capabilities"]["hardware"] is False

    # Check capabilities for Cirq
    cirq_meta = next(b for b in data["backends"] if b["name"] == "cirq")
    assert cirq_meta["capabilities"]["local_simulator"] is True
    assert cirq_meta["capabilities"]["remote_provider"] is False
    assert cirq_meta["capabilities"]["shots"] is True
    assert cirq_meta["capabilities"]["statevector"] is True
    assert cirq_meta["capabilities"]["hardware"] is False

    # Check capabilities for qBraid
    qbraid_meta = next(b for b in data["backends"] if b["name"] == "qbraid")
    assert qbraid_meta["capabilities"]["local_simulator"] is False
    assert qbraid_meta["capabilities"]["remote_provider"] is True
    assert qbraid_meta["capabilities"]["shots"] is True
    assert qbraid_meta["capabilities"]["statevector"] is False
    assert qbraid_meta["capabilities"]["hardware"] is True

def test_api_simulate_with_backend_selection():
    payload = {
        "qubits": 1,
        "classical_bits": 1,
        "gates": [{"gate": "x", "targets": [0]}],
        "measure": True,
        "shots": 100
    }
    # Test PennyLane backend via query parameter
    resp_pl = client.post("/api/v1/simulate?backend=pennylane", json=payload)
    assert resp_pl.status_code == 200
    assert resp_pl.json()["backend"] == "pennylane"
    assert resp_pl.json()["counts"] == {"1": 100}

    # Test default backend (qiskit_aer)
    resp_default = client.post("/api/v1/simulate", json=payload)
    assert resp_default.status_code == 200
    assert resp_default.json()["backend"] == "qiskit_aer"

def test_api_statevector_with_backend_selection():
    payload = {
        "qubits": 1,
        "classical_bits": 0,
        "gates": [{"gate": "h", "targets": [0]}],
        "measure": False
    }
    resp_pl = client.post("/api/v1/simulate/statevector?backend=pennylane", json=payload)
    assert resp_pl.status_code == 200
    data = resp_pl.json()
    assert data["backend"] == "pennylane"
    assert data["bloch"] == {"x": 1.0, "y": 0.0, "z": 0.0}

def test_api_unknown_backend_rejected():
    payload = {
        "qubits": 1,
        "classical_bits": 1,
        "gates": [{"gate": "x", "targets": [0]}],
        "measure": True,
        "shots": 100
    }
    response = client.post("/api/v1/simulate?backend=invalid_backend", json=payload)
    assert response.status_code == 400
    assert "Unknown backend" in response.json()["detail"]
