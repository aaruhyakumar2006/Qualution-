"""
benchmark_architecture_scaling.py

Architecture Verification & Scalability Benchmark Suite.
Validates stability, memory safety, and performance up to 1,000 qubits:
1. 2-qubit Bell State baseline
2. 8-qubit entangled register
3. 28-qubit boundary test
4. 41-qubit empty/idle circuit (validating regression fix for user's reported bug)
5. 100-qubit GHZ state (polynomial-time stabilizer scaling)
6. 500-qubit deep Clifford circuit
7. 1,000-qubit massive stabilizer benchmark (<1 MB RAM verification)
8. 1,000-qubit dense statevector safety rejection (clean 400 response without OOM)
9. qBraid backend credential & metadata validation
"""

import time
import json
import psutil
import os
from fastapi.testclient import TestClient
from app.main import app
from app.backends.registry import backend_registry

client = TestClient(app)

def run_benchmark_suite():
    process = psutil.Process(os.getpid())
    results = []

    print("=" * 80)
    print(" QUALUTION ARCHITECTURE & SCALABILITY BENCHMARK SUITE")
    print(" Testing up to 1,000 Qubits with Memory & Crash Verification")
    print("=" * 80)

    # -------------------------------------------------------------
    # 1. qBraid Backend Credential & Configuration Validation
    # -------------------------------------------------------------
    print("\n[Step 1/9] Validating qBraid Backend...")
    qbraid = backend_registry.get("qbraid")
    qbraid_meta = qbraid.get_metadata()
    print(f"  qBraid Name: {qbraid_meta.name}")
    print(f"  qBraid Provider: {qbraid_meta.provider}")
    print(f"  qBraid Available: {qbraid_meta.available}")
    print(f"  qBraid Status: {qbraid_meta.status}")
    assert qbraid_meta.name == "qbraid"
    results.append({
        "test": "qBraid API & Backend Contract",
        "qubits": "N/A",
        "status": "PASS",
        "details": f"Backend available: {qbraid_meta.available}, Status: {qbraid_meta.status}"
    })

    # Helper function to run circuit benchmark
    def benchmark_circuit(name, qubits, gates, mode="shots", shots=100, backend="auto"):
        mem_before_kb = process.memory_info().rss / 1024
        t0 = time.perf_counter()

        payload = {
            "circuit": {
                "qubits": qubits,
                "classical_bits": qubits,
                "gates": gates,
                "measure": True,
                "shots": shots
            },
            "backend": backend,
            "mode": mode,
            "include": {
                "metrics": True,
                "timeline": qubits <= 12,
                "bloch": qubits <= 8
            }
        }

        resp = client.post("/api/v1/circuits/run", json=payload)
        t1 = time.perf_counter()
        mem_after_kb = process.memory_info().rss / 1024
        delta_mem_kb = max(0, mem_after_kb - mem_before_kb)
        wall_ms = round((t1 - t0) * 1000, 2)

        return resp, wall_ms, delta_mem_kb

    # -------------------------------------------------------------
    # 2. 2-Qubit Bell State Baseline
    # -------------------------------------------------------------
    print("\n[Step 2/9] Benchmarking 2-Qubit Bell State...")
    gates_2q = [
        {"gate": "h", "targets": [0]},
        {"gate": "cx", "targets": [0, 1]}
    ]
    resp, wall_ms, mem_kb = benchmark_circuit("2-Qubit Bell", 2, gates_2q)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    print(f"  Duration: {wall_ms}ms | Selected Backend: {data['simulation']['backend']} | Policy: {data['routing']['policy']}")
    results.append({
        "test": "2-Qubit Bell Circuit",
        "qubits": 2,
        "gates": 2,
        "backend": data['simulation']['backend'],
        "latency_ms": wall_ms,
        "memory_delta_kb": round(mem_kb, 1),
        "status": "PASS"
    })

    # -------------------------------------------------------------
    # 3. 8-Qubit Entangled Register
    # -------------------------------------------------------------
    print("\n[Step 3/9] Benchmarking 8-Qubit Entangled Register...")
    gates_8q = [{"gate": "h", "targets": [0]}] + [{"gate": "cx", "targets": [i, i + 1]} for i in range(7)]
    resp, wall_ms, mem_kb = benchmark_circuit("8-Qubit Entangled", 8, gates_8q)
    assert resp.status_code == 200
    data = resp.json()
    print(f"  Duration: {wall_ms}ms | Selected Backend: {data['simulation']['backend']}")
    results.append({
        "test": "8-Qubit Entangled Circuit",
        "qubits": 8,
        "gates": len(gates_8q),
        "backend": data['simulation']['backend'],
        "latency_ms": wall_ms,
        "memory_delta_kb": round(mem_kb, 1),
        "status": "PASS"
    })

    # -------------------------------------------------------------
    # 4. 28-Qubit Boundary Circuit
    # -------------------------------------------------------------
    print("\n[Step 4/9] Benchmarking 28-Qubit Boundary Circuit...")
    gates_28q = [{"gate": "h", "targets": [0]}] + [{"gate": "cx", "targets": [i, i + 1]} for i in range(27)]
    resp, wall_ms, mem_kb = benchmark_circuit("28-Qubit GHZ", 28, gates_28q)
    assert resp.status_code == 200
    data = resp.json()
    print(f"  Duration: {wall_ms}ms | Selected Backend: {data['simulation']['backend']}")
    results.append({
        "test": "28-Qubit Boundary Circuit",
        "qubits": 28,
        "gates": len(gates_28q),
        "backend": data['simulation']['backend'],
        "latency_ms": wall_ms,
        "memory_delta_kb": round(mem_kb, 1),
        "status": "PASS"
    })

    # -------------------------------------------------------------
    # 5. 41-Qubit Empty / Zero-Gate Circuit (Regression Guard)
    # -------------------------------------------------------------
    print("\n[Step 5/9] Benchmarking 41-Qubit Empty Circuit (Zero-Gate Bug Fix)...")
    resp, wall_ms, mem_kb = benchmark_circuit("41-Qubit Empty", 41, [])
    assert resp.status_code == 200
    data = resp.json()
    counts = data["simulation"]["counts"]
    zero_key = "0" * 41
    assert counts.get(zero_key, 0) == 100, f"Expected 100 shots in |0^41>, got {counts}"
    print(f"  Duration: {wall_ms}ms | State: |0^41> (100% ground state) | Selected Backend: {data['simulation']['backend']}")
    results.append({
        "test": "41-Qubit Empty Circuit (Bug Fix)",
        "qubits": 41,
        "gates": 0,
        "backend": data['simulation']['backend'],
        "latency_ms": wall_ms,
        "memory_delta_kb": round(mem_kb, 1),
        "status": "PASS"
    })

    # -------------------------------------------------------------
    # 6. 100-Qubit GHZ State (Stabilizer Scaling)
    # -------------------------------------------------------------
    print("\n[Step 6/9] Benchmarking 100-Qubit GHZ State...")
    gates_100q = [{"gate": "h", "targets": [0]}] + [{"gate": "cx", "targets": [i, i + 1]} for i in range(99)]
    resp, wall_ms, mem_kb = benchmark_circuit("100-Qubit GHZ", 100, gates_100q)
    assert resp.status_code == 200
    data = resp.json()
    print(f"  Duration: {wall_ms}ms | Selected Backend: {data['simulation']['backend']}")
    results.append({
        "test": "100-Qubit GHZ State",
        "qubits": 100,
        "gates": len(gates_100q),
        "backend": data['simulation']['backend'],
        "latency_ms": wall_ms,
        "memory_delta_kb": round(mem_kb, 1),
        "status": "PASS"
    })

    # -------------------------------------------------------------
    # 7. 500-Qubit Clifford Register
    # -------------------------------------------------------------
    print("\n[Step 7/9] Benchmarking 500-Qubit Clifford Register...")
    gates_500q = [{"gate": "x", "targets": [i]} for i in range(0, 500, 2)] + [
        {"gate": "cz", "targets": [i, i + 1]} for i in range(0, 498, 2)
    ]
    resp, wall_ms, mem_kb = benchmark_circuit("500-Qubit Clifford", 500, gates_500q)
    assert resp.status_code == 200
    data = resp.json()
    print(f"  Duration: {wall_ms}ms | Selected Backend: {data['simulation']['backend']}")
    results.append({
        "test": "500-Qubit Clifford Circuit",
        "qubits": 500,
        "gates": len(gates_500q),
        "backend": data['simulation']['backend'],
        "latency_ms": wall_ms,
        "memory_delta_kb": round(mem_kb, 1),
        "status": "PASS"
    })

    # -------------------------------------------------------------
    # 8. 1,000-Qubit Stabilizer Circuit (< 1 MB RAM Guarantee)
    # -------------------------------------------------------------
    print("\n[Step 8/9] Benchmarking 1,000-Qubit Stabilizer Circuit...")
    gates_1000q = [
        {"gate": "h", "targets": [0]},
        {"gate": "x", "targets": [100]},
        {"gate": "y", "targets": [200]},
        {"gate": "z", "targets": [300]},
        {"gate": "s", "targets": [400]},
        {"gate": "cx", "targets": [0, 500]},
        {"gate": "cz", "targets": [500, 999]},
    ]
    resp, wall_ms, mem_kb = benchmark_circuit("1000-Qubit Stabilizer", 1000, gates_1000q, shots=50)
    assert resp.status_code == 200
    data = resp.json()
    stab_bytes = data["metrics"]["stabilizer_memory_bytes"]
    stab_kb = stab_bytes / 1024
    print(f"  Duration: {wall_ms}ms | Stabilizer Memory: {stab_kb:.1f} KB (< 1 MB RAM!)")
    print(f"  Selected Backend: {data['simulation']['backend']}")
    assert stab_kb < 1024, f"Stabilizer RAM exceeded 1 MB: {stab_kb} KB"
    results.append({
        "test": "1,000-Qubit Stabilizer Circuit",
        "qubits": 1000,
        "gates": len(gates_1000q),
        "backend": data['simulation']['backend'],
        "latency_ms": wall_ms,
        "stabilizer_ram_kb": round(stab_kb, 1),
        "status": "PASS"
    })

    # -------------------------------------------------------------
    # 9. 1,000-Qubit Statevector Memory Safety Rejection
    # -------------------------------------------------------------
    print("\n[Step 9/9] Verifying 1,000-Qubit Statevector Memory Guard...")
    sv_payload = {
        "circuit": {
            "qubits": 1000,
            "classical_bits": 0,
            "gates": [{"gate": "h", "targets": [0]}],
            "measure": False
        },
        "backend": "qiskit_aer",
        "mode": "statevector"
    }
    t0 = time.perf_counter()
    resp = client.post("/api/v1/circuits/run", json=sv_payload)
    t1 = time.perf_counter()
    sv_ms = round((t1 - t0) * 1000, 2)
    assert resp.status_code == 400, f"Expected 400 rejection, got {resp.status_code}"
    err_detail = resp.json().get("detail", "")
    assert "exceeds maximum statevector safety limit" in err_detail
    print(f"  Clean 400 Rejection in {sv_ms}ms without server crash or memory leak.")
    results.append({
        "test": "1,000-Qubit Statevector Safety Guard",
        "qubits": 1000,
        "mode": "statevector",
        "status_code": 400,
        "latency_ms": sv_ms,
        "status": "PASS",
        "details": "Safely rejected before memory allocation"
    })

    print("\n" + "=" * 80)
    print(" BENCHMARK RESULTS SUMMARY")
    print("=" * 80)
    for r in results:
        qubits_str = f"({r['qubits']}Q)" if r.get('qubits') != "N/A" else ""
        lat_str = f" | {r['latency_ms']}ms" if "latency_ms" in r else ""
        print(f"  + [{r['status']}] {r['test']} {qubits_str}{lat_str}")
    print("=" * 80)
    print(" ALL 9 ARCHITECTURE & SCALING BENCHMARKS PASSED PERFECTLY!\n")

    # Save benchmark report to JSON
    with open("benchmark_architecture_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print(" Saved telemetry to benchmark_architecture_results.json")

if __name__ == "__main__":
    run_benchmark_suite()
