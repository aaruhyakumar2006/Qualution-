from typing import List
from pydantic import BaseModel, Field
from app.schemas.circuit import CircuitRequest
from app.schemas.metrics import CircuitMetricsResponse

class OptimizationImprovements(BaseModel):
    gate_count_reduction: int = Field(..., description="Absolute reduction in quantum gate count")
    gate_count_reduction_percent: float = Field(..., description="Percentage reduction in gate count")
    depth_reduction: int = Field(..., description="Absolute reduction in quantum circuit depth")
    depth_reduction_percent: float = Field(..., description="Percentage reduction in circuit depth")
    two_qubit_gate_reduction: int = Field(..., description="Absolute reduction in two-qubit gates")
    two_qubit_gate_reduction_percent: float = Field(..., description="Percentage reduction in two-qubit gates")

class OptimizationResponse(BaseModel):
    original_circuit: CircuitRequest = Field(..., description="Unmodified input circuit")
    optimized_circuit: CircuitRequest = Field(..., description="Mathematically verified optimized circuit")
    changed: bool = Field(..., description="Whether any optimization transformations were applied")
    correctness_verified: bool = Field(..., description="Whether unitary equivalence was formally verified")
    optimization_passes_applied: List[str] = Field(..., description="List of optimization pass names that applied changes")
    original_metrics: CircuitMetricsResponse = Field(..., description="Metrics of original circuit")
    optimized_metrics: CircuitMetricsResponse = Field(..., description="Metrics of optimized circuit")
    improvements: OptimizationImprovements = Field(..., description="Quantified structural improvements")
    explanation: List[str] = Field(..., description="Educational explanations of each applied optimization")
    execution_time_ms: float = Field(..., description="Optimization and verification runtime in ms")
