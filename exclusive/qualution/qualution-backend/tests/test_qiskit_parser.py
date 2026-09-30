import pytest
import math
from app.codeparse.qiskit_parser import QiskitCodeParser

def test_qiskit_parser_single_qubit_gates():
    code = """
from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.h(0)
qc.x(0)
qc.y(0)
qc.z(0)
qc.s(0)
qc.t(0)
"""
    parser = QiskitCodeParser()
    circuit, warnings = parser.parse(code)

    assert circuit.qubits == 1
    assert circuit.classical_bits == 0
    assert len(circuit.gates) == 6
    assert [g.gate for g in circuit.gates] == ["h", "x", "y", "z", "s", "t"]
    assert circuit.measure is False

def test_qiskit_parser_rotations_with_math_expressions():
    code = """
import math
from qiskit import QuantumCircuit

qc = QuantumCircuit(2)
qc.rx(math.pi / 2, 0)
qc.ry(3.14159265 / 4, 1)
qc.rz(-1.570796, 0)
"""
    parser = QiskitCodeParser()
    circuit, warnings = parser.parse(code)

    assert circuit.qubits == 2
    assert len(circuit.gates) == 3
    assert math.isclose(circuit.gates[0].angle, math.pi / 2, rel_tol=1e-5)
    assert math.isclose(circuit.gates[1].angle, 3.14159265 / 4, rel_tol=1e-5)
    assert math.isclose(circuit.gates[2].angle, -1.570796, rel_tol=1e-5)

def test_qiskit_parser_two_qubit_gates_and_ordering():
    code = """
from qiskit import QuantumCircuit
qc = QuantumCircuit(3, 3)
qc.cx(2, 0)  # Control is 2, target is 0
qc.cz(1, 2)
qc.swap(0, 1)
qc.measure(0, 0)
qc.measure(1, 1)
qc.measure(2, 2)
"""
    parser = QiskitCodeParser()
    circuit, warnings = parser.parse(code)

    assert circuit.qubits == 3
    assert circuit.classical_bits == 3
    assert len(circuit.gates) == 3
    assert circuit.gates[0].targets == [2, 0]  # Order preserved!
    assert circuit.gates[1].targets == [1, 2]
    assert circuit.gates[2].targets == [0, 1]
    assert circuit.measure is True

def test_qiskit_parser_unsupported_operation():
    code = """
from qiskit import QuantumCircuit
qc = QuantumCircuit(2)
qc.h(0)
qc.barrier()
"""
    parser = QiskitCodeParser()
    with pytest.raises(ValueError) as exc:
        parser.parse(code)
    assert "Unsupported Qiskit operation 'barrier'" in str(exc.value)

def test_qiskit_parser_missing_circuit():
    code = "x = 42\nprint(x)"
    parser = QiskitCodeParser()
    with pytest.raises(ValueError) as exc:
        parser.parse(code)
    assert "No valid 'QuantumCircuit(qubits, ...)'" in str(exc.value)

def test_qiskit_parser_toffoli_phase_and_subscripts():
    code = """
from qiskit import QuantumCircuit
qc = QuantumCircuit(3)
qc.h(q[0])
qc.p(1.5708, q[1])
qc.cnot(q[0], q[1])
qc.ccx(q[0], q[1], q[2])
qc.measure_all()
"""
    parser = QiskitCodeParser()
    circuit, warnings = parser.parse(code)
    assert circuit.qubits == 3
    assert len(circuit.gates) == 4
    assert circuit.gates[0].gate == "h"
    assert circuit.gates[0].targets == [0]
    assert circuit.gates[1].gate == "p"
    assert circuit.gates[1].targets == [1]
    assert circuit.gates[2].gate == "cx"
    assert circuit.gates[2].targets == [0, 1]
    assert circuit.gates[3].gate == "ccx"
    assert circuit.gates[3].targets == [0, 1, 2]
    assert circuit.measure is True

