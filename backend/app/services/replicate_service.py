import httpx
import time
from typing import Optional
from app.config import settings


# Model versions - güncel tutulmalı
MODELS = {
    "real-esrgan": {
        "version": "b3ef194191d13140337468c916c2c5b96dd0cb06dffc032a022a31807f6a5ea8",
        "default_scale": 4,
        "max_scale": 10,
        "supports_face_enhance": True
    },
    "recraft-crisp": {
        "version": "31c70d9026bbd25ee2b751825e19101e0321b8814c33863c88fe5d0d63c00c82",
        "default_scale": 4,
        "max_scale": 4,
        "supports_face_enhance": False
    }
}


class ReplicateService:
    """Service for interacting with Replicate API via HTTP."""

    def __init__(self):
        self.api_token = settings.replicate_api_token
        self.base_url = "https://api.replicate.com/v1"

    def _headers(self):
        return {
            "Authorization": f"Token {self.api_token}",
            "Content-Type": "application/json"
        }

    def run_upscale_sync(
        self,
        image_url: str,
        model_key: str = "real-esrgan",
        scale: int = 4,
        face_enhance: bool = False,
        timeout: int = 300
    ) -> str:
        """
        Run upscale synchronously and wait for result.

        Args:
            image_url: URL of image to upscale
            model_key: "real-esrgan" or "recraft-crisp"
            scale: Upscale factor (2-10 for real-esrgan, 4 for recraft)
            face_enhance: Enable face enhancement (real-esrgan only)
            timeout: Max wait time in seconds

        Returns:
            Output image URL
        """
        model = MODELS.get(model_key, MODELS["real-esrgan"])
        version = model["version"]

        # Build input based on model
        if model_key == "real-esrgan":
            input_data = {
                "image": image_url,
                "scale": min(scale, model["max_scale"]),
                "face_enhance": face_enhance
            }
        else:
            input_data = {
                "image": image_url
            }

        print(f"[Replicate] Starting {model_key} upscale (scale={scale}, face_enhance={face_enhance})...")
        print(f"[Replicate] Image: {image_url[:100]}...")

        # Create prediction
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{self.base_url}/predictions",
                headers=self._headers(),
                json={
                    "version": version,
                    "input": input_data
                }
            )

            if response.status_code != 201:
                print(f"[Replicate] Error creating prediction: {response.text}")
                raise Exception(f"Failed to create prediction: {response.text}")

            prediction = response.json()
            prediction_id = prediction["id"]
            print(f"[Replicate] Prediction created: {prediction_id}")

        # Poll for completion
        start_time = time.time()
        with httpx.Client(timeout=30.0) as client:
            while time.time() - start_time < timeout:
                response = client.get(
                    f"{self.base_url}/predictions/{prediction_id}",
                    headers=self._headers()
                )

                if response.status_code != 200:
                    raise Exception(f"Failed to get prediction: {response.text}")

                result = response.json()
                status = result.get("status")

                print(f"[Replicate] Status: {status}")

                if status == "succeeded":
                    output = result.get("output")
                    print(f"[Replicate] Success! Output: {output}")
                    return output
                elif status == "failed":
                    error = result.get("error", "Unknown error")
                    print(f"[Replicate] Failed: {error}")
                    raise Exception(f"Prediction failed: {error}")
                elif status == "canceled":
                    raise Exception("Prediction was canceled")

                time.sleep(2)

        raise Exception("Prediction timed out")


# Singleton instance
replicate_service = ReplicateService()
