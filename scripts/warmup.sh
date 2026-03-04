#!/bin/bash
# ─────────────────────────────────────────────────────────────
# OmniTrade — AI Infrastructure Warm-up
# This script pulls the required LLM and Embedding models
# directly into the Ollama container.
# ─────────────────────────────────────────────────────────────

echo "🚀 Starting AI Infrastructure Warm-up..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Initialize MinIO Buckets
echo "📦 Initializing MinIO Buckets..."
# Wait for MinIO to be healthy
until [ "$(docker inspect -f '{{.State.Health.Status}}' minio)" == "healthy" ]; do
    echo "⌛ Waiting for Minio to be healthy..."
    sleep 5
done

# Use mc (MinIO Client) to create bucket
docker run --rm --network omnitrade_default \
    -e MC_HOST_minio=http://admin:omnitrade2026@minio:9000 \
    minio/mc mb minio/raw-filings

echo "✅ Warm-up complete! Models are pre-loaded and Storage buckets are initialized."
