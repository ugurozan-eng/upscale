from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))


class Settings(BaseSettings):
    # Replicate
    replicate_api_token: str

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str

    # DigitalOcean Spaces
    do_spaces_key: str
    do_spaces_secret: str
    do_spaces_region: str = "fra1"
    do_spaces_bucket: str = "vibecoding-upscale-v1"
    do_spaces_endpoint: str = "https://fra1.digitaloceanspaces.com"

    # Redis (optional for now)
    redis_url: str = "redis://localhost:6379"

    # App
    base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"
    environment: str = "development"

    # Replicate model
    upscale_model: str = "recraft-ai/recraft-crisp-upscale"

    # Pricing
    credits_per_upscale: int = 1

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def do_spaces_cdn_url(self) -> str:
        return f"https://{self.do_spaces_bucket}.{self.do_spaces_region}.cdn.digitaloceanspaces.com"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
