import pytest
import math
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_optimize_endpoint_hh_cancellation():
    payload = {
        "qubits": 1,
        "classical_bits": 0,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "h", "targets": [0]}
        ],
        "measure": False
    }
    response = client.post("/api/v1/circuits/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["changed"] is True
    assert data["correctness_verified"] is True
    assert len(data["optimized_circuit"]["gates"]) == 0
    assert data["improvements"]["gate_count_reduction"] == 2
    assert data["improvements"]["gate_count_reduction_percent"] == 100.0
    assert len(data["explanation"]) > 0

def test_api_optimize_bell_circuit_preserved():
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
    response = client.post("/api/v1/circuits/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Bell circuit is already minimal
    assert data["changed"] is False
    assert data["correctness_verified"] is True
    assert len(data["optimized_circuit"]["gates"]) == 2
    assert data["optimized_circuit"]["measure"] is True

def test_before_after_simulation_cross_check():
    """
    Verify that simulating the original and optimized circuits produces identical probabilities.
    """
    redundant_circuit = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "x", "targets": [1]},
            {"gate": "x", "targets": [1]},  # Redundant X X
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": True,
        "shots": 1000
    }

    # 1. Optimize
    opt_resp = client.post("/api/v1/circuits/optimize", json=redundant_circuit)
    assert opt_resp.status_code == 200
    opt_data = opt_resp.json()
    assert opt_data["changed"] is True
    assert opt_data["correctness_verified"] is True
    assert len(opt_data["optimized_circuit"]["gates"]) == 2  # H, CX

    # 2. Simulate original
    sim_orig = client.post("/api/v1/simulate", json=redundant_circuit).json()

    # 3. Simulate optimized
    sim_opt = client.post("/api/v1/simulate", json=opt_data["optimized_circuit"]).json()

    # Both must produce Bell state distributions strictly in 00 and 11
    assert "01" not in sim_orig["counts"]
    assert "10" not in sim_orig["counts"]
    assert "01" not in sim_opt["counts"]
    assert "10" not in sim_opt["counts"]

    p00_orig = sim_orig["probabilities"].get("00", 0.0)
    p00_opt = sim_opt["probabilities"].get("00", 0.0)
    assert math.isclose(p00_orig, p00_opt, abs_tol=0.1)  # Statistical tolerance with 1000 shots
