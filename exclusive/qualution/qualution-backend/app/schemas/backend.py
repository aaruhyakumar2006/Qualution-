from typing import List
from pydantic import BaseModel, Field

class BackendCapabilities(BaseModel):
    shots: bool = True
    shot_simulation: bool = True
    statevector: bool = True
    probabilities: bool = True
    timeline: bool = False
    bloch: bool = True
    hardware: bool = False
    local_simulator: bool = True
    remote_provider: bool = False

class BackendMetadata(BaseModel):
    name: str = Field(..., description="Unique backend identifier (e.g. 'qiskit_aer', 'pennylane', 'cirq', 'qbraid')")
    framework: str = Field(..., description="Underlying quantum framework (e.g. 'qiskit', 'pennylane', 'cirq', 'qbraid')")
    provider: str = Field(default="local", description="Provider origin: 'local' simulator or 'qbraid' ecosystem")
    status: str = Field(default="AVAILABLE", description="Backend status: 'AVAILABLE', 'NOT_CONFIGURED', 'UNAVAILABLE', 'ERROR'")
    available: bool = Field(default=True, description="Whether backend is available for execution")
    capabilities: BackendCapabilities = Field(..., description="Supported features matrix")

class BackendListResponse(BaseModel):
    backends: List[BackendMetadata]
