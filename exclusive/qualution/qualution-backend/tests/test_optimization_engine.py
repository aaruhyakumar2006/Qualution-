import pytest
import math
from app.optimization.engine import (
    CancelSelfInversePass,
    CombineRotationsPass,
    RemoveIdentityRotationsPass,
    optimization_engine,
)
from app.schemas.circuit import GateRequest

def test_cancel_self_inverse_pass():
    gates = [
        GateRequest(gate="h", targets=[0]),
        GateRequest(gate="h", targets=[0]),
        GateRequest(gate="x", targets=[1]),
        GateRequest(gate="x", targets=[1]),
        GateRequest(gate="cx", targets=[0, 1]),
        GateRequest(gate="cx", targets=[0, 1]),
        GateRequest(gate="swap", targets=[0, 1]),
        GateRequest(gate="swap", targets=[0, 1]),
    ]
    p = CancelSelfInversePass()
    new_gates, changed, explanations = p.run(gates)
    assert changed is True
    assert len(new_gates) == 0
    assert len(explanations) == 4

def test_combine_rotations_pass():
    gates = [
        GateRequest(gate="rx", targets=[0], angle=math.pi / 4),
        GateRequest(gate="rx", targets=[0], angle=math.pi / 4),
        GateRequest(gate="ry", targets=[1], angle=1.0),
        GateRequest(gate="ry", targets=[1], angle=2.0),
        GateRequest(gate="rz", targets=[0], angle=0.5),
        GateRequest(gate="rz", targets=[0], angle=0.5),
    ]
    p = CombineRotationsPass()
    new_gates, changed, explanations = p.run(gates)
    assert changed is True
    assert len(new_gates) == 3
    assert new_gates[0].angle is not None
    assert new_gates[1].angle is not None
    assert new_gates[2].angle is not None
    assert math.isclose(new_gates[0].angle, math.pi / 2, rel_tol=1e-5)
    assert math.isclose(new_gates[1].angle, 3.0, rel_tol=1e-5)
    assert math.isclose(new_gates[2].angle, 1.0, rel_tol=1e-5)

def test_remove_identity_rotations_pass():
    gates = [
        GateRequest(gate="rx", targets=[0], angle=0.0),
        GateRequest(gate="ry", targets=[0], angle=2.0 * math.pi),
        GateRequest(gate="rz", targets=[0], angle=1.5),
    ]
    p = RemoveIdentityRotationsPass()
    new_gates, changed, explanations = p.run(gates)
    assert changed is True
    assert len(new_gates) == 1
    assert new_gates[0].gate == "rz"
    assert new_gates[0].angle == 1.5

def test_multi_pass_iterative_engine():
    # RX(pi) followed by RX(pi) combines to RX(2pi) -> removed by identity pass
    gates = [
        GateRequest(gate="rx", targets=[0], angle=math.pi),
        GateRequest(gate="rx", targets=[0], angle=math.pi),
    ]
    new_gates, changed, passes, explanations = optimization_engine.optimize_gates(gates)
    assert changed is True
    assert len(new_gates) == 0
    assert "combine_rotations" in passes
    assert "remove_identity_rotations" in passes

def test_non_adjacent_gates_do_not_cancel():
    # H -> X -> H must NOT cancel the H gates because X intervenes
    gates = [
        GateRequest(gate="h", targets=[0]),
        GateRequest(gate="x", targets=[0]),
        GateRequest(gate="h", targets=[0]),
    ]
    new_gates, changed, passes, explanations = optimization_engine.optimize_gates(gates)
    assert changed is False
    assert len(new_gates) == 3
