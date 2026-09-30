from typing import Dict, Any, List, Optional
from qiskit import QuantumCircuit
from qiskit.compiler import transpile
from qiskit.transpiler import CouplingMap
from app.schemas.circuit import CircuitRequest

def to_qiskit_circuit(circuit: CircuitRequest) -> QuantumCircuit:
    """
    Convert a framework-independent Qualution CircuitRequest into a Qiskit QuantumCircuit.
    Robust against malformed targets, out-of-bounds indices, duplicate targets, and None angles.
    """
    num_qubits = max(circuit.qubits, 1)
    num_clbits = max(circuit.classical_bits, 0)
    qc = QuantumCircuit(num_qubits, num_clbits)

    for gate_req in circuit.gates:
        gate_name = gate_req.gate.lower()
        raw_targets = gate_req.targets or []
        # Filter and validate targets: must be integer and within [0, num_qubits - 1]
        targets = [int(t) for t in raw_targets if isinstance(t, (int, float)) and 0 <= int(t) < num_qubits]
        angle = float(gate_req.angle) if gate_req.angle is not None else 0.0

        try:
            if gate_name == "h":
                if len(targets) >= 1:
                    qc.h(targets[0])
            elif gate_name == "x":
                if len(targets) >= 1:
                    qc.x(targets[0])
            elif gate_name == "y":
                if len(targets) >= 1:
                    qc.y(targets[0])
            elif gate_name == "z":
                if len(targets) >= 1:
                    qc.z(targets[0])
            elif gate_name == "s":
                if len(targets) >= 1:
                    qc.s(targets[0])
            elif gate_name == "t":
                if len(targets) >= 1:
                    qc.t(targets[0])
            elif gate_name == "rx":
                if len(targets) >= 1:
                    qc.rx(angle, targets[0])
            elif gate_name == "ry":
                if len(targets) >= 1:
                    qc.ry(angle, targets[0])
            elif gate_name == "rz":
                if len(targets) >= 1:
                    qc.rz(angle, targets[0])
            elif gate_name == "cx":
                if len(targets) >= 2 and targets[0] != targets[1]:
                    qc.cx(targets[0], targets[1])
            elif gate_name == "cz":
                if len(targets) >= 2 and targets[0] != targets[1]:
                    qc.cz(targets[0], targets[1])
            elif gate_name == "swap":
                if len(targets) >= 2 and targets[0] != targets[1]:
                    qc.swap(targets[0], targets[1])
            elif gate_name == "ccx":
                if len(targets) >= 3 and len(set(targets[:3])) == 3:
                    qc.ccx(targets[0], targets[1], targets[2])
            elif gate_name == "p":
                if len(targets) >= 1:
                    qc.p(angle, targets[0])
            elif gate_name == "cp":
                if len(targets) >= 2 and targets[0] != targets[1]:
                    qc.cp(angle, targets[0], targets[1])
            elif gate_name == "crx":
                if len(targets) >= 2 and targets[0] != targets[1]:
                    qc.crx(angle, targets[0], targets[1])
            elif gate_name == "cry":
                if len(targets) >= 2 and targets[0] != targets[1]:
                    qc.cry(angle, targets[0], targets[1])
            elif gate_name == "crz":
                if len(targets) >= 2 and targets[0] != targets[1]:
                    qc.crz(angle, targets[0], targets[1])
            elif gate_name == "ch":
                if len(targets) >= 2 and targets[0] != targets[1]:
                    qc.ch(targets[0], targets[1])
            elif gate_name == "tdg":
                if len(targets) >= 1:
                    qc.tdg(targets[0])
            elif gate_name == "sdg":
                if len(targets) >= 1:
                    qc.sdg(targets[0])
            elif gate_name == "sx":
                if len(targets) >= 1:
                    qc.sx(targets[0])
            elif gate_name == "mcx":
                if len(targets) >= 2 and len(set(targets)) == len(targets):
                    qc.mcx(targets[:-1], targets[-1])
            elif gate_name == "id":
                if len(targets) >= 1:
                    try:
                        qc.id(targets[0])
                    except AttributeError:
                        qc.i(targets[0])
            elif gate_name == "barrier":
                valid_barriers = [t for t in targets if t < num_qubits]
                if valid_barriers:
                    qc.barrier(valid_barriers)
            elif gate_name == "reset":
                if len(targets) >= 1:
                    qc.reset(targets[0])
            elif gate_name == "measure":
                if num_clbits > 0 and len(targets) >= 1:
                    cbit = targets[0] if targets[0] < num_clbits else 0
                    qc.measure(targets[0], cbit)
            elif gate_name in ["control", "if", "for", "while", "box", "phase_disk", "custom"]:
                pass
            else:
                pass
        except Exception:
            # Skip invalid / failing instructions cleanly without raising 500 error
            pass

    if circuit.measure and num_clbits > 0:
        num_measure = min(num_qubits, num_clbits)
        for i in range(num_measure):
            try:
                qc.measure(i, i)
            except Exception:
                pass

    return qc

def get_qiskit_debug_info(qc: QuantumCircuit) -> Dict[str, Any]:
    """
    Extract a JSON-serializable debug representation of a Qiskit QuantumCircuit.
    """
    operations: List[Dict[str, Any]] = []
    measurements: List[Dict[str, Any]] = []

    for instruction in qc.data:
        op_name = instruction.operation.name
        q_indices = [qc.find_bit(q).index for q in instruction.qubits]
        c_indices = [qc.find_bit(c).index for c in instruction.clbits]

        if op_name == "measure":
            for q_idx, c_idx in zip(q_indices, c_indices):
                measurements.append({"qubit": q_idx, "classical_bit": c_idx})
        else:
            op_dict: Dict[str, Any] = {"name": op_name, "qubits": q_indices}
            if instruction.operation.params:
                op_dict["params"] = [float(p) for p in instruction.operation.params]
            operations.append(op_dict)

    return {
        "backend": "qiskit",
        "qubits": qc.num_qubits,
        "classical_bits": qc.num_clbits,
        "operations": operations,
        "measurements": measurements,
    }

def get_topology_coupling_map(topology: str) -> Optional[CouplingMap]:
    if topology == "Linear (5Q)":
        return CouplingMap.from_line(5)
    elif topology == "Cross (5Q)":
        edges = [[0, 1], [0, 2], [0, 3], [0, 4]]
        return CouplingMap(edges)
    elif topology == "Heavy-Hex (16Q)":
        edges = [
            [0,1], [1,2], [2,3], [2,4], [4,5], [5,6], [5,7], [7,8], [8,9], [8,10],
            [1,11], [11,12], [4,13], [13,14], [7,15]
        ]
        return CouplingMap(edges)
    return None

def transpile_circuit(qc: QuantumCircuit, topology: str) -> QuantumCircuit:
    cmap = get_topology_coupling_map(topology)
    if not cmap:
        return qc
    return transpile(qc, coupling_map=cmap, optimization_level=1)

def get_transpiled_instructions(qc: QuantumCircuit) -> List[Dict[str, Any]]:
    instructions = []
    for instruction in qc.data:
        op_name = instruction.operation.name
        if op_name in ['measure', 'barrier']:
            continue
        q_indices = [qc.find_bit(q).index for q in instruction.qubits]
        inst = {
            "gate": op_name,
            "targets": q_indices
        }
        if instruction.operation.params:
            inst["angle"] = float(instruction.operation.params[0])
        instructions.append(inst)
    return instructions
