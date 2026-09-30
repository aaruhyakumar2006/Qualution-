from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from app.schemas.result import ComplexNumber, BlochVector, QubitBlochVector

class TimelineStep(BaseModel):
    step: int = Field(..., description="Step index (0 is the initial state)")
    operation: str = Field(..., description="Operation performed at this step (e.g. 'initial', 'h', 'cx')")
    qubits: List[int] = Field(default_factory=list, description="Target qubit indices for the operation")
    parameters: Optional[Dict[str, float]] = Field(default=None, description="Operation parameters such as rotation angles")
    statevector: List[ComplexNumber] = Field(..., description="Statevector amplitudes after this step")
    probabilities: Dict[str, float] = Field(..., description="Theoretical computational basis probabilities")
    bloch: Optional[BlochVector] = Field(default=None, description="Bloch sphere coordinates (single-qubit only)")
    bloch_qubits: Optional[Dict[str, QubitBlochVector]] = Field(default=None, description="Per-qubit reduced density matrix Bloch coordinates")

class TimelineResponse(BaseModel):
    backend: str = Field("qiskit_statevector_timeline", description="Timeline simulation backend")
    qubits: int = Field(..., description="Total qubits in circuit")
    total_steps: int = Field(..., description="Total timeline steps recorded")
    steps: List[TimelineStep] = Field(..., description="Sequential state evolution steps")
    execution_time_ms: float = Field(..., description="Execution time in milliseconds")
