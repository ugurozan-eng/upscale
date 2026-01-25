import replicate
from typing import Optional
from app.config import settings


class ReplicateService:
    """Service for interacting with Replicate API for image upscaling."""

    def __init__(self):
        self.client = replicate.Client(api_token=settings.replicate_api_token)
        self.model = settings.upscale_model

    def create_upscale_prediction(
        self,
        image_url: str,
        webhook_url: Optional[str] = None
    ) -> dict:
        """
        Create an upscale prediction using recraft-crisp model.

        Args:
            image_url: URL of the image to upscale
            webhook_url: Optional webhook URL for completion notification

        Returns:
            Prediction object with id, status, etc.
        """
        input_params = {
            "image": image_url
        }

        # Create prediction with optional webhook
        if webhook_url:
            prediction = self.client.predictions.create(
                model=self.model,
                input=input_params,
                webhook=webhook_url,
                webhook_events_filter=["completed"]
            )
        else:
            prediction = self.client.predictions.create(
                model=self.model,
                input=input_params
            )

        return {
            "id": prediction.id,
            "status": prediction.status,
            "created_at": str(prediction.created_at),
            "model": self.model
        }

    def get_prediction(self, prediction_id: str) -> dict:
        """Get the status and output of a prediction."""
        prediction = self.client.predictions.get(prediction_id)

        result = {
            "id": prediction.id,
            "status": prediction.status,
            "created_at": str(prediction.created_at),
        }

        if prediction.output:
            result["output"] = prediction.output

        if prediction.error:
            result["error"] = prediction.error

        if prediction.metrics:
            result["metrics"] = prediction.metrics

        return result

    def run_upscale_sync(self, image_url: str) -> str:
        """
        Run upscale synchronously and wait for result.
        Returns the output image URL.
        """
        output = self.client.run(
            self.model,
            input={"image": image_url}
        )
        return output


# Singleton instance
replicate_service = ReplicateService()
