import importlib.metadata
from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "qualution-backend"}

from app.core.config import settings

@router.get("/ready")
def readiness_check():
    """
    Check availability and versions of core quantum simulation dependencies
    and AI provider configuration states without exposing credentials.
    """
    dependencies = {}
    ready = True

    for pkg in ["qiskit", "qiskit-aer", "pennylane", "cirq", "qbraid"]:
        try:
            ver = importlib.metadata.version(pkg)
            dependencies[pkg] = {"installed": True, "version": ver}
        except Exception as e:
            # Core dependencies required; optional providers degrade if missing
            if pkg in ["qiskit", "qiskit-aer", "pennylane", "cirq"]:
                ready = False
            dependencies[pkg] = {"installed": False, "error": str(e)}

    ai_status = {
        "nvidia_configured": bool(settings.NVIDIA_API_KEY and len(settings.NVIDIA_API_KEY.strip()) > 0),
        "groq_configured": bool(settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 0),
    }

    return {
        "status": "ready" if ready else "degraded",
        "ready": ready,
        "dependencies": dependencies,
        "ai": ai_status
    }
