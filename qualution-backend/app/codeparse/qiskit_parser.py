import ast
from typing import Tuple, List, Optional
from app.codeparse.base import CodeParser
from app.codeparse.models import ParseWarning
from app.codeparse.ast_utils import safe_eval_ast_number
from app.schemas.circuit import CircuitRequest, GateRequest

SINGLE_QUBIT_GATES = {"h", "x", "y", "z", "s", "t", "id", "i"}
ROTATION_GATES = {"rx", "ry", "rz", "p", "phase"}
TWO_QUBIT_GATES = {"cx", "cz", "swap", "cnot"}
THREE_QUBIT_GATES = {"ccx", "toffoli"}

def _extract_qubit(node: ast.AST) -> int:
    """Extract integer qubit index from int constant or Subscript like q[0]"""
    if isinstance(node, ast.Subscript):
        if isinstance(node.slice, ast.Constant) and isinstance(node.slice.value, int):
            return node.slice.value
        try:
            return int(safe_eval_ast_number(node.slice))
        except Exception:
            pass
    return int(safe_eval_ast_number(node))

class QiskitCodeParser(CodeParser):
    @property
    def framework(self) -> str:
        return "qiskit"

    def parse(self, code: str) -> Tuple[CircuitRequest, List[ParseWarning]]:
        try:
            tree = ast.parse(code)
        except SyntaxError as se:
            raise ValueError(f"Syntax error on line {se.lineno}, col {se.offset}: {se.msg}")

        circuit_var: Optional[str] = None
        qubits: Optional[int] = None
        classical_bits: int = 0
        shots: int = 1024
        has_measurements: bool = False
        gates: List[GateRequest] = []
        warnings: List[ParseWarning] = []
        max_seen_qubit = -1

        for node in tree.body:
            # 1. Look for `qc = QuantumCircuit(...)`
            if isinstance(node, ast.Assign):
                is_qc = False
                if isinstance(node.value, ast.Call):
                    func = node.value.func
                    if isinstance(func, ast.Name) and func.id == "QuantumCircuit":
                        is_qc = True
                    elif isinstance(func, ast.Attribute) and func.attr == "QuantumCircuit":
                        is_qc = True

                if is_qc:
                    if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                        circuit_var = node.targets[0].id
                        args = node.value.args
                        if len(args) >= 1:
                            qubits = int(safe_eval_ast_number(args[0]))
                        if len(args) >= 2:
                            classical_bits = int(safe_eval_ast_number(args[1]))

                # Also inspect `job = simulator.run(qc, shots=...)`
                elif (
                    isinstance(node.value, ast.Call)
                    and isinstance(node.value.func, ast.Attribute)
                    and node.value.func.attr == "run"
                ):
                    for kw in node.value.keywords:
                        if kw.arg == "shots":
                            try:
                                shots = int(safe_eval_ast_number(kw.value))
                            except Exception:
                                pass

            # 2. Look for `qc.<gate>(...)` calls
            elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
                call = node.value
                if isinstance(call.func, ast.Attribute) and isinstance(call.func.value, ast.Name):
                    caller_name = call.func.value.id
                    method_name = call.func.attr.lower()

                    if circuit_var and caller_name == circuit_var:
                        # Single-qubit Pauli / Clifford gates
                        if method_name in SINGLE_QUBIT_GATES:
                            if not call.args:
                                raise ValueError(f"Gate '{method_name}' on line {node.lineno} requires a target qubit argument.")
                            target = _extract_qubit(call.args[0])
                            max_seen_qubit = max(max_seen_qubit, target)
                            canonical = "id" if method_name == "i" else method_name
                            gates.append(GateRequest(gate=canonical, targets=[target]))

                        # Single-qubit parametric rotations
                        elif method_name in ROTATION_GATES:
                            if len(call.args) < 2:
                                raise ValueError(f"Rotation gate '{method_name}' on line {node.lineno} requires (angle, target) arguments.")
                            angle = float(safe_eval_ast_number(call.args[0]))
                            target = _extract_qubit(call.args[1])
                            max_seen_qubit = max(max_seen_qubit, target)
                            canonical = "p" if method_name == "phase" else method_name
                            gates.append(GateRequest(gate=canonical, targets=[target], angle=angle))

                        # Two-qubit gates
                        elif method_name in TWO_QUBIT_GATES:
                            if len(call.args) < 2:
                                raise ValueError(f"Two-qubit gate '{method_name}' on line {node.lineno} requires two qubit targets.")
                            t0 = _extract_qubit(call.args[0])
                            t1 = _extract_qubit(call.args[1])
                            max_seen_qubit = max(max_seen_qubit, t0, t1)
                            canonical = "cx" if method_name == "cnot" else method_name
                            gates.append(GateRequest(gate=canonical, targets=[t0, t1]))

                        # Three-qubit gates
                        elif method_name in THREE_QUBIT_GATES:
                            if len(call.args) < 3:
                                raise ValueError(f"Three-qubit gate '{method_name}' on line {node.lineno} requires three qubit targets.")
                            t0 = _extract_qubit(call.args[0])
                            t1 = _extract_qubit(call.args[1])
                            t2 = _extract_qubit(call.args[2])
                            max_seen_qubit = max(max_seen_qubit, t0, t1, t2)
                            gates.append(GateRequest(gate="ccx", targets=[t0, t1, t2]))

                        # Measurement
                        elif method_name in {"measure", "measure_all"}:
                            has_measurements = True

                        else:
                            raise ValueError(
                                f"Unsupported Qiskit operation '{method_name}' on line {node.lineno}, col {node.col_offset}. "
                                f"Qualution IR currently supports gates: {sorted(list(SINGLE_QUBIT_GATES | ROTATION_GATES | TWO_QUBIT_GATES | THREE_QUBIT_GATES))}."
                            )

        if qubits is None:
            if max_seen_qubit >= 0:
                qubits = max_seen_qubit + 1
            else:
                raise ValueError("No valid 'QuantumCircuit(qubits, ...)' initialization found in source code.")

        if has_measurements and classical_bits == 0:
            classical_bits = qubits

        circuit_request = CircuitRequest(
            qubits=qubits,
            classical_bits=classical_bits,
            gates=gates,
            measure=has_measurements,
            shots=shots
        )
        return circuit_request, warnings

