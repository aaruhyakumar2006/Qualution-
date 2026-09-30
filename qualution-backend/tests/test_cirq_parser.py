import pytest
import math
import numpy as np
from app.codeparse.cirq_parser import CirqCodeParser
from app.codegen.cirq_generator import CirqCodeGenerator
from app.schemas.circuit import CircuitRequest, GateRequest

def test_cirq_parser_bell_state():
    code = """
import cirq

qubits = cirq.LineQubit.range(2)
circuit = cirq.Circuit()

circuit.append(cirq.H(qubits[0]))
circuit.append(cirq.CNOT(qubits[0], qubits[1]))

circuit.append([cirq.measure(qubits[0]), cirq.measure(qubits[1])])

simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions=1000)
"""
    parser = CirqCodeParser()
    req, warnings = parser.parse(code)

    assert req.qubits == 2
    assert req.classical_bits == 2
    assert req.measure is True
    assert req.shots == 1000
    assert len(req.gates) == 2
    assert req.gates[0].gate == "h"
    assert req.gates[0].targets == [0]
    assert req.gates[1].gate == "cx"
    assert req.gates[1].targets == [0, 1]

def test_cirq_parser_all_gates_and_rotations():
    code = """
import cirq
import numpy as np

qubits = [cirq.LineQubit(i) for i in range(2)]
circuit = cirq.Circuit()

circuit.append(cirq.H(qubits[0]))
circuit.append(cirq.X(qubits[1]))
circuit.append(cirq.Y(qubits[0]))
circuit.append(cirq.Z(qubits[1]))
circuit.append(cirq.S(qubits[0]))
circuit.append(cirq.T(qubits[1]))
circuit.append(cirq.rx(np.pi / 2)(qubits[0]))
circuit.append(cirq.ry(1.5)(qubits[1]))
circuit.append(cirq.rz(np.pi / 4)(qubits[0]))
circuit.append(cirq.CNOT(qubits[0], qubits[1]))
circuit.append(cirq.CZ(qubits[0], qubits[1]))
circuit.append(cirq.SWAP(qubits[0], qubits[1]))
"""
    parser = CirqCodeParser()
    req, warnings = parser.parse(code)

    assert req.qubits == 2
    assert req.measure is False
    assert len(req.gates) == 12

    assert req.gates[6].gate == "rx"
    assert math.isclose(req.gates[6].angle, np.pi / 2, abs_tol=1e-5)
    assert req.gates[7].gate == "ry"
    assert math.isclose(req.gates[7].angle, 1.5, abs_tol=1e-5)
    assert req.gates[8].gate == "rz"
    assert math.isclose(req.gates[8].angle, np.pi / 4, abs_tol=1e-5)

def test_cirq_codegen_and_parser_roundtrip():
    original_circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1]),
            GateRequest(gate="rx", targets=[0], angle=1.570796),
        ],
        measure=True,
        shots=2048
    )

    generator = CirqCodeGenerator()
    generated_code = generator.generate(original_circuit)

    parser = CirqCodeParser()
    parsed_circuit, warnings = parser.parse(generated_code)

    assert parsed_circuit.qubits == original_circuit.qubits
    assert parsed_circuit.classical_bits == original_circuit.classical_bits
    assert parsed_circuit.measure == original_circuit.measure
    assert parsed_circuit.shots == original_circuit.shots
    assert len(parsed_circuit.gates) == len(original_circuit.gates)

    for g_orig, g_parsed in zip(original_circuit.gates, parsed_circuit.gates):
        assert g_orig.gate == g_parsed.gate
        assert g_orig.targets == g_parsed.targets
        if g_orig.angle is not None:
            assert math.isclose(g_orig.angle, g_parsed.angle, abs_tol=1e-4)

def test_cirq_parser_security_no_code_execution():
    malicious_code = """
import os
os.system("echo malicious")
qubits = cirq.LineQubit.range(2)
"""
    parser = CirqCodeParser()
    # Parsing AST must not execute os.system
    req, warnings = parser.parse(malicious_code)
    assert req.qubits == 2
