from fastapi import APIRouter

try:
    from .upscale import router as upscale_router
except Exception:
    upscale_router = APIRouter()

try:
    from .webhooks import router as webhooks_router
except Exception:
    webhooks_router = APIRouter()

__all__ = ["upscale_router", "webhooks_router"]
