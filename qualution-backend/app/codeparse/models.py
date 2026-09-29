from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.circuit import CircuitRequest

class ParseRequest(BaseModel):
    code: str = Field(..., description="Quantum program source code string")

class ParseWarning(BaseModel):
    line: Optional[int] = Field(None, description="Source line number")
    column: Optional[int] = Field(None, description="Source column number")
    message: str = Field(..., description="Warning description")

class ParseResponse(BaseModel):
    framework: str = Field(..., description="Detected or parsed framework ('qiskit', 'pennylane')")
    circuit: CircuitRequest = Field(..., description="Parsed and validated Qualution CircuitRequest")
    warnings: List[ParseWarning] = Field(default_factory=list, description="Parser warnings or ignored constructs")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Parsing metadata")
