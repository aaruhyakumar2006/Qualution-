from typing import Any, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator

# Gate Type Definitions
SingleQubitGate = Literal["h", "x", "y", "z", "s", "t", "rx", "ry", "rz", "p", "id", "measure", "reset", "control", "sdg", "tdg", "sx"]
TwoQubitGate = Literal["cx", "cz", "swap", "cp", "crx", "cry", "crz", "ch"]
ThreeQubitGate = Literal["ccx"]
RotationGate = Literal["rx", "ry", "rz", "p", "cp", "crx", "cry", "crz"]
AllGates = Literal[
    "h", "x", "y", "z", "s", "t", "rx", "ry", "rz", "p", "id",
    "cx", "cz", "swap", "ccx", "measure", "reset", "barrier", "control",
    "cp", "crx", "cry", "crz", "ch", "tdg", "sdg", "sx", "mcx",
    "if", "for", "while", "box", "phase_disk", "custom"
]

class GateRequest(BaseModel):
    gate: AllGates
    targets: List[int]
    angle: Optional[float] = None
    id: Optional[str] = None
    column: Optional[int] = None
    name: Optional[str] = None
    sub_circuit: Optional[List["GateRequest"]] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_gate_input(cls, data: Any) -> Any:
        if isinstance(data, dict):
            raw_gate = str(data.get("gate") or data.get("type") or "").strip().lower()
            alias_map = {
                "|0⟩": "reset",
                "|0>": "reset",
                "dirac 0": "reset",
                "dirac0": "reset",
                "cnot": "cx",
                "toffoli": "ccx",
                "u1": "p",
            }
            data["gate"] = alias_map.get(raw_gate, raw_gate)
        return data

    @model_validator(mode="after")
    def validate_gate(self) -> "GateRequest":
        gate_type = self.gate.lower()
        targets = self.targets
        angle = self.angle

        # Validate target counts
        if gate_type in ["h", "x", "y", "z", "s", "t", "rx", "ry", "rz", "p", "id", "reset", "control", "sdg", "tdg", "sx"]:
            if len(targets) != 1:
                raise ValueError(f"Gate {gate_type} requires exactly 1 target, got {len(targets)}")
        elif gate_type in ["cx", "cz", "swap", "cp", "crx", "cry", "crz", "ch"]:
            if len(targets) != 2:
                raise ValueError(f"Gate {gate_type} requires exactly 2 targets, got {len(targets)}")
            if targets[0] == targets[1]:
                raise ValueError(f"Gate {gate_type} targets must be distinct, got {targets}")
        elif gate_type in ["ccx"]:
            if len(targets) != 3:
                raise ValueError(f"Gate {gate_type} requires exactly 3 targets, got {len(targets)}")
            if len(set(targets)) != 3:
                raise ValueError(f"Gate {gate_type} targets must be distinct, got {targets}")
        elif gate_type in ["measure", "barrier", "custom"]:
            if len(targets) < 1:
                raise ValueError(f"Gate {gate_type} requires at least 1 target, got {len(targets)}")

        # Validate angle
        if gate_type in ["rx", "ry", "rz", "p", "cp", "crx", "cry", "crz"]:
            if angle is None:
                raise ValueError(f"Rotation gate {gate_type} requires an angle")
        else:
            if angle is not None:
                raise ValueError(f"Non-rotation gate {gate_type} must not have an angle")

        return self

class CircuitRequest(BaseModel):
    qubits: int = Field(..., ge=1, le=2000, description="Number of qubits (1-2000)")
    classical_bits: int = Field(0, ge=0, le=2000, description="Number of classical bits (0-2000)")
    gates: List[GateRequest] = Field(default_factory=list, description="List of quantum gates to apply")
    measure: bool = Field(False, description="Whether to apply measurements to all qubits at the end")
    shots: int = Field(1024, ge=1, le=100000, description="Number of shots for simulation (1-100000)")
    topology: Optional[str] = Field(None, description="Hardware topology to transpile the circuit against")

    @model_validator(mode="after")
    def validate_circuit(self) -> "CircuitRequest":
        # Validate measurement vs classical bits
        if self.measure and self.classical_bits == 0:
            raise ValueError("Measurement requires at least 1 classical bit")

        # Validate gate targets against qubit count
        for i, gate in enumerate(self.gates):
            for target in gate.targets:
                if target < 0 or target >= self.qubits:
                    raise ValueError(f"Gate {gate.gate} at index {i} references invalid qubit {target}. Circuit has {self.qubits} qubits.")

        return self
