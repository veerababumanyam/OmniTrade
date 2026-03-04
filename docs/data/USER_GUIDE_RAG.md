# OmniTrade RAG Codebase Indexer - User Guide

This guide explains how to use the built-in Semantic Search (RAG) system for your codebase. This system acts similarly to "Context" in advanced IDEs, providing LLMs (Claude Code, Cursor, Google Antigravity) with precise, semantically relevant code snippets.

## 1. How It Works
The system follows a three-step pipeline:
1. **Discovery**: Watches your workspace for code changes.
2. **Embedding**: Uses local Ollama (`embeddinggemma:300m`) to turn code into numeric vectors.
3. **Retrieval**: Stores these vectors in your OmniTrade PostgreSQL database (`pgvector`) for lightning-fast similarity search.

## 2. Using it in Chat / IDEs

### Claude Code
I have already added the configuration to your `.mcp.json`.
1. **Restart Claude**: Run `exit` and then restart the `claude` command.
2. **Verify Interface**: Type `/mcp` in Claude. You should see `kilo-indexer` active.
3. **Query**: Ask Claude:
   - *"Use codebase_search to find where the Risk Manager veto logic is implemented"*
   - *"How does the websocket ingestion pipeline handle disconnections?"*

### Cursor / VS Code
Add a new MCP server in Cursor settings:
- **Type**: Stdio
- **Command**: `C:\Users\admin\Desktop\OmniTrade\backend\rag-indexer.exe`
- **Args**: `--mcp --workspace C:\Users\admin\Desktop\OmniTrade`

## 3. Frequent Updates & Live Sync

### Automatic Live Sync (Enabled)
The indexer includes an **FSNotify-based File Watcher**. 
- Whenever you save a file in VS Code or via an agent, the indexer detects the change instantly.
- It computes a hash of the file. If the hash has changed, it re-indexes only that specific file.
- **You don't need to do anything manually.** It stays in sync while running.

### Git Branch Tracking
The system includes a **Branch Watcher**.
- If you switch git branches (e.g., from `main` to `feature-xyz`), the system detects the branch change.
- It will automatically trigger a re-scan of the workspace to ensure the "Context" matches your current branch state.

### Manual Refresh
If you ever feel the index is out of date, you can force a re-index:
1. Kill the `rag-indexer.exe` process (or restart the IDE).
2. It will perform a "Full Scan" on startup, using its local SQLite cache (`.rag_cache.db`) to quickly skip unchanged files.

## 4. Troubleshooting Index Status
You can ask your agent: `Call kilo-indexer:indexer_status`
- **Standby**: Not running.
- **Indexing**: Busy processing new changes.
- **Indexed**: All code is up-to-date.
- **Error**: Potential connection issue with Ollama or Postgres.

## 5. Configuration (Agnostic)
Customize what is indexed by creating or editing:
- `.gitignore`: Standard exclusion.
- `.codebaseignore`: Custom exclusions for all AI tools.
- `.ragignore`: Specific exclusions only for this RAG indexer.

Files larger than **1MB** or known binary formats are skipped automatically to keep the index clean.
