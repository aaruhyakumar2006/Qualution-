import os
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel

# Load .env if present
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'").strip('"')
                    if k not in os.environ:
                        os.environ[k] = v
    except Exception:
        pass

class Settings(BaseModel):
    PROJECT_NAME: str = "Qualution Backend"
    API_V1_STR: str = "/api/v1"
    MAX_STATEVECTOR_QUBITS: int = int(os.getenv("MAX_STATEVECTOR_QUBITS", "16"))
    MAX_SHOTS: int = int(os.getenv("MAX_SHOTS", "100000"))
    MAX_TIMELINE_QUBITS: int = int(os.getenv("MAX_TIMELINE_QUBITS", "12"))
    MAX_TIMELINE_STEPS: int = int(os.getenv("MAX_TIMELINE_STEPS", "50"))
    MAX_OPTIMIZATION_QUBITS: int = int(os.getenv("MAX_OPTIMIZATION_QUBITS", "10"))
    MAX_OPTIMIZATION_ITERATIONS: int = int(os.getenv("MAX_OPTIMIZATION_ITERATIONS", "10"))
    QBRAID_API_KEY: Optional[str] = os.getenv("QBRAID_API_KEY", None)
    QBRAID_DEFAULT_DEVICE: Optional[str] = os.getenv("QBRAID_DEFAULT_DEVICE", None)
    NVIDIA_API_KEY: Optional[str] = os.getenv("NVIDIA_API_KEY", None)
    NVIDIA_MODEL: str = os.getenv("NVIDIA_MODEL", "nvidia/nemotron-3-super-120b-a12b")
    NVIDIA_BASE_URL: str = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    NVIDIA_CONNECT_TIMEOUT: float = float(os.getenv("NVIDIA_CONNECT_TIMEOUT", "10.0"))
    NVIDIA_READ_TIMEOUT: float = float(os.getenv("NVIDIA_READ_TIMEOUT", "35.0"))
    NVIDIA_REQUEST_TIMEOUT: float = float(os.getenv("NVIDIA_REQUEST_TIMEOUT", "45.0"))
    NVIDIA_MAX_RETRIES: int = int(os.getenv("NVIDIA_MAX_RETRIES", "1"))
    NVIDIA_RETRY_BACKOFF: float = float(os.getenv("NVIDIA_RETRY_BACKOFF", "1.5"))
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", None)
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GROQ_BASE_URL: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    GROQ_CONNECT_TIMEOUT: float = float(os.getenv("GROQ_CONNECT_TIMEOUT", "5.0"))
    GROQ_READ_TIMEOUT: float = float(os.getenv("GROQ_READ_TIMEOUT", "15.0"))
    AI_ENVIRONMENT_CACHE_TTL_MS: int = int(os.getenv("AI_ENVIRONMENT_CACHE_TTL_MS", "30000"))
    AI_LOW_BANDWIDTH_LATENCY_MS: float = float(os.getenv("AI_LOW_BANDWIDTH_LATENCY_MS", "1500.0"))
    AI_PROBE_TIMEOUT_MS: float = float(os.getenv("AI_PROBE_TIMEOUT_MS", "3000.0"))
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:5176"
        ).split(",")
        if origin.strip()
    ]

settings = Settings()
