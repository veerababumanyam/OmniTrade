# OmniTrade Implementation Plan

## Goal Description
Build a world-class, institutional-grade AI Trading Platform (OmniTrade) from scratch. The system requires a strict three-plane architecture (Data, Intelligence, Action), utilizing a Go 1.26+ backend, React 19 + Vanilla CSS "Liquid Glass" frontend, and Google Genkit for AI orchestration. 

This plan incorporates the architectural blueprints discovered from state-of-the-art Python reference repositories (e.g., `ai-hedge-fund`, `equity-research-agent`) and maps them to our required technology stack.

## Proposed Changes / Phased Execution

---

### Phase 1: Foundation & Data Plane (Read-Only)
*Goal: Establish the robust, secure Go backend and real-time data ingestion pipelines.*

1. **Database Strategy (`sqlx` + PostgreSQL)**
   - Define strict RBAC: Agents only get `medisync_readonly` connections.
   - Set up tables for: `users`, `assets`, `market_data_ticks`, `immutable_audit_log`, `portfolios`.
   - Setup pgvector for storing RAG document embeddings (SEC filings, news).
2. **REST API Core (`go-chi`)**
   - Implement Auth (JWT / WebAuthn).
   - Scaffold standard CRUD endpoints for users and portfolio views.
3. **Data Ingestion Services (The "Tick" Engine)**
   - Connect to standard Market Data providers (e.g., Polygon.io, Alpaca) via WebSockets.
   - Implement the *Data Retrieval Pipeline* (inspired by `LLM-Search-RAG`): Fetch Price -> Search News -> Store in Vector DB.

---

### Phase 2: Intelligence Plane (Google Genkit Multi-Agent System)
*Goal: Replicate the Python multi-agent topologies (from `ai-hedge-fund` and `equity-research-agent`) natively in Go using Genkit.*

1. **Agent Setup & Tooling**
   - Initialize Google Genkit in the Go backend.
   - Create specific Go functions (tools) that Genkit agents can call (e.g., `GetStockPrice(ticker string)`, `QueryNewsVectorDB(ticker string)`).
2. **The Agent Hierarchy (The Debate Topology)**
   - **Data Analyst Agent:** Summarizes SEC filings and real-time news using RAG.
   - **Quantitative Agent:** Evaluates hard numerical factors (moving averages, momentum) utilizing traditional algorithmic heuristics.
   - **Risk Manager Agent:** Evaluates portfolio exposure and sets hard stop-loss limits (circuit breakers).
   - **Portfolio Manager Agent (The Chief):** Takes signals from Data, Quant, and Risk agents. Forces a "debate" if signals conflict, then generates a final `TradeProposal` JSON output.

---

### Phase 3: Action Plane (Human-in-the-Loop)
*Goal: Ensure the AI cannot execute trades autonomously without cryptographic auditing and user approval.*

1. **Trade Proposal Queue**
   - When the Portfolio Manager generates a `TradeProposal`, write it to the database with a status of `PENDING_REVIEW`.
2. **Explainable AI (XAI)**
   - Ensure the proposal includes the *exact source citations* (e.g., "Buying AAPL because Risk Agent approved and Data Agent found positive sentiment in Q3 10-K, paragraph 4").
3. **Approval Execution Engine**
   - Build the endpoint where a human verifies and approves the trade.
   - Upon approval, securely decrypt brokerage API keys (via HashiCorp Vault pattern) and execute the trade against the live broker API.
4. **Audit Logging**
   - Cryptographically hash and log the AI's reasoning, the retrieved data, and the human's approval timestamp to the `immutable_audit_log`.

---

### Phase 4: The "Liquid Glass" Frontend (React 19 + Vite)
*Goal: Deliver the premium, wow-factor UI required by the project constraints.*

1. **Foundation**
   - Finalize Vite + React template setup.
   - Implement the pure Vanilla CSS design system (glassmorphism panels, smooth gradients, modern typography).
2. **Command Center Dashboard**
   - Build resizable, draggable widget panels for viewing real-time charts and portfolio balances.
3. **HITL Review Queue UI**
   - Create a Tinder-style or modal-based "Approval Queue" component where the human user reviews the `TradeProposals` and their AI-generated justifications.
4. **Generative AI Chat**
   - Implement the natural language query bar (CopilotKit style) so the user can chat with the Portfolio Manager Agent directly ("Why did we buy TSLA yesterday?").

---

## Verification Plan

### Automated Tests
- **Go Backend:** Unit test all database queries, specifically testing that the `medisync_readonly` role *cannot* execute `INSERT`/`UPDATE` commands on data tables.
- **Agent Testing:** Create mock market data JSON files and write Go tests covering the Genkit flows. Ensure the *Risk Manager Agent* correctly vetos trades that violate circuit breaker rules.

### Manual Verification
- **Paper Trading:** We will connect the Action Plane to a Paper Trading / Mock Broker API.
- **User Simulator:** We will manually inject fake breaking news into the Vector DB to ensure the Data Analyst Agent picks it up, passes it to the Portfolio Manager, and successfully generates a `PENDING_REVIEW` trade.
- **Frontend Audits:** Verify the "Liquid Glass" aesthetic across different modern browsers to ensure animations and gradients render correctly.
