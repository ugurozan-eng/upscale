import boto3
from botocore.config import Config
import uuid
from datetime import datetime
from typing import BinaryIO
from app.config import settings


class StorageService:
    """Service for uploading/downloading files from DigitalOcean Spaces."""

    def __init__(self):
        self.client = boto3.client(
            's3',
            region_name=settings.do_spaces_region,
            endpoint_url=settings.do_spaces_endpoint,
            aws_access_key_id=settings.do_spaces_key,
            aws_secret_access_key=settings.do_spaces_secret,
            config=Config(signature_version='s3v4')
        )
        self.bucket = settings.do_spaces_bucket
        self.cdn_url = settings.do_spaces_cdn_url

    def generate_key(self, user_id: str, filename: str, folder: str = "uploads") -> str:
        """Generate a unique storage key for a file."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:8]
        ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'jpg'
        return f"{folder}/{user_id}/{timestamp}_{unique_id}.{ext}"

    def upload_file(
        self,
        file_data: BinaryIO,
        key: str,
        content_type: str = "image/jpeg"
    ) -> str:
        """
        Upload a file to DO Spaces.
        Returns the CDN URL of the uploaded file.
        """
        self.client.upload_fileobj(
            file_data,
            self.bucket,
            key,
            ExtraArgs={
                'ContentType': content_type,
                'ACL': 'public-read'
            }
        )
        return f"{self.cdn_url}/{key}"

    def upload_from_url(self, source_url: str, key: str) -> str:
        """
        Download from URL and upload to DO Spaces.
        Used for storing Replicate output images.
        """
        import requests
        response = requests.get(source_url, stream=True)
        response.raise_for_status()

        content_type = response.headers.get('Content-Type', 'image/png')

        self.client.upload_fileobj(
            response.raw,
            self.bucket,
            key,
            ExtraArgs={
                'ContentType': content_type,
                'ACL': 'public-read'
            }
        )
        return f"{self.cdn_url}/{key}"

    def delete_file(self, key: str) -> bool:
        """Delete a file from storage."""
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except Exception:
            return False

    def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """Generate a presigned URL for private file access."""
        return self.client.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket, 'Key': key},
            ExpiresIn=expires_in
        )


# Singleton instance
storage_service = StorageService()
