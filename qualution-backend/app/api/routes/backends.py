from fastapi import APIRouter
from app.schemas.backend import BackendListResponse
from app.backends.registry import backend_registry

router = APIRouter(prefix="/backends", tags=["Backends"])

@router.get("", response_model=BackendListResponse)
def get_available_backends():
    """
    List available quantum execution backends and their supported capabilities.
    """
    backends = backend_registry.list_backends()
    return BackendListResponse(backends=backends)
