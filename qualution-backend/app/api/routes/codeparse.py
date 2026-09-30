from fastapi import APIRouter, HTTPException, Path
from typing import Optional
from pydantic import BaseModel
from app.codeparse.models import ParseRequest, ParseResponse
from app.codeparse.service import codeparse_service

router = APIRouter(prefix="/codeparse", tags=["Code Parsing"])

class GenericParseRequest(BaseModel):
    code: str
    source: Optional[str] = "qiskit"
    framework: Optional[str] = None

@router.post("/parse", response_model=ParseResponse)
def parse_code_generic(req: GenericParseRequest):
    fw = req.framework or req.source or "qiskit"
    try:
        return codeparse_service.parse_code(fw, req.code)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code parsing error: {str(e)}")

@router.post("/{framework}", response_model=ParseResponse)
def parse_framework_code(
    request: ParseRequest,
    framework: str = Path(..., description="Framework identifier ('qiskit', 'pennylane', 'cirq')")
):
    """
    Parse supported Qiskit, PennyLane, or Cirq Python source code into a framework-independent Qualution CircuitRequest.
    """
    try:
        return codeparse_service.parse_code(framework, request.code)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code parsing error: {str(e)}")
