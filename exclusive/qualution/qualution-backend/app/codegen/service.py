from typing import Dict
from app.codegen.base import CodeGenerator
from app.codegen.qiskit_generator import QiskitCodeGenerator
from app.codegen.pennylane_generator import PennyLaneCodeGenerator
from app.codegen.cirq_generator import CirqCodeGenerator
from app.codegen.models import CodeGenerationResponse, CodeGenerationMetadata
from app.schemas.circuit import CircuitRequest

class CodeGenService:
    def __init__(self):
        self._generators: Dict[str, CodeGenerator] = {
            "qiskit": QiskitCodeGenerator(),
            "pennylane": PennyLaneCodeGenerator(),
            "cirq": CirqCodeGenerator(),
        }

    def generate_code(self, framework: str, circuit: CircuitRequest) -> CodeGenerationResponse:
        fw_key = framework.lower()
        if fw_key not in self._generators:
            available = list(self._generators.keys())
            raise ValueError(f"Unsupported framework '{framework}'. Available frameworks: {available}")

        generator = self._generators[fw_key]
        code = generator.generate(circuit)

        metadata = CodeGenerationMetadata(
            qubits=circuit.qubits,
            classical_bits=circuit.classical_bits,
            gate_count=len(circuit.gates),
            measure=circuit.measure,
            shots=circuit.shots,
        )

        return CodeGenerationResponse(
            framework=fw_key,
            language="python",
            code=code,
            metadata=metadata,
        )

codegen_service = CodeGenService()
