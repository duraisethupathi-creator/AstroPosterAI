# Mock integration testing

See [Local AI setup](LOCAL_AI.md#mock-and-verification) for the current commands.
Set `AI_MOCK_MODE=true` in ignored `server/.env` and restart the backend.
Use the same provider-free request in the direct test instructions. Expect
`mode: "mock"` and editable development samples. Ollama and API keys are unnecessary.
Restore `AI_MOCK_MODE=false` before testing real local generation.
