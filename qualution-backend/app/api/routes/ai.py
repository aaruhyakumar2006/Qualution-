import json
import logging
import asyncio
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional

logger = logging.getLogger("ai_routes")
from app.schemas.ai_tutor import (
    TutorQueryRequest,
    DebugCircuitRequest,
    OptimizeExplanationRequest,
    ExplainRequest,
    PredictOutcomeRequest,
    CompareSimulationRequest,
    RecommendationRequest,
    NormalizedTutorResponse
)
from app.schemas.ai_environment import AIEnvironmentResponse
from app.services.ai_orchestrator import ai_orchestrator
from app.services.environment_service import environment_service
from app.services.providers.nvidia_provider import redact_sensitive

router = APIRouter(prefix="/ai", tags=["AI Quantum Tutor Gateway"])

@router.get("/environment", response_model=AIEnvironmentResponse)
@router.head("/environment")
def get_ai_environment():
    """
    Lightweight capability and health probe endpoint.
    Returns sanitized provider availability and local system capabilities without exposing secrets.
    """
    return environment_service.get_environment_snapshot()

@router.post("/tutor", response_model=NormalizedTutorResponse)
def query_ai_tutor(request: TutorQueryRequest):
    """
    Query the Qualution Quantum AI Tutor powered by NVIDIA NIM (primary reasoning)
    and Groq LPU (pedagogical response optimization).
    """
    try:
        res = ai_orchestrator.query_tutor(
            question=request.question,
            context=request.context,
            mode=request.mode or "explain",
            level=request.level or "beginner",
            simplify_for_students=True if request.simplify_for_students is None else request.simplify_for_students
        )
        return res
    except Exception as e:
        safe_msg = redact_sensitive(str(e))
        raise HTTPException(status_code=500, detail=f"Tutor query failed: {safe_msg}")

@router.post("/tutor/stream")
async def stream_ai_tutor(request: TutorQueryRequest, http_request: Request):
    """
    Server-Sent Events (SSE) streaming endpoint for the Agent-Style UI.
    Streams genuine upstream token deltas from NVIDIA NIM and Groq LPU in real-time,
    accompanied by stage status events and the final normalized payload.
    """
    async def event_generator():
        try:
            for event in ai_orchestrator.stream_tutor(
                question=request.question,
                context=request.context,
                mode=request.mode or "explain",
                level=request.level or "beginner",
                simplify_for_students=True if request.simplify_for_students is None else request.simplify_for_students
            ):
                if await http_request.is_disconnected():
                    logger.info("Client disconnected from SSE stream.")
                    break
                event_type = event.get("event", "message")
                event_data = event.get("data", {})
                yield f"event: {event_type}\ndata: {json.dumps(event_data)}\n\n"
        except Exception as e:
            safe_err = redact_sensitive(str(e))
            yield f"event: error\ndata: {json.dumps({'error': safe_err, 'code': 'STREAM_ERROR'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/explain", response_model=NormalizedTutorResponse)
def explain_quantum_component(request: ExplainRequest):
    """Explain a selected gate, circuit structure, or measurement probability distribution."""
    try:
        context = {
            "circuit": request.circuit,
            "simulation": request.simulation,
            "selectedGate": request.selected_gate
        }
        if request.target == "gate" and request.selected_gate:
            g_name = request.selected_gate.get("gate", "").upper()
            tgts = request.selected_gate.get("targets", [])
            question = f"What does the {g_name} gate do on wire {tgts}? Explain its physical transformation and matrix action."
        elif request.target == "result" and request.simulation:
            question = "Explain the simulation measurement probabilities and why specific basis states appeared."
        else:
            question = "Explain the complete quantum circuit behavior and state evolution."

        return ai_orchestrator.query_tutor(
            question=question,
            context=context,
            mode="explain",
            level=request.level or "beginner"
        )
    except Exception as e:
        safe_msg = redact_sensitive(str(e))
        raise HTTPException(status_code=500, detail=f"Explanation failed: {safe_msg}")

@router.post("/debug", response_model=NormalizedTutorResponse)
def debug_quantum_circuit(request: DebugCircuitRequest):
    """
    Perform deep quantum circuit anomaly and logical bug detection using NVIDIA AI.
    """
    try:
        return ai_orchestrator.debug_circuit(
            circuit=request.circuit,
            simulation_data=request.simulation,
            code=request.code,
            error=request.error,
            level=request.level or "beginner"
        )
    except Exception as e:
        safe_msg = redact_sensitive(str(e))
        raise HTTPException(status_code=500, detail=f"Circuit debugging failed: {safe_msg}")

@router.post("/optimize", response_model=NormalizedTutorResponse)
def explain_circuit_optimization(request: OptimizeExplanationRequest):
    """
    Generate architectural and physical quantum fidelity analysis for circuit optimizations.
    """
    try:
        return ai_orchestrator.explain_optimization(
            original_circuit=request.original_circuit,
            optimized_circuit=request.optimized_circuit,
            passes_applied=request.passes,
            improvements=request.improvements,
            level=request.level or "beginner"
        )
    except Exception as e:
        safe_msg = redact_sensitive(str(e))
        raise HTTPException(status_code=500, detail=f"Optimization explanation failed: {safe_msg}")

@router.post("/predict", response_model=NormalizedTutorResponse)
def predict_quantum_outcome(request: PredictOutcomeRequest):
    """
    Socratic prediction mode: evaluates or prompts prediction of quantum state outcome.
    """
    try:
        context = {
            "circuit": request.circuit,
            "proposedGate": request.proposed_gate,
            "targetQubit": request.target_qubit
        }
        if request.proposed_gate:
            g = request.proposed_gate.get("gate", "").upper()
            q = request.target_qubit if request.target_qubit is not None else 0
            question = f"What will happen to the quantum state amplitudes and measurement probabilities if I add a {g} gate to wire q[{q}]?"
        elif request.learner_prediction:
            question = f"I predict the outcome will be: {request.learner_prediction}. How will the circuit evolve to verify this?"
        else:
            question = "Predict the expected measurement outcome distribution for this circuit before running simulation."

        return ai_orchestrator.query_tutor(
            question=question,
            context=context,
            mode="predict",
            level=request.level or "beginner"
        )
    except Exception as e:
        safe_msg = redact_sensitive(str(e))
        raise HTTPException(status_code=500, detail=f"Prediction query failed: {safe_msg}")

@router.post("/compare", response_model=NormalizedTutorResponse)
def compare_prediction_vs_result(request: CompareSimulationRequest):
    """
    Compare learner's pre-simulation prediction against actual quantum simulation measurements.
    """
    try:
        return ai_orchestrator.compare_simulation(
            circuit=request.circuit,
            prediction=request.prediction,
            simulation=request.simulation,
            level=request.level or "beginner"
        )
    except Exception as e:
        safe_msg = redact_sensitive(str(e))
        raise HTTPException(status_code=500, detail=f"Comparison failed: {safe_msg}")

@router.post("/recommend", response_model=NormalizedTutorResponse)
def recommend_next_step(request: RecommendationRequest):
    """
    Recommend the next quantum experiment or concept challenge tailored to student level.
    """
    try:
        return ai_orchestrator.recommend_next(
            learner_level=request.learner_level or "beginner",
            mastery=request.mastery,
            current_topic=request.current_topic,
            recent_circuit=request.recent_circuit
        )
    except Exception as e:
        safe_msg = redact_sensitive(str(e))
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {safe_msg}")
