from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_smoke_health_check():
    """Verify that the health check endpoint returns 200 OK and valid status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "qualution-backend"

def test_smoke_minimal_simulation():
    """Verify that a minimal circuit executes end-to-end via FastAPI route."""
    payload = {
        "qubits": 1,
        "classical_bits": 1,
        "gates": [{"gate": "x", "targets": [0]}],
        "measure": True,
        "shots": 100
    }
    response = client.post("/api/v1/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["backend"] == "qiskit_aer"
    assert data["shots"] == 100
    assert data["counts"] == {"1": 100}
    assert data["probabilities"] == {"1": 1.0}
