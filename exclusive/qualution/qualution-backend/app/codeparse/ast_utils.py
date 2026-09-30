import ast
import math
from typing import Any, Optional, Union

ALLOWED_CONSTANTS = {
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau if hasattr(math, "tau") else 2 * math.pi,
}

def safe_eval_ast_number(node: ast.AST) -> Union[int, float]:
    """
    Safely evaluate simple numeric expressions (numbers, math.pi, basic arithmetic)
    directly from an AST node without using eval() or exec().
    """
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Expected numeric literal, got {type(node.value).__name__}: {node.value!r}")

    elif isinstance(node, ast.Name):
        if node.id in ALLOWED_CONSTANTS:
            return ALLOWED_CONSTANTS[node.id]
        raise ValueError(f"Undefined or disallowed variable: '{node.id}'")

    elif isinstance(node, ast.Attribute):
        # Recognize math.pi, np.pi, numpy.pi
        if isinstance(node.value, ast.Name) and node.value.id in {"math", "np", "numpy"}:
            if node.attr in ALLOWED_CONSTANTS:
                return ALLOWED_CONSTANTS[node.attr]
        raise ValueError(f"Disallowed attribute access: '{ast.unparse(node) if hasattr(ast, 'unparse') else 'attribute'}'")

    elif isinstance(node, ast.UnaryOp):
        operand = safe_eval_ast_number(node.operand)
        if isinstance(node.op, ast.USub):
            return -operand
        elif isinstance(node.op, ast.UAdd):
            return +operand
        raise ValueError(f"Unsupported unary operator: {type(node.op).__name__}")

    elif isinstance(node, ast.BinOp):
        left = safe_eval_ast_number(node.left)
        right = safe_eval_ast_number(node.right)
        if isinstance(node.op, ast.Add):
            return left + right
        elif isinstance(node.op, ast.Sub):
            return left - right
        elif isinstance(node.op, ast.Mult):
            return left * right
        elif isinstance(node.op, ast.Div):
            if right == 0:
                raise ValueError("Division by zero in angle expression")
            return left / right
        elif isinstance(node.op, ast.FloorDiv):
            if right == 0:
                raise ValueError("Division by zero in angle expression")
            return left // right
        elif isinstance(node.op, ast.Pow):
            return left ** right
        elif isinstance(node.op, ast.Mod):
            return left % right
        raise ValueError(f"Unsupported binary operator: {type(node.op).__name__}")

    raise ValueError(f"Dynamic or unsupported expression node: {type(node).__name__}")
