import pytest
import os
from app.codeparse.qiskit_parser import QiskitCodeParser
from app.codeparse.pennylane_parser import PennyLaneCodeParser

def test_security_os_system_never_executed():
    sentinel_file = "d:/DELUSION AI/qualution-backend/security_test_sentinel.txt"
    if os.path.exists(sentinel_file):
        os.remove(sentinel_file)

    malicious_code = f"""
import os
os.system("echo hacked > '{sentinel_file}'")
from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.h(0)
"""
    parser = QiskitCodeParser()
    # Parser must process AST without executing os.system
    circuit, warnings = parser.parse(malicious_code)
    assert circuit.qubits == 1
    assert len(circuit.gates) == 1
    assert not os.path.exists(sentinel_file), "Security breach: os.system was executed during parsing!"

def test_security_eval_and_exec_rejected():
    code_eval = """
from qiskit import QuantumCircuit
qc = QuantumCircuit(eval("1 + 1"))
qc.h(0)
"""
    parser = QiskitCodeParser()
    with pytest.raises(ValueError) as exc:
        parser.parse(code_eval)
    assert "Dynamic or unsupported expression" in str(exc.value)

def test_security_subprocess_never_executed():
    code_subp = """
import subprocess
subprocess.run(["cmd.exe", "/c", "echo test"])
import pennylane as qml
dev = qml.device("default.qubit", wires=1)
@qml.qnode(dev)
def circuit():
    qml.Hadamard(wires=0)
    return qml.state()
"""
    parser = PennyLaneCodeParser()
    circuit, warnings = parser.parse(code_subp)
    assert circuit.qubits == 1
    assert len(circuit.gates) == 1
