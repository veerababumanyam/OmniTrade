# OmniTrade Caching Architecture

> **Version:** 1.0 · **Date:** 2026-03-04 · **Status:** Active

## Overview

OmniTrade utilizes a multi-layered caching architecture to reduce LLM API costs, minimize latency, and protect systemic resources. This document outlines the three pillars of our caching strategy:

1. **Prompt Caching** (Provider-Side)
2. **Semantic Caching** (Application-Side)
3. **Redis Integration** (In-Memory Infrastructure)
4. **Tiered Memory System** (Agent Context Layers)

---

## 1. Prompt Caching

Prompt Caching leverages features provided by LLM providers (e.g., Anthropic Claude, OpenAI, Google Gemini) to cache context that is repeatedly sent across API requests. This drastically reduces the Time-To-First-Token (TTFT) and input token costs for our multi-agent system.

### Architectural Rules for Agents

To ensure Prompt Caching engages correctly, all Genkit agents MUST adhere to the following rules:

1. **Static System Instructions First**: The system prompt (agent persona, strict trading rules, output schema formats) must be placed at the *absolute beginning* of the prompt structure.
2. **Minimum Token Threshold**: Providers typically require a minimum prompt size (e.g., >1024 tokens) to trigger caching. OmniTrade's complex agent instructions naturally exceed this, but they must remain contiguous.
3. **Immutability of the Prefix**: The static portion of the prompt must match *exactly* (character for character) across requests. Any dynamic data (current market price, user query, timestamp) MUST be appended *after* the static system instructions.

**Caching Pattern:**
```text
[STATIC] Core Agent Persona & Rules (Cached)
[STATIC] JSON Output Schema Definition (Cached)
[STATIC] Historical / Background Context (Cached)
--- Caching Boundary ---
[DYNAMIC] Current Market Data (Not Cached)
[DYNAMIC] Recent News Context (Not Cached)
[DYNAMIC] Specific User Query (Not Cached)
```

---

## 2. Semantic Caching

While Prompt Caching optimizes the processing of identical *instructions*, Semantic Caching avoids calling the LLM entirely for identical or highly similar *queries*.

### The Semantic Cache Flow

When a request arrives at the Intelligence Plane (e.g., `GenerateTradeProposal` for AAPL):

1. **Embedding**: The application generates a vector embedding of the incoming query (e.g., "Analyze AAPL value").
2. **Similarity Search**: The embedding is compared against a Redis Vector database containing recently asked queries.
3. **Cache Hit**: If a mathematically similar query is found (e.g., Cosine Similarity > 0.95) within the Time-To-Live (TTL) window, the previously generated LLM answer (the `TradeProposalOutput`) is returned instantly.
4. **Cache Miss**: If no match is found, the system proceeds with the standard RAG and LLM execution pipeline. The new question and its resulting answer are then embedded and stored in Redis for future hits.

### TTL Strategy
- **High Volatility Hours (Market Open/Close)**: Cache TTL = 5-15 minutes. Market conditions change rapidly; answers shouldn't be overly stale.
- **Low Volatility / After Hours**: Cache TTL = 1-4 hours.

---

## 3. Tiered Memory System

To prevent context bloat and optimize token usage, OmniTrade implements a **structured, tiered approach to agent memory**, utilizing Redis and PostgreSQL:

### 3.1 Working Memory (Short-Term Context)
- **Scope**: The immediate, short-term context of the current active task (e.g., analyzing a specific stock over a single session).
- **Storage**: Redis Lists (fast access, volatile).
- **Usage**: Provides the agent with the immediate context of the ongoing conversation/analysis step. It is cleared or summarized when a task concludes.

### 3.2 Episodic Memory (Experience & History)
- **Scope**: A log of past actions, decisions, and their outcomes.
- **Storage**: Redis Vector DB or PostgreSQL `pgvector`.
- **Usage**: Allows the agent to retrieve past experiences via similarity search. For example, if the current market conditions resemble a past trade for AAPL, the agent can recall how it successfully (or unsuccessfully) handled that pattern previously. This is the foundation of the agent's "experience."

### 3.3 Semantic / User Memory (Facts & Rules)
- **Scope**: Explicitly stored facts, global rules, and user preferences (e.g., "Always emphasize risk in volatile markets" or "Never trade TSLA during earnings week").
- **Storage**: PostgreSQL relational tables (`agent_model_config` / user preferences).
- **Usage**: Retrieved at the start of a session and injected directly into the Prompt Cache layer as definitive, non-negotiable instructions.

---

## 4. Redis Infrastructure

Redis 8.x serves as the high-performance, in-memory backbone for OmniTrade's ephemeral data planes, including caching and tiered memory processing.

### Redis Roles

| Role | Redis Data Structure | Purpose |
|:-----|:---------------------|:--------|
| **Semantic Cache** | Hashes (with Vector Search) | Storing vectorized queries and their LLM responses for quick similarity lookups. |
| **API Rate Limiting**| Sorted Sets / Strings | Protecting backend endpoints from abuse (e.g., limiting expensive LLM queries per user per minute). |
| **Working Memory** | Lists | Fast retrieval of recent turn-by-turn chat context and immediate task states. |
| **Episodic Memory** | Hashes (with Vector Search) | Vectorized storage of past agent decisions/outcomes for experiential recall. |
| **Pub/Sub** | Streams | Future capability for broadcasting live WebSocket ticker data to clients. |

### Semantic Cache Schema in Redis

When a query is cached, we store a Hash structure in Redis:

- **Key**: `semantic_cache:{UUID}`
- **Fields**:
  - `query` (text): The original user query or intent.
  - `embedding` (vector blob): The embedding representation of the query.
  - `response` (text): The serialized JSON response from the LLM.
  - `created_at` (timestamp): When the cache entry was created.

A RediSearch index allows testing the cosine similarity of an incoming embedding against the `embedding` fields in the `semantic_cache:*` namespace.
