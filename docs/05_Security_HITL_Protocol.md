# OmniTrade: Security, Auditing & HITL Protocol

This document outlines the strict security measures, role-based access controls, and the Human-in-the-Loop (HITL) approval process required to deploy AI agents safely in a financial context.

## 1. Database Role-Based Access Control (RBAC)

The foundational security principle of OmniTrade is that **AI agents cannot execute trades.** They exist purely in the Intelligence Plane.

- **`medisync_readonly` Role**: The Go service hosting the Genkit flows connects to PostgreSQL using this role.
  - **Permissions**: `GRANT SELECT ON market_data, fundamental_data, stock_assets;`
  - **Restriction**: If an LLM attempts prompt injection or writes malicious SQL, the database will reject any `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` commands.

- **`omnitrade_executor` Role**: Only the human-authenticated API endpoints (Action Plane) connect using this role.
  - **Permissions**: Can write to `trade_proposals`, `audit_logs`, and update `portfolios`.

## 2. Cryptographic Secrets Management

To interact with live brokerages (e.g., Interactive Brokers, Alpaca, Binance), OmniTrade needs API keys.
- **Vaulting**: Live brokerage API credentials are NEVER stored in plaintext or accessible to the Genkit flows. They are stored in a secure secret manager (e.g., HashiCorp Vault or AWS Secrets Manager).
- **Just-in-Time Decryption**: The keys are only decrypted in memory by the Go backend at the exact millisecond a human user clicks "Approve Trade" on the frontend.

## 3. Human-In-The-Loop (HITL) Approval Flow

1. **Generation**: The Genkit Portfolio Manager generates a `TradeProposal` (Symbol, Action, Confidence, Context).
2. **Queueing**: The Go backend inserts this row into the `trade_proposals` table with `status = 'PENDING'`.
3. **Review UI**: 
   - The React frontend fetches pending proposals and displays them in a "Signal Review" dashboard.
   - The required Explainable AI (XAI) forces the UI to show the user the AI's step-by-step reasoning ("Chain of Thought").
   - The UI displays clickable links to the underlying MinIO documents so the human can verify the AI didn't hallucinate facts.
4. **Action**: The human user clicks `[Approve]` or `[Reject]`.
   - If **Rejected**: The proposal status updates to `REJECTED`. The human can optionally provide feedback to fine-tune future RAG prompts.
   - If **Approved**: The user is prompted for a secondary authentication token (e.g., WebAuthn or TOTP).

## 4. Immutable Audit Logging

Every significant action within the Action Plane is recorded in the `audit_logs` table.

**Audit Event Triggers:**
- A human approves a trade.
- A human rejects a trade.
- An Administrator hot-swaps the underlying LLM assigned to an agent.
- A Risk Manager agent vetoes a portfolio trade based on hard-coded rules.

**Audit Record Structure:**
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50), -- e.g., 'TRADE_EXECUTED', 'CONFIG_CHANGED'
    proposal_id UUID REFERENCES trade_proposals(id),
    user_id UUID, -- The human who executed the action
    ai_model_version VARCHAR(100), -- Exactly which LLM made the recommendation
    action_payload JSONB, -- The exact trade parameters or config changes
    crypto_hash VARCHAR(256), -- SHA-256 hash of the previous log + current payload (blockchain-style tamper evidence)
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

By hashing previous logs with the current payload, the audit table becomes a tamper-evident ledger, satisfying compliance requirements for algorithmic trading operations.
