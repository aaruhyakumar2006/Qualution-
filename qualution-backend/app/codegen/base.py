from abc import ABC, abstractmethod
from app.schemas.circuit import CircuitRequest

class CodeGenerator(ABC):
    @property
    @abstractmethod
    def framework(self) -> str:
        """Name of the target quantum framework."""
        pass

    @abstractmethod
    def generate(self, circuit: CircuitRequest) -> str:
        """Generate executable Python source code for the given Qualution circuit."""
        pass
