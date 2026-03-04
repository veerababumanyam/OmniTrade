# OmniTrade: Data Ingestion Pipeline Strategy

To feed the Intelligence Plane with real-time quantitative data and high-quality fundamental context, OmniTrade requires a robust, two-part data ingestion system. This operates entirely within the **Data Plane**.

## 1. The "Tick" Engine (Quantitative Data)

The Tick Engine is a high-throughput, low-latency Go service responsible for maintaining live price action and order book data.

### 1.1 Architecture
- **Protocol**: WebSockets (WSS).
- **Data Providers**: Polygon.io or Alpaca (for standardized equities/crypto data).
- **Service Structure**: A dedicated Go Goroutine per WebSocket connection/channel.
- **Buffering**: Incoming ticks are placed on a Go channel, batched, and written to PostgreSQL in bulk to prevent database locking.

### 1.2 Flow
1. **Connection**: The Go service establishes a WSS connection to the provider and subscribes to the `aggregate_minute` (1m or 5m candles) stream for the tracked portfolio assets.
2. **Buffer**: Ticks are collected in memory using a ring buffer.
3. **Flushing**: Every 10 seconds, the buffer is flushed via a bulk `INSERT` into the PostgreSQL `market_data` table.
4. **Broadcast**: Simultaneously, the latest price is broadcast via a local Redis Pub/Sub channel or Server-Sent Events (SSE) directly to the React React/Vite frontend (Dashboard) so the user sees live prices.

**Schema Target:**
```sql
INSERT INTO market_data (symbol, price, volume, timestamp) VALUES ...
```

## 2. The Document Ingestion & RAG Pipeline (Fundamental Data)

This is a slower, background worker process (Cron or Task Queue) responsible for keeping the RAG vector database up-to-date with the latest news and SEC filings.

### 2.1 Scraping & Fetching
- **Trigger**: Runs nightly (for SEC filings) or hourly (for financial news RSS feeds).
- **Sources**: SEC EDGAR API, Yahoo Finance News API, or specialized alternative data providers.
- **Immutable Storage**: The raw fetched files (PDFs, HTML, JSON) are immediately written to **MinIO** object storage. This is critical for the audit trail.

### 2.2 Parsing & Chunking (The Pipeline)
Once a file is in MinIO, an asynchronous Go worker queues the file for processing:
1.  **Extract Text**: Unstructured text is extracted from the PDF or HTML, cleaning out boilerplate navigation and styling.
2.  **Semantic Chunking**: The text is split into overlapping chunks (e.g., 512 tokens with a 50-token overlap). Headers and structural metadata are preserved.
3.  **Embedding**: The Go worker sends an HTTP request to the local **Ollama** instance running `nomic-embed-text-v1.5`. The text chunk is converted into a 768-dimensional float vector.
4.  **Vector DB Storage**: The chunk, its metadata, the vector, and the MinIO `document_id` are saved to PostgreSQL via the `pgvector` extension.

**Schema Target:**
```sql
-- The embedding process outputs data for this table
INSERT INTO fundamental_data (symbol, document_id, content, embedding) VALUES ...
```

## 3. Rate Limiting & Error Handling

- **Circuit Breakers**: Both the Tick Engine and Document Ingestion pipelines implement HTTP/WSS circuit breakers. If Polygon.io API starts returning 429s (Rate Limit Exceeded), the ingestion pauses with exponential backoff.
- **Dead Letter Queues**: If a PDF fails to parse or embed correctly, its `document_id` is sent to a Dead Letter Queue table for manual inspection, ensuring the pipeline doesn't crash on bad data.
- **Data Pruning**: Historical `market_data` older than 30 days that has been rolled up into Daily/Weekly candles is moved to cold storage to keep the primary PostgreSQL database performant for the AI Genkit flows.
