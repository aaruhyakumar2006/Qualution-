from typing import Dict
from app.codeparse.base import CodeParser
from app.codeparse.qiskit_parser import QiskitCodeParser
from app.codeparse.pennylane_parser import PennyLaneCodeParser
from app.codeparse.cirq_parser import CirqCodeParser
from app.codeparse.openqasm_parser import OpenQASMCodeParser
from app.codeparse.models import ParseResponse

class CodeParseService:
    def __init__(self):
        self._parsers: Dict[str, CodeParser] = {
            "qiskit": QiskitCodeParser(),
            "pennylane": PennyLaneCodeParser(),
            "cirq": CirqCodeParser(),
            "openqasm": OpenQASMCodeParser(),
        }

    def parse_code(self, framework: str, code: str) -> ParseResponse:
        fw_key = framework.lower()
        if fw_key not in self._parsers:
            available = list(self._parsers.keys())
            raise ValueError(f"Unsupported framework '{framework}'. Available parsers: {available}")

        parser = self._parsers[fw_key]
        circuit_request, warnings = parser.parse(code)

        return ParseResponse(
            framework=fw_key,
            circuit=circuit_request,
            warnings=warnings,
            metadata={
                "qubit_count": circuit_request.qubits,
                "gate_count": len(circuit_request.gates),
                "measure": circuit_request.measure
            }
        )

codeparse_service = CodeParseService()
