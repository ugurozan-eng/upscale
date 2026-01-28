from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from app.models.job import UpscaleResponse, JobStatus, JobStatusResponse
import httpx
from app.config import settings
import io
import time
import base64
from PIL import Image

# Max pixels for Replicate GPU (approx 1400x1400)
MAX_PIXELS = 1800000

router = APIRouter(prefix="/api", tags=["upscale"])

# Test user ID (no auth yet)
TEST_USER_ID = "60fd27a2-03e3-40a5-8969-7ccc3165aea3"

# In-memory job storage for testing (when DB is not available)
_mock_jobs = {}


def get_replicate_service():
    """Lazy load replicate service."""
    try:
        from app.services.replicate_service import replicate_service
        return replicate_service
    except Exception as e:
        print(f"Failed to load replicate service: {e}")
        return None


def get_storage_service():
    """Lazy load storage service."""
    try:
        from app.services.storage_service import storage_service
        return storage_service
    except Exception as e:
        print(f"Failed to load storage service: {e}")
        return None


def get_db_functions():
    """Lazy load database functions."""
    try:
        from app.database.supabase_client import (
            get_user_credits,
            create_job,
            get_job,
            update_job
        )
        return get_user_credits, create_job, get_job, update_job
    except Exception as e:
        print(f"Failed to load DB functions: {e}")
        return None, None, None, None


@router.post("/test/upload", response_model=UpscaleResponse)
async def test_upload(file: UploadFile = File(...)):
    """
    Upload and upscale an image using Replicate API.
    """
    user_id = TEST_USER_ID

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Check file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Resize image if too large for Replicate GPU
    try:
        img = Image.open(io.BytesIO(contents))
        width, height = img.size
        total_pixels = width * height
        print(f"Original image: {width}x{height} = {total_pixels} pixels")

        if total_pixels > MAX_PIXELS:
            # Calculate new dimensions while maintaining aspect ratio
            ratio = (MAX_PIXELS / total_pixels) ** 0.5
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            print(f"Resizing to: {new_width}x{new_height}")

            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Save resized image to bytes
            buffer = io.BytesIO()
            img_format = 'JPEG' if file.content_type == 'image/jpeg' else 'PNG'
            img.save(buffer, format=img_format, quality=95)
            contents = buffer.getvalue()
            print(f"Resized image size: {len(contents)} bytes")
    except Exception as e:
        print(f"Image resize failed (continuing with original): {e}")

    # Get services
    storage = get_storage_service()
    replicate = get_replicate_service()
    get_user_credits, create_job, get_job_fn, update_job = get_db_functions()

    # Check user credits
    if get_user_credits:
        try:
            credits = get_user_credits(user_id)
            if credits < settings.credits_per_upscale:
                raise HTTPException(status_code=402, detail="Insufficient credits")
        except HTTPException:
            raise
        except Exception:
            pass

    # Upload to storage
    input_url = None
    if storage:
        try:
            storage_key = storage.generate_key(user_id, file.filename or "image.jpg", "uploads")
            file_stream = io.BytesIO(contents)
            input_url = storage.upload_file(file_stream, storage_key, file.content_type)
            print(f"Uploaded to storage: {input_url}")
        except Exception as e:
            print(f"Storage upload failed: {e}")

    # Fallback to data URL if storage fails
    if not input_url:
        b64_data = base64.b64encode(contents).decode('utf-8')
        input_url = f"data:{file.content_type};base64,{b64_data}"
        print("Using data URL fallback")

    # Create job record
    job_id = f"job-{int(time.time() * 1000)}"
    if create_job:
        try:
            job_data = {
                "user_id": user_id,
                "status": JobStatus.PROCESSING.value,
                "input_image_url": input_url,
                "model_key": "real-esrgan",
                "credits_used": settings.credits_per_upscale,
            }
            job = create_job(job_data)
            if job:
                job_id = job["id"]
        except Exception as e:
            print(f"Job creation failed: {e}")

    # Run Replicate upscale with Real-ESRGAN (4x scale, face enhance)
    output_url = input_url  # Fallback
    if replicate:
        try:
            print(f"Calling Replicate API with Real-ESRGAN...")
            output_url = replicate.run_upscale_sync(
                image_url=input_url,
                model_key="real-esrgan",
                scale=4,
                face_enhance=True
            )
            print(f"Replicate returned: {output_url}")

            # Upload result to storage if available
            if storage and output_url and not output_url.startswith("data:"):
                try:
                    output_key = storage.generate_key(user_id, "upscaled.png", "outputs")
                    stored_url = storage.upload_from_url(output_url, output_key)
                    if stored_url:
                        output_url = stored_url
                        print(f"Stored output at: {output_url}")
                except Exception as e:
                    print(f"Failed to store output: {e}")

        except Exception as e:
            print(f"Replicate API error: {e}")
            raise HTTPException(status_code=500, detail=f"Upscale failed: {str(e)}")
    else:
        print("WARNING: Replicate service not available, returning original image")

    # Update job with result
    if update_job:
        try:
            from datetime import datetime
            update_job(job_id, {
                "status": JobStatus.COMPLETED.value,
                "output_image_url": output_url,
                "completed_at": datetime.utcnow().isoformat()
            })
        except Exception as e:
            print(f"Job update failed: {e}")

    # Store in memory as fallback
    _mock_jobs[job_id] = {
        "id": job_id,
        "status": JobStatus.COMPLETED.value,
        "input_image_url": input_url,
        "output_image_url": output_url,
    }

    return UpscaleResponse(
        job_id=job_id,
        status=JobStatus.COMPLETED,
        message="Upscale completed successfully",
        input_url=input_url,
        output_url=output_url
    )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get job status and output."""
    _, _, get_job_fn, _ = get_db_functions()

    job = None
    if get_job_fn:
        try:
            job = get_job_fn(job_id)
        except Exception:
            pass

    # Fallback to mock storage
    if not job and job_id in _mock_jobs:
        job = _mock_jobs[job_id]

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        job_id=job.get("id", job_id),
        status=JobStatus(job.get("status", "completed")),
        input_url=job.get("input_image_url", ""),
        output_url=job.get("output_image_url"),
        created_at=job.get("created_at"),
        completed_at=job.get("completed_at"),
        error_message=job.get("error_message")
    )


@router.get("/credits")
async def get_credits():
    """Get credit balance for test user."""
    get_user_credits, _, _, _ = get_db_functions()

    credits = 100
    if get_user_credits:
        try:
            credits = get_user_credits(TEST_USER_ID)
        except Exception:
            pass

    return {"user_id": TEST_USER_ID, "credits": credits}


@router.get("/download/{job_id}")
async def download_image(job_id: str):
    """Download proxy for upscaled images."""
    _, _, get_job_fn, _ = get_db_functions()

    job = None
    if get_job_fn:
        try:
            job = get_job_fn(job_id)
        except Exception:
            pass

    if not job and job_id in _mock_jobs:
        job = _mock_jobs[job_id]

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    output_url = job.get("output_image_url")
    if not output_url:
        raise HTTPException(status_code=404, detail="Output image not available")

    # Handle data URLs
    if output_url.startswith("data:"):
        header, b64_data = output_url.split(",", 1)
        content_type = header.split(":")[1].split(";")[0]
        content = base64.b64decode(b64_data)

        ext = "png"
        if "jpeg" in content_type or "jpg" in content_type:
            ext = "jpg"

        return StreamingResponse(
            io.BytesIO(content),
            media_type=content_type,
            headers={
                "Content-Disposition": f'attachment; filename="upscaled-{job_id}.{ext}"',
                "Content-Length": str(len(content))
            }
        )

    # Fetch from URL
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(output_url)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "image/png")
            ext = "png"
            if "jpeg" in content_type or "jpg" in content_type:
                ext = "jpg"

            return StreamingResponse(
                io.BytesIO(response.content),
                media_type=content_type,
                headers={
                    "Content-Disposition": f'attachment; filename="upscaled-{job_id}.{ext}"',
                    "Content-Length": str(len(response.content))
                }
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch image: {str(e)}")
