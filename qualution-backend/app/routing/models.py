from typing import List, Optional, Union
from pydantic import BaseModel, Field
from app.schemas.metrics import CircuitMetricsResponse
from app.schemas.simulation import SimulationResponse
from app.schemas.result import StatevectorResponse

class CandidateBackend(BaseModel):
    backend: str = Field(..., description="Backend identifier")
    framework: str = Field(..., description="Framework name")
    eligible: bool = Field(..., description="Whether backend is eligible to execute the circuit")
    reason: Optional[str] = Field(None, description="Reason if ineligible")
    median_execution_time_ms: Optional[float] = Field(None, description="Measured or cached median latency in ms")
    is_cached_measurement: bool = Field(False, description="Whether execution time was loaded from benchmark cache")

class RoutingReason(BaseModel):
    policy: str = Field(..., description="Routing policy rule applied (e.g. 'lowest_measured_latency', 'safe_fallback')")
    explanation: str = Field(..., description="Human-readable educational reason for backend selection")

class AutoRoutingResponse(BaseModel):
    selected_backend: str = Field(..., description="Backend selected for final execution")
    routing_reason: RoutingReason = Field(..., description="Explanation of why this backend was chosen")
    candidates: List[CandidateBackend] = Field(..., description="Evaluation of all registered backend candidates")
    metrics: CircuitMetricsResponse = Field(..., description="Circuit structural and resource metrics")
    result: Union[SimulationResponse, StatevectorResponse] = Field(..., description="Execution result from selected backend")
