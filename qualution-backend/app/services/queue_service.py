import uuid
import time
from typing import Dict, Any, Optional
from pydantic import BaseModel
from enum import Enum

class JobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class JobState(BaseModel):
    job_id: str
    status: JobStatus
    created_at: float
    result: Optional[Any] = None
    error: Optional[str] = None

class QueueService:
    def __init__(self):
        self._jobs: Dict[str, JobState] = {}

    def create_job(self) -> str:
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = JobState(
            job_id=job_id,
            status=JobStatus.PENDING,
            created_at=time.time()
        )
        return job_id

    def get_job(self, job_id: str) -> Optional[JobState]:
        return self._jobs.get(job_id)

    def update_job_status(self, job_id: str, status: JobStatus, result: Any = None, error: str = None):
        if job_id in self._jobs:
            self._jobs[job_id].status = status
            if result is not None:
                self._jobs[job_id].result = result
            if error is not None:
                self._jobs[job_id].error = error

queue_service = QueueService()
