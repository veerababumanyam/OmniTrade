package action

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// ActionPlaneDB handles database operations for the Action Plane.
// This service uses a separate database connection with write privileges.
type ActionPlaneDB struct {
	db *sqlx.DB
}

// NewActionPlaneDB creates a new Action Plane database connection.
// This should use the omnitrade_write role, not the read-only role.
func NewActionPlaneDB() (*ActionPlaneDB, error) {
	dbUser := os.Getenv("DB_USER_WRITE")
	if dbUser == "" {
		dbUser = "omnitrade_write"
	}
	dbPassword := os.Getenv("DB_PASSWORD_WRITE")
	if dbPassword == "" {
		dbPassword = os.Getenv("DB_PASSWORD") // Fallback to main password
	}
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "omnitrade"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbUser, dbPassword, dbName)

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL (Action Plane): %w", err)
	}

	// Verify connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping PostgreSQL (Action Plane): %w", err)
	}

	log.Printf("Connected to Action Plane database as %s", dbUser)

	return &ActionPlaneDB{db: db}, nil
}

// CreateProposal creates a new trade proposal in the database
func (a *ActionPlaneDB) CreateProposal(ctx context.Context, proposal *TradeProposal) error {
	query := `
		INSERT INTO trade_proposals (
			id, symbol, action, confidence_score, reasoning, 
			proposed_by_model, status, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
		)
		RETURNING id`

	proposal.ID = uuid.New().String()
	proposal.Status = "PENDING"

	_, err := a.db.ExecContext(ctx, query,
		proposal.ID,
		proposal.Symbol,
		proposal.Action,
		proposal.ConfidenceScore,
		proposal.Reasoning,
		proposal.ProposedByModel,
		proposal.Status,
	)

	if err != nil {
		return fmt.Errorf("failed to create proposal: %w", err)
	}

	log.Printf("Created trade proposal: %s for %s %s (confidence: %.2f)",
		proposal.ID, proposal.Symbol, proposal.Action, proposal.ConfidenceScore)

	return nil
}

// UpdateProposalStatus updates the status of a trade proposal
func (a *ActionPlaneDB) UpdateProposalStatus(ctx context.Context, id, status string) error {
	query := `
		UPDATE trade_proposals 
		SET status = $1, updated_at = NOW() 
		WHERE id = $2
		RETURNING id`

	var resultID string
	err := a.db.GetContext(ctx, &resultID, query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update proposal status: %w", err)
	}

	log.Printf("Updated proposal %s status to %s", id, status)
	return nil
}

// ApproveProposal marks a proposal as approved
func (a *ActionPlaneDB) ApproveProposal(ctx context.Context, id, userID string) error {
	// Update proposal status
	if err := a.UpdateProposalStatus(ctx, id, "APPROVED"); err != nil {
		return err
	}

	// Create audit log
	return a.CreateAuditLog(ctx, &AuditLog{
		ID:          uuid.New().String(),
		ProposalID:  id,
		ActionTaken: "APPROVED",
		UserID:      userID,
	})
}

// RejectProposal marks a proposal as rejected
func (a *ActionPlaneDB) RejectProposal(ctx context.Context, id, userID string) error {
	// Update proposal status
	if err := a.UpdateProposalStatus(ctx, id, "REJECTED"); err != nil {
		return err
	}

	// Create audit log
	return a.CreateAuditLog(ctx, &AuditLog{
		ID:          uuid.New().String(),
		ProposalID:  id,
		ActionTaken: "REJECTED",
		UserID:      userID,
	})
}

// ExecuteProposal marks a proposal as executed (after broker execution)
func (a *ActionPlaneDB) ExecuteProposal(ctx context.Context, id, userID string) error {
	// Update proposal status
	if err := a.UpdateProposalStatus(ctx, id, "EXECUTED"); err != nil {
		return err
	}

	// Create audit log
	return a.CreateAuditLog(ctx, &AuditLog{
		ID:          uuid.New().String(),
		ProposalID:  id,
		ActionTaken: "EXECUTED",
		UserID:      userID,
	})
}

// CreateAuditLog creates an immutable audit log entry
func (a *ActionPlaneDB) CreateAuditLog(ctx context.Context, entry *AuditLog) error {
	query := `
		INSERT INTO audit_logs (
			id, proposal_id, action_taken, user_id, metadata, executed_at
		) VALUES (
			$1, $2, $3, $4, $5, NOW()
		)`

	_, err := a.db.ExecContext(ctx, query,
		entry.ID,
		entry.ProposalID,
		entry.ActionTaken,
		entry.UserID,
		entry.Metadata,
	)

	if err != nil {
		return fmt.Errorf("failed to create audit log: %w", err)
	}

	log.Printf("Created audit log: %s for proposal %s action: %s",
		entry.ID, entry.ProposalID, entry.ActionTaken)

	return nil
}

// FetchAuditLogs retrieves audit logs, optionally filtered by proposal ID
func (a *ActionPlaneDB) FetchAuditLogs(ctx context.Context, proposalID string) ([]AuditLog, error) {
	var logs []AuditLog
	var query string
	var args []interface{}

	if proposalID != "" {
		query = `
			SELECT id, proposal_id, action_taken, user_id, metadata, executed_at 
			FROM audit_logs 
			WHERE proposal_id = $1 
			ORDER BY executed_at DESC`
		args = []interface{}{proposalID}
	} else {
		query = `
			SELECT id, proposal_id, action_taken, user_id, metadata, executed_at 
			FROM audit_logs 
			ORDER BY executed_at DESC`
	}

	err := a.db.SelectContext(ctx, &logs, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch audit logs: %w", err)
	}

	return logs, nil
}

// Close closes the database connection
func (a *ActionPlaneDB) Close() error {
	return a.db.Close()
}

// TradeProposal represents a trade proposal for the Action Plane
type TradeProposal struct {
	ID              string  `db:"id"`
	Symbol          string  `db:"symbol"`
	Action          string  `db:"action"`
	ConfidenceScore float64 `db:"confidence_score"`
	Reasoning       string  `db:"reasoning"`
	ProposedByModel string  `db:"proposed_by_model"`
	Status          string  `db:"status"`
}

// AuditLog represents an immutable audit log entry
type AuditLog struct {
	ID          string `db:"id"`
	ProposalID  string `db:"proposal_id"`
	ActionTaken string `db:"action_taken"`
	UserID      string `db:"user_id"`
	Metadata    string `db:"metadata"`
	ExecutedAt  string `db:"executed_at"`
}
