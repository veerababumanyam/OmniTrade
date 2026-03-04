# Technical Specification: OmniTrade AI Platform

## 1. System Components

The system is divided into three primary services:
1.  **Data Ingestion Service (Go)**: Connects to WebSockets/APIs (Binance, Polygon) and writes to the database.
2.  **Intelligence Service (Go/Genkit)**: Hosts the Genkit flows and agents. Uses the `medisync_readonly` database role.
3.  **Frontend Interface (React/Vite)**: The user-facing dashboard for HITL approval and strategy monitoring.

## 2. Database Schema (PostgreSQL)

The database enforces security through role-based access. AI agents cannot write to primary tables.

### 2.1 Core Tables
```sql
-- Read-only to AI agents
CREATE TABLE stock_assets (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100),
    sector VARCHAR(50)
);

CREATE TABLE market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    price DECIMAL(15, 4),
    volume BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fundamental_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    report_type VARCHAR(20), -- 10-K, 10-Q
    content TEXT,
    embedding vector(1536) -- For RAG
);
```

### 2.2 Action Plane Tables
```sql
-- Read/Write accessible for Audit & Execution (Not accessible directly by AI flows)
CREATE TABLE trade_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    action VARCHAR(10), -- BUY/SELL
    confidence_score DECIMAL(3, 2),
    reasoning TEXT,
    proposed_by_model VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES trade_proposals(id),
    action_taken VARCHAR(50),
    user_id UUID,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Intelligence Plane: Genkit Agent Flows

The orchestration relies on Google Genkit to manage agent interactions.

### 3.1 Flow: `GenerateTradeProposal`
**Input Schema:**
```json
{
  "symbol": "AAPL",
  "strategy": "mid_term_growth",
  "allocator_budget": 10000
}
```

**Steps:**
1.  **Data Fetcher Node**: Queries `market_data` for current price and MACD/RSI indicators. (Fast, deterministic).
2.  **RAG Node**: Queries `fundamental_data` using vector search for recent earnings call context.
3.  **Analysis Node (Model: FinGPT or Llama-3-8B)**: Summarizes RAG context to minimize token usage.
4.  **Portfolio Manager Node (Model: Claude 3.5 Sonnet / GPT-4o)**: Synthesizes technical indicators and summarized fundamentals to output a final decision.

**Output Schema (Trade Proposal):**
```json
{
  "symbol": "AAPL",
  "action": "BUY",
  "confidence": 0.85,
  "reasoning": "Strong Q3 earnings offset short-term RSI overbought conditions. Value buy.",
  "risk_assessment": "Medium volatility expected next week due to Fed meeting."
}
```

## 4. Frontend Application Architecture

### 4.1 Tech Stack 
- React 19 + TypeScript
- Build Tool: Vite
- Styling: Vanilla CSS (Liquid Glass design system)
- State Management: React Context / Zustand
- Generative UI: CopilotKit

### 4.2 Key Views
1.  **Dashboard**: High-level overview of portfolio value and currently active LLM models.
2.  **Signal Review (HITL)**: A dedicated inbox of `PENDING` trade proposals. Displays the AI's "chain-of-thought", references (links to filings), and [Approve]/[Reject] buttons.
3.  **Strategy Configurator**: Interface to assign specific LLM providers (OpenAI, DeepSeek, Ollama) to specific agent roles (e.g., using Ollama for local low-level parsing to save API costs).

## 5. Multi-LLM Routing Layer
The Intelligence Service manages a configuration file/DB mapping agent roles to LLM clients:
```yaml
llm_routing:
  fundamental_summarizer:
    provider: "ollama"
    model: "llama3:8b"
  portfolio_manager:
    provider: "anthropic"
    model: "claude-3-5-sonnet-20240620"
  sentiment_analyst:
    provider: "deepseek"
    model: "deepseek-chat"
```
This ensures token efficiency and vendor independence.
