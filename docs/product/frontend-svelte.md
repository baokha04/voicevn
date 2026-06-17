# Svelte Frontend Specification

## User Interface Design

The application consists of a single-page responsive interface containing:
1. **Title**: "Vietnamese Text-to-Speech Engine"
2. **Text Input**: A textarea for entering Vietnamese text with a placeholder.
3. **Control Buttons**:
   - `Generate Voice & Save` (Primary action, disabled during loading or when input is empty)
   - `Clear Cached Audio` (Visible/active when cached audio is present)
4. **Active Transcript Box**: Shows the text currently represented by the loaded audio.
5. **Audio Player**: Standard HTML5 `<audio>` player, configured with the Base64 audio source, supporting play, pause, seek, and auto-playing upon generation.
6. **Error Banner**: Displays clear error messages when API requests fail.

## Caching Strategy (localStorage)
- On component mount, retrieve `cached_tts_audio` and `cached_tts_transcript` from browser `localStorage`. If both are present, hydrate the UI state so the user can play back the last generated audio immediately.
- Upon successful audio generation, read the binary blob response using the `FileReader` API.
- Convert the blob to a Base64-encoded Data URL (e.g. `data:audio/mpeg;base64,...`).
- Store the Base64 Data URL and corresponding transcript text in `localStorage`.
- Safely handle storage quota exceptions (e.g., `QuotaExceededError`) by showing a warning in the console or UI but still allowing local playback without caching.

## State Management
- `text`: bound to textarea value.
- `transcript`: stores the text for the current audio clip.
- `audioBase64`: stores the audio source (Base64 string).
- `isLoading`: boolean tracking whether synthesis is in progress.
- `errorMessage`: string showing any fetch or client-side errors.
