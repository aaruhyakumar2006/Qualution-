from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.circuit import CircuitRequest

class CodeGenerationMetadata(BaseModel):
    qubits: int = Field(..., description="Qubit count")
    classical_bits: int = Field(..., description="Classical bit count")
    gate_count: int = Field(..., description="Total gate count")
    measure: bool = Field(..., description="Whether measurements are included")
    shots: int = Field(..., description="Simulation shot count")

class CodeGenerationResponse(BaseModel):
    framework: str = Field(..., description="Target quantum framework ('qiskit', 'pennylane')")
    language: str = Field("python", description="Generated programming language")
    code: str = Field(..., description="Clean, executable Python source code")
    metadata: CodeGenerationMetadata = Field(..., description="Circuit summary metadata")
