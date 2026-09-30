import pytest
import math
import numpy as np
from app.codegen.pennylane_generator import PennyLaneCodeGenerator
from app.schemas.circuit import CircuitRequest, GateRequest

def test_pennylane_codegen_all_gates_and_syntax():
    generator = PennyLaneCodeGenerator()
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="x", targets=[1]),
            GateRequest(gate="y", targets=[0]),
            GateRequest(gate="z", targets=[1]),
            GateRequest(gate="s", targets=[0]),
            GateRequest(gate="t", targets=[1]),
            GateRequest(gate="rx", targets=[0], angle=1.2345),
            GateRequest(gate="ry", targets=[1], angle=0.5432),
            GateRequest(gate="rz", targets=[0], angle=2.3456),
            GateRequest(gate="cx", targets=[0, 1]),
            GateRequest(gate="cz", targets=[0, 1]),
            GateRequest(gate="swap", targets=[0, 1]),
        ],
        measure=True,
        shots=500
    )
    code = generator.generate(circuit)

    # 1. Verify code structure
    assert "import pennylane as qml" in code
    assert 'dev = qml.device("default.qubit", wires=2)' in code
    assert "@qml.qnode(dev, shots=500)" in code
    assert "qml.Hadamard(wires=0)" in code
    assert "qml.RX(1.2345, wires=0)" in code
    assert "qml.CNOT(wires=[0, 1])" in code
    assert "return qml.counts()" in code

    # 2. Verify syntactically valid Python
    compiled = compile(code, "<pennylane_gen>", "exec")
    assert compiled is not None

def test_pennylane_codegen_execution_agreement():
    generator = PennyLaneCodeGenerator()
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=True,
        shots=1000
    )
    code = generator.generate(circuit)

    # Execute generated code
    ns = {}
    exec(code, ns)
    assert "counts" in ns
    counts = ns["counts"]
    assert "01" not in counts
    assert "10" not in counts
    assert "00" in counts and "11" in counts
    assert 400 <= counts["00"] <= 600
    assert 400 <= counts["11"] <= 600

def test_pennylane_codegen_statevector_mode():
    generator = PennyLaneCodeGenerator()
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=False
    )
    code = generator.generate(circuit)

    assert "return qml.state()" in code

    ns = {}
    exec(code, ns)
    assert "state" in ns
    state = ns["state"]
    probs = np.abs(state) ** 2
    assert math.isclose(probs[0], 0.5, abs_tol=1e-5)
    assert math.isclose(probs[1], 0.5, abs_tol=1e-5)
