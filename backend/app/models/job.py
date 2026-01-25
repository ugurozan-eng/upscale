from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UpscaleRequest(BaseModel):
    """Request model for upscale endpoint."""
    # File will be uploaded via form-data, not JSON
    pass


class UpscaleResponse(BaseModel):
    """Response model for upscale endpoint."""
    job_id: str
    status: JobStatus
    message: str
    input_url: Optional[str] = None
    output_url: Optional[str] = None


class UpscaleJob(BaseModel):
    """Database model for upscale jobs."""
    id: Optional[str] = None
    user_id: str
    status: JobStatus = JobStatus.PENDING
    input_url: str
    output_url: Optional[str] = None
    replicate_id: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class JobStatusResponse(BaseModel):
    """Response model for job status check."""
    job_id: str
    status: JobStatus
    input_url: str
    output_url: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None


class WebhookPayload(BaseModel):
    """Replicate webhook payload."""
    id: str
    status: str
    output: Optional[str] = None
    error: Optional[str] = None
