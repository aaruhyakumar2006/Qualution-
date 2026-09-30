from typing import Optional
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.schemas.circuit import CircuitRequest
from app.schemas.simulation import SimulationResponse
from app.schemas.result import StatevectorResponse
from app.schemas.timeline import TimelineResponse
from app.backends.registry import backend_registry
from app.benchmark.models import ExecutionMode
from app.routing.models import AutoRoutingResponse
from app.routing.service import routing_service
from app.services.timeline_service import timeline_service
from app.services.queue_service import queue_service, JobStatus, JobState
from app.core.config import settings
from pydantic import BaseModel

from app.schemas.canonical import CanonicalCircuitInput, UnifiedExecutionResultResponse
from app.services.aer_mps_service import aer_mps_service

router = APIRouter(prefix="/simulate", tags=["Simulation"])

@router.post("/mps", response_model=UnifiedExecutionResultResponse)
def simulate_mps_endpoint(circuit: CanonicalCircuitInput):
    """
    Execute Matrix Product State (MPS) tensor network simulation for high-qubit circuits with bounded entanglement.
    Accepts canonical circuit JSON and returns results conforming to the Unified Result contract.
    """
    try:
        return aer_mps_service.simulate(circuit)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MPS simulation error: {str(e)}")


class AsyncJobResponse(BaseModel):
    job_id: str
    status: JobStatus

def _run_simulation_task(job_id: str, circuit: CircuitRequest, backend: Optional[str]):
    queue_service.update_job_status(job_id, JobStatus.RUNNING)
    try:
        selected_backend = backend_registry.get(backend)
        result = selected_backend.simulate(circuit)
        queue_service.update_job_status(job_id, JobStatus.COMPLETED, result=result.dict())
    except Exception as e:
        queue_service.update_job_status(job_id, JobStatus.FAILED, error=str(e))

@router.post("/async", response_model=AsyncJobResponse)
def simulate_circuit_async(
    circuit: CircuitRequest,
    background_tasks: BackgroundTasks,
    backend: Optional[str] = Query(default=None, description="Quantum backend ('qiskit_aer', 'pennylane')")
):
    if not circuit.measure:
        raise HTTPException(
            status_code=400,
            detail="Shot-based simulation requires 'measure=true' on the circuit."
        )
    job_id = queue_service.create_job()
    background_tasks.add_task(_run_simulation_task, job_id, circuit, backend)
    return AsyncJobResponse(job_id=job_id, status=JobStatus.PENDING)

@router.get("/job/{job_id}", response_model=JobState)
def get_simulation_job_status(job_id: str):
    job = queue_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("", response_model=SimulationResponse)
def simulate_circuit(
    circuit: CircuitRequest,
    backend: Optional[str] = Query(default=None, description="Quantum backend ('qiskit_aer', 'pennylane')")
):
    """
    Execute shot-based simulation of a Qualution quantum circuit using the selected backend.
    """
    if not circuit.measure:
        raise HTTPException(
            status_code=400,
            detail="Shot-based simulation requires 'measure=true' on the circuit."
        )

    try:
        selected_backend = backend_registry.get(backend)
        return selected_backend.simulate(circuit)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@router.post("/statevector", response_model=StatevectorResponse)
def simulate_statevector_endpoint(
    circuit: CircuitRequest,
    backend: Optional[str] = Query(default=None, description="Quantum backend ('qiskit_aer', 'pennylane')")
):
    """
    Compute exact statevector, basis probabilities, and single-qubit Bloch vector using the selected backend.
    """
    if circuit.qubits > settings.MAX_STATEVECTOR_QUBITS:
        raise HTTPException(
            status_code=400,
            detail=f"Circuit exceeds maximum statevector qubit limit ({settings.MAX_STATEVECTOR_QUBITS} qubits). Requested: {circuit.qubits} qubits."
        )

    try:
        selected_backend = backend_registry.get(backend)
        return selected_backend.statevector(circuit)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Statevector simulation error: {str(e)}")

@router.post("/auto", response_model=AutoRoutingResponse)
def simulate_auto_routing(
    circuit: CircuitRequest,
    mode: ExecutionMode = Query(default="shots", description="Execution mode ('shots' or 'statevector')")
):
    """
    Intelligently evaluate candidate backends, select the optimal backend, and explain the decision.
    """
    if mode == "shots" and not circuit.measure:
        raise HTTPException(
            status_code=400,
            detail="Shot-based simulation requires 'measure=true' on the circuit."
        )

    try:
        return routing_service.auto_simulate(circuit, mode=mode)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-routing simulation error: {str(e)}")

@router.post("/timeline", response_model=TimelineResponse)
def simulate_timeline_endpoint(circuit: CircuitRequest):
    """
    Simulate quantum state step-by-step after every gate operation for interactive learning and visual animation.
    """
    if circuit.qubits > settings.MAX_TIMELINE_QUBITS:
        raise HTTPException(
            status_code=400,
            detail=f"Circuit exceeds maximum timeline qubit limit ({settings.MAX_TIMELINE_QUBITS} qubits). Requested: {circuit.qubits} qubits."
        )

    if len(circuit.gates) > settings.MAX_TIMELINE_STEPS:
        raise HTTPException(
            status_code=400,
            detail=f"The circuit contains too many operations for timeline visualization (limit: {settings.MAX_TIMELINE_STEPS} gates, provided: {len(circuit.gates)} gates)."
        )

    try:
        result = timeline_service.generate_timeline(circuit)
        return TimelineResponse(**result)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Timeline simulation error: {str(e)}")
