# Get A Real Gemini API Key

## Current Issue
The project needs a valid Gemini API key from Google AI Studio to enable live AI responses.

## How To Create A Key
1. Go to `https://aistudio.google.com/app/apikey`
2. Click `Create API Key`
3. Create a new project or use an existing one
4. Copy the generated key

## How To Use It
1. Store the key in your local environment file
2. Set `GEMINI_API_KEY=<your-gemini-api-key>`
3. Restart the backend after updating the environment

## Verification
After restarting the app:
1. Open the AI chat page
2. Send a simple prompt such as `What is Python?`
3. Confirm the UI shows live AI mode instead of demo mode

## Important Notes
- Do not hardcode API keys in source files
- Do not commit API keys to Git
- Use local `.env` files for development secrets
