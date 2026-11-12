# DVAA + Ollama (free local LLM)

Upstream DVAA Settings only offered OpenAI / Anthropic. This fork adds **Ollama**.

## Quick local (host Ollama)

```bash
# Terminal A — model (once)
ollama pull llama3.2

# Terminal B — DVAA with LLM mode on at boot
DVAA_LLM_PROVIDER=ollama \
DVAA_LLM_MODEL=llama3.2 \
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1 \
npm start
```

Or start DVAA normally, open **Settings**, pick **Ollama**, leave API key blank, Enable.

## Docker Compose

```bash
ollama pull llama3.2   # or: docker compose --profile llm exec ollama ollama pull llama3.2
DVAA_LLM_PROVIDER=ollama docker compose --profile llm up --build
```

DVAA reaches Ollama at `http://ollama:11434/v1` inside the compose network.

## Env vars

| Variable | Purpose |
|----------|---------|
| `DVAA_LLM_PROVIDER` | `ollama` (or `openai` / `anthropic`) enables LLM mode at startup |
| `DVAA_LLM_MODEL` | Model name (default `llama3.2`) |
| `OLLAMA_BASE_URL` | OpenAI-compatible base, e.g. `http://127.0.0.1:11434/v1` |
| `DVAA_LLM_API_KEY` | Optional; Ollama ignores it (defaults to `ollama`) |

## EKS / lab note

Run Ollama as a second Deployment/Service in-cluster and set:

```text
DVAA_LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama.default.svc.cluster.local:11434/v1
DVAA_LLM_MODEL=llama3.2
```

Use a GPU node or a tiny CPU model (`llama3.2:1b`) for demos.
