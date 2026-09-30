from pydantic import BaseModel, Field
from typing import Optional, Literal

class LocalAICapability(BaseModel):
    available: bool = False
    model: Optional[str] = None

class ProviderCapability(BaseModel):
    available: bool = False

class DeterministicCapability(BaseModel):
    available: bool = True

class AIEnvironmentResponse(BaseModel):
    connectivity: Literal["online", "low_bandwidth", "offline"] = "online"
    latency_ms: Optional[float] = None
    bandwidth_mbps: Optional[float] = None
    local_ai: LocalAICapability = Field(default_factory=LocalAICapability)
    nvidia: ProviderCapability = Field(default_factory=ProviderCapability)
    groq: ProviderCapability = Field(default_factory=ProviderCapability)
    deterministic: DeterministicCapability = Field(default_factory=DeterministicCapability)
    checked_at: float = Field(default_factory=lambda: 0.0)
