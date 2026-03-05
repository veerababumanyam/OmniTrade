package portfolio

import (
	"database/sql"
	"time"

	"github.com/shopspring/decimal"
)

// Portfolio represents a user's investment portfolio.
// All monetary values use decimal.Decimal for precise financial calculations.
type Portfolio struct {
	ID            string          `db:"id" json:"id"`
	UserID        string          `db:"user_id" json:"user_id"`
	Name          string          `db:"name" json:"name"`
	Description   string          `db:"description" json:"description"`
	BaseCurrency  string          `db:"base_currency" json:"base_currency"`
	TotalValue    decimal.Decimal `db:"total_value" json:"total_value"`
	CashBalance   decimal.Decimal `db:"cash_balance" json:"cash_balance"`
	InvestedValue decimal.Decimal `db:"invested_value" json:"invested_value"`
	DayPnL        decimal.Decimal `db:"day_pnl" json:"day_pnl"`
	DayPnLPct     decimal.Decimal `db:"day_pnl_pct" json:"day_pnl_pct"`
	TotalPnL      decimal.Decimal `db:"total_pnl" json:"total_pnl"`
	TotalPnLPct   decimal.Decimal `db:"total_pnl_pct" json:"total_pnl_pct"`
	IsActive      bool            `db:"is_active" json:"is_active"`
	CreatedAt     time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time       `db:"updated_at" json:"updated_at"`
}

// Position represents an individual holding within a portfolio.
// Tracks cost basis, current value, and unrealized/realized P&L.
type Position struct {
	ID               string          `db:"id" json:"id"`
	PortfolioID      string          `db:"portfolio_id" json:"portfolio_id"`
	Symbol           string          `db:"symbol" json:"symbol"`
	Quantity         decimal.Decimal `db:"quantity" json:"quantity"`
	AvgCost          decimal.Decimal `db:"avg_cost" json:"avg_cost"`
	CurrentPrice     decimal.Decimal `db:"current_price" json:"current_price"`
	MarketValue      decimal.Decimal `db:"market_value" json:"market_value"`
	UnrealizedPnL    decimal.Decimal `db:"unrealized_pnl" json:"unrealized_pnl"`
	UnrealizedPnLPct decimal.Decimal `db:"unrealized_pnl_pct" json:"unrealized_pnl_pct"`
	RealizedPnL      decimal.Decimal `db:"realized_pnl" json:"realized_pnl"`
	Weight           decimal.Decimal `db:"weight" json:"weight"`
	OpenedAt         time.Time       `db:"opened_at" json:"opened_at"`
	UpdatedAt        time.Time       `db:"updated_at" json:"updated_at"`
}

// PortfolioSnapshot represents a daily portfolio snapshot for performance tracking.
type PortfolioSnapshot struct {
	ID                string          `db:"id" json:"id"`
	PortfolioID       string          `db:"portfolio_id" json:"portfolio_id"`
	SnapshotDate      time.Time       `db:"snapshot_date" json:"snapshot_date"`
	TotalValue        decimal.Decimal `db:"total_value" json:"total_value"`
	CashBalance       decimal.Decimal `db:"cash_balance" json:"cash_balance"`
	InvestedValue     decimal.Decimal `db:"invested_value" json:"invested_value"`
	DailyReturn       decimal.Decimal `db:"daily_return" json:"daily_return"`
	CumulativeReturn  decimal.Decimal `db:"cumulative_return" json:"cumulative_return"`
	CreatedAt         time.Time       `db:"created_at" json:"created_at"`
}

// ExecutedTrade represents a completed trade linked to a proposal.
type ExecutedTrade struct {
	ID            string          `db:"id" json:"id"`
	ProposalID    sql.NullString  `db:"proposal_id" json:"proposal_id"`
	PortfolioID   string          `db:"portfolio_id" json:"portfolio_id"`
	Symbol        string          `db:"symbol" json:"symbol"`
	Action        string          `db:"action" json:"action"`
	Quantity      decimal.Decimal `db:"quantity" json:"quantity"`
	ExecutedPrice decimal.Decimal `db:"executed_price" json:"executed_price"`
	Commission    decimal.Decimal `db:"commission" json:"commission"`
	ExecutedAt    time.Time       `db:"executed_at" json:"executed_at"`
}

// LivePrice represents the current market price for a symbol.
type LivePrice struct {
	Symbol      string          `db:"symbol" json:"symbol"`
	Price       decimal.Decimal `db:"price" json:"price"`
	Bid         decimal.Decimal `db:"bid" json:"bid"`
	Ask         decimal.Decimal `db:"ask" json:"ask"`
	Volume      int64           `db:"volume" json:"volume"`
	Change      decimal.Decimal `db:"change" json:"change"`
	ChangePct   decimal.Decimal `db:"change_pct" json:"change_pct"`
	LastUpdated time.Time       `db:"last_updated" json:"last_updated"`
}

// PerformanceMetrics aggregates performance data for a portfolio.
type PerformanceMetrics struct {
	PortfolioID        string          `json:"portfolio_id"`
	StartDate          time.Time       `json:"start_date"`
	EndDate            time.Time       `json:"end_date"`
	TotalReturn        decimal.Decimal `json:"total_return"`
	TotalReturnPct     decimal.Decimal `json:"total_return_pct"`
	AnnualizedReturn   decimal.Decimal `json:"annualized_return"`
	Volatility         decimal.Decimal `json:"volatility"`
	SharpeRatio        decimal.Decimal `json:"sharpe_ratio"`
	MaxDrawdown        decimal.Decimal `json:"max_drawdown"`
	WinRate            decimal.Decimal `json:"win_rate"`
	ProfitLossRatio    decimal.Decimal `json:"profit_loss_ratio"`
}

// PortfolioSummary combines portfolio info with positions and performance.
type PortfolioSummary struct {
	Portfolio  Portfolio   `json:"portfolio"`
	Positions  []Position  `json:"positions"`
	Performance PerformanceMetrics `json:"performance"`
}

// TradeRequest represents a request to execute a trade.
type TradeRequest struct {
	PortfolioID string  `json:"portfolio_id"`
	Symbol      string  `json:"symbol"`
	Action      string  `json:"action"`
	Quantity    float64 `json:"quantity"`
	ProposalID  string  `json:"proposal_id,omitempty"`
}

// CreatePortfolioRequest represents a request to create a new portfolio.
type CreatePortfolioRequest struct {
	UserID      string `json:"user_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// UpdatePortfolioRequest represents a request to update portfolio details.
type UpdatePortfolioRequest struct {
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
}
