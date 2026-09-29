import re
import ast
from typing import Tuple, List, Optional
from app.codeparse.base import CodeParser
from app.codeparse.models import ParseWarning
from app.codeparse.ast_utils import safe_eval_ast_number
from app.schemas.circuit import CircuitRequest, GateRequest

SINGLE_QUBIT_GATES = {"h", "x", "y", "z", "s", "t"}
ROTATION_GATES = {"rx", "ry", "rz", "p", "phase"}
TWO_QUBIT_GATES = {"cx", "cz", "swap", "cnot"}
THREE_QUBIT_GATES = {"ccx", "toffoli"}

class OpenQASMCodeParser(CodeParser):
    @property
    def framework(self) -> str:
        return "openqasm"

    def parse(self, code: str) -> Tuple[CircuitRequest, List[ParseWarning]]:
        qubits: Optional[int] = None
        classical_bits: int = 0
        has_measurements: bool = False
        gates: List[GateRequest] = []
        warnings: List[ParseWarning] = []
        max_seen_qubit = -1

        # Match gate statement: name(angle) targets; or name targets;
        stmt_pattern = re.compile(r"^\s*([a-zA-Z0-9_]+)(?:\s*\(([^)]+)\))?\s+([^;]+);")
        # Match measurement: measure q[0] -> c[0]; or c[0] = measure q[0];
        measure_arrow_pattern = re.compile(r"^\s*measure\s+\w+\[(\d+)\]\s*->\s*\w+\[(\d+)\];")
        measure_assign_pattern = re.compile(r"^\s*\w+\[(\d+)\]\s*=\s*measure\s+\w+\[(\d+)\];")

        # Split comments then split statements by semicolon
        clean_statements: List[Tuple[int, str]] = []
        for line_num, raw_line in enumerate(code.splitlines(), start=1):
            line_no_comment = raw_line.split("//")[0].strip()
            if not line_no_comment:
                continue
            for part in line_no_comment.split(";"):
                stmt = part.strip()
                if stmt:
                    clean_statements.append((line_num, stmt + ";"))

        for line_num, line in clean_statements:
            # Header / include statements
            if line.upper().startswith("OPENQASM") or line.startswith("include"):
                continue

            # Check Qubit declarations (OpenQASM 3: qubit[N] q; OpenQASM 2: qreg q[N];)
            q3_match = re.match(r"^qubit\[(\d+)\]\s+\w+;", line)
            if q3_match:
                qubits = int(q3_match.group(1))
                continue

            q2_match = re.match(r"^qreg\s+\w+\[(\d+)\];", line)
            if q2_match:
                qubits = int(q2_match.group(1))
                continue

            # Classical bit declarations (bit[N] c; or creg c[N];)
            c3_match = re.match(r"^bit\[(\d+)\]\s+\w+;", line)
            if c3_match:
                classical_bits = int(c3_match.group(1))
                continue

            c2_match = re.match(r"^creg\s+\w+\[(\d+)\];", line)
            if c2_match:
                classical_bits = int(c2_match.group(1))
                continue

            # Barrier
            if line.startswith("barrier"):
                continue

            # Measurements
            if measure_arrow_pattern.match(line) or measure_assign_pattern.match(line):
                has_measurements = True
                continue

            # Gate execution
            stmt_match = stmt_pattern.match(line)
            if not stmt_match:
                continue

            gate_raw = stmt_match.group(1).lower()
            angle_str = stmt_match.group(2)
            operands_str = stmt_match.group(3)

            # Special case measurement: `measure q[0];`
            if gate_raw == "measure":
                has_measurements = True
                continue

            # Extract target qubit indices from operands
            target_matches = re.findall(r"\[(\d+)\]", operands_str)
            if not target_matches:
                # Might be comma separated numbers or plain indices
                target_matches = [m for m in re.split(r"[\s,]+", operands_str.strip()) if m.isdigit()]

            targets = [int(m) for m in target_matches]
            for t in targets:
                if t > max_seen_qubit:
                    max_seen_qubit = t

            # Parse angle if present
            angle: Optional[float] = None
            if angle_str is not None:
                try:
                    eval_node = ast.parse(angle_str.strip(), mode="eval").body
                    angle = float(safe_eval_ast_number(eval_node))
                except Exception as e:
                    raise ValueError(f"Line {line_num}: Invalid angle expression '({angle_str})': {e}")

            # Normalize gate names
            canonical_gate = gate_raw
            if gate_raw == "cnot":
                canonical_gate = "cx"
            elif gate_raw == "phase":
                canonical_gate = "p"
            elif gate_raw == "toffoli":
                canonical_gate = "ccx"

            if canonical_gate in SINGLE_QUBIT_GATES:
                if not targets:
                    raise ValueError(f"Line {line_num}: Gate '{canonical_gate}' requires a target qubit.")
                for t in targets:
                    gates.append(GateRequest(gate=canonical_gate, targets=[t]))

            elif canonical_gate in ROTATION_GATES:
                if not targets:
                    raise ValueError(f"Line {line_num}: Rotation gate '{canonical_gate}' requires a target qubit.")
                for t in targets:
                    gates.append(GateRequest(gate=canonical_gate, targets=[t], angle=angle or 0.0))

            elif canonical_gate in TWO_QUBIT_GATES:
                if len(targets) != 2:
                    raise ValueError(f"Line {line_num}: Two-qubit gate '{canonical_gate}' requires exactly 2 targets, got {targets}.")
                gates.append(GateRequest(gate=canonical_gate, targets=targets))

            elif canonical_gate in THREE_QUBIT_GATES:
                if len(targets) != 3:
                    raise ValueError(f"Line {line_num}: Three-qubit gate '{canonical_gate}' requires exactly 3 targets, got {targets}.")
                gates.append(GateRequest(gate=canonical_gate, targets=targets))

            else:
                warnings.append(ParseWarning(line=line_num, message=f"Ignored unsupported gate '{canonical_gate}'"))

        final_qubits = qubits if qubits is not None else max(max_seen_qubit + 1, 1)
        final_clbits = classical_bits if classical_bits > 0 else (final_qubits if has_measurements else 0)

        circuit_req = CircuitRequest(
            qubits=final_qubits,
            classical_bits=final_clbits,
            gates=gates,
            measure=has_measurements,
            shots=1024,
        )
        return circuit_req, warnings
