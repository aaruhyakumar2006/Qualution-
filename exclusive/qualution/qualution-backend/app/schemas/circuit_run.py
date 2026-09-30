from typing import Dict, List, Optional, Literal
from pydantic import BaseModel, Field
from app.schemas.circuit import CircuitRequest
from app.schemas.metrics import CircuitMetricsResponse
from app.schemas.result import ComplexNumber, BlochVector, QubitBlochVector
from app.schemas.timeline import TimelineResponse

RunMode = Literal["shots", "statevector"]

class CircuitRunInclude(BaseModel):
    metrics: bool = Field(True, description="Whether to include structural circuit metrics and resource estimates")
    timeline: bool = Field(False, description="Whether to compute step-by-step gate execution timeline")
    bloch: bool = Field(False, description="Whether to calculate single-qubit Bloch vector coordinates")

class CircuitRunRequest(BaseModel):
    circuit: CircuitRequest
    mode: RunMode = Field("shots", description="Execution mode ('shots' or 'statevector')")
    backend: str = Field("auto", description="Execution backend ('auto', 'qiskit_aer', 'pennylane')")
    include: CircuitRunInclude = Field(default_factory=CircuitRunInclude, description="Optional payload inclusions")

class CircuitRunCircuitSummary(BaseModel):
    qubits: int = Field(..., description="Qubit register size")
    classical_bits: int = Field(..., description="Classical bit register size")
    gate_count: int = Field(..., description="Total gate count")
    measure: bool = Field(..., description="Measurement flag")
    shots: int = Field(..., description="Simulation shots")

class CircuitRunRoutingSummary(BaseModel):
    requested_backend: str = Field(..., description="Requested backend parameter ('auto' or specific backend)")
    selected_backend: str = Field(..., description="Actual backend chosen for simulation")
    framework: str = Field(..., description="Underlying quantum framework")
    policy: str = Field(..., description="Routing policy applied ('direct_selection', 'lowest_measured_latency', 'safe_default_fallback')")
    reason: str = Field(..., description="Educational explanation of backend selection")

class CircuitRunSimulationResult(BaseModel):
    backend: str = Field(..., description="Executed backend name")
    mode: RunMode = Field(..., description="Execution mode ('shots' or 'statevector')")
    shots: int = Field(..., description="Shot count")
    counts: Optional[Dict[str, int]] = Field(None, description="Shot measurement counts (present in 'shots' mode)")
    probabilities: Dict[str, float] = Field(..., description="Basis state probability distribution")
    statevector: Optional[List[ComplexNumber]] = Field(None, description="Exact complex statevector amplitudes (in 'statevector' mode)")
    execution_time_ms: float = Field(..., description="Pure simulation execution latency in ms")

class CircuitRunVisualization(BaseModel):
    bloch: Optional[BlochVector] = Field(None, description="Single-qubit Bloch coordinates (null for multi-qubit for backwards compatibility)")
    bloch_qubits: Optional[Dict[str, QubitBlochVector]] = Field(None, description="Per-qubit reduced density matrix Bloch coordinates")
    timeline: Optional[TimelineResponse] = Field(None, description="Step-by-step gate timeline (if requested)")
    timeline_notice: Optional[str] = Field(None, description="Notice if timeline was skipped due to circuit size")

class CircuitRunResponse(BaseModel):
    circuit: CircuitRunCircuitSummary = Field(..., description="Circuit summary metadata")
    routing: CircuitRunRoutingSummary = Field(..., description="Routing and candidate selection summary")
    metrics: Optional[CircuitMetricsResponse] = Field(None, description="Structural metrics and resource estimation")
    simulation: CircuitRunSimulationResult = Field(..., description="Normalized simulation results")
    visualization: CircuitRunVisualization = Field(..., description="Visual data assets (Bloch, timeline)")
    execution_time_ms: float = Field(..., description="Total workflow orchestration latency in ms")
