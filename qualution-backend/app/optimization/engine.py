import math
from abc import ABC, abstractmethod
from typing import List, Tuple, Optional
from app.schemas.circuit import GateRequest

SELF_INVERSE_GATES = {"h", "x", "y", "z", "cx", "cz", "swap"}
ROTATION_GATES = {"rx", "ry", "rz", "p"}

def find_next_interacting_gate(gates: List[GateRequest], i: int) -> Tuple[int, Optional[GateRequest]]:
    """
    Find the next gate j > i that interacts with the target qubits of gates[i].
    Returns (j, gate_j) if an interacting gate is found and can commute with all intervening gates;
    returns (-1, None) if no interacting gate exists or if blocked by a non-commuting gate / barrier.
    """
    g1 = gates[i]
    targets1 = set(g1.targets)

    for j in range(i + 1, len(gates)):
        gj = gates[j]
        name_j = gj.gate.lower()

        # Barriers block all commutations across their target wires
        if name_j == "barrier":
            barrier_targets = set(gj.targets) if gj.targets else targets1
            if targets1 & barrier_targets:
                return -1, None

        targets_j = set(gj.targets)
        overlap = targets1 & targets_j

        if overlap:
            # Found the first gate that shares qubits with g1
            return j, gj

    return -1, None

class OptimizationPass(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def run(self, gates: List[GateRequest]) -> Tuple[List[GateRequest], bool, List[str]]:
        """
        Execute optimization pass.
        Returns: (new_gates, changed, explanations)
        """
        pass

class CancelSelfInversePass(OptimizationPass):
    @property
    def name(self) -> str:
        return "cancel_self_inverse"

    def run(self, gates: List[GateRequest]) -> Tuple[List[GateRequest], bool, List[str]]:
        working = list(gates)
        explanations: List[str] = []
        changed = False
        i = 0

        while i < len(working):
            g1 = working[i]
            name1 = g1.gate.lower()

            if name1 in SELF_INVERSE_GATES:
                j, g2 = find_next_interacting_gate(working, i)
                if j != -1 and g2 is not None:
                    name2 = g2.gate.lower()
                    if name1 == name2 and g1.targets == g2.targets:
                        explanations.append(
                            f"Cancelled adjacent self-inverse {name1.upper()} gates on qubit(s) {g1.targets} to identity."
                        )
                        # Remove g2 first (higher index), then g1
                        working.pop(j)
                        working.pop(i)
                        changed = True
                        continue

            i += 1

        return working, changed, explanations

class CombineRotationsPass(OptimizationPass):
    @property
    def name(self) -> str:
        return "combine_rotations"

    def run(self, gates: List[GateRequest]) -> Tuple[List[GateRequest], bool, List[str]]:
        working = list(gates)
        explanations: List[str] = []
        changed = False
        i = 0

        while i < len(working):
            g1 = working[i]
            name1 = g1.gate.lower()

            if name1 in ROTATION_GATES and g1.angle is not None:
                j, g2 = find_next_interacting_gate(working, i)
                if j != -1 and g2 is not None:
                    name2 = g2.gate.lower()
                    if name1 == name2 and g1.targets == g2.targets and g2.angle is not None:
                        combined_angle = g1.angle + g2.angle
                        norm_angle = (combined_angle + math.pi) % (2.0 * math.pi) - math.pi

                        explanations.append(
                            f"Combined consecutive {name1.upper()} rotations on qubit {g1.targets[0]} "
                            f"({g1.angle:.4f} rad + {g2.angle:.4f} rad = {norm_angle:.4f} rad)."
                        )
                        working[i] = GateRequest(
                            gate=g1.gate,
                            targets=g1.targets,
                            angle=norm_angle,
                            id=g1.id,
                            column=g1.column,
                        )
                        working.pop(j)
                        changed = True
                        continue

            i += 1

        return working, changed, explanations

class CliffordMergePass(OptimizationPass):
    @property
    def name(self) -> str:
        return "clifford_merge"

    def run(self, gates: List[GateRequest]) -> Tuple[List[GateRequest], bool, List[str]]:
        working = list(gates)
        explanations: List[str] = []
        changed = False
        i = 0

        while i < len(working):
            g1 = working[i]
            name1 = g1.gate.lower()

            if name1 in {"s", "t"}:
                j, g2 = find_next_interacting_gate(working, i)
                if j != -1 and g2 is not None:
                    name2 = g2.gate.lower()
                    if g1.targets == g2.targets:
                        if name1 == "s" and name2 == "s":
                            explanations.append(
                                f"Merged adjacent S gates on qubit {g1.targets[0]} into Z gate (S² = Z)."
                            )
                            working[i] = GateRequest(
                                gate="z",
                                targets=g1.targets,
                                id=g1.id,
                                column=g1.column,
                            )
                            working.pop(j)
                            changed = True
                            continue
                        elif name1 == "t" and name2 == "t":
                            explanations.append(
                                f"Merged adjacent T gates on qubit {g1.targets[0]} into S gate (T² = S)."
                            )
                            working[i] = GateRequest(
                                gate="s",
                                targets=g1.targets,
                                id=g1.id,
                                column=g1.column,
                            )
                            working.pop(j)
                            changed = True
                            continue

            i += 1

        return working, changed, explanations

class RemoveIdentityPass(OptimizationPass):
    @property
    def name(self) -> str:
        return "remove_identity_rotations"

    def run(self, gates: List[GateRequest]) -> Tuple[List[GateRequest], bool, List[str]]:
        new_gates: List[GateRequest] = []
        explanations: List[str] = []
        changed = False

        for g in gates:
            name = g.gate.lower()
            if name == "id":
                explanations.append(f"Removed identity gate I on qubit {g.targets[0]}.")
                changed = True
                continue

            if name in ROTATION_GATES and g.angle is not None:
                norm_angle = (g.angle + math.pi) % (2.0 * math.pi) - math.pi
                if math.isclose(norm_angle, 0.0, abs_tol=1e-5):
                    explanations.append(
                        f"Removed identity rotation {name.upper()}({g.angle:.4f} rad) on qubit {g.targets[0]}."
                    )
                    changed = True
                    continue

            new_gates.append(g)

        return new_gates, changed, explanations

RemoveIdentityRotationsPass = RemoveIdentityPass

class OptimizationEngine:
    def __init__(self):
        self.passes: List[OptimizationPass] = [
            RemoveIdentityPass(),
            CancelSelfInversePass(),
            CombineRotationsPass(),
            CliffordMergePass(),
        ]

    def optimize_gates(
        self, gates: List[GateRequest], max_iterations: int = 10
    ) -> Tuple[List[GateRequest], bool, List[str], List[str]]:
        """
        Iteratively run optimization passes until a fixed point is reached or max_iterations exceeded.
        Returns: (optimized_gates, any_changed, passes_applied, all_explanations)
        """
        current_gates = list(gates)
        any_changed = False
        passes_applied_set = set()
        all_explanations: List[str] = []

        for _ in range(max_iterations):
            iteration_changed = False
            for opt_pass in self.passes:
                new_gates, pass_changed, pass_explanations = opt_pass.run(current_gates)
                if pass_changed:
                    current_gates = new_gates
                    iteration_changed = True
                    any_changed = True
                    passes_applied_set.add(opt_pass.name)
                    all_explanations.extend(pass_explanations)

            if not iteration_changed:
                break

        return current_gates, any_changed, list(passes_applied_set), all_explanations

optimization_engine = OptimizationEngine()
