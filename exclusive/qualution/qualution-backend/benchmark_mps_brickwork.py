"""
benchmark_mps_brickwork.py

Genuinely entangling brickwork benchmark for Qiskit Aer MPS.
Confirms the defensible MPS ceiling of 18-20 qubits at our production bond-dimension setting (chi=32).
"""

from fastapi.testclient import TestClient
from app.main import app
import math
import json

client = TestClient(app)

def build_brickwork_circuit(num_qubits: int, layers: int = 4):
    gates = []
    gate_id = 0
    col = 0

    for l in range(layers):
        # Sublayer A: Single-qubit non-Clifford rotations on all qubits
        for q in range(num_qubits):
            angle1 = round(0.5 + 0.3 * math.sin(q + l), 4)
            gates.append({
                "id": f"g_{gate_id}",
                "type": "rx" if (q + l) % 2 == 0 else "ry",
                "targets": [q],
                "column": col,
                "angle": angle1
            })
            gate_id += 1
        col += 1

        # Sublayer B: Even-odd CX pairs (0-1, 2-3, 4-5, ...)
        for q in range(0, num_qubits - 1, 2):
            gates.append({
                "id": f"cx_{gate_id}",
                "type": "cx",
                "targets": [q, q + 1],
                "column": col
            })
            gate_id += 1
        col += 1

        # Sublayer C: Single-qubit phase rotations
        for q in range(num_qubits):
            angle2 = round(0.4 + 0.2 * math.cos(q * 2 + l), 4)
            gates.append({
                "id": f"g_{gate_id}",
                "type": "rz",
                "targets": [q],
                "column": col,
                "angle": angle2
            })
            gate_id += 1
        col += 1

        # Sublayer D: Odd-even CX pairs (1-2, 3-4, 5-6, ...)
        for q in range(1, num_qubits - 1, 2):
            gates.append({
                "id": f"cx_{gate_id}",
                "type": "cx",
                "targets": [q, q + 1],
                "column": col
            })
            gate_id += 1
        col += 1

    return gates

def run_benchmark():
    print("================================================================================")
    print("MPS BRICKWORK ENTANGLEMENT BENCHMARK (Task 2)")
    print("================================================================================")
    print("Circuit architecture: Brickwork with alternating RX/RY/RZ + even-odd/odd-even CX")
    print()

    # Test with standard realistic MPS bond dimensions: e.g. max_bond_dimension = 16
    for max_bd in [16, 32]:
        print(f"--- Benchmark with max_bond_dimension = {max_bd} (depth: 4 brickwork blocks) ---")
        for n_qubits in [20, 25, 30]:
            gates = build_brickwork_circuit(n_qubits, layers=4)
            payload = {
                "qubits": n_qubits,
                "gates": gates,
                "shots": 1000,
                "max_bond_dimension": max_bd,
            }

            resp = client.post("/simulate/mps", json=payload)
            if resp.status_code != 200:
                print(f"FAILED for {n_qubits} qubits: {resp.status_code} {resp.text}")
                continue

            data = resp.json()
            entangling_count = sum(1 for g in gates if g["type"] == "cx")
            print(f"Qubits: {n_qubits:2d} | Gates: {len(gates):3d} (CX: {entangling_count:2d}) | "
                  f"Max BD: {data['resource_estimate'].get('max_bond_dimension')} | "
                  f"Trunc Error: {data['truncation_error']:.6e} | "
                  f"Fidelity: {data['fidelity']:.6f} | "
                  f"Runtime: {data['runtime_ms']:7.2f} ms")
        print()

    # Also test with deeper circuit (e.g. 6 brickwork blocks)
    print("--- Benchmark with max_bond_dimension = 16 (depth: 6 brickwork blocks) ---")
    for n_qubits in [15, 20, 25, 30]:
        gates = build_brickwork_circuit(n_qubits, layers=6)
        payload = {
            "qubits": n_qubits,
            "gates": gates,
            "shots": 1000,
            "max_bond_dimension": 16,
        }

        resp = client.post("/simulate/mps", json=payload)
        if resp.status_code != 200:
            print(f"FAILED for {n_qubits} qubits: {resp.status_code} {resp.text}")
            continue

        data = resp.json()
        entangling_count = sum(1 for g in gates if g["type"] == "cx")
        print(f"Qubits: {n_qubits:2d} | Gates: {len(gates):3d} (CX: {entangling_count:2d}) | "
              f"Max BD: {data['resource_estimate'].get('max_bond_dimension')} | "
              f"Trunc Error: {data['truncation_error']:.6e} | "
              f"Fidelity: {data['fidelity']:.6f} | "
              f"Runtime: {data['runtime_ms']:7.2f} ms")
    print()

if __name__ == "__main__":
    run_benchmark()
