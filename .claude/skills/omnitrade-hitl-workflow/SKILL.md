---
name: omnitrade-hitl-workflow
description: Use when implementing trade proposal submission, human approval/rejection flow, audit logging, or the proposal status lifecycle in OmniTrade.
---

# OmniTrade HITL Trade Approval Workflow

## Overview

Human-in-the-Loop (HITL) is a hard constraint: AI agents **never** execute trades. Every proposal flows through: `PENDING_REVIEW → APPROVED/REJECTED → EXECUTED`. Human approval is required at the `APPROVED` stage before any brokerage API call.

## Proposal Lifecycle

```
Genkit Flow Output
       ↓
  REST Handler (write role)
       ↓
 trade_proposals INSERT (status=PENDING_REVIEW)
       ↓
 Frontend Approval Queue displays proposal
       ↓
  Human: Approve / Reject
       ↓
APPROVED → Execution Engine → Brokerage API
REJECTED → audit_log entry, no execution
```

## Database Schema

```sql
CREATE TABLE trade_proposals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol              VARCHAR(10) REFERENCES stock_assets(symbol),
    action              VARCHAR(10) CHECK (action IN ('BUY', 'SELL', 'HOLD')),
    confidence_score    DECIMAL(3, 2) CHECK (confidence_score >= 0.70), -- enforced at DB level
    reasoning           TEXT NOT NULL,
    chain_of_thought    TEXT,
    proposed_by_model   VARCHAR(50) NOT NULL,
    status              VARCHAR(20) DEFAULT 'PENDING_REVIEW'
                            CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXECUTED')),
    reviewed_by         VARCHAR(100),          -- human reviewer ID
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Immutable audit trail — append only, no UPDATE/DELETE
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES trade_proposals(id),
    event_type  VARCHAR(50) NOT NULL,   -- 'PROPOSED', 'APPROVED', 'REJECTED', 'EXECUTED'
    actor       VARCHAR(100) NOT NULL,  -- agent model name or human user ID
    reasoning   TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

## Submitting a Proposal (Handler)

```go
// POST /api/v1/proposals — called after Genkit flow returns
func (h *Handler) SubmitProposal(w http.ResponseWriter, r *http.Request) {
    var output agent.TradeProposalOutput
    if err := json.NewDecoder(r.Body).Decode(&output); err != nil {
        http.Error(w, "invalid body", http.StatusBadRequest)
        return
    }

    // Enforce confidence gate
    if output.ConfidenceScore < 0.70 {
        http.Error(w, "confidence below threshold", http.StatusUnprocessableEntity)
        return
    }

    proposal, err := h.db.InsertProposal(r.Context(), output)
    if err != nil {
        http.Error(w, "failed to save proposal", http.StatusInternalServerError)
        return
    }

    // Write audit entry
    h.db.AppendAuditLog(r.Context(), AuditEntry{
        ProposalID: proposal.ID,
        EventType:  "PROPOSED",
        Actor:      output.ProposedByModel,
        Reasoning:  output.ChainOfThought,
    })

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(proposal)
}
```

## Approving a Proposal

```go
// POST /api/v1/proposals/{id}/approve
func (h *Handler) ApproveProposal(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    reviewerID := extractUserID(r) // from JWT

    if err := h.db.UpdateProposalStatus(r.Context(), id, "APPROVED", reviewerID); err != nil {
        http.Error(w, "failed to approve", http.StatusInternalServerError)
        return
    }

    h.db.AppendAuditLog(r.Context(), AuditEntry{
        ProposalID: uuid.MustParse(id),
        EventType:  "APPROVED",
        Actor:      reviewerID,
        Reasoning:  "Human approval",
    })

    // Trigger async execution — do NOT execute synchronously in HTTP handler
    go h.executionEngine.Execute(context.Background(), id)

    w.WriteHeader(http.StatusAccepted)
}
```

## Audit Log Rules

- Audit log is **append-only** — no UPDATE or DELETE permitted
- Every status transition must produce an audit entry
- Actor field must be: model name (AI actions) or user ID (human actions)
- All reasoning text must be preserved verbatim
- Timestamps use `TIMESTAMPTZ` (always UTC)

## Execution Engine Pattern

```go
// Runs async after human approval
func (e *ExecutionEngine) Execute(ctx context.Context, proposalID string) {
    proposal, _ := e.db.GetProposal(ctx, proposalID)

    // Decrypt brokerage API key (HashiCorp Vault / env secrets)
    apiKey := e.vault.GetBrokerKey(ctx)

    // Execute trade against broker API
    result, err := e.brokerClient.PlaceOrder(ctx, BrokerOrder{
        Symbol:   proposal.Symbol,
        Action:   proposal.Action,
        Quantity: proposal.RecommendedSize,
    })

    status := "EXECUTED"
    if err != nil {
        status = "FAILED"
    }

    e.db.UpdateProposalStatus(ctx, proposalID, status, "system")
    e.db.AppendAuditLog(ctx, AuditEntry{
        ProposalID: uuid.MustParse(proposalID),
        EventType:  status,
        Actor:      "execution_engine",
        Metadata:   result,
    })
}
```

## Frontend Approval Queue

Display `PENDING_REVIEW` proposals with:
- Symbol + Action badge (BUY=green, SELL=red)
- Confidence score bar
- AI reasoning text
- Chain-of-thought (expandable)
- Approve / Reject buttons

Poll or WebSocket for real-time updates.

## API Endpoints

```
GET  /api/v1/proposals              # List PENDING_REVIEW proposals
GET  /api/v1/proposals/{id}         # Get proposal detail + audit trail
POST /api/v1/proposals/{id}/approve # Approve (human only)
POST /api/v1/proposals/{id}/reject  # Reject (human only)
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Executing trade in HTTP handler | Use async execution engine |
| AI flow writes proposal directly | Flow returns output → handler inserts |
| Missing audit log on transition | Every status change = audit entry |
| Skipping confidence gate in handler | Enforce 0.70 minimum at handler |
| Using float for confidence_score | Use `DECIMAL(3,2)` in DB, decimal.Decimal in Go |
