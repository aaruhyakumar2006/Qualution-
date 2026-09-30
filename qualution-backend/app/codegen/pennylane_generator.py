from app.codegen.base import CodeGenerator
from app.schemas.circuit import CircuitRequest

class PennyLaneCodeGenerator(CodeGenerator):
    @property
    def framework(self) -> str:
        return "pennylane"

    def generate(self, circuit: CircuitRequest) -> str:
        lines = []
        lines.append("import pennylane as qml")
        lines.append("")
        lines.append("# Initialize Quantum Device")
        lines.append(f'dev = qml.device("default.qubit", wires={circuit.qubits})')
        lines.append("")
        lines.append("# Define Quantum Circuit QNode")
        if circuit.measure:
            lines.append(f"@qml.qnode(dev, shots={circuit.shots})")
        else:
            lines.append("@qml.qnode(dev)")
        lines.append("def circuit():")

        if not circuit.gates:
            lines.append("    # Empty circuit (identity)")
            lines.append("    pass")
        else:
            for g in circuit.gates:
                name = g.gate.lower()
                targets = g.targets
                angle = g.angle

                if name == "h":
                    lines.append(f"    qml.Hadamard(wires={targets[0]})")
                elif name == "x":
                    lines.append(f"    qml.PauliX(wires={targets[0]})")
                elif name == "y":
                    lines.append(f"    qml.PauliY(wires={targets[0]})")
                elif name == "z":
                    lines.append(f"    qml.PauliZ(wires={targets[0]})")
                elif name == "s":
                    lines.append(f"    qml.S(wires={targets[0]})")
                elif name == "t":
                    lines.append(f"    qml.T(wires={targets[0]})")
                elif name == "rx":
                    lines.append(f"    qml.RX({repr(angle)}, wires={targets[0]})")
                elif name == "ry":
                    lines.append(f"    qml.RY({repr(angle)}, wires={targets[0]})")
                elif name == "rz":
                    lines.append(f"    qml.RZ({repr(angle)}, wires={targets[0]})")
                elif name == "cx":
                    lines.append(f"    qml.CNOT(wires=[{targets[0]}, {targets[1]}])")
                elif name == "cz":
                    lines.append(f"    qml.CZ(wires=[{targets[0]}, {targets[1]}])")
                elif name == "swap":
                    lines.append(f"    qml.SWAP(wires=[{targets[0]}, {targets[1]}])")
                elif name in ("ccx", "toffoli"):
                    lines.append(f"    qml.Toffoli(wires=[{targets[0]}, {targets[1]}, {targets[2]}])")
                elif name in ("p", "u1", "phase"):
                    lines.append(f"    qml.PhaseShift({repr(angle)}, wires={targets[0]})")
                elif name == "cp":
                    lines.append(f"    qml.ControlledPhaseShift({repr(angle)}, wires=[{targets[0]}, {targets[1]}])")
                elif name == "crx":
                    lines.append(f"    qml.CRX({repr(angle)}, wires=[{targets[0]}, {targets[1]}])")
                elif name == "cry":
                    lines.append(f"    qml.CRY({repr(angle)}, wires=[{targets[0]}, {targets[1]}])")
                elif name == "crz":
                    lines.append(f"    qml.CRZ({repr(angle)}, wires=[{targets[0]}, {targets[1]}])")
                elif name == "ch":
                    lines.append(f"    qml.CH(wires=[{targets[0]}, {targets[1]}])")
                elif name in ("sdg", "s_dagger"):
                    lines.append(f"    qml.adjoint(qml.S)(wires={targets[0]})")
                elif name in ("tdg", "t_dagger"):
                    lines.append(f"    qml.adjoint(qml.T)(wires={targets[0]})")
                elif name == "sx":
                    lines.append(f"    qml.SX(wires={targets[0]})")
                elif name == "id":
                    lines.append(f"    qml.Identity(wires={targets[0]})")
                elif name == "reset":
                    pass
                elif name == "barrier":
                    lines.append("    qml.Barrier()")
                else:
                    raise ValueError(f"Unsupported PennyLane gate: '{name}'")

        lines.append("")
        if circuit.measure:
            lines.append("    return qml.counts()")
            lines.append("")
            lines.append("# Execute Simulation")
            lines.append("counts = circuit()")
            lines.append('print("Measurement counts:", counts)')
        else:
            lines.append("    return qml.state()")
            lines.append("")
            lines.append("# Compute Theoretical Statevector")
            lines.append("state = circuit()")
            lines.append('print("Quantum state:", state)')

        return "\n".join(lines) + "\n"
