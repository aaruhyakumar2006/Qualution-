"""
targeted_mps_ceiling.py

Demonstrates that the defensible MPS ceiling for arbitrary entangled circuits is
18-20 qubits at our production bond-dimension setting (chi=32).
"""

from fastapi.testclient import TestClient
from app.main import app
import math

client = TestClient(app)

def build_brickwork(num_qubits: int, layers: int):
    gates = []
    gid = 0
    col = 0
    for l in range(layers):
        for q in range(num_qubits):
            gates.append({
                "id": f"g_{gid}",
                "type": "rx" if (q + l) % 2 == 0 else "ry",
                "targets": [q],
                "column": col,
                "angle": round(0.5 + 0.3 * math.sin(q + l), 4)
            })
            gid += 1
        col += 1

        for q in range(0, num_qubits - 1, 2):
            gates.append({"id": f"cx_{gid}", "type": "cx", "targets": [q, q + 1], "column": col})
            gid += 1
        col += 1

        for q in range(num_qubits):
            gates.append({
                "id": f"g_{gid}",
                "type": "rz",
                "targets": [q],
                "column": col,
                "angle": round(0.4 + 0.2 * math.cos(q * 2 + l), 4)
            })
            gid += 1
        col += 1

        for q in range(1, num_qubits - 1, 2):
            gates.append({"id": f"cx_{gid}", "type": "cx", "targets": [q, q + 1], "column": col})
            gid += 1
        col += 1
    return gates

print("================================================================================")
print("PINPOINTING MPS DEGRADATION CEILING (Layers = 5, max_bond_dimension = 32)")
print("================================================================================")

for n_qubits in [16, 18, 20, 22, 24, 25, 26, 28, 30]:
    gates = build_brickwork(n_qubits, layers=5)
    payload = {
        "qubits": n_qubits,
        "gates": gates,
        "shots": 1000,
        "max_bond_dimension": 32,
    }
    resp = client.post("/simulate/mps", json=payload)
    data = resp.json()
    cx_count = sum(1 for g in gates if g["type"] == "cx")
    print(f"Qubits: {n_qubits:2d} | Depth: 20 | CXs: {cx_count:2d} | "
          f"Max BD: {data['resource_estimate'].get('max_bond_dimension'):2d} | "
          f"Trunc Error: {data['truncation_error']:.6e} | "
          f"Fidelity: {data['fidelity']:.6f} | Runtime: {data['runtime_ms']:6.2f} ms")

print()
print("================================================================================")
print("BENCHMARK AT 20, 25, 30 QUBITS (Required by Task 2, item 3)")
print("================================================================================")
for max_bd in [32, 64]:
    print(f"\n--- Results for max_bond_dimension = {max_bd} (5 layers, 20 depth) ---")
    for n_qubits in [20, 25, 30]:
        gates = build_brickwork(n_qubits, layers=5)
        payload = {
            "qubits": n_qubits,
            "gates": gates,
            "shots": 1000,
            "max_bond_dimension": max_bd,
        }
        resp = client.post("/simulate/mps", json=payload)
        data = resp.json()
        print(f"Qubits: {n_qubits:2d} | Max BD: {max_bd} | "
              f"Trunc Error: {data['truncation_error']:.6e} | "
              f"Fidelity: {data['fidelity']:.6f} | Runtime: {data['runtime_ms']:6.2f} ms")
