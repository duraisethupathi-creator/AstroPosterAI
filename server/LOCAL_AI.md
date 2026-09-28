# Stage 5.1 local AI on Windows

The phone talks only to AstroPoster on port 3001. AstroPoster validates requests,
then calls Ollama on loopback port 11434. No external AI credentials are needed.
Model weights are downloaded once; inference runs locally. Keep Ollama private.

## Model and hardware

Default: `qwen3.5:2b-q4_K_M` (Q4_K_M), approximately 1.9 GB download. Qwen3.5 documents multilingual coverage of 201 languages and dialects. Language quality still needs human
review, especially for a small model. Budget approximately 2–4 GB runtime RAM at
4096 context (an estimate, not a guaranteed ceiling), plus Windows, Node and Expo.
This development PC has about 7.2 GiB RAM and a Ryzen 3 7320U; memory is tight.
16 GB system RAM is more comfortable. CPU generation can be slow. Thinking is
disabled, output tokens are bounded, and only one inference runs at a time.

Sources: https://ollama.com/library/qwen3.5:2b-q4_K_M and
https://ollama.com/library/qwen3.5 . Native API:
https://docs.ollama.com/api/chat and
https://docs.ollama.com/capabilities/structured-outputs .

## Install and start Ollama

Official Windows installer: https://ollama.com/download/windows . Install it,
then open a fresh PowerShell terminal. See https://docs.ollama.com/windows .
If using the portable runtime prepared in this checkout, use its executable:

```powershell
Set-Location E:\AstroPosterAI
$ollama = 'E:\AstroPosterAI\.local-ai\ollama\ollama.exe'
$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:OLLAMA_MODELS = 'E:\AstroPosterAI\.local-ai\models'
$env:OLLAMA_NO_CLOUD = '1'
$env:OLLAMA_NUM_PARALLEL = '1'
$env:OLLAMA_MAX_LOADED_MODELS = '1'
& $ollama serve
```

For a standard installation, replace `$ollama` with `ollama`. Do not start a second
server if the installed tray application already serves port 11434. Configure the
same model storage directory in both terminals if using the portable setup.
The ignored `.local-ai` directory keeps large downloads off the system drive.
The portable runtime and selected model have already been installed in this
checkout. Ollama and AstroPoster were started as hidden background processes for
the Android handoff; do not launch duplicate servers while their ports are in use.

In another PowerShell terminal:

```powershell
$ollama = 'E:\AstroPosterAI\.local-ai\ollama\ollama.exe'
$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:OLLAMA_MODELS = 'E:\AstroPosterAI\.local-ai\models'
& $ollama pull qwen3.5:2b-q4_K_M
Invoke-RestMethod 'http://127.0.0.1:11434/api/tags'
```

The tags response must list `qwen3.5:2b-q4_K_M`. It proves the model is installed, not
that generation has succeeded. First inference also loads the model into RAM.

## Backend configuration and start

Edit the ignored `E:\AstroPosterAI\server\.env`. The example contains the complete
configuration; copy it only for a fresh setup. Essential lines:

```dotenv
AI_MOCK_MODE=false
LOCAL_AI_BASE_URL=http://127.0.0.1:11434
LOCAL_AI_MODEL=qwen3.5:2b-q4_K_M
LOCAL_AI_TIMEOUT_MS=60000
LOCAL_AI_CONTEXT=4096
LOCAL_AI_MAX_TOKENS=768
LOCAL_AI_THINK=false
HOST=0.0.0.0
PORT=3001
NODE_ENV=development
```

```powershell
Set-Location E:\AstroPosterAI\server
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Leave it running. Restart with Ctrl+C then `npm.cmd start` after changing `.env`.
For the prepared hidden backend, first stop only its recorded process if it still
owns port 3001, then run the start commands above:

```powershell
$backendPid = [int](Get-Content 'E:\AstroPosterAI\.local-ai\backend.pid')
$listener = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($listener -and $listener.OwningProcess -eq $backendPid) {
  Stop-Process -Id $backendPid
}
```

Shell environment variables override `.env`; remove stale overrides if necessary.
Health checks the backend process only, not model readiness:

```powershell
Invoke-RestMethod 'http://127.0.0.1:3001/health'
```

## Direct generation: English and Tamil

Run sequentially, leaving both servers running:

```powershell
foreach ($language in @('en', 'ta')) {
  $body = @{ request = @{
    categoryId = 'daily'; language = $language; zodiacId = 'aries'
    period = @{ date = (Get-Date -Format 'yyyy-MM-dd') }; inputs = @{}
  }} | ConvertTo-Json -Depth 6
  $timer = [Diagnostics.Stopwatch]::StartNew()
  $result = Invoke-RestMethod 'http://127.0.0.1:3001/api/ai/generate' `
    -Method Post -ContentType 'application/json; charset=utf-8' `
    -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 75
  $timer.Stop()
  $result | ConvertTo-Json -Depth 6
  "Elapsed milliseconds: $($timer.ElapsedMilliseconds)"
}
```

Expect success=true, mode=live, correct language/category/zodiac and eight
validated Daily content fields. Other categories use their own schemas. No
`provider` parameter is accepted. Invalid output gets at most one repair, within
the same 60-second deadline. Mobile waits 75 seconds. A timeout is a failed test;
do not treat it as a successful generation or silently substitute mock content.

## Android after direct tests pass

Use `ipconfig` to find the PC's current Wi-Fi IPv4. Previously it was
`192.168.1.2`; DHCP can change it. Both devices must share trusted Wi-Fi.
Only AstroPoster port 3001 needs LAN access. Keep Ollama bound to loopback.
Allow Node on the private network if Windows prompts; do not expose this
unauthenticated development backend to the internet.

```powershell
Set-Location E:\AstroPosterAI
$env:EXPO_PUBLIC_AI_BASE_URL = 'http://192.168.1.2:3001'
npx.cmd expo start --lan --clear
```

This URL is developer build configuration, never an end-user Settings field.
It can also be set in ignored root `.env.local`. Never use phone localhost for
the Windows backend. Verify `http://192.168.1.2:3001/health` on the phone.
Test Daily / Tamil / one Rasi / Generate, edit a returned field, then test English.
Check that Settings contains language options and no AI provider controls.
Exactly one Retry should appear after a generation failure.

## Mock and verification

Set `AI_MOCK_MODE=true` in backend `.env` and restart for offline integration
samples. No Ollama is needed then; the response is visibly marked as mock.
Restore false and restart before real local model tests.

```powershell
Set-Location E:\AstroPosterAI
npm.cmd run typecheck
npx.cmd expo-doctor
node --test scripts/astrology.test.cjs scripts/i18n.test.cjs scripts/brandProfile.test.cjs
Set-Location server
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Production needs HTTPS plus an authenticated reverse proxy with stripped and
verified identity headers; bind the backend privately behind it. CORS alone is
not authentication. The local model URL can point to a private self-hosted
Ollama-compatible service later without changing the mobile contract.

Poster rendering, bulk 12-Rasi generation and Jathagam calculations remain future
work. Future astronomical positions/charts must use deterministic calculations;
AI may explain validated calculated data. No commit/push before Android PASS.
