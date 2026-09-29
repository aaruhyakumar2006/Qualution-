from typing import Optional, Literal
from pydantic import BaseModel, Field

MemoryClass = Literal["small", "moderate", "large", "very_large", "stabilizer"]

class CircuitMetricsResponse(BaseModel):
    qubit_count: int = Field(..., description="Total qubits defined in the circuit")
    classical_bit_count: int = Field(..., description="Total classical bits defined")
    gate_count: int = Field(..., description="Total quantum operations (excluding measurements)")
    depth: int = Field(..., description="Circuit depth computed by Qiskit")
    single_qubit_gate_count: int = Field(..., description="Number of single-qubit gates")
    two_qubit_gate_count: int = Field(..., description="Number of two-qubit gates")
    rotation_gate_count: int = Field(..., description="Number of parameterized rotation gates")
    measurement_count: int = Field(..., description="Number of measurement operations")
    max_qubit_index: Optional[int] = Field(None, description="Highest qubit index touched by gates")
    unique_qubits_used: int = Field(..., description="Number of unique qubits touched by gates")
    two_qubit_gate_ratio: float = Field(..., description="Ratio of two-qubit gates to total gates")
    statevector_amplitudes: int = Field(..., description="Theoretical number of complex amplitudes (2^n)")
    statevector_memory_bytes: int = Field(..., description="Estimated dense statevector memory in bytes")
    statevector_memory_mb: float = Field(..., description="Estimated dense statevector memory in Megabytes")
    statevector_memory_gb: float = Field(..., description="Estimated dense statevector memory in Gigabytes")
    simulation_memory_class: MemoryClass = Field(..., description="Resource footprint classification")
    is_clifford: bool = Field(False, description="Whether the circuit contains exclusively Clifford operations")
    stabilizer_memory_bytes: Optional[int] = Field(None, description="Estimated Aaronson-Gottesman stabilizer tableau memory in bytes")
    recommended_simulation_method: Optional[str] = Field("statevector", description="Optimal simulation method (e.g. stabilizer, statevector, mps)")

