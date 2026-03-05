package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/v13478/omnitrade/backend/internal/action"
)

// ActionPlaneAPI handles Action Plane (HITL) endpoints
type ActionPlaneAPI struct {
	actionDB *action.ActionPlaneDB
}

// NewActionPlaneAPI creates a new Action Plane API handler
func NewActionPlaneAPI(actionDB *action.ActionPlaneDB) *ActionPlaneAPI {
	return &ActionPlaneAPI{actionDB: actionDB}
}

// SetupActionRoutes sets up the Action Plane routes
func (a *ActionPlaneAPI) SetupActionRoutes(r chi.Router) {
	r.Route("/proposals", func(r chi.Router) {
		r.Post("/", a.HandleCreateProposal)
		r.Post("/{id}/approve", a.HandleApproveProposal)
		r.Post("/{id}/reject", a.HandleRejectProposal)
		r.Post("/{id}/execute", a.HandleExecuteProposal)
	})

	r.Post("/audit", a.HandleGetAuditLogs)
}

// ProposalRequest represents a proposal creation request
type ProposalRequest struct {
	Symbol          string  `json:"symbol"`
	Action          string  `json:"action"`
	ConfidenceScore float64 `json:"confidence_score"`
	Reasoning       string  `json:"reasoning"`
	ProposedByModel string  `json:"proposed_by_model"`
}

// ProposalResponse represents a proposal response
type ProposalResponse struct {
	ID              string  `json:"id"`
	Symbol          string  `json:"symbol"`
	Action          string  `json:"action"`
	ConfidenceScore float64 `json:"confidence_score"`
	Reasoning       string  `json:"reasoning"`
	ProposedByModel string  `json:"proposed_by_model"`
	Status          string  `json:"status"`
	CreatedAt       string  `json:"created_at"`
}

// HandleCreateProposal creates a new trade proposal
func (a *ActionPlaneAPI) HandleCreateProposal(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req ProposalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Symbol == "" || req.Action == "" || req.Reasoning == "" {
		http.Error(w, "missing required fields: symbol, action, reasoning", http.StatusBadRequest)
		return
	}

	// Validate action
	if req.Action != "BUY" && req.Action != "SELL" {
		http.Error(w, "action must be BUY or SELL", http.StatusBadRequest)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID := GetUserID(ctx)
	if userID == "" {
		userID = "system" // Fallback for development
	}

	proposal := &action.TradeProposal{
		Symbol:          req.Symbol,
		Action:          req.Action,
		ConfidenceScore: req.ConfidenceScore,
		Reasoning:       req.Reasoning,
		ProposedByModel: req.ProposedByModel,
	}

	if err := a.actionDB.CreateProposal(ctx, proposal); err != nil {
		http.Error(w, "failed to create proposal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := ProposalResponse{
		ID:              proposal.ID,
		Symbol:          proposal.Symbol,
		Action:          proposal.Action,
		ConfidenceScore: proposal.ConfidenceScore,
		Reasoning:       proposal.Reasoning,
		ProposedByModel: proposal.ProposedByModel,
		Status:          proposal.Status,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// HandleApproveProposal approves a trade proposal
func (a *ActionPlaneAPI) HandleApproveProposal(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	if id == "" {
		http.Error(w, "missing proposal ID", http.StatusBadRequest)
		return
	}

	// Get user ID from context
	userID := GetUserID(ctx)
	if userID == "" {
		userID = "system"
	}

	if err := a.actionDB.ApproveProposal(ctx, id, userID); err != nil {
		http.Error(w, "failed to approve proposal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "APPROVED"})
}

// HandleRejectProposal rejects a trade proposal
func (a *ActionPlaneAPI) HandleRejectProposal(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	if id == "" {
		http.Error(w, "missing proposal ID", http.StatusBadRequest)
		return
	}

	// Get user ID from context
	userID := GetUserID(ctx)
	if userID == "" {
		userID = "system"
	}

	if err := a.actionDB.RejectProposal(ctx, id, userID); err != nil {
		http.Error(w, "failed to reject proposal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "REJECTED"})
}

// HandleExecuteProposal marks a proposal as executed (after broker execution)
func (a *ActionPlaneAPI) HandleExecuteProposal(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	if id == "" {
		http.Error(w, "missing proposal ID", http.StatusBadRequest)
		return
	}

	// Get user ID from context
	userID := GetUserID(ctx)
	if userID == "" {
		userID = "system"
	}

	if err := a.actionDB.ExecuteProposal(ctx, id, userID); err != nil {
		http.Error(w, "failed to execute proposal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "EXECUTED"})
}

// AuditLogResponse represents an audit log response
type AuditLogResponse struct {
	ID          string `json:"id"`
	ProposalID  string `json:"proposal_id"`
	ActionTaken string `json:"action_taken"`
	UserID      string `json:"user_id"`
	ExecutedAt  string `json:"executed_at"`
}

// HandleGetAuditLogs retrieves audit logs
func (a *ActionPlaneAPI) HandleGetAuditLogs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	proposalID := r.URL.Query().Get("proposal_id")

	logs, err := a.actionDB.FetchAuditLogs(ctx, proposalID)
	if err != nil {
		http.Error(w, "failed to fetch audit logs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(logs)
}
