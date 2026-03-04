# OmniTrade: Infrastructure & Deployment Plan

This document outlines the containerization and deployment strategy for OmniTrade, focusing on a "local-first" AI approach to ensure data privacy and zero-cost inference using open-source models.

## 1. Orchestration Strategy

The entire stack is designed to be managed via **Docker Compose** for local development and potential hybrid-cloud deployment.

### 1.1 Core Services
| Service | Technology | Role |
| :--- | :--- | :--- |
| **API Backend** | Go 1.26 | REST API, Genkit Orchestration, Tick Engine. |
| **Database** | PostgreSQL 16 + pgvector | Transactional data + Vector embeddings. |
| **Object Storage**| MinIO | Immutable S3-compatible storage for raw filings. |
| **AI Runtime** | Ollama / vLLM | Local inference server for LLMs and Embedding models. |
| **Frontend** | React 19 + Vite | "Liquid Glass" Dashboard & HITL Interface. |

## 2. Docker Compose Topology

```yaml
services:
  db:
    image: ankane/pgvector:v0.5.1
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]

  storage:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes:
      - miniodata:/data

  ollama:
    image: ollama/ollama
    volumes:
      - ollama_models:/root/.ollama
    # Add GPU support if available
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

  backend:
    build: ./backend
    depends_on:
      db:
        condition: service_healthy
    environment:
      OLLAMA_HOST: "http://ollama:11434"
      MINIO_ENDPOINT: "storage:9000"
      DATABASE_URL: "postgres://user:pass@db:5432/omnitrade"
```

## 3. Environment Configuration

OmniTrade uses a strict `.env` strategy to manage transitions between **Development** (Paper Trading) and **Production** (Live Brokerage).

- **`TRADING_MODE`**: `PAPER` | `LIVE`.
- **`AI_PROVIDER`**: `OLLAMA` (Default) | `OPENROUTER` (Fallback).
- **`SECRET_KEY`**: Used for JWT signing and local encryption of sensitive Action Plane logs.

## 4. Local AI Warm-up (The "First Run" Script)

Because we rely on open-source models, the deployment includes an automated "warm-up" script that pulls the required models upon initialization:

```bash
#!/bin/bash
# Warm-up script for OmniTrade AI Plane
docker exec -it ollama ollama pull nomic-embed-text:v1.5
docker exec -it ollama ollama pull llama3:8b
docker exec -it ollama ollama pull deepseek-coder:v3
```

## 5. Persistent Volume Management
To ensure the "storage-focused" requirement is met:
- **`pgdata`**: Persistent volume for the vector database.
- **`miniodata`**: Persistent volume for all raw PDF and news ingestion files.
- **Backups**: A separate cron service runs `pg_dump` and `mc mirror` (MinIO client) to an external off-site backup every 24 hours.
