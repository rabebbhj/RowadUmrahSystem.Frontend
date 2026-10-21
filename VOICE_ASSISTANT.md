# Ruwad Arabic voice assistant

The assistant has been moved to the Expo mobile application at the user's request. The web homepage card and its component/service files have been removed. See [the mobile setup instructions](../RowadUmrahSystem.Mobile/VOICE_ASSISTANT.md). The remaining sections record the initial implementation and shared backend setup.

## Run

No new npm or NuGet packages are required. From the backend directory:

```powershell
dotnet user-secrets set "OpenAI:ApiKey" "YOUR_KEY"
dotnet run --launch-profile http
```

From the frontend directory:

```powershell
npm ci
npm run dev
```

Sign in with the application's existing identity account to use chat, transcription and neural speech. Anonymous users can read and play the welcome and general dua using installed Arabic voices. Without an API key, authenticated Development chat returns explicitly marked demo responses; recording is disabled with an explanation. Production does not serve demo replies.

Configuration uses the existing backend configuration system. Set `OpenAI__ApiKey` as a server environment secret, or use user-secrets locally. Optional settings: `OpenAI__ChatModel` (default `gpt-4o-mini`), `OpenAI__TranscriptionModel` (`gpt-4o-mini-transcribe`), `OpenAI__SpeechModel` (`gpt-4o-mini-tts`), `OpenAI__SpeechVoice` (`coral`). Speech instructions require a compatible TTS model. No provider key belongs in a Vite environment variable.

## Behavior and privacy

Tap the welcome button to play audio; playback is never triggered by mounting or rendering. Completed welcome playback is remembered in session storage. Sound preference and installed voice selection use local storage. After welcome playback, dua playback requires a separate yes/read action. The prayer is labelled a general supplication.

The expanded assistant offers keyboard input, microphone consent, voice preference and stop controls. Recordings stop after 30 seconds, when submitted, on close, when the page is hidden, or on unmount. Stop cancels pending network requests and invalidates late callbacks. WebM/Opus, MP4 and Ogg recording are negotiated according to browser capabilities. Maximum audio upload: 5 MiB; maximum question/history turn: 3,000 characters; history: eight turns held in component memory and reset when the homepage identity changes. The app does not retain raw recordings. ASP.NET may buffer multipart uploads in temporary files that are deleted after the request. Audio and text are sent to OpenAI when configured; provider data handling is separate from application storage.

Use HTTPS outside localhost. Endpoints reuse Identity cookies, require an antiforgery header obtained from `GET /api/assistant/session`, and allow 20 requests/minute and 200/day per account. Limits are held in process and reset on restart; multiple server instances need shared quotas and a provider spending cap before deployment. This implementation is turn-based, not full-duplex realtime speech.

Neural playback can be blocked on mobile. A retry reuses prepared audio and plays it directly from a user click. Installed voices, microphone permission and physical iPhone/Android testing remain device-dependent. No booking, visa, hotel, GPS, transport or ritual-completion data is connected. Religious guidance needs review by a qualified authority.

## Files

Created: `src/api/voiceAssistant.ts`, `src/components/Voice/RuwadVoiceAssistantCard.tsx`, `src/components/Voice/RuwadVoiceAssistantCard.css`, this document; backend `Services/VoiceAssistantService.cs`, `ViewModels/Api/AssistantDtos.cs`, `Controllers/Api/AssistantController.cs`; root `tests/voice-assistant-smoke.mjs` and `tests/VoiceProviderChecks/{VoiceProviderChecks.csproj,Program.cs}`.

Modified: frontend `src/components/landingpage/LandingPage.tsx`; backend `Program.cs`.

## Validation

```powershell
dotnet build RowadUmrahSystem.Backend --no-restore
dotnet run --project tests/VoiceProviderChecks
cd RowadUmrahSystem.Frontend
npm run build -- --outDir dist-voice-check
```

For API smoke tests, start a Development backend on port 5067 with a disposable database (`--ConnectionStrings:DefaultConnection "Data Source=.../voice-smoke.db"`) and no provider key, then run `node tests/voice-assistant-smoke.mjs`. The test uses the app's seeded admin identity to avoid an existing migration issue in traveler permissions. Do not run against production or a real user database.

Builds and isolated API tests passed. Provider transport checks use a fake HTTP handler and do not call OpenAI. Live transcription/speech/conversation and physical mobile testing need credentials/devices. Browser visual verification was unavailable in the execution environment. A fresh database also exposes an existing traveler login failure: missing `UserPermissions.CanAccessDashboard` in the current migrations. This is outside the assistant module.

Official API references: [speech](https://developers.openai.com/api/docs/guides/text-to-speech), [transcription](https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create).
