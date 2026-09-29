from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class SimulationResponse(BaseModel):
    backend: str = Field(..., description="Quantum backend used for simulation")
    shots: int = Field(..., description="Number of simulation shots")
    counts: Dict[str, int] = Field(..., description="Raw measurement outcome counts")
    probabilities: Dict[str, float] = Field(..., description="Normalized outcome probabilities")
    execution_time_ms: float = Field(..., description="Execution time in milliseconds on the server")
    transpiled_instructions: Optional[List[Dict[str, Any]]] = Field(None, description="Transpiled gates if topology was specified")
