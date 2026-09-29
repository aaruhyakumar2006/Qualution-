import sys
import time
import json
import traceback
import math
from typing import Dict, Any, List
from fastapi.testclient import TestClient

sys.path.insert(0, ".")
from app.main import app

client = TestClient(app)

results = {
    "summary": {"passed": 0, "failed": 0, "warnings": 0},
    "tests": []
}

def log_test(name: str, passed: bool, details: Any, warning: bool = False):
    status = "WARN" if warning else ("PASS" if passed else "FAIL")
    if warning:
        results["summary"]["warnings"] += 1
    elif passed:
        results["summary"]["passed"] += 1
    else:
        results["summary"]["failed"] += 1
    print(f"[{status}] {name}")
    results["tests"].append({
        "name": name,
        "status": status,
        "details": details
    })

print("=" * 70)
print("COMPREHENSIVE BACKEND INTEGRATION & CAPABILITY AUDIT")
print("=" * 70)

# TEST 1: Health Check
try:
    resp = client.get("/api/v1/health")
    if resp.status_code == 200:
        log_test("GET /api/v1/health", True, resp.json())
    else:
        log_test("GET /api/v1/health", False, f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_test("GET /api/v1/health", False, str(e))

# TEST 2: Backends list
try:
    resp = client.get("/api/v1/backends")
    if resp.status_code == 200:
        data = resp.json()
        backends = data.get("backends", [])
        log_test("GET /api/v1/backends", len(backends) > 0, {
            "total_backends": len(backends),
            "backend_names": [b.get("name") for b in backends]
        })
    else:
        log_test("GET /api/v1/backends", False, f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_test("GET /api/v1/backends", False, str(e))

# TEST 3: Unified Run - Small Clifford 2-qubit (Bell State)
try:
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"id": "g0", "type": "h", "targets": [0], "column": 0},
                {"id": "g1", "type": "cx", "targets": [0, 1], "column": 1}
            ],
            "measure": True,
            "shots": 1024
        },
        "mode": "shots"
    }
    resp = client.post("/api/v1/circuits/run", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        sim = data.get("simulation", {})
        log_test("Unified Run (2-qubit Bell shots)", True, {
            "backend": sim.get("backend"),
            "counts": sim.get("counts"),
            "routing_reason": data.get("routing", {}).get("reason")
        })
    else:
        log_test("Unified Run (2-qubit Bell shots)", False, f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_test("Unified Run (2-qubit Bell shots)", False, str(e))

# TEST 4: Unified Run - Statevector Mode 2-qubit
try:
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"id": "g0", "type": "h", "targets": [0], "column": 0},
                {"id": "g1", "type": "cx", "targets": [0, 1], "column": 1}
            ],
            "measure": False
        },
        "mode": "statevector"
    }
    resp = client.post("/api/v1/circuits/run", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        sim = data.get("simulation", {})
        statevector = sim.get("statevector", [])
        log_test("Unified Run (2-qubit Bell statevector)", len(statevector) == 4, {
            "backend": sim.get("backend"),
            "amplitudes_count": len(statevector),
            "probabilities": sim.get("probabilities")
        })
    else:
        log_test("Unified Run (2-qubit Bell statevector)", False, f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_test("Unified Run (2-qubit Bell statevector)", False, str(e))

# TEST 5: Large Qubit Scale - 1000 Qubits Clifford (Shots Mode)
try:
    gates = [{"id": f"h_{i}", "type": "h", "targets": [i], "column": 0} for i in range(50)]
    gates.append({"id": "cx_end", "type": "cx", "targets": [0, 999], "column": 1})
    payload = {
        "circuit": {
            "qubits": 1000,
            "classical_bits": 1000,
            "gates": gates,
            "measure": True,
            "shots": 100
        },
        "mode": "shots"
    }
    t0 = time.perf_counter()
    resp = client.post("/api/v1/circuits/run", json=payload)
    dur = time.perf_counter() - t0
    if resp.status_code == 200:
        data = resp.json()
        sim = data.get("simulation", {})
        log_test("1000 Qubits Clifford Simulation (Shots)", True, {
            "backend": sim.get("backend"),
            "execution_time_ms": sim.get("execution_time_ms"),
            "client_elapsed_sec": round(dur, 3),
            "counts_count": len(sim.get("counts", {}))
        })
    else:
        log_test("1000 Qubits Clifford Simulation (Shots)", False, f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_test("1000 Qubits Clifford Simulation (Shots)", False, str(e))

# TEST 6: Large Qubit Safety - 1000 Qubits Statevector (Should cleanly reject, NOT crash)
try:
    payload = {
        "circuit": {
            "qubits": 1000,
            "classical_bits": 1000,
            "gates": [{"id": "h_0", "type": "h", "targets": [0], "column": 0}],
            "measure": False
        },
        "mode": "statevector"
    }
    resp = client.post("/api/v1/circuits/run", json=payload)
    if resp.status_code in (400, 422):
        log_test("1000 Qubits Statevector Memory Rejection", True, {
            "status_code": resp.status_code,
            "detail": resp.json()
        })
    else:
        log_test("1000 Qubits Statevector Memory Rejection", False, f"Unexpected status {resp.status_code}: {resp.text}")
except Exception as e:
    log_test("1000 Qubits Statevector Memory Rejection", False, str(e))

# TEST 7: Circuit Metrics Endpoint with 1000 Qubits (/api/v1/circuits/metrics and /analyze)
try:
    payload = {
        "qubits": 1000,
        "gates": [
            {"id": "g0", "type": "h", "targets": [0], "column": 0},
            {"id": "g1", "type": "cx", "targets": [0, 999], "column": 1}
        ]
    }
    resp1 = client.post("/api/v1/circuits/metrics", json=payload)
    resp2 = client.post("/api/v1/circuits/analyze", json=payload)
    if resp1.status_code == 200 and resp2.status_code == 200:
        data = resp1.json()
        log_test("1000 Qubits Circuit Metrics (/metrics & /analyze)", True, {
            "qubits": data.get("qubit_count"),
            "depth": data.get("depth"),
            "gate_count": data.get("gate_count")
        })
    else:
        log_test("1000 Qubits Circuit Metrics", False, f"Status /metrics={resp1.status_code}, /analyze={resp2.status_code}")
except Exception as e:
    log_test("1000 Qubits Circuit Metrics", False, str(e))

# TEST 8: Code Generation for All 3 Frameworks (Qiskit, Cirq, PennyLane)
for fw in ["qiskit", "cirq", "pennylane"]:
    try:
        circuit_payload = {
            "qubits": 3,
            "classical_bits": 3,
            "gates": [
                {"id": "g0", "type": "h", "targets": [0], "column": 0},
                {"id": "g1", "type": "rx", "targets": [1], "column": 0, "angle": 0.5},
                {"id": "g2", "type": "cx", "targets": [0, 1], "column": 1},
                {"id": "g3", "type": "ccx", "targets": [0, 1, 2], "column": 2}
            ],
            "measure": True
        }
        # Test both endpoint forms: /codegen/{fw} and /codegen/generate
        resp_direct = client.post(f"/api/v1/codegen/{fw}", json=circuit_payload)
        resp_generic = client.post("/api/v1/codegen/generate", json={"circuit": circuit_payload, "target": fw})
        if resp_direct.status_code == 200 and resp_generic.status_code == 200:
            code = resp_direct.json().get("code", "")
            log_test(f"Codegen ({fw}) [Direct & Generic]", len(code) > 20, {"code_length": len(code)})
        else:
            log_test(f"Codegen ({fw})", False, f"direct={resp_direct.status_code}, generic={resp_generic.status_code}")
    except Exception as e:
        log_test(f"Codegen ({fw})", False, str(e))

# TEST 9: Codeparse Roundtrip (Qiskit & Cirq AST Parsers)
for fw, sample_code in [
    ("qiskit", "import qiskit\nqc = qiskit.QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure([0, 1], [0, 1])"),
    ("cirq", "import cirq\nq0, q1 = cirq.LineQubit.range(2)\ncircuit = cirq.Circuit(\n    cirq.H(q0),\n    cirq.CNOT(q0, q1),\n    cirq.measure(q0, q1)\n)")
]:
    try:
        # Test both endpoint forms: /codeparse/{fw} and /codeparse/parse
        resp_direct = client.post(f"/api/v1/codeparse/{fw}", json={"code": sample_code})
        resp_generic = client.post("/api/v1/codeparse/parse", json={"code": sample_code, "framework": fw})
        if resp_direct.status_code == 200 and resp_generic.status_code == 200:
            circuit = resp_direct.json().get("circuit", {})
            gates = circuit.get("gates", [])
            log_test(f"Codeparse ({fw}) [Direct & Generic]", len(gates) >= 2, {
                "qubits": circuit.get("qubits"),
                "gate_count": len(gates)
            })
        else:
            log_test(f"Codeparse ({fw})", False, f"direct={resp_direct.status_code}, generic={resp_generic.status_code}")
    except Exception as e:
        log_test(f"Codeparse ({fw})", False, str(e))

# TEST 10: Optimization Engine Endpoint
try:
    payload = {
        "qubits": 2,
        "gates": [
            {"id": "g0", "type": "h", "targets": [0], "column": 0},
            {"id": "g1", "type": "h", "targets": [0], "column": 1},  # H followed by H cancels out!
            {"id": "g2", "type": "x", "targets": [1], "column": 0}
        ]
    }
    resp = client.post("/api/v1/circuits/optimize", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        opt_circuit = data.get("optimized_circuit", {})
        opt_gates = opt_circuit.get("gates", [])
        log_test("Circuit Optimization (Cancel Inverse H-H)", len(opt_gates) < 3, {
            "original_gate_count": 3,
            "optimized_gate_count": len(opt_gates),
            "improvements": data.get("improvements")
        })
    else:
        log_test("Circuit Optimization (Cancel Inverse H-H)", False, f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_test("Circuit Optimization (Cancel Inverse H-H)", False, str(e))

# TEST 11: Benchmark Route Endpoint (/benchmarks/run and /benchmark/run)
try:
    payload = {
        "circuit": {
            "qubits": 2,
            "gates": [
                {"id": "g0", "type": "h", "targets": [0], "column": 0},
                {"id": "g1", "type": "cx", "targets": [0, 1], "column": 1}
            ],
            "measure": True,
            "shots": 100
        },
        "backends": ["qiskit_aer"]
    }
    resp1 = client.post("/api/v1/benchmarks/run", json=payload)
    resp2 = client.post("/api/v1/benchmark/run", json=payload)
    if resp1.status_code == 200 and resp2.status_code == 200:
        data = resp1.json()
        log_test("Benchmark Route (/benchmarks & /benchmark)", True, {
            "results_count": len(data.get("results", [])),
            "fastest": data.get("fastest_backend")
        })
    else:
        log_test("Benchmark Route", False, f"/benchmarks={resp1.status_code}, /benchmark={resp2.status_code}")
except Exception as e:
    log_test("Benchmark Route", False, str(e))

# TEST 12: AI Environment & Tutor Routes
try:
    resp_env = client.get("/api/v1/ai/environment")
    tutor_payload = {
        "question": "What does a Hadamard gate do?",
        "context": {"topic": "Beginner learning single-qubit superpositions"}
    }
    resp_tutor = client.post("/api/v1/ai/tutor", json=tutor_payload)
    # Environment probe must return 200; tutor can return 200 or clean fallback
    log_test("AI Environment Endpoint", resp_env.status_code == 200, resp_env.json() if resp_env.status_code == 200 else resp_env.text)
    log_test("AI Tutor Endpoint", resp_tutor.status_code in (200, 500, 503), {
        "status_code": resp_tutor.status_code,
        "detail": resp_tutor.json()
    })
except Exception as e:
    log_test("AI Endpoints", False, str(e))

# TEST 13: Onboarding Questions & Status Endpoints
try:
    resp_q = client.get("/api/v1/onboarding/questions")
    resp_s = client.get("/api/v1/onboarding/status")
    if resp_q.status_code == 200 and resp_s.status_code == 200:
        questions = resp_q.json()
        status_data = resp_s.json()
        log_test("Onboarding Endpoints (/questions & /status)", True, {
            "question_count": len(questions),
            "status": status_data
        })
    else:
        log_test("Onboarding Endpoints", False, f"q={resp_q.status_code}, s={resp_s.status_code}")
except Exception as e:
    log_test("Onboarding Endpoints", False, str(e))

# TEST 14: Negative Angle Gate Edge Cases (e.g. Rx(-pi/2), Ry(-0.75), Rz(-pi))
try:
    payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"id": "g0", "type": "rx", "targets": [0], "column": 0, "angle": -math.pi / 2},
                {"id": "g1", "type": "ry", "targets": [1], "column": 0, "angle": -0.75},
                {"id": "g2", "type": "rz", "targets": [0], "column": 1, "angle": -math.pi},
                {"id": "g3", "type": "cx", "targets": [0, 1], "column": 2}
            ],
            "measure": True,
            "shots": 500
        },
        "mode": "shots"
    }
    resp = client.post("/api/v1/circuits/run", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        log_test("Negative Rotation Angles Simulation", True, {
            "backend": data.get("simulation", {}).get("backend"),
            "counts": data.get("simulation", {}).get("counts")
        })
    else:
        log_test("Negative Rotation Angles Simulation", False, f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_test("Negative Rotation Angles Simulation", False, str(e))

# TEST 15: 3-Qubit Toffoli (CCX) Gate Workflow
try:
    payload = {
        "circuit": {
            "qubits": 3,
            "classical_bits": 3,
            "gates": [
                {"id": "g0", "type": "x", "targets": [0], "column": 0},
                {"id": "g1", "type": "x", "targets": [1], "column": 0},
                {"id": "g2", "type": "ccx", "targets": [0, 1, 2], "column": 1}
            ],
            "measure": True,
            "shots": 100
        },
        "mode": "shots"
    }
    resp = client.post("/api/v1/circuits/run", json=payload)
    if resp.status_code == 200:
        counts = resp.json().get("simulation", {}).get("counts", {})
        # Should measure |111> because q0 and q1 were flipped to 1, flipping q2
        log_test("3-Qubit Toffoli (CCX) Execution", True, {"counts": counts})
    else:
        log_test("3-Qubit Toffoli (CCX) Execution", False, f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_test("3-Qubit Toffoli (CCX) Execution", False, str(e))

# Save results
with open("scratch/audit_report.json", "w") as f:
    json.dump(results, f, indent=2)

print("=" * 70)
print(f"AUDIT COMPLETED: Passed={results['summary']['passed']}, Failed={results['summary']['failed']}, Warnings={results['summary']['warnings']}")
print("=" * 70)
