import ast
from typing import Tuple, List, Optional
from app.codeparse.base import CodeParser
from app.codeparse.models import ParseWarning
from app.codeparse.ast_utils import safe_eval_ast_number
from app.schemas.circuit import CircuitRequest, GateRequest

PL_GATE_MAPPING = {
    "hadamard": "h",
    "paulix": "x",
    "pauliy": "y",
    "pauliz": "z",
    "s": "s",
    "t": "t",
    "rx": "rx",
    "ry": "ry",
    "rz": "rz",
    "cnot": "cx",
    "cz": "cz",
    "swap": "swap",
}

def extract_wires(node: ast.AST) -> List[int]:
    """Safely extract wire integers from AST Constant, List, or Tuple."""
    if isinstance(node, ast.Constant) and isinstance(node.value, int):
        return [node.value]
    elif isinstance(node, (ast.List, ast.Tuple)):
        wires = []
        for elt in node.elts:
            if isinstance(elt, ast.Constant) and isinstance(elt.value, int):
                wires.append(elt.value)
            else:
                raise ValueError(f"Expected integer wire index, got: {ast.dump(elt)}")
        return wires
    raise ValueError(f"Unsupported wire specification: {type(node).__name__}")

class PennyLaneCodeParser(CodeParser):
    @property
    def framework(self) -> str:
        return "pennylane"

    def parse(self, code: str) -> Tuple[CircuitRequest, List[ParseWarning]]:
        try:
            tree = ast.parse(code)
        except SyntaxError as se:
            raise ValueError(f"Syntax error on line {se.lineno}, col {se.offset}: {se.msg}")

        qubits: Optional[int] = None
        shots: int = 1024
        has_measurements: bool = False
        gates: List[GateRequest] = []
        warnings: List[ParseWarning] = []

        # 1. Scan for device configuration: `qml.device("default.qubit", wires=N, shots=S)`
        for node in tree.body:
            if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call):
                call = node.value
                if isinstance(call.func, ast.Attribute) and call.func.attr == "device":
                    for kw in call.keywords:
                        if kw.arg == "wires":
                            qubits = int(safe_eval_ast_number(kw.value))
                        elif kw.arg == "shots":
                            shots = int(safe_eval_ast_number(kw.value))

        # 2. Locate QNode function
        qnode_fn: Optional[ast.FunctionDef] = None
        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                for dec in node.decorator_list:
                    # Check @qml.qnode(...)
                    if isinstance(dec, ast.Call):
                        if (
                            isinstance(dec.func, ast.Attribute)
                            and dec.func.attr == "qnode"
                        ):
                            qnode_fn = node
                            # Check shots keyword on decorator
                            for kw in dec.keywords:
                                if kw.arg == "shots":
                                    shots = int(safe_eval_ast_number(kw.value))
                    elif isinstance(dec, ast.Attribute) and dec.attr == "qnode":
                        qnode_fn = node

        if not qnode_fn:
            raise ValueError("No PennyLane @qml.qnode function definition found in source code.")

        # 3. Parse statements inside QNode function
        for stmt in qnode_fn.body:
            # Check gates: `qml.Gate(...)`
            if isinstance(stmt, ast.Expr) and isinstance(stmt.value, ast.Call):
                call = stmt.value
                if isinstance(call.func, ast.Attribute) and isinstance(call.func.value, ast.Name):
                    if call.func.value.id in {"qml", "pennylane"}:
                        pl_name = call.func.attr.lower()
                        if pl_name not in PL_GATE_MAPPING:
                            raise ValueError(
                                f"Unsupported PennyLane operation 'qml.{call.func.attr}' on line {stmt.lineno}. "
                                f"Qualution IR supports: {list(PL_GATE_MAPPING.keys())}."
                            )

                        canonical_gate = PL_GATE_MAPPING[pl_name]
                        wires_node: Optional[ast.AST] = None
                        angle_node: Optional[ast.AST] = None

                        # Check keywords
                        for kw in call.keywords:
                            if kw.arg == "wires":
                                wires_node = kw.value

                        # Parse based on gate type
                        if canonical_gate in {"h", "x", "y", "z", "s", "t"}:
                            if not wires_node and call.args:
                                wires_node = call.args[0]
                            if not wires_node:
                                raise ValueError(f"Gate 'qml.{call.func.attr}' requires a 'wires' target.")
                            targets = extract_wires(wires_node)
                            gates.append(GateRequest(gate=canonical_gate, targets=targets))

                        elif canonical_gate in {"rx", "ry", "rz"}:
                            if call.args:
                                angle_node = call.args[0]
                                if not wires_node and len(call.args) > 1:
                                    wires_node = call.args[1]
                            if not angle_node or not wires_node:
                                raise ValueError(f"Rotation 'qml.{call.func.attr}' requires angle and 'wires'.")
                            angle = float(safe_eval_ast_number(angle_node))
                            targets = extract_wires(wires_node)
                            gates.append(GateRequest(gate=canonical_gate, targets=targets, angle=angle))

                        elif canonical_gate in {"cx", "cz", "swap"}:
                            if not wires_node and call.args:
                                wires_node = call.args[0]
                            if not wires_node:
                                raise ValueError(f"Two-qubit gate 'qml.{call.func.attr}' requires 'wires=[c, t]'.")
                            targets = extract_wires(wires_node)
                            if len(targets) != 2:
                                raise ValueError(f"Two-qubit gate 'qml.{call.func.attr}' expects exactly 2 wires, got {len(targets)}.")
                            gates.append(GateRequest(gate=canonical_gate, targets=targets))

            # Check return statement: `return qml.counts()` vs `return qml.state()`
            elif isinstance(stmt, ast.Return) and isinstance(stmt.value, ast.Call):
                ret_call = stmt.value
                if isinstance(ret_call.func, ast.Attribute):
                    if ret_call.func.attr == "counts":
                        has_measurements = True
                    elif ret_call.func.attr == "state":
                        has_measurements = False

        if qubits is None:
            # Infer from highest wire target if not declared on device
            all_targets = [t for g in gates for t in g.targets]
            qubits = max(all_targets) + 1 if all_targets else 1

        classical_bits = qubits if has_measurements else 0

        circuit_request = CircuitRequest(
            qubits=qubits,
            classical_bits=classical_bits,
            gates=gates,
            measure=has_measurements,
            shots=shots
        )
        return circuit_request, warnings
