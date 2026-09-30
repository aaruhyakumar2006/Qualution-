from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.schemas.circuit import CircuitRequest
from app.schemas.metrics import CircuitMetricsResponse
from app.schemas.circuit_run import CircuitRunRequest, CircuitRunResponse
from app.optimization.models import OptimizationResponse
from app.optimization.service import optimization_service
from app.services.qiskit_service import to_qiskit_circuit, get_qiskit_debug_info
from app.services.circuit_metrics_service import circuit_metrics_service
from app.services.circuit_run_service import circuit_run_service
from app.services.queue_service import queue_service, JobStatus, JobState
from pydantic import BaseModel

router = APIRouter(prefix="/circuits", tags=["Circuits"])

class AsyncJobResponse(BaseModel):
    job_id: str
    status: JobStatus

def _run_unified_task(job_id: str, request: CircuitRunRequest):
    queue_service.update_job_status(job_id, JobStatus.RUNNING)
    try:
        result = circuit_run_service.run_circuit_workflow(request)
        queue_service.update_job_status(job_id, JobStatus.COMPLETED, result=result.model_dump())
    except Exception as e:
        queue_service.update_job_status(job_id, JobStatus.FAILED, error=str(e))


@router.post("/validate")
def validate_circuit(circuit: CircuitRequest):
    return {
        "valid": True,
        "qubits": circuit.qubits,
        "classical_bits": circuit.classical_bits,
        "gate_count": len(circuit.gates),
        "measure": circuit.measure,
        "shots": circuit.shots
    }

@router.post("/convert/qiskit")
def convert_to_qiskit(circuit: CircuitRequest):
    qc = to_qiskit_circuit(circuit)
    return get_qiskit_debug_info(qc)

@router.post("/analyze", response_model=CircuitMetricsResponse)
@router.post("/metrics", response_model=CircuitMetricsResponse)
def analyze_circuit_endpoint(circuit: CircuitRequest):
    """
    Analyze circuit structure, depth, gate breakdown, and theoretical statevector memory footprint.
    """
    metrics = circuit_metrics_service.analyze_circuit(circuit)
    return CircuitMetricsResponse(**metrics)

@router.post("/optimize", response_model=OptimizationResponse)
def optimize_circuit_endpoint(circuit: CircuitRequest):
    """
    Apply deterministic optimization rewrite passes, verify mathematical equivalence, and quantify improvements.
    """
    return optimization_service.optimize_circuit(circuit)

@router.post("/run", response_model=CircuitRunResponse)
def run_unified_circuit_workflow(request: CircuitRunRequest):
    """
    Execute unified circuit workflow: analysis, auto-routing or direct backend dispatch,
    simulation, statevector calculation, and educational visualizations in a single call.
    """
    try:
        return circuit_run_service.run_circuit_workflow(request)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow execution error: {str(e)}")
