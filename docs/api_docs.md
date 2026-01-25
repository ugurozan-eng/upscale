# API Documentation

## Authentication
- Handled via Supabase.

## Image Processing
### POST /api/v1/upscale
- **Description:** Initiates an image upscale task.
- **Payload:**
    ```json
    {
      "image_url": "string",
      "upscale_factor": 2
    }
    ```
- **Response:**
    ```json
    {
      "task_id": "uuid",
      "status": "pending"
    }
    ```

### GET /api/v1/tasks/{task_id}
- **Description:** Retrieves the status and result of an upscale task.

## Payments
- Webhooks from Lemon Squeezy to be implemented.
