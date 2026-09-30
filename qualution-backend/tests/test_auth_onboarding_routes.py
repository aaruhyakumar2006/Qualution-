import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_current_user_default():
    response = client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "evaluator@qualution.ai"
    assert data["role"] == "teacher"
    assert data["full_name"] == "SIH Quantum Evaluator"

def test_register_and_login_flow():
    # Register a new student
    reg_payload = {
        "email": "learner@sih.org",
        "full_name": "SIH Quantum Student",
        "password": "quantum-secure-pass",
        "role": "student"
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["email"] == "learner@sih.org"
    assert reg_data["role"] == "student"

    # Login
    login_payload = {
        "email": "learner@sih.org",
        "password": "quantum-secure-pass"
    }
    login_res = client.post("/api/v1/auth/login/json", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Verify /users/me with bearer token
    me_res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "learner@sih.org"
    assert me_data["full_name"] == "SIH Quantum Student"

def test_onboarding_questions():
    res = client.get("/api/v1/onboarding/questions")
    assert res.status_code == 200
    questions = res.json()
    assert len(questions) == 5
    dims = {q["dimension"] for q in questions}
    assert "knowledge" in dims
    assert "circuits" in dims
    assert "programming" in dims

def test_onboarding_assess_beginner_with_misconceptions():
    payload = {
        "answers": {
            "q1_superposition": "B",  # wrong
            "q2_interference": "B",   # misconception RULE_SUPERPOS_RANDOM
            "q3_cnot_entanglement": "B", # misconception RULE_CNOT_COPY
            "q4_measurement_collapse": "B", # misconception RULE_MEASURE_NO_EFFECT
            "q5_programming": "D"
        },
        "learning_goals": ["visual_circuits"],
        "preferred_style": "visual"
    }
    res = client.post("/api/v1/onboarding/assess", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["level"] == "beginner"
    assert len(data["detected_misconceptions"]) == 3
    rule_ids = {m["rule_id"] for m in data["detected_misconceptions"]}
    assert "RULE_SUPERPOS_RANDOM" in rule_ids
    assert "RULE_CNOT_COPY" in rule_ids
    assert "RULE_MEASURE_NO_EFFECT" in rule_ids
    assert len(data["recommended_path"]) > 0

def test_onboarding_assess_advanced():
    payload = {
        "answers": {
            "q1_superposition": "A",
            "q2_interference": "A",
            "q3_cnot_entanglement": "A",
            "q4_measurement_collapse": "A",
            "q5_programming": "A"
        },
        "learning_goals": ["algorithms"],
        "preferred_style": "rigorous"
    }
    res = client.post("/api/v1/onboarding/assess", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["level"] == "advanced"
    assert data["score"] == 100
    assert len(data["detected_misconceptions"]) == 0
    assert "GHZ State Synthesis" in data["recommended_path"][0]
