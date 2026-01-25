from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.job import UpscaleResponse, JobStatus, JobStatusResponse
from app.services.storage_service import storage_service
from app.services.replicate_service import replicate_service
from app.database.supabase_client import (
    supabase,
    get_user_credits,
    deduct_credits,
    create_job,
    get_job,
    update_job
)
from app.config import settings
import io

router = APIRouter(prefix="/api", tags=["upscale"])

# Test user ID (no auth yet)
TEST_USER_ID = "60fd27a2-03e3-40a5-8969-7ccc3165aea3"


@router.post("/test/upload", response_model=UpscaleResponse)
async def test_upload(file: UploadFile = File(...)):
    """
    Test endpoint for file upload and upscale.
    Uses hardcoded test user ID - NO AUTH.
    """
    user_id = TEST_USER_ID

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Check file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Check user credits
    credits = get_user_credits(user_id)
    if credits < settings.credits_per_upscale:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Upload to DO Spaces
    storage_key = storage_service.generate_key(user_id, file.filename or "image.jpg", "uploads")
    file_stream = io.BytesIO(contents)
    input_url = storage_service.upload_file(file_stream, storage_key, file.content_type)

    # Create job in database (using actual DB column names)
    job_data = {
        "user_id": user_id,
        "status": JobStatus.PENDING.value,
        "input_image_url": input_url,
        "model_key": "recraft-crisp",
        "credits_used": settings.credits_per_upscale,
    }
    job = create_job(job_data)

    if not job:
        raise HTTPException(status_code=500, detail="Failed to create job")

    job_id = job["id"]

    # Deduct credits
    if not deduct_credits(user_id, settings.credits_per_upscale):
        raise HTTPException(status_code=402, detail="Failed to deduct credits")

    # In development, run sync (no webhook). In production, use webhook.
    use_webhook = settings.environment == "production" and settings.base_url.startswith("https")

    if use_webhook:
        webhook_url = f"{settings.base_url}/api/webhooks/replicate?job_id={job_id}"
    else:
        webhook_url = None

    # Start Replicate prediction
    try:
        if use_webhook:
            # Async mode with webhook
            prediction = replicate_service.create_upscale_prediction(
                image_url=input_url,
                webhook_url=webhook_url
            )
            update_job(job_id, {
                "status": JobStatus.PROCESSING.value,
                "prediction_id": prediction["id"]
            })
            return UpscaleResponse(
                job_id=job_id,
                status=JobStatus.PROCESSING,
                message="Upscale job started",
                input_url=input_url
            )
        else:
            # Sync mode for development (wait for result)
            update_job(job_id, {"status": JobStatus.PROCESSING.value})

            output_url_replicate = replicate_service.run_upscale_sync(input_url)

            # Upload result to DO Spaces
            output_key = storage_service.generate_key(user_id, "upscaled.png", "outputs")
            output_url = storage_service.upload_from_url(output_url_replicate, output_key)

            # Update job as completed
            from datetime import datetime
            update_job(job_id, {
                "status": JobStatus.COMPLETED.value,
                "output_image_url": output_url,
                "completed_at": datetime.utcnow().isoformat()
            })

            return UpscaleResponse(
                job_id=job_id,
                status=JobStatus.COMPLETED,
                message="Upscale completed",
                input_url=input_url,
                output_url=output_url
            )

    except Exception as e:
        update_job(job_id, {
            "status": JobStatus.FAILED.value,
            "error_message": str(e)
        })
        raise HTTPException(status_code=500, detail=f"Replicate error: {str(e)}")


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get the status of an upscale job."""
    job = get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        job_id=job["id"],
        status=JobStatus(job["status"]),
        input_url=job["input_image_url"],
        output_url=job.get("output_image_url"),
        created_at=job.get("created_at"),
        completed_at=job.get("completed_at"),
        error_message=job.get("error_message")
    )


@router.get("/credits")
async def get_credits():
    """Get credit balance for test user."""
    credits = get_user_credits(TEST_USER_ID)
    return {"user_id": TEST_USER_ID, "credits": credits}
