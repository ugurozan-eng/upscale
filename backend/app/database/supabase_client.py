from supabase import create_client, Client
from app.config import settings


def get_supabase_client() -> Client:
    """Get Supabase client with service key for backend operations."""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_key
    )


# Singleton instance
supabase: Client = get_supabase_client()


# Helper functions for common operations
def get_user_credits(user_id: str) -> int:
    """Get current credit balance for a user."""
    result = supabase.table("user_credits").select("credits_remaining").eq("user_id", user_id).single().execute()
    return result.data.get("credits_remaining", 0) if result.data else 0


def deduct_credits(user_id: str, amount: int = 1) -> bool:
    """Deduct credits from user. Returns True if successful."""
    current = get_user_credits(user_id)
    if current < amount:
        return False

    supabase.table("user_credits").update({
        "credits_remaining": current - amount
    }).eq("user_id", user_id).execute()
    return True


def create_job(job_data: dict) -> dict:
    """Create a new upscale job in the database."""
    result = supabase.table("upscale_jobs").insert(job_data).execute()
    return result.data[0] if result.data else None


def update_job(job_id: str, update_data: dict) -> dict:
    """Update an existing job."""
    result = supabase.table("upscale_jobs").update(update_data).eq("id", job_id).execute()
    return result.data[0] if result.data else None


def get_job(job_id: str) -> dict:
    """Get a job by ID."""
    result = supabase.table("upscale_jobs").select("*").eq("id", job_id).single().execute()
    return result.data
