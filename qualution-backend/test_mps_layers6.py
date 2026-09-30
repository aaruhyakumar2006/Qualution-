"""
test_mps_layers6.py
"""
from fastapi.testclient import TestClient
from app.main import app
import math

client = TestClient(app)

def build_brickwork(num_qubits: int, layers: int = 6):
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

print("================================================================")
print("TESTING 20, 25, 30 QUBITS (6 layers / depth 24)")
print("================================================================")
for bd in [16, 32]:
    print(f"\n--- max_bond_dimension = {bd} ---")
    for n_qubits in [10, 12, 14, 16, 18, 20, 25, 30]:
        gates = build_brickwork(n_qubits, layers=6)
        payload = {
            "qubits": n_qubits,
            "gates": gates,
            "shots": 1000,
            "max_bond_dimension": bd,
        }
        resp = client.post("/simulate/mps", json=payload)
        data = resp.json()
        print(f"Qubits: {n_qubits:2d} | Trunc Error: {data['truncation_error']:.6e} | Fidelity: {data['fidelity']:.6f} | Max BD: {data['resource_estimate'].get('max_bond_dimension')}")
