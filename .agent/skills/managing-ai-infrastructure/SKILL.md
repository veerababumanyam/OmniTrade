---
name: managing-ai-infrastructure
description: Manages the local-first AI infrastructure for OmniTrade, including Docker Compose orchestration, Ollama/vLLM inference servers, and MinIO object storage. Use when configuring AI runtimes, inference models, or object storage buckets.
---

# Managing AI Infrastructure

This skill provides the structure and patterns for OmniTrade's **Inference & Storage Layer**, focusing on local-first AI to ensure data privacy and zero-cost inference.

## When to use this skill
- When configuring Docker Compose for AI services (Ollama, vLLM, MinIO, pgvector).
- When pulling or managing LLM/Embedding models (e.g., Llama 3, DeepSeek, Nomic).
- When setting up MinIO buckets for raw financial filings and news.
- When implementing "warm-up" scripts for the AI Intelligence Plane.
- When managing persistent volumes for vector data (`pgdata`) or objects (`miniodata`).

## Workflow

- [ ] **Docker Service Mesh**: Ensure Ollama and MinIO are healthy and reachable via internal Docker networking.
- [ ] **Model Lifecycle**: Use `ollama pull` or vLLM equivalents to ensure required models are pre-loaded.
- [ ] **Bucket Initialization**: Create a `raw-filings` bucket in MinIO with appropriate access policies.
- [ ] **Environment Mapping**: Set `OLLAMA_HOST` and `MINIO_ENDPOINT` in the Go backend's environment.
- [ ] **Validation Check**: Verify GPU acceleration availability if using NVIDIA-enabled containers.
- [ ] **Audit Backup**: Configure `pg_dump` and `mc mirror` for daily 24h off-site snapshots.

## Instructions

### 1. Docker Compose Patterns
Use named volumes and health checks to ensure dependencies are ready before the backend starts.
```yaml
services:
  ollama:
    image: ollama/ollama
    volumes: [ollama_models:/root/.ollama]
    healthcheck:
      test: ["CMD", "ollama", "list"]
  storage:
    image: minio/minio
    command: server /data
```

### 2. AI Warm-up (The "First Run" Script)
LLMs must be pre-pulled for zero-latency startup.
- **Model Standard**: `nomic-embed-text:v1.5` for RAG, `llama3:8b` for general analysis.
- **Coder Standard**: `deepseek-coder:v3` for technical/quantitative tasks.

### 3. MinIO Configuration
- Use the MinIO console (`:9001`) for initial bucket setup.
- Access the API via `storage:9000` from other containers.

### 4. GPU Support
Uncomment the `deploy: resources: reservations: devices` block in `docker-compose.yaml` to enable NVIDIA GPU passthrough for faster inference.

## Resources
- [Docker Compose Topology](resources/INFRA_TOPOLOGY.yaml)
- [Example: Warm-up Script](scripts/warmup.sh)
