import pytest
import math
from app.codegen.qiskit_generator import QiskitCodeGenerator
from app.schemas.circuit import CircuitRequest, GateRequest

def test_qiskit_codegen_all_gates_and_syntax():
    generator = QiskitCodeGenerator()
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
    assert "from qiskit import QuantumCircuit" in code
    assert "from qiskit_aer import AerSimulator" in code
    assert "qc = QuantumCircuit(2, 2)" in code
    assert "qc.h(0)" in code
    assert "qc.rx(1.2345, 0)" in code
    assert "qc.cx(0, 1)" in code
    assert "qc.measure(0, 0)" in code
    assert "qc.measure(1, 1)" in code
    assert "shots=500" in code

    # 2. Verify syntactically valid Python
    compiled = compile(code, "<qiskit_gen>", "exec")
    assert compiled is not None

def test_qiskit_codegen_execution_agreement():
    generator = QiskitCodeGenerator()
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

    # Execute generated code in clean namespace
    ns = {}
    exec(code, ns)
    assert "counts" in ns
    counts = ns["counts"]
    assert "01" not in counts
    assert "10" not in counts
    assert "00" in counts and "11" in counts
    assert 400 <= counts["00"] <= 600
    assert 400 <= counts["11"] <= 600

def test_qiskit_codegen_statevector_mode():
    generator = QiskitCodeGenerator()
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=False
    )
    code = generator.generate(circuit)

    assert "from qiskit.quantum_info import Statevector" in code
    assert "Statevector(qc)" in code

    ns = {}
    exec(code, ns)
    assert "probabilities" in ns
    probs = ns["probabilities"]
    assert math.isclose(probs["0"], 0.5, abs_tol=1e-5)
    assert math.isclose(probs["1"], 0.5, abs_tol=1e-5)
