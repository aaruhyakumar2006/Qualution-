from fastapi import APIRouter, HTTPException, Path
from typing import Optional
from pydantic import BaseModel
from app.schemas.circuit import CircuitRequest
from app.codegen.models import CodeGenerationResponse
from app.codegen.service import codegen_service

router = APIRouter(prefix="/codegen", tags=["Code Generation"])

class GenericCodegenRequest(BaseModel):
    circuit: CircuitRequest
    target: Optional[str] = "qiskit"
    framework: Optional[str] = None

@router.post("/generate", response_model=CodeGenerationResponse)
def generate_code_generic(req: GenericCodegenRequest):
    fw = req.framework or req.target or "qiskit"
    try:
        return codegen_service.generate_code(fw, req.circuit)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation error: {str(e)}")

@router.post("/{framework}", response_model=CodeGenerationResponse)
def generate_framework_code(
    circuit: CircuitRequest,
    framework: str = Path(..., description="Target framework ('qiskit', 'pennylane', 'cirq')")
):
    """
    Generate clean, idiomatic, executable Python source code for the requested quantum framework.
    """
    try:
        return codegen_service.generate_code(framework, circuit)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation error: {str(e)}")
