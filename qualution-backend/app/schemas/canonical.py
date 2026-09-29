from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class CanonicalGateInput(BaseModel):
    id: Optional[str] = None
    type: Optional[str] = None
    gate: Optional[str] = None
    targets: List[int] = Field(default_factory=list)
    column: Optional[int] = None
    angle: Optional[float] = None
    name: Optional[str] = None

class CanonicalMeasurementInput(BaseModel):
    qubit: int
    classical_bit: int
    column: Optional[int] = None

class CanonicalCircuitInput(BaseModel):
    qubits: int = Field(..., ge=1, le=2000, description="Number of qubits (1-2000)")
    classical_bits: Optional[int] = Field(None, ge=0, le=2000)
    gates: List[CanonicalGateInput] = Field(default_factory=list)
    measurements: Optional[List[CanonicalMeasurementInput]] = None
    measure: Optional[bool] = None
    shots: Optional[int] = Field(1024, ge=1, le=100000)
    # MPS-specific optional parameters
    max_bond_dimension: Optional[int] = Field(None, ge=1, description="Max MPS bond dimension cutoff")
    truncation_threshold: Optional[float] = Field(None, ge=0.0, description="Singular value truncation threshold")

class ComplexAmplitude(BaseModel):
    real: float
    imag: float

class UnifiedExecutionResultResponse(BaseModel):
    backend: str = Field(default="qiskit_aer_mps", description="Simulation backend name")
    execution_location: str = Field(default="local_python", description="Execution environment location")
    execution_method: str = Field(default="mps", description="Simulation algorithm method")
    qubit_count: int = Field(..., description="Number of simulated qubits")
    shots: int = Field(..., description="Number of measurement shots")
    counts: Optional[Dict[str, int]] = Field(default=None, description="Outcome bitstring counts")
    probabilities: Dict[str, float] = Field(..., description="Estimated or exact basis probabilities")
    statevector: Optional[List[ComplexAmplitude]] = Field(default=None, description="Full statevector amplitudes if requested")
    amplitudes: Optional[List[ComplexAmplitude]] = Field(default=None, description="Alias for statevector amplitudes")
    runtime_ms: float = Field(..., description="Measured execution wall-clock time in ms")
    approximation: bool = Field(default=False, description="Whether simulation used tensor truncation / approximation")
    fidelity: Optional[float] = Field(default=1.0, description="Exact or lower-bound state fidelity (0.0 to 1.0)")
    truncation_error: Optional[float] = Field(default=0.0, description="Cumulative discarded singular-value weight")
    resource_estimate: Optional[Dict[str, Any]] = Field(default=None, description="MPS resource metrics (bond dimensions, memory)")
    warnings: Optional[List[str]] = Field(default=None, description="Operational warnings or diagnostic notices")
    routing_reason: str = Field(..., description="Explanation of why MPS was executed")
