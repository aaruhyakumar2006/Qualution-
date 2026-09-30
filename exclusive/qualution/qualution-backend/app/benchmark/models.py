from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.circuit import CircuitRequest

ExecutionMode = Literal["shots", "statevector"]

class BenchmarkResult(BaseModel):
    backend: str = Field(..., description="Quantum backend name")
    framework: str = Field(..., description="Underlying framework")
    circuit_signature: str = Field(..., description="Deterministic circuit hash/signature")
    qubits: int = Field(..., description="Circuit qubit count")
    gate_count: int = Field(..., description="Total quantum gate count")
    depth: int = Field(..., description="Circuit depth")
    two_qubit_gate_count: int = Field(..., description="Two-qubit gate count")
    execution_mode: ExecutionMode = Field(..., description="Execution mode ('shots' or 'statevector')")
    shots: int = Field(..., description="Shot count for simulation")
    median_time_ms: float = Field(..., description="Median execution latency in ms")
    min_time_ms: float = Field(..., description="Minimum execution latency in ms")
    max_time_ms: float = Field(..., description="Maximum execution latency in ms")
    warmup_runs: int = Field(..., description="Number of discarded warmup iterations")
    measured_runs: int = Field(..., description="Number of measured iterations")
    success: bool = Field(..., description="Whether benchmark ran and passed correctness checks")
    error: Optional[str] = Field(None, description="Error message if benchmark failed")
    memory_estimate_bytes: int = Field(..., description="Theoretical statevector memory estimate")

class BenchmarkRequest(BaseModel):
    circuit: CircuitRequest
    execution_mode: ExecutionMode = Field("shots", description="Execution mode to benchmark")
    warmup_runs: int = Field(1, ge=0, le=5, description="Warmup iterations (not included in metrics)")
    measured_runs: int = Field(3, ge=1, le=10, description="Measured iterations for median calculation")
    backends: Optional[List[str]] = Field(None, description="Optional list of backends to benchmark. Defaults to all.")

class BenchmarkComparisonResponse(BaseModel):
    circuit_signature: str = Field(..., description="Deterministic circuit signature")
    execution_mode: ExecutionMode
    qubits: int
    gate_count: int
    depth: int
    results: List[BenchmarkResult]
