from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class ComplexNumber(BaseModel):
    real: float
    imag: float

class BlochVector(BaseModel):
    x: float
    y: float
    z: float

class QubitBlochVector(BlochVector):
    purity: Optional[float] = Field(default=None, description="Quantum state purity Tr(rho^2)")
    magnitude: Optional[float] = Field(default=None, description="Bloch vector length sqrt(x^2 + y^2 + z^2)")

class StatevectorResponse(BaseModel):
    backend: str = Field("qiskit_aer_statevector", description="Simulation backend")
    qubits: int = Field(..., description="Number of qubits")
    statevector: List[ComplexNumber] = Field(..., description="List of complex amplitudes")
    probabilities: Dict[str, float] = Field(..., description="Theoretical state probabilities")
    bloch: Optional[BlochVector] = Field(default=None, description="Bloch sphere coordinates for single-qubit circuits")
    execution_time_ms: float = Field(..., description="Execution time in milliseconds")
