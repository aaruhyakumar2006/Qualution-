from app.codegen.base import CodeGenerator
from app.schemas.circuit import CircuitRequest

class CirqCodeGenerator(CodeGenerator):
    @property
    def framework(self) -> str:
        return "cirq"

    def generate(self, circuit: CircuitRequest) -> str:
        lines = []
        lines.append("import cirq")
        lines.append("import numpy as np")
        lines.append("")
        lines.append(f"# Initialize {circuit.qubits} Qubit(s)")
        lines.append(f"qubits = [cirq.LineQubit(i) for i in range({circuit.qubits})]")
        lines.append("circuit = cirq.Circuit()")
        lines.append("")
        lines.append("# Apply Quantum Operations")

        for g in circuit.gates:
            name = g.gate.lower()
            targets = g.targets
            angle = g.angle

            if name == "h":
                lines.append(f"circuit.append(cirq.H(qubits[{targets[0]}]))")
            elif name == "x":
                lines.append(f"circuit.append(cirq.X(qubits[{targets[0]}]))")
            elif name == "y":
                lines.append(f"circuit.append(cirq.Y(qubits[{targets[0]}]))")
            elif name == "z":
                lines.append(f"circuit.append(cirq.Z(qubits[{targets[0]}]))")
            elif name == "s":
                lines.append(f"circuit.append(cirq.S(qubits[{targets[0]}]))")
            elif name == "t":
                lines.append(f"circuit.append(cirq.T(qubits[{targets[0]}]))")
            elif name == "rx":
                lines.append(f"circuit.append(cirq.rx({repr(angle)})(qubits[{targets[0]}]))")
            elif name == "ry":
                lines.append(f"circuit.append(cirq.ry({repr(angle)})(qubits[{targets[0]}]))")
            elif name == "rz":
                lines.append(f"circuit.append(cirq.rz({repr(angle)})(qubits[{targets[0]}]))")
            elif name == "cx":
                lines.append(f"circuit.append(cirq.CNOT(qubits[{targets[0]}], qubits[{targets[1]}]))")
            elif name == "cz":
                lines.append(f"circuit.append(cirq.CZ(qubits[{targets[0]}], qubits[{targets[1]}]))")
            elif name == "swap":
                lines.append(f"circuit.append(cirq.SWAP(qubits[{targets[0]}], qubits[{targets[1]}]))")
            elif name in ("ccx", "toffoli"):
                lines.append(f"circuit.append(cirq.TOFFOLI(qubits[{targets[0]}], qubits[{targets[1]}], qubits[{targets[2]}]))")
            elif name in ("p", "u1", "phase"):
                lines.append(f"circuit.append(cirq.rz({repr(angle)})(qubits[{targets[0]}]))")
            elif name == "cp":
                lines.append(f"circuit.append(cirq.CZPowGate(exponent={repr(angle)} / np.pi)(qubits[{targets[0]}], qubits[{targets[1]}]))")
            elif name == "crx":
                lines.append(f"circuit.append(cirq.ControlledGate(cirq.rx({repr(angle)}))(qubits[{targets[0]}], qubits[{targets[1]}]))")
            elif name == "cry":
                lines.append(f"circuit.append(cirq.ControlledGate(cirq.ry({repr(angle)}))(qubits[{targets[0]}], qubits[{targets[1]}]))")
            elif name == "crz":
                lines.append(f"circuit.append(cirq.ControlledGate(cirq.rz({repr(angle)}))(qubits[{targets[0]}], qubits[{targets[1]}]))")
            elif name == "ch":
                lines.append(f"circuit.append(cirq.ControlledGate(cirq.H)(qubits[{targets[0]}], qubits[{targets[1]}]))")
            elif name in ("sdg", "s_dagger"):
                lines.append(f"circuit.append(cirq.S(qubits[{targets[0]}])**-1)")
            elif name in ("tdg", "t_dagger"):
                lines.append(f"circuit.append(cirq.T(qubits[{targets[0]}])**-1)")
            elif name == "sx":
                lines.append(f"circuit.append(cirq.XPowGate(exponent=0.5)(qubits[{targets[0]}]))")
            elif name == "id":
                lines.append(f"circuit.append(cirq.I(qubits[{targets[0]}]))")
            elif name == "reset":
                lines.append(f"circuit.append(cirq.reset(qubits[{targets[0]}]))")
            elif name == "barrier":
                pass
            else:
                raise ValueError(f"Unsupported Cirq gate: '{name}'")

        if circuit.measure:
            lines.append("")
            lines.append("# Measurement and Simulation")
            lines.append("for i in range(len(qubits)):")
            lines.append("    circuit.append(cirq.measure(qubits[i], key=f'q{i}'))")
            lines.append("")
            lines.append("simulator = cirq.Simulator()")
            lines.append(f"result = simulator.run(circuit, repetitions={circuit.shots})")
            lines.append("print(result)")
        else:
            lines.append("")
            lines.append("# Statevector Simulation")
            lines.append("simulator = cirq.Simulator()")
            lines.append("result = simulator.simulate(circuit)")
            lines.append("print('Statevector:', result.state_vector())")

        return "\n".join(lines)
