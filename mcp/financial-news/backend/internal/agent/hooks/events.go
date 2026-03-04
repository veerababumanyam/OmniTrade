// Package hooks provides a plugin hook system for the OmniTrade agent architecture.
// It enables extensible event-driven communication between plugins and the core system.
package hooks

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// EventType defines the type of hook event
type EventType string

const (
	// Data Plane Events (Read-Only)
	EventBeforeDataFetch  EventType = "before.data.fetch"
	EventAfterDataFetch   EventType = "after.data.fetch"
	EventOnDataIngest     EventType = "on.data.ingest"
	EventOnMarketUpdate   EventType = "on.market.update"
	EventOnTickerUpdate   EventType = "on.ticker.update"
	EventOnOrderBookSync  EventType = "on.orderbook.sync"
	EventOnHistoricalSync EventType = "on.historical.sync"

	// Intelligence Plane Events
	EventBeforeAnalysis     EventType = "before.analysis"
	EventAfterAnalysis      EventType = "after.analysis"
	EventBeforeAgentRun     EventType = "before.agent.run"
	EventAfterAgentRun      EventType = "after.agent.run"
	EventOnSignalGenerated  EventType = "on.signal.generated"
	EventOnPatternDetected  EventType = "on.pattern.detected"
	EventOnRiskCalculated   EventType = "on.risk.calculated"
	EventOnConfidenceScore  EventType = "on.confidence.score"
	EventOnMultiAgentSync   EventType = "on.multiagent.sync"
	EventBeforeGenkitFlow   EventType = "before.genkit.flow"
	EventAfterGenkitFlow    EventType = "after.genkit.flow"

	// Action Plane Events (HITL)
	EventBeforeTradeProposal EventType = "before.trade.proposal"
	EventAfterTradeProposal  EventType = "after.trade.proposal"
	EventOnApprovalRequired  EventType = "on.approval.required"
	EventOnApprovalGranted   EventType = "on.approval.granted"
	EventOnApprovalDenied    EventType = "on.approval.denied"
	EventBeforeOrderSubmit   EventType = "before.order.submit"
	EventAfterOrderSubmit    EventType = "after.order.submit"
	EventOnOrderFilled       EventType = "on.order.filled"
	EventOnOrderCancelled    EventType = "on.order.cancelled"

	// System Events
	EventOnPluginLoad    EventType = "on.plugin.load"
	EventOnPluginUnload  EventType = "on.plugin.unload"
	EventOnPluginError   EventType = "on.plugin.error"
	EventOnConfigChange  EventType = "on.config.change"
	EventOnHealthCheck   EventType = "on.health.check"
	EventOnAuditLog      EventType = "on.audit.log"
	EventOnMetricEmit    EventType = "on.metric.emit"
	EventOnAlert         EventType = "on.alert"
	EventOnShutdownStart EventType = "on.shutdown.start"
)

// EventCategory groups related event types
type EventCategory string

const (
	CategoryData        EventCategory = "data"
	CategoryIntelligence EventCategory = "intelligence"
	CategoryAction      EventCategory = "action"
	CategorySystem      EventCategory = "system"
)

// EventCategory returns the category for an event type
func (et EventType) Category() EventCategory {
	switch {
	case et.StartsWith("data.") || et.StartsWith("market.") || et.StartsWith("ticker.") ||
		et.StartsWith("orderbook.") || et.StartsWith("historical."):
		return CategoryData
	case et.StartsWith("analysis.") || et.StartsWith("agent.") || et.StartsWith("signal.") ||
		et.StartsWith("pattern.") || et.StartsWith("risk.") || et.StartsWith("confidence.") ||
		et.StartsWith("multiagent.") || et.StartsWith("genkit."):
		return CategoryIntelligence
	case et.StartsWith("trade.") || et.StartsWith("approval.") || et.StartsWith("order."):
		return CategoryAction
	default:
		return CategorySystem
	}
}

// StartsWith checks if the event type starts with a prefix
func (et EventType) StartsWith(prefix string) bool {
	return len(et) >= len(prefix) && string(et[:len(prefix)]) == prefix
}

// Priority defines the execution order of hooks
type Priority int

const (
	PriorityLowest    Priority = 0
	PriorityLow       Priority = 25
	PriorityNormal    Priority = 50
	PriorityHigh      Priority = 75
	PriorityHighest   Priority = 100
	PriorityMonitors  Priority = -1  // Monitors run first for observability
	PriorityCritical  Priority = 200 // Critical hooks must run absolutely first
)

// Event represents a hook event with context and payload
type Event struct {
	// ID is a unique identifier for this event instance
	ID string `json:"id"`

	// Type is the event type
	Type EventType `json:"type"`

	// Category is the event category
	Category EventCategory `json:"category"`

	// Timestamp when the event was created
	Timestamp time.Time `json:"timestamp"`

	// Source identifies what triggered the event (plugin name, agent ID, etc.)
	Source string `json:"source"`

	// CorrelationID for tracing across multiple events
	CorrelationID string `json:"correlation_id,omitempty"`

	// TraceID for distributed tracing integration
	TraceID string `json:"trace_id,omitempty"`

	// ParentEventID for event chaining
	ParentEventID string `json:"parent_event_id,omitempty"`

	// Payload contains the event data
	Payload Payload `json:"payload"`

	// Metadata contains additional context
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// ctx is the context for cancellation and deadlines
	ctx context.Context

	// cancelled indicates if the event was cancelled
	cancelled bool

	// cancelReason explains why the event was cancelled
	cancelReason string
}

// Payload is the event payload interface
type Payload interface {
	// Validate validates the payload
	Validate() error

	// ToJSON converts the payload to JSON
	ToJSON() ([]byte, error)

	// FromJSON populates the payload from JSON
	FromJSON(data []byte) error
}

// BasePayload provides a basic payload implementation
type BasePayload struct {
	Data map[string]interface{} `json:"data"`
}

// Validate validates the base payload
func (p *BasePayload) Validate() error {
	return nil
}

// ToJSON converts the payload to JSON
func (p *BasePayload) ToJSON() ([]byte, error) {
	return json.Marshal(p.Data)
}

// FromJSON populates the payload from JSON
func (p *BasePayload) FromJSON(data []byte) error {
	return json.Unmarshal(data, &p.Data)
}

// NewEvent creates a new event with defaults
func NewEvent(eventType EventType, source string, payload Payload) *Event {
	return &Event{
		ID:         generateEventID(),
		Type:       eventType,
		Category:   eventType.Category(),
		Timestamp:  time.Now().UTC(),
		Source:     source,
		Payload:    payload,
		Metadata:   make(map[string]interface{}),
		ctx:        context.Background(),
		cancelled:  false,
	}
}

// NewEventWithContext creates a new event with a context
func NewEventWithContext(ctx context.Context, eventType EventType, source string, payload Payload) *Event {
	event := NewEvent(eventType, source, payload)
	event.ctx = ctx
	return event
}

// Context returns the event context
func (e *Event) Context() context.Context {
	if e.ctx == nil {
		return context.Background()
	}
	return e.ctx
}

// SetContext sets the event context
func (e *Event) SetContext(ctx context.Context) {
	e.ctx = ctx
}

// Cancel marks the event as cancelled
func (e *Event) Cancel(reason string) {
	e.cancelled = true
	e.cancelReason = reason
}

// IsCancelled returns whether the event was cancelled
func (e *Event) IsCancelled() bool {
	return e.cancelled
}

// CancelReason returns the cancellation reason
func (e *Event) CancelReason() string {
	return e.cancelReason
}

// SetMetadata sets a metadata key
func (e *Event) SetMetadata(key string, value interface{}) {
	if e.Metadata == nil {
		e.Metadata = make(map[string]interface{})
	}
	e.Metadata[key] = value
}

// GetMetadata gets a metadata value
func (e *Event) GetMetadata(key string) (interface{}, bool) {
	if e.Metadata == nil {
		return nil, false
	}
	val, ok := e.Metadata[key]
	return val, ok
}

// Clone creates a copy of the event
func (e *Event) Clone() *Event {
	metadata := make(map[string]interface{})
	for k, v := range e.Metadata {
		metadata[k] = v
	}

	return &Event{
		ID:            generateEventID(),
		Type:          e.Type,
		Category:      e.Category,
		Timestamp:     time.Now().UTC(),
		Source:        e.Source,
		CorrelationID: e.CorrelationID,
		TraceID:       e.TraceID,
		ParentEventID: e.ID,
		Payload:       e.Payload,
		Metadata:      metadata,
		ctx:           e.ctx,
		cancelled:     false,
	}
}

// ToJSON serializes the event to JSON
func (e *Event) ToJSON() ([]byte, error) {
	payloadData, err := e.Payload.ToJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to serialize payload: %w", err)
	}

	type eventJSON struct {
		ID            string                 `json:"id"`
		Type          EventType              `json:"type"`
		Category      EventCategory          `json:"category"`
		Timestamp     time.Time              `json:"timestamp"`
		Source        string                 `json:"source"`
		CorrelationID string                 `json:"correlation_id,omitempty"`
		TraceID       string                 `json:"trace_id,omitempty"`
		ParentEventID string                 `json:"parent_event_id,omitempty"`
		Payload       json.RawMessage        `json:"payload"`
		Metadata      map[string]interface{} `json:"metadata,omitempty"`
		Cancelled     bool                   `json:"cancelled"`
		CancelReason  string                 `json:"cancel_reason,omitempty"`
	}

	evt := eventJSON{
		ID:            e.ID,
		Type:          e.Type,
		Category:      e.Category,
		Timestamp:     e.Timestamp,
		Source:        e.Source,
		CorrelationID: e.CorrelationID,
		TraceID:       e.TraceID,
		ParentEventID: e.ParentEventID,
		Payload:       payloadData,
		Metadata:      e.Metadata,
		Cancelled:     e.cancelled,
		CancelReason:  e.cancelReason,
	}

	return json.Marshal(evt)
}

// generateEventID generates a unique event ID
func generateEventID() string {
	return fmt.Sprintf("evt_%d", time.Now().UnixNano())
}

// TradeProposalPayload contains trade proposal data
type TradeProposalPayload struct {
	BasePayload
	ProposalID   string          `json:"proposal_id"`
	Symbol       string          `json:"symbol"`
	Side         string          `json:"side"` // "buy" or "sell"
	Quantity     string          `json:"quantity"` // Decimal as string
	Price        string          `json:"price"`    // Decimal as string
	Strategy     string          `json:"strategy"`
	Confidence   float64         `json:"confidence"`
	AgentID      string          `json:"agent_id"`
	Reasoning    string          `json:"reasoning"`
	RiskScore    float64         `json:"risk_score"`
	ExpiresAt    time.Time       `json:"expires_at,omitempty"`
}

// Validate validates the trade proposal payload
func (p *TradeProposalPayload) Validate() error {
	if p.ProposalID == "" {
		return fmt.Errorf("proposal_id is required")
	}
	if p.Symbol == "" {
		return fmt.Errorf("symbol is required")
	}
	if p.Side != "buy" && p.Side != "sell" {
		return fmt.Errorf("side must be 'buy' or 'sell'")
	}
	if p.Confidence < 0 || p.Confidence > 1 {
		return fmt.Errorf("confidence must be between 0 and 1")
	}
	if p.RiskScore < 0 || p.RiskScore > 1 {
		return fmt.Errorf("risk_score must be between 0 and 1")
	}
	return nil
}

// MarketDataPayload contains market data update information
type MarketDataPayload struct {
	BasePayload
	Symbol    string    `json:"symbol"`
	Price     string    `json:"price"`
	Volume    string    `json:"volume"`
	Bid       string    `json:"bid,omitempty"`
	Ask       string    `json:"ask,omitempty"`
	Timestamp time.Time `json:"timestamp"`
	Source    string    `json:"source"` // exchange, api, websocket
}

// Validate validates the market data payload
func (p *MarketDataPayload) Validate() error {
	if p.Symbol == "" {
		return fmt.Errorf("symbol is required")
	}
	if p.Price == "" {
		return fmt.Errorf("price is required")
	}
	return nil
}

// AgentRunPayload contains agent execution information
type AgentRunPayload struct {
	BasePayload
	AgentID      string            `json:"agent_id"`
	AgentType    string            `json:"agent_type"` // analyst, risk_manager, strategist
	Input        map[string]string `json:"input,omitempty"`
	Output       map[string]string `json:"output,omitempty"`
	Duration     time.Duration     `json:"duration"`
	Success      bool              `json:"success"`
	ErrorMessage string            `json:"error_message,omitempty"`
	ModelUsed    string            `json:"model_used,omitempty"`
	TokensUsed   int               `json:"tokens_used,omitempty"`
}

// Validate validates the agent run payload
func (p *AgentRunPayload) Validate() error {
	if p.AgentID == "" {
		return fmt.Errorf("agent_id is required")
	}
	if p.AgentType == "" {
		return fmt.Errorf("agent_type is required")
	}
	return nil
}

// ApprovalPayload contains approval request information
type ApprovalPayload struct {
	BasePayload
	ProposalID   string    `json:"proposal_id"`
	RequesterID  string    `json:"requester_id"`
	ApproverID   string    `json:"approver_id,omitempty"`
	Status       string    `json:"status"` // pending, approved, denied
	Reason       string    `json:"reason,omitempty"`
	ReviewedAt   time.Time `json:"reviewed_at,omitempty"`
	AutoApproved bool      `json:"auto_approved"`
}

// Validate validates the approval payload
func (p *ApprovalPayload) Validate() error {
	if p.ProposalID == "" {
		return fmt.Errorf("proposal_id is required")
	}
	if p.Status != "pending" && p.Status != "approved" && p.Status != "denied" {
		return fmt.Errorf("status must be 'pending', 'approved', or 'denied'")
	}
	return nil
}

// AuditLogPayload contains audit log information
type AuditLogPayload struct {
	BasePayload
	Actor       string                 `json:"actor"`
	Action      string                 `json:"action"`
	Resource    string                 `json:"resource"`
	ResourceID  string                 `json:"resource_id,omitempty"`
	OldValue    interface{}            `json:"old_value,omitempty"`
	NewValue    interface{}            `json:"new_value,omitempty"`
	IPAddress   string                 `json:"ip_address,omitempty"`
	UserAgent   string                 `json:"user_agent,omitempty"`
	Extra       map[string]interface{} `json:"extra,omitempty"`
}

// Validate validates the audit log payload
func (p *AuditLogPayload) Validate() error {
	if p.Actor == "" {
		return fmt.Errorf("actor is required")
	}
	if p.Action == "" {
		return fmt.Errorf("action is required")
	}
	return nil
}
