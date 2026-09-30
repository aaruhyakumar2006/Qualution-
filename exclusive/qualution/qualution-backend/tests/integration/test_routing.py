import pytest
import math
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_simulate_auto_bell_circuit_shots():
    """
    Test intelligent auto-routing simulation on a Bell circuit (shot mode).
    """
    payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": True,
        "shots": 1000
    }
    response = client.post("/api/v1/simulate/auto?mode=shots", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["selected_backend"] in ["qiskit_aer", "pennylane", "cirq"]
    assert "routing_reason" in data
    assert len(data["candidates"]) == 4
    assert "metrics" in data
    assert data["metrics"]["gate_count"] == 2
    assert data["metrics"]["depth"] == 2

    res = data["result"]
    assert "counts" in res
    assert "probabilities" in res
    p00 = res["probabilities"].get("00", 0.0)
    p11 = res["probabilities"].get("11", 0.0)
    assert 0.44 <= p00 <= 0.56
    assert 0.44 <= p11 <= 0.56

def test_api_simulate_auto_statevector_mode():
    """
    Test intelligent auto-routing simulation in statevector mode.
    """
    payload = {
        "qubits": 1,
        "classical_bits": 0,
        "gates": [{"gate": "h", "targets": [0]}],
        "measure": False
    }
    response = client.post("/api/v1/simulate/auto?mode=statevector", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["selected_backend"] in ["qiskit_aer", "pennylane", "cirq"]
    res = data["result"]
    assert "statevector" in res
    assert "bloch" in res
    assert res["bloch"]["x"] == 1.0

def test_api_simulate_auto_invalid_shots_without_measure():
    """
    Verify auto-routing shot simulation rejects circuits without measure=true.
    """
    payload = {
        "qubits": 1,
        "classical_bits": 0,
        "gates": [{"gate": "h", "targets": [0]}],
        "measure": False
    }
    response = client.post("/api/v1/simulate/auto?mode=shots", json=payload)
    assert response.status_code == 400
    assert "requires 'measure=true'" in response.json()["detail"]

def test_benchmark_then_auto_route_pipeline():
    """
    Benchmark a circuit explicitly, then call /simulate/auto to ensure cached benchmark latency informs routing.
    """
    circuit = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": True,
        "shots": 500
    }
    # 1. Run explicit benchmark
    bm_res = client.post("/api/v1/benchmarks/run", json={"circuit": circuit, "execution_mode": "shots"})
    assert bm_res.status_code == 200
    bm_data = bm_res.json()
    assert len(bm_data["results"]) == 3

    # 2. Call auto-routing
    auto_res = client.post("/api/v1/simulate/auto?mode=shots", json=circuit)
    assert auto_res.status_code == 200
    auto_data = auto_res.json()

    assert auto_data["routing_reason"]["policy"] == "lowest_measured_latency"
    assert any(c["is_cached_measurement"] for c in auto_data["candidates"])
