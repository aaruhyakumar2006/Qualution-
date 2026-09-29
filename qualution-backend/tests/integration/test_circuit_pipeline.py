import pytest
import math
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_end_to_end_bell_circuit_pipeline():
    """
    Test the canonical Bell circuit across all 6 core pipeline endpoints:
    validate -> convert -> analyze -> simulate -> statevector -> timeline
    """
    bell_payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": True,
        "shots": 1000
    }

    # 1. Validation
    res_val = client.post("/api/v1/circuits/validate", json=bell_payload)
    assert res_val.status_code == 200
    assert res_val.json()["valid"] is True
    assert res_val.json()["gate_count"] == 2

    # 2. Conversion
    res_conv = client.post("/api/v1/circuits/convert/qiskit", json=bell_payload)
    assert res_conv.status_code == 200
    conv_data = res_conv.json()
    assert conv_data["backend"] == "qiskit"
    assert len(conv_data["operations"]) == 2
    assert conv_data["operations"][0] == {"name": "h", "qubits": [0]}
    assert conv_data["operations"][1] == {"name": "cx", "qubits": [0, 1]}
    assert len(conv_data["measurements"]) == 2

    # 3. Static Analysis
    res_ana = client.post("/api/v1/circuits/analyze", json=bell_payload)
    assert res_ana.status_code == 200
    ana_data = res_ana.json()
    assert ana_data["qubit_count"] == 2
    assert ana_data["gate_count"] == 2
    assert ana_data["single_qubit_gate_count"] == 1
    assert ana_data["two_qubit_gate_count"] == 1
    assert ana_data["measurement_count"] == 2
    assert ana_data["depth"] == 2
    assert ana_data["simulation_memory_class"] == "small"

    # 4. Shot-based Simulation (Aer)
    res_sim = client.post("/api/v1/simulate", json=bell_payload)
    assert res_sim.status_code == 200
    sim_data = res_sim.json()
    assert sim_data["shots"] == 1000
    p00_empirical = sim_data["probabilities"].get("00", 0.0)
    p11_empirical = sim_data["probabilities"].get("11", 0.0)
    assert 0.44 <= p00_empirical <= 0.56
    assert 0.44 <= p11_empirical <= 0.56
    assert "01" not in sim_data["counts"]
    assert "10" not in sim_data["counts"]

    # 5. Exact Statevector
    res_sv = client.post("/api/v1/simulate/statevector", json=bell_payload)
    assert res_sv.status_code == 200
    sv_data = res_sv.json()
    assert sv_data["qubits"] == 2
    assert sv_data["bloch"] is None  # No single Bloch vector for entangled state
    assert math.isclose(sv_data["probabilities"]["00"], 0.5, rel_tol=1e-4)
    assert math.isclose(sv_data["probabilities"]["11"], 0.5, rel_tol=1e-4)
    assert sv_data["probabilities"]["01"] == 0.0
    assert sv_data["probabilities"]["10"] == 0.0

    # 6. Timeline Evolution
    res_time = client.post("/api/v1/simulate/timeline", json=bell_payload)
    assert res_time.status_code == 200
    time_data = res_time.json()
    assert time_data["total_steps"] == 3
    assert time_data["steps"][0]["operation"] == "initial"
    assert time_data["steps"][1]["operation"] == "h"
    assert time_data["steps"][2]["operation"] == "cx"

def test_cross_endpoint_consistency_bell_state():
    """
    Verify that the final state from the timeline exactly matches the statevector endpoint.
    """
    bell_payload = {
        "qubits": 2,
        "classical_bits": 0,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": False
    }

    sv_resp = client.post("/api/v1/simulate/statevector", json=bell_payload).json()
    tl_resp = client.post("/api/v1/simulate/timeline", json=bell_payload).json()

    final_tl_step = tl_resp["steps"][-1]

    # Amplitudes must match across endpoints
    for sv_amp, tl_amp in zip(sv_resp["statevector"], final_tl_step["statevector"]):
        assert math.isclose(sv_amp["real"], tl_amp["real"], abs_tol=1e-6)
        assert math.isclose(sv_amp["imag"], tl_amp["imag"], abs_tol=1e-6)

    # Probabilities must match across endpoints
    assert sv_resp["probabilities"] == final_tl_step["probabilities"]

def test_independent_probability_and_normalization_check():
    """
    Independently verify probability = |real|^2 + |imag|^2 and sum(prob) == 1.
    """
    payload = {
        "qubits": 2,
        "classical_bits": 0,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "ry", "targets": [1], "angle": 1.23}
        ],
        "measure": False
    }
    sv_resp = client.post("/api/v1/simulate/statevector", json=payload).json()

    total_prob = 0.0
    for i, amp in enumerate(sv_resp["statevector"]):
        bitstring = format(i, "02b")
        independent_prob = amp["real"] ** 2 + amp["imag"] ** 2
        reported_prob = sv_resp["probabilities"][bitstring]
        assert math.isclose(independent_prob, reported_prob, abs_tol=1e-5)
        total_prob += reported_prob

    assert math.isclose(total_prob, 1.0, abs_tol=1e-5)

def test_canonical_single_qubit_pipeline():
    """
    Verify complete single-qubit pipeline for |0> -> H -> |+>.
    """
    payload = {
        "qubits": 1,
        "classical_bits": 1,
        "gates": [{"gate": "h", "targets": [0]}],
        "measure": True,
        "shots": 1000
    }

    # Analysis
    ana_res = client.post("/api/v1/circuits/analyze", json=payload).json()
    assert ana_res["qubit_count"] == 1
    assert ana_res["single_qubit_gate_count"] == 1
    assert ana_res["two_qubit_gate_count"] == 0

    # Statevector & Bloch
    sv_res = client.post("/api/v1/simulate/statevector", json=payload).json()
    inv_sqrt_2 = 1.0 / math.sqrt(2)
    assert math.isclose(sv_res["statevector"][0]["real"], inv_sqrt_2, rel_tol=1e-4)
    assert math.isclose(sv_res["statevector"][1]["real"], inv_sqrt_2, rel_tol=1e-4)
    assert sv_res["bloch"] == {"x": 1.0, "y": 0.0, "z": 0.0}

    # Timeline
    tl_res = client.post("/api/v1/simulate/timeline", json=payload).json()
    assert tl_res["total_steps"] == 2
    assert tl_res["steps"][0]["bloch"] == {"x": 0.0, "y": 0.0, "z": 1.0}
    assert tl_res["steps"][1]["bloch"] == {"x": 1.0, "y": 0.0, "z": 0.0}

def test_invalid_circuit_consistency_across_endpoints():
    """
    Verify that invalid circuits are rejected with 422 across all relevant endpoints.
    """
    invalid_payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [{"gate": "cx", "targets": [0]}]  # Missing target for CX
    }
    endpoints = [
        "/api/v1/circuits/validate",
        "/api/v1/circuits/convert/qiskit",
        "/api/v1/circuits/analyze",
        "/api/v1/simulate",
        "/api/v1/simulate/statevector",
        "/api/v1/simulate/timeline"
    ]
    for endpoint in endpoints:
        resp = client.post(endpoint, json=invalid_payload)
        assert resp.status_code == 422, f"Endpoint {endpoint} did not return 422 for invalid circuit"

def test_out_of_range_qubit_index_protection():
    """
    Verify out-of-range qubit index (5 on a 2-qubit circuit) is caught by Pydantic.
    """
    payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [{"gate": "h", "targets": [5]}],
        "measure": False
    }
    resp = client.post("/api/v1/circuits/validate", json=payload)
    assert resp.status_code == 422
    assert "references invalid qubit" in str(resp.json())

def test_rotation_parameter_end_to_end_preservation():
    """
    Verify that rotation parameter (pi/2) is preserved without distortion.
    """
    angle = math.pi / 2
    payload = {
        "qubits": 1,
        "classical_bits": 0,
        "gates": [{"gate": "rx", "targets": [0], "angle": angle}],
        "measure": False
    }
    tl_res = client.post("/api/v1/simulate/timeline", json=payload).json()
    assert math.isclose(tl_res["steps"][1]["parameters"]["angle"], angle, rel_tol=1e-5)
    assert math.isclose(tl_res["steps"][1]["bloch"]["y"], -1.0, abs_tol=1e-4)

def test_measurement_handling_consistency():
    """
    Verify that /simulate requires measure=true, while statevector and timeline
    return pre-measurement states without throwing errors.
    """
    circuit_without_measure = {
        "qubits": 1,
        "classical_bits": 0,
        "gates": [{"gate": "h", "targets": [0]}],
        "measure": False
    }
    # /simulate must reject measure=False
    resp_sim = client.post("/api/v1/simulate", json=circuit_without_measure)
    assert resp_sim.status_code == 400

    # /simulate/statevector must succeed
    resp_sv = client.post("/api/v1/simulate/statevector", json=circuit_without_measure)
    assert resp_sv.status_code == 200

    # /simulate/timeline must succeed
    resp_tl = client.post("/api/v1/simulate/timeline", json=circuit_without_measure)
    assert resp_tl.status_code == 200

def test_bloch_sphere_mathematical_validation_all_poles():
    """
    Integration test verifying all 6 canonical single-qubit poles on the Bloch sphere.
    """
    cases = [
        ([], (0.0, 0.0, 1.0)),                                                          # |0> -> +Z
        ([{"gate": "x", "targets": [0]}], (0.0, 0.0, -1.0)),                            # |1> -> -Z
        ([{"gate": "h", "targets": [0]}], (1.0, 0.0, 0.0)),                            # |+> -> +X
        ([{"gate": "h", "targets": [0]}, {"gate": "z", "targets": [0]}], (-1.0, 0.0, 0.0)),  # |-> -> -X
        ([{"gate": "h", "targets": [0]}, {"gate": "s", "targets": [0]}], (0.0, 1.0, 0.0)),   # |+i> -> +Y
        ([{"gate": "rx", "targets": [0], "angle": math.pi / 2}], (0.0, -1.0, 0.0)),   # |-i> -> -Y
    ]
    for gates, (expected_x, expected_y, expected_z) in cases:
        payload = {"qubits": 1, "classical_bits": 0, "gates": gates, "measure": False}
        res = client.post("/api/v1/simulate/statevector", json=payload).json()
        bloch = res["bloch"]
        assert math.isclose(bloch["x"], expected_x, abs_tol=1e-4)
        assert math.isclose(bloch["y"], expected_y, abs_tol=1e-4)
        assert math.isclose(bloch["z"], expected_z, abs_tol=1e-4)
        
        # Verify pure state unit magnitude: sqrt(x^2 + y^2 + z^2) == 1
        magnitude = math.sqrt(bloch["x"]**2 + bloch["y"]**2 + bloch["z"]**2)
        assert math.isclose(magnitude, 1.0, abs_tol=1e-4)

def test_resource_analysis_consistency():
    """
    Verify resource analysis memory scaling calculation across diverse qubit counts.
    """
    test_cases = [1, 5, 10, 20, 25, 30]
    for n in test_cases:
        payload = {"qubits": n, "classical_bits": 0, "gates": [], "measure": False}
        res = client.post("/api/v1/circuits/analyze", json=payload).json()
        expected_amplitudes = 2**n
        expected_bytes = expected_amplitudes * 16
        assert res["statevector_amplitudes"] == expected_amplitudes
        assert res["statevector_memory_bytes"] == expected_bytes

def test_safety_limits_api_rejection():
    """
    Verify that requests exceeding statevector and timeline safety limits are rejected cleanly.
    """
    # 1. Statevector limit (> 16 qubits)
    payload_sv = {"qubits": 18, "classical_bits": 0, "gates": [], "measure": False}
    resp_sv = client.post("/api/v1/simulate/statevector", json=payload_sv)
    assert resp_sv.status_code == 400
    assert "exceeds maximum statevector qubit limit" in resp_sv.json()["detail"]

    # 2. Timeline qubit limit (> 12 qubits)
    payload_tl_q = {"qubits": 14, "classical_bits": 0, "gates": [], "measure": False}
    resp_tl_q = client.post("/api/v1/simulate/timeline", json=payload_tl_q)
    assert resp_tl_q.status_code == 400
    assert "exceeds maximum timeline qubit limit" in resp_tl_q.json()["detail"]

    # 3. Timeline step limit (> 50 gates)
    payload_tl_s = {
        "qubits": 1,
        "classical_bits": 0,
        "gates": [{"gate": "h", "targets": [0]} for _ in range(55)],
        "measure": False
    }
    resp_tl_s = client.post("/api/v1/simulate/timeline", json=payload_tl_s)
    assert resp_tl_s.status_code == 400
    assert "contains too many operations" in resp_tl_s.json()["detail"]
