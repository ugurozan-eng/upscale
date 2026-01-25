# Current Status

## Review Summary (2026-01-23)
- Completed a full project scan for functional and UI/design issues.
- Findings documented in the review response (frontend, backend, and integration gaps).

## Notes
- API base URL adjusted to default to the backend dev port (8000) when env is unset.
- Debug instrumentation remains active pending post-fix verification.
- Fixed Replicate prediction created_at handling when the client returns a string.
- Added dev-mode polling fallback to mark jobs completed from Replicate status.
- Added backend download proxy to avoid CORS issues with Replicate output URLs.