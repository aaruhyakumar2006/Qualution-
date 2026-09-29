from abc import ABC, abstractmethod
from typing import Tuple, List
from app.schemas.circuit import CircuitRequest
from app.codeparse.models import ParseWarning

class CodeParser(ABC):
    @property
    @abstractmethod
    def framework(self) -> str:
        """Target framework identifier."""
        pass

    @abstractmethod
    def parse(self, code: str) -> Tuple[CircuitRequest, List[ParseWarning]]:
        """
        Parse quantum program source code into a Qualution CircuitRequest and warnings.
        Must NEVER execute arbitrary code.
        """
        pass
