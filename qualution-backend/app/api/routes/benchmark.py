from fastapi import APIRouter, HTTPException
from app.benchmark.models import BenchmarkRequest, BenchmarkComparisonResponse
from app.benchmark.service import benchmark_service
from app.core.config import settings

router = APIRouter(tags=["Benchmarks"])

@router.post("/benchmarks/run", response_model=BenchmarkComparisonResponse)
@router.post("/benchmark/run", response_model=BenchmarkComparisonResponse)
def run_benchmark_endpoint(request: BenchmarkRequest):
    """
    Explicitly benchmark a circuit across available quantum backends with warmup and median timing.
    """
    if request.circuit.qubits > settings.MAX_STATEVECTOR_QUBITS:
        raise HTTPException(
            status_code=400,
            detail=f"Circuit exceeds maximum benchmark qubit limit ({settings.MAX_STATEVECTOR_QUBITS} qubits)."
        )

    try:
        return benchmark_service.benchmark_circuit(request)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark execution error: {str(e)}")
