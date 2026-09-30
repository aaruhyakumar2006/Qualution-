import pytest
from app.codegen.cirq_generator import CirqCodeGenerator
from app.schemas.circuit import CircuitRequest, GateRequest

def test_cirq_codegen_all_gates():
    generator = CirqCodeGenerator()
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

    assert "import cirq" in code
    assert "cirq.LineQubit(i)" in code
    assert "circuit.append(cirq.H(qubits[0]))" in code
    assert "circuit.append(cirq.X(qubits[1]))" in code
    assert "circuit.append(cirq.rx(1.2345)(qubits[0]))" in code
    assert "circuit.append(cirq.CNOT(qubits[0], qubits[1]))" in code
    assert "circuit.append(cirq.CZ(qubits[0], qubits[1]))" in code
    assert "circuit.append(cirq.SWAP(qubits[0], qubits[1]))" in code
    assert "repetitions=500" in code

    # Verify compiles to valid Python bytecode
    compiled = compile(code, "<cirq_gen>", "exec")
    assert compiled is not None

def test_cirq_codegen_statevector_mode():
    generator = CirqCodeGenerator()
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=False
    )
    code = generator.generate(circuit)
    assert "simulator.simulate(circuit)" in code
    assert "Statevector:" in code
