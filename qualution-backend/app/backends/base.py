from abc import ABC, abstractmethod
from app.schemas.circuit import CircuitRequest
from app.schemas.backend import BackendMetadata
from app.schemas.simulation import SimulationResponse
from app.schemas.result import StatevectorResponse

class QuantumBackend(ABC):
    """
    Abstract base class representing a framework-agnostic quantum backend.
    """

    @abstractmethod
    def get_metadata(self) -> BackendMetadata:
        """Return capabilities and framework metadata."""
        pass

    @abstractmethod
    def simulate(self, circuit: CircuitRequest) -> SimulationResponse:
        """Execute shot-based measurement simulation."""
        pass

    @abstractmethod
    def statevector(self, circuit: CircuitRequest) -> StatevectorResponse:
        """Compute exact statevector and probabilities."""
        pass
