# Cloudflare Worker Backend Specification

## Endpoints

### 1. `POST /` (or designated API route)
Synthesizes Vietnamese text to audio.

- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "text": "Đoạn văn bản tiếng Việt cần chuyển sang giọng nói.",
    "lang": "vi-VN"
  }
  ```
- **Response Headers**:
  - `Content-Type`: `audio/mpeg` (or specific audio formats like `audio/wav`, `audio/mp3`)
  - `Access-Control-Allow-Origin`: `*` (or specific frontend domains in production)
- **Response Body**: Binary audio data.

### 2. `OPTIONS /`
CORS preflight request handling.
- **Response Headers**:
  - `Access-Control-Allow-Origin`: `*`
  - `Access-Control-Allow-Methods`: `POST, OPTIONS`
  - `Access-Control-Allow-Headers`: `Content-Type`

## Environment Configuration
The backend Worker expects the following environment variables / bindings:

| Binding Name | Type | Description | Secret? |
| --- | --- | --- | --- |
| `TTS_API_KEY` | Secret Text | API credentials for the external TTS provider | Yes |
| `TTS_API_URL` | Text | API endpoint for the external TTS provider | No |

## Boundary Processing (Parse-First Rule)
The Worker must validate inputs at the entry point:
1. Ensure the request method is `POST` (or `OPTIONS` for preflight).
2. Validate that the payload is valid JSON.
3. Validate that `text` is a non-empty string.
4. Normalize `lang` parameter, defaulting to `vi-VN` if not specified.
5. Catch all network and upstream errors and return standard JSON error responses with proper status codes (e.g. 400 for bad input, 502 for upstream failures, 500 for internal errors).
