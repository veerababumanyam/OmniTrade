---
name: securing-trading-infrastructure
description: Manages the security, auditing, and role-based access control (RBAC) protocols for OmniTrade's trading operations. Use when implementing secret management (Vault), database permissions, or tamper-evident audit logs.
---

# Securing Trading Infrastructure

This skill provides the structure and patterns for OmniTrade's **Security & Compliance Layer**, ensuring that AI agents are isolated and all human actions are cryptographically auditable.

## When to use this skill
- When configuring PostgreSQL RBAC (e.g., `omnitrade_readonly` for AI agents vs. `omnitrade_executor` for humans).
- When integrating **HashiCorp Vault** or equivalent secret management for brokerage API keys.
- When implementing **Just-in-Time decryption** for live trade execution.
- When building **Tamper-Evident Audit Logs** with SHA-256 chaining.
- When adding secondary authentication (WebAuthn/TOTP) for trade approvals.

## Workflow

- [ ] **RBAC Isolation**: Ensure LLMs and Intelligence Plane agents ONLY use the read-only role (`GRANT SELECT ONLY`).
- [ ] **Secret Vaulting**: Securely store Interactive Brokers/Binance/Alpaca keys in Vault. NO plaintext `.env`.
- [ ] **JIT Decryption**: Decrypt keys ONLY in memory during the approved Action Plane session.
- [ ] **Audit Chaining**: Store the SHA-256 hash of (previous log + current payload) for every new audit entry (blockchain-style ledger).
- [ ] **Permission Audit**: Periodically verify that no `INSERT/UPDATE/DELETE` permissions were leaked to the `readonly` role.
- [ ] **HITL Verification**: Ensure the frontend Review UI displays the AI's "Chain of Thought" (CoT) and raw MinIO source links for human vetting.

## Instructions

### 1. Database RBAC (SQL)
```sql
-- Read-only role for AI Intelligence Plane
CREATE ROLE omnitrade_readonly;
GRANT SELECT ON market_data, fundamental_data TO omnitrade_readonly;

-- Executor role for Human Action Plane
CREATE ROLE omnitrade_executor;
GRANT INSERT, UPDATE ON trade_proposals, audit_logs TO omnitrade_executor;
```

### 2. Tamper-Evident Auditing (SQL/Go)
Chain audit logs to prevent database manipulation.
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    payload JSONB,
    crypto_hash VARCHAR(256), -- prev_hash + payload
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Secret Management (Vault)
- **Store**: `vault kv put secret/broker/alpaca apiKey=... secretKey=...`
- **Retrieve**: Use JIT decryption in the Action Plane Go handler upon human approval.

### 4. HITL Protocol
Ensure "Explainable AI" (XAI) is enforced. The user MUST see the reasoning before the "Approve" button is active.

## Resources
- [Security Checklist](resources/SECURITY_CHECKLIST.md)
- [Example: Audit Chaining](examples/audit_chain.go)
