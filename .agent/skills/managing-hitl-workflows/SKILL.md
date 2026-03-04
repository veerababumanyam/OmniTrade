---
name: managing-hitl-workflows
description: Implementing trade proposal submission, human approval/rejection flow, audit logging, and the proposal status lifecycle in OmniTrade. Use when implementing the Action Plane or HITL-based trade execution.
---

# Managing HITL Workflows

This skill provides the structure for OmniTrade's **Action Plane**, ensuring that AI agents never execute trades directly. Every trade proposal must pass through a Human-in-the-Loop (HITL) approval queue.

## When to use this skill
- When implementing the trade proposal submission logic (POST `/api/v1/proposals`).
- When building the human approval/rejection interface and API handlers.
- When managing the proposal status lifecycle (`PENDING_REVIEW` → `APPROVED/REJECTED` → `EXECUTED`).
- When implementing the immutable **Audit Log** for financial compliance.
- When designing the asynchronous **Execution Engine** (Brokerage API integration).

## Workflow

- [ ] **Submit with Confidence**: Enforce the `>= 0.70` confidence gate at the handler level before saving.
- [ ] **Initialize Status**: Set the initial status to `PENDING_REVIEW`. NO auto-approval.
- [ ] **Capture Audit Trace**: Append a `PROPOSED` event to the `audit_logs` with the agent's full Chain-of-Thought (CoT).
- [ ] **Human Review**: Route proposals to the Frontend Approval Queue for human adjudication.
- [ ] **Approved to Execute**: Only transition to `APPROVED` when a human reviewer ID is provided.
- [ ] **Async Execution**: Trigger the **Execution Engine** asynchronously after human approval. DO NOT execute trades in the HTTP request/response cycle.
- [ ] **Immutable Trail**: Block any `UPDATE` or `DELETE` on the `audit_logs` table (Append-only).

## Instructions

### 1. Proposal Status Lifecycle
- `PENDING_REVIEW`: Awaiting human action.
- `APPROVED`: Human has committed to the trade.
- `REJECTED`: Human has declined. No execution occurs.
- `EXECUTED`: Brokerage API call was successful.
- `FAILED`: Brokerage API call failed (insufficient funds, API error, etc.).

### 2. Audit Trail Rules
Every status transition must produce a corresponding `audit_logs` entry.
- **Actor**: Must be the agent model name (e.g., `claude-3-5-sonnet`) for proposals, or the human User ID for approvals/rejections.
- **Reasoning**: Preserve the AI's verbatim reasoning and the human's comments.

### 3. Execution Engine (Go)
Use a background worker or async trigger for brokerage API calls.
```go
func (e *Engine) Execute(ctx context.Context, proposalID string) {
    // 1. Fetch encrypted credentials (Vault)
    // 2. Place order with Broker API
    // 3. Update status and append audit log 'EXECUTED' or 'FAILED'
}
```

### 4. Precision Gate (SQL)
```sql
CREATE TABLE trade_proposals (
    status VARCHAR(20) DEFAULT 'PENDING_REVIEW',
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0.70)
);
```

## Resources
- [HITL Lifecycle Reference](resources/HITL_LIFECYCLE.md)
- [Example: Approval Handler](examples/approval_handler.go)
