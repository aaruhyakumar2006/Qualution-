import ast
from typing import Tuple, List, Optional, cast
from app.codeparse.base import CodeParser
from app.codeparse.models import ParseWarning
from app.codeparse.ast_utils import safe_eval_ast_number
from app.schemas.circuit import CircuitRequest, GateRequest, AllGates

SINGLE_QUBIT_GATES = {
    "h": "h",
    "x": "x",
    "y": "y",
    "z": "z",
    "s": "s",
    "t": "t",
    "hadamard": "h",
    "paulix": "x",
    "pauliy": "y",
    "pauliz": "z",
}

ROTATION_GATES = {"rx", "ry", "rz"}

TWO_QUBIT_GATES = {
    "cx": "cx",
    "cnot": "cx",
    "cz": "cz",
    "swap": "swap",
}

class CirqCodeParser(CodeParser):
    @property
    def framework(self) -> str:
        return "cirq"

    def _extract_qubit_index(self, node: ast.AST) -> Optional[int]:
        """Extract qubit integer index from `qubits[0]`, `q0`, `cirq.LineQubit(0)`, etc."""
        if isinstance(node, ast.Subscript):
            if isinstance(node.slice, ast.Constant) and isinstance(node.slice.value, int):
                return node.slice.value
            try:
                return int(safe_eval_ast_number(node.slice))
            except Exception:
                pass
        elif isinstance(node, ast.Constant) and isinstance(node.value, int):
            return node.value
        elif isinstance(node, ast.Name):
            import re
            m = re.search(r"(\d+)$", node.id)
            if m:
                return int(m.group(1))
        elif isinstance(node, ast.Call):
            # e.g. cirq.LineQubit(0)
            if node.args and isinstance(node.args[0], (ast.Constant, ast.UnaryOp, ast.BinOp)):
                try:
                    return int(safe_eval_ast_number(node.args[0]))
                except Exception:
                    pass
        return None

    def parse(self, code: str) -> Tuple[CircuitRequest, List[ParseWarning]]:
        try:
            tree = ast.parse(code)
        except SyntaxError as se:
            raise ValueError(f"Syntax error on line {se.lineno}, col {se.offset}: {se.msg}")

        qubits: Optional[int] = None
        classical_bits: int = 0
        shots: int = 1024
        has_measurements: bool = False
        gates: List[GateRequest] = []
        warnings: List[ParseWarning] = []
        max_seen_qubit = -1

        def register_gate(name: str, targets: List[int], angle: Optional[float] = None):
            nonlocal max_seen_qubit
            for t in targets:
                if t > max_seen_qubit:
                    max_seen_qubit = t
            gates.append(GateRequest(gate=cast(AllGates, name), targets=targets, angle=angle))

        def parse_cirq_gate_call(gate_call_node: ast.Call):
            """Parse `cirq.H(qubit)`, `cirq.rx(angle)(qubit)`, `cirq.CNOT(c, t)`, `cirq.measure(q)`."""
            nonlocal has_measurements

            # Pattern A: Curried rotation `cirq.rx(angle)(qubit)`
            if isinstance(gate_call_node.func, ast.Call):
                inner_call = gate_call_node.func
                gate_name = None
                if isinstance(inner_call.func, ast.Attribute):
                    gate_name = inner_call.func.attr.lower()
                elif isinstance(inner_call.func, ast.Name):
                    gate_name = inner_call.func.id.lower()

                if gate_name is not None and gate_name in ROTATION_GATES:
                    angle = None
                    if inner_call.args:
                        angle = float(safe_eval_ast_number(inner_call.args[0]))
                    target = self._extract_qubit_index(gate_call_node.args[0]) if gate_call_node.args else None
                    if target is not None:
                        register_gate(gate_name, [target], angle=angle)
                    return

            # Pattern B: Normal gate call `cirq.Gate(qubit1, qubit2)`
            gate_name = None
            if isinstance(gate_call_node.func, ast.Attribute):
                gate_name = gate_call_node.func.attr.lower()
            elif isinstance(gate_call_node.func, ast.Name):
                gate_name = gate_call_node.func.id.lower()

            if not gate_name:
                return

            if gate_name == "measure":
                has_measurements = True
                return

            if gate_name in SINGLE_QUBIT_GATES:
                canonical = SINGLE_QUBIT_GATES[gate_name]
                for arg in gate_call_node.args:
                    target = self._extract_qubit_index(arg)
                    if target is not None:
                        register_gate(canonical, [target])

            elif gate_name in TWO_QUBIT_GATES:
                canonical = TWO_QUBIT_GATES[gate_name]
                if len(gate_call_node.args) >= 2:
                    t0 = self._extract_qubit_index(gate_call_node.args[0])
                    t1 = self._extract_qubit_index(gate_call_node.args[1])
                    if t0 is not None and t1 is not None:
                        register_gate(canonical, [t0, t1])

            elif gate_name in ROTATION_GATES:
                # Direct call e.g. rx(angle, qubit) or rx(qubit, rads=angle)
                angle = None
                target = None
                if len(gate_call_node.args) >= 2:
                    angle = float(safe_eval_ast_number(gate_call_node.args[0]))
                    target = self._extract_qubit_index(gate_call_node.args[1])
                elif len(gate_call_node.args) == 1:
                    angle = float(safe_eval_ast_number(gate_call_node.args[0]))
                if target is not None:
                    register_gate(gate_name, [target], angle=angle)

        for node in tree.body:
            # 1. Look for `qubits = [cirq.LineQubit(i) for i in range(n)]` or `qubits = cirq.LineQubit.range(n)`
            if isinstance(node, ast.Assign):
                # Pattern: LineQubit.range(n)
                if isinstance(node.value, ast.Call):
                    func = node.value.func
                    is_circuit = (
                        (isinstance(func, ast.Name) and func.id == "Circuit")
                        or (isinstance(func, ast.Attribute) and func.attr == "Circuit")
                    )
                    if is_circuit:
                        for arg in node.value.args:
                            if isinstance(arg, (ast.List, ast.Tuple)):
                                for elt in arg.elts:
                                    if isinstance(elt, ast.Call):
                                        parse_cirq_gate_call(elt)
                            elif isinstance(arg, ast.Call):
                                parse_cirq_gate_call(arg)
                    elif (
                        isinstance(node.value.func, ast.Attribute)
                        and node.value.func.attr == "range"
                        and node.value.args
                    ):
                        try:
                            qubits = int(safe_eval_ast_number(node.value.args[0]))
                        except Exception:
                            pass
                    # Pattern: simulator.run(..., repetitions=N)
                    elif (
                        isinstance(node.value.func, ast.Attribute)
                        and node.value.func.attr == "run"
                    ):
                        for kw in node.value.keywords:
                            if kw.arg in {"repetitions", "shots"}:
                                try:
                                    shots = int(safe_eval_ast_number(kw.value))
                                except Exception:
                                    pass

                # Pattern: List comprehension [cirq.LineQubit(i) for i in range(N)]
                elif isinstance(node.value, ast.ListComp):
                    for gen in node.value.generators:
                        if isinstance(gen.iter, ast.Call) and isinstance(gen.iter.func, ast.Name) and gen.iter.func.id == "range":
                            if gen.iter.args:
                                try:
                                    qubits = int(safe_eval_ast_number(gen.iter.args[0]))
                                except Exception:
                                    pass

            # 2. Look for `circuit.append(...)` or `circuit.append([...])`
            elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
                call = node.value
                if isinstance(call.func, ast.Attribute) and call.func.attr in {"append", "insert"}:
                    for arg in call.args:
                        if isinstance(arg, ast.List):
                            for elt in arg.elts:
                                if isinstance(elt, ast.Call):
                                    parse_cirq_gate_call(elt)
                        elif isinstance(arg, ast.Call):
                            parse_cirq_gate_call(arg)

                # simulator.run(circuit, repetitions=...) in standalone expression
                elif isinstance(call.func, ast.Attribute) and call.func.attr == "run":
                    for kw in call.keywords:
                        if kw.arg in {"repetitions", "shots"}:
                            try:
                                shots = int(safe_eval_ast_number(kw.value))
                            except Exception:
                                pass

            # 3. Look for loops `for i in range(...): circuit.append(cirq.measure(...))`
            elif isinstance(node, ast.For):
                for sub in node.body:
                    if isinstance(sub, ast.Expr) and isinstance(sub.value, ast.Call):
                        if isinstance(sub.value.func, ast.Attribute) and sub.value.func.attr == "append":
                            for arg in sub.value.args:
                                if isinstance(arg, ast.Call):
                                    parse_cirq_gate_call(arg)

        # Fallback qubit count calculation
        final_qubits = qubits if qubits is not None else max(max_seen_qubit + 1, 1)
        final_clbits = final_qubits if has_measurements else 0

        circuit_req = CircuitRequest(
            qubits=final_qubits,
            classical_bits=final_clbits,
            gates=gates,
            measure=has_measurements,
            shots=shots,
        )

        return circuit_req, warnings
