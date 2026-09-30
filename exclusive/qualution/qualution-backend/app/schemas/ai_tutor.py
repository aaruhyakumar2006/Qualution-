from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class TutorActionSchema(BaseModel):
    type: str
    label: str
    payload: Optional[Dict[str, Any]] = None

class NormalizedTutorResponse(BaseModel):
    status: str = "success"  # "success" | "degraded" | "provider_timeout" | "provider_unavailable" | "configuration_error"
    answer: Optional[str] = None
    fallback_answer: Optional[str] = None
    retryable: bool = False
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    latency_ms: Optional[float] = None
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    context_used: List[str] = Field(default_factory=list)
    reasoning_provider: str = "nvidia"
    response_optimizer: Optional[str] = None
    confidence: str = "high"
    follow_up: Optional[str] = None
    visualization_hint: Optional[str] = None
    code: Optional[str] = None
    technical_analysis: Optional[str] = None
    facts: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    # Backwards compatibility fields for existing frontend/test consumers
    provider: str = "groq-nvidia-dual"
    simplified_by: Optional[str] = None
    timings: Optional[Dict[str, Any]] = None

class TutorQueryRequest(BaseModel):
    question: str
    context: Dict[str, Any] = Field(default_factory=dict)
    mode: Optional[str] = "explain"
    level: Optional[str] = "beginner"
    simplify_for_students: Optional[bool] = True
    history: Optional[List[Dict[str, str]]] = None

class ExplainRequest(BaseModel):
    target: str = "circuit"  # "gate", "circuit", "result"
    selected_gate: Optional[Dict[str, Any]] = None
    circuit: Dict[str, Any] = Field(default_factory=dict)
    simulation: Optional[Dict[str, Any]] = None
    level: Optional[str] = "beginner"

class DebugCircuitRequest(BaseModel):
    circuit: Dict[str, Any]
    simulation: Optional[Dict[str, Any]] = None
    code: Optional[str] = None
    error: Optional[str] = None
    level: Optional[str] = "beginner"

class OptimizeExplanationRequest(BaseModel):
    original_circuit: Dict[str, Any]
    optimized_circuit: Dict[str, Any]
    passes: List[str] = Field(default_factory=list)
    improvements: Dict[str, Any] = Field(default_factory=dict)
    level: Optional[str] = "beginner"

class PredictOutcomeRequest(BaseModel):
    circuit: Dict[str, Any]
    proposed_gate: Optional[Dict[str, Any]] = None
    target_qubit: Optional[int] = None
    learner_prediction: Optional[str] = None
    level: Optional[str] = "beginner"

class CompareSimulationRequest(BaseModel):
    circuit: Dict[str, Any]
    prediction: str
    simulation: Dict[str, Any]
    level: Optional[str] = "beginner"

class RecommendationRequest(BaseModel):
    learner_level: Optional[str] = "beginner"
    mastery: Optional[Dict[str, Any]] = None
    current_topic: Optional[str] = None
    recent_circuit: Optional[Dict[str, Any]] = None
