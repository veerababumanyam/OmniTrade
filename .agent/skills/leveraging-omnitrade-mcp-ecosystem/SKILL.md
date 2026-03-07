---
name: leveraging-omnitrade-mcp-ecosystem
description: Orchestrates and utilizes the OmniTrade MCP ecosystem for codebase intelligence, market research, and multi-model execution. Use when navigating the codebase, searching financial data, or choosing between LLM providers.
---

# Leveraging OmniTrade MCP Ecosystem

This skill provides the patterns for using the various Model Context Protocol (MCP) servers integrated into the OmniTrade platform. These servers extend the agent's capabilities across three domains: **Codebase Intelligence**, **Market Intelligence**, and **Execution Optimization**.

## When to use this skill
- When searching for specific logic or documentation across the codebase (**kilo-indexer**).
- When retrieving precise symbol implementations without reading full files (**jcodemunch**).
- When performing semantic search over SEC filings or financial news (**pgvector-server**).
- When prototyping or editing UI components visually (**StitchMCP**).
- When discovering or debugging backend flows (**genkit-mcp-server**).
- When coordinating multi-model analysis or cost-efficient LLM routing (**omnitrade-gateway**).

## MCP Servers Overview

### 1. Codebase Intelligence (Fast Brain)
- **`kilo-indexer`**: Semantic "Search Engine" for the codebase.
  - *Tool*: `codebase_search` (Search by intent, e.g., "Where is the signal consensus logic?").
  - *Tool*: `indexer_status` (Verify if the index is up-to-date).
- **`jcodemunch`**: Precision "Scalpel" for code symbols.
  - *Tool*: `search_symbols` (Find exact functions/classes/methods).
  - *Tool*: `get_symbol` (Retrieve byte-level implementation of a specific function).
  - *Tool*: `get_file_outline` (Understand file structure without loading all lines).

### 2. Market & Fundamental Intelligence (Deep Brain)
- **`pgvector-server`**: RAG access to the `omnitrade` database.
  - *Tool*: `search_sec_filings` (Semantic search across 10-K, 10-Q, 8-K filings).
  - *Tool*: `search_news` (Market mood search across global news feeds).
  - *Tool*: `get_fundamental_analysis` (Aggregate historical data for a symbol).
  - *Tool*: `summarize_text` (Condense long reports using local Ministral models).

### 3. Execution & Orchestration (Nervous System)
- **`omnitrade-gateway`**: LiteLLM-powered universal provider access.
  - Use when a specific model (e.g., Claude 3.5 Sonnet) is unavailable or when a cheaper model (e.g., Gemini 1.5 Flash) is sufficient for a sub-task.
- **`genkit-mcp-server`**: Real-time access to the Go Backend flows.
  - *Tool*: `list_flows` (Discover available trading or analysis flows).
  - *Tool*: `run_flow` (Execute a specific backend flow with JSON input).
- **`StitchMCP`**: Generative UI and Design system editing.
  - Use for creating or modifying "Liquid Glass" frontend components.

## Workflow Patterns

### Pattern A: Precise Code Refactoring
1. Use `kilo-indexer:codebase_search` to find the relevant modules.
2. Use `jcodemunch:get_file_outline` to map the target file.
3. Use `jcodemunch:get_symbol` to read only the implementation blocks you need to change.
4. Apply edits and verify.

### Pattern B: High-Conviction Market Analysis
1. Use `pgvector-server:search_sec_filings` to extract risk factors for a symbol.
2. Use `pgvector-server:search_news` to check for recent sentiment triggers.
3. Use `pgvector-server:summarize_text` to synthesize findings into a CoT (Chain-of-Thought) report.

### Pattern C: Agent-to-Agent Coordination
1. Discover the target agent's flow via `genkit-mcp-server:list_flows`.
2. Inspect input schemas.
3. Call the flow via `genkit-mcp-server:run_flow`.

## Resources
- [MCP Configuration](../../.gemini/antigravity/mcp_config.json)
- [MCP Integration Docs](../../docs/plugins/mcp-integration.md)
- [Three-Plane Architecture](../../docs/architecture/AI_Trading_System_Architecture.md)
