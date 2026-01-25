from fastapi import APIRouter, Request, HTTPException
from datetime import datetime
from app.database.supabase_client import update_job, get_job
from app.services.storage_service import storage_service
from app.models.job import JobStatus

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/replicate")
async def replicate_webhook(request: Request, job_id: str):
    """
    Webhook endpoint for Replicate prediction completion.
    Called when upscale job finishes (success or failure).
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Get prediction status from payload
    status = payload.get("status")
    prediction_id = payload.get("id")
    output = payload.get("output")
    error = payload.get("error")

    # Get the job to verify it exists
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Handle successful completion
    if status == "succeeded" and output:
        try:
            # Download output from Replicate and upload to our storage
            output_key = storage_service.generate_key(
                job["user_id"],
                "upscaled.png",
                "outputs"
            )
            output_url = storage_service.upload_from_url(output, output_key)

            # Update job as completed
            update_job(job_id, {
                "status": JobStatus.COMPLETED.value,
                "output_image_url": output_url,
                "completed_at": datetime.utcnow().isoformat()
            })

            return {"status": "ok", "message": "Job completed", "output_url": output_url}

        except Exception as e:
            update_job(job_id, {
                "status": JobStatus.FAILED.value,
                "error_message": f"Failed to save output: {str(e)}",
                "completed_at": datetime.utcnow().isoformat()
            })
            return {"status": "error", "message": str(e)}

    # Handle failure
    elif status == "failed":
        update_job(job_id, {
            "status": JobStatus.FAILED.value,
            "error_message": error or "Unknown error",
            "completed_at": datetime.utcnow().isoformat()
        })
        return {"status": "ok", "message": "Job marked as failed"}

    # Handle other statuses (processing, etc.)
    return {"status": "ok", "message": f"Received status: {status}"}


@router.get("/test")
async def test_webhook():
    """Test endpoint to verify webhooks are reachable."""
    return {"status": "ok", "message": "Webhook endpoint is working"}
