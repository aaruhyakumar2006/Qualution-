import time
import logging
from typing import Dict, Any, Optional
from app.core.config import settings
from app.schemas.ai_environment import (
    AIEnvironmentResponse,
    LocalAICapability,
    ProviderCapability,
    DeterministicCapability,
)
from app.services.providers.nvidia_provider import nvidia_provider
from app.services.providers.groq_provider import groq_provider

logger = logging.getLogger("environment_service")

class EnvironmentService:
    """
    AI-1 Environment & Capability Engine (Backend).
    Reports sanitized provider availability, local capabilities, and server-side state.
    Guarantees that no credentials or secrets are exposed to the frontend.
    """

    def __init__(self):
        self._cache: Optional[Dict[str, Any]] = None
        self._cache_timestamp: float = 0.0

    def get_environment_snapshot(
        self,
        latency_ms: Optional[float] = None,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Produce a sanitized capability snapshot of AI providers and local capabilities.
        Cached with TTL defined in AI_ENVIRONMENT_CACHE_TTL_MS.
        """
        now = time.time()
        ttl_seconds = getattr(settings, "AI_ENVIRONMENT_CACHE_TTL_MS", 30000) / 1000.0

        if not force_refresh and self._cache and (now - self._cache_timestamp) < ttl_seconds:
            cached = dict(self._cache)
            if latency_ms is not None:
                cached["latency_ms"] = latency_ms
                if latency_ms > getattr(settings, "AI_LOW_BANDWIDTH_LATENCY_MS", 1500.0):
                    cached["connectivity"] = "low_bandwidth"
                elif latency_ms < 0:
                    cached["connectivity"] = "offline"
                else:
                    cached["connectivity"] = "online"
            return cached

        # Check provider availability via provider configuration without executing heavy requests
        nvidia_available = bool(nvidia_provider.is_configured())
        groq_available = bool(groq_provider.is_configured())

        # Determine connectivity class if latency is provided
        connectivity = "online"
        if latency_ms is not None:
            if latency_ms > getattr(settings, "AI_LOW_BANDWIDTH_LATENCY_MS", 1500.0):
                connectivity = "low_bandwidth"
            elif latency_ms < 0:
                connectivity = "offline"

        snapshot = AIEnvironmentResponse(
            connectivity=connectivity,
            latency_ms=latency_ms,
            bandwidth_mbps=None,
            local_ai=LocalAICapability(available=False, model=None),
            nvidia=ProviderCapability(available=nvidia_available),
            groq=ProviderCapability(available=groq_available),
            deterministic=DeterministicCapability(available=True),
            checked_at=round(now, 3)
        ).model_dump()

        self._cache = snapshot
        self._cache_timestamp = now

        logger.info(
            f"AIEnvironment evaluated: connectivity={connectivity} "
            f"nvidia={nvidia_available} groq={groq_available} deterministic=True "
            f"latency_ms={latency_ms}"
        )

        return snapshot

    def clear_cache(self) -> None:
        """Clear the cached environment snapshot (useful for testing and configuration changes)."""
        self._cache = None
        self._cache_timestamp = 0.0

environment_service = EnvironmentService()
