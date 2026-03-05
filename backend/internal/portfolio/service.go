package portfolio

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"math"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/shopspring/decimal"
)

// Service provides portfolio management operations.
// It maintains separate read and write database connections following
// the principle of least privilege for security.
type Service struct {
	readDB  *sqlx.DB
	writeDB *sqlx.DB
}

// NewService creates a new portfolio service with separate read/write connections.
// The read connection uses omnitrade_readonly role (for Intelligence Plane).
// The write connection uses omnitrade_write role (for Action Plane).
func NewService() (*Service, error) {
	// Initialize read connection (omnitrade_readonly)
	readDB, err := connectDB("omnitrade_readonly", false)
	if err != nil {
		return nil, fmt.Errorf("failed to connect read database: %w", err)
	}

	// Initialize write connection (omnitrade_write)
	writeDB, err := connectDB("omnitrade_write", true)
	if err != nil {
		readDB.Close()
		return nil, fmt.Errorf("failed to connect write database: %w", err)
	}

	log.Printf("Portfolio service initialized with read/write connections")
	return &Service{
		readDB:  readDB,
		writeDB: writeDB,
	}, nil
}

// connectDB establishes a database connection with the specified role.
func connectDB(defaultRole string, isWrite bool) (*sqlx.DB, error) {
	var dbUser, dbPassword string

	if isWrite {
		dbUser = getEnvOrDefault("DB_USER_WRITE", "omnitrade_write")
		dbPassword = getEnvOrDefault("DB_PASSWORD_WRITE", os.Getenv("DB_PASSWORD"))
	} else {
		dbUser = getEnvOrDefault("DB_USER", defaultRole)
		dbPassword = os.Getenv("DB_PASSWORD")
	}

	dbHost := getEnvOrDefault("DB_HOST", "localhost")
	dbName := getEnvOrDefault("DB_NAME", "omnitrade")

	if dbPassword == "" {
		return nil, fmt.Errorf("database password not configured")
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbUser, dbPassword, dbName)

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL as %s: %w", dbUser, err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping PostgreSQL as %s: %w", dbUser, err)
	}

	log.Printf("Connected to database as %s (write: %v)", dbUser, isWrite)
	return db, nil
}

// getEnvOrDefault returns the environment variable value or a default.
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// GetPortfolio retrieves a portfolio by ID using the read connection.
func (s *Service) GetPortfolio(ctx context.Context, portfolioID string) (*Portfolio, error) {
	query := `
		SELECT id, user_id, name, description, base_currency,
		       total_value, cash_balance, invested_value,
		       day_pnl, day_pnl_pct, total_pnl, total_pnl_pct,
		       is_active, created_at, updated_at
		FROM portfolios
		WHERE id = $1 AND is_active = true`

	var portfolio Portfolio
	if err := s.readDB.GetContext(ctx, &portfolio, query, portfolioID); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("portfolio not found: %s", portfolioID)
		}
		return nil, fmt.Errorf("failed to get portfolio: %w", err)
	}

	return &portfolio, nil
}

// GetPortfoliosByUser retrieves all portfolios for a user.
func (s *Service) GetPortfoliosByUser(ctx context.Context, userID string) ([]Portfolio, error) {
	query := `
		SELECT id, user_id, name, description, base_currency,
		       total_value, cash_balance, invested_value,
		       day_pnl, day_pnl_pct, total_pnl, total_pnl_pct,
		       is_active, created_at, updated_at
		FROM portfolios
		WHERE user_id = $1 AND is_active = true
		ORDER BY created_at DESC`

	var portfolios []Portfolio
	if err := s.readDB.SelectContext(ctx, &portfolios, query, userID); err != nil {
		return nil, fmt.Errorf("failed to get portfolios for user: %w", err)
	}

	return portfolios, nil
}

// GetPositions retrieves all positions for a portfolio.
func (s *Service) GetPositions(ctx context.Context, portfolioID string) ([]Position, error) {
	query := `
		SELECT id, portfolio_id, symbol, quantity, avg_cost,
		       current_price, market_value, unrealized_pnl,
		       unrealized_pnl_pct, realized_pnl, weight,
		       opened_at, updated_at
		FROM positions
		WHERE portfolio_id = $1
		ORDER BY weight DESC, symbol ASC`

	var positions []Position
	if err := s.readDB.SelectContext(ctx, &positions, query, portfolioID); err != nil {
		return nil, fmt.Errorf("failed to get positions: %w", err)
	}

	return positions, nil
}

// GetPosition retrieves a specific position by portfolio and symbol.
func (s *Service) GetPosition(ctx context.Context, portfolioID, symbol string) (*Position, error) {
	query := `
		SELECT id, portfolio_id, symbol, quantity, avg_cost,
		       current_price, market_value, unrealized_pnl,
		       unrealized_pnl_pct, realized_pnl, weight,
		       opened_at, updated_at
		FROM positions
		WHERE portfolio_id = $1 AND symbol = $2`

	var position Position
	if err := s.readDB.GetContext(ctx, &position, query, portfolioID, symbol); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("position not found: %s in portfolio %s", symbol, portfolioID)
		}
		return nil, fmt.Errorf("failed to get position: %w", err)
	}

	return &position, nil
}

// GetPerformance retrieves performance snapshots for a portfolio over a date range.
func (s *Service) GetPerformance(ctx context.Context, portfolioID string, startDate, endDate time.Time) ([]PortfolioSnapshot, error) {
	query := `
		SELECT id, portfolio_id, snapshot_date, total_value,
		       cash_balance, invested_value, daily_return,
		       cumulative_return, created_at
		FROM portfolio_snapshots
		WHERE portfolio_id = $1
		  AND snapshot_date >= $2
		  AND snapshot_date <= $3
		ORDER BY snapshot_date ASC`

	var snapshots []PortfolioSnapshot
	if err := s.readDB.SelectContext(ctx, &snapshots, query, portfolioID, startDate, endDate); err != nil {
		return nil, fmt.Errorf("failed to get performance: %w", err)
	}

	return snapshots, nil
}

// CalculatePerformanceMetrics computes performance metrics from snapshots.
func (s *Service) CalculatePerformanceMetrics(ctx context.Context, portfolioID string, startDate, endDate time.Time) (*PerformanceMetrics, error) {
	snapshots, err := s.GetPerformance(ctx, portfolioID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	if len(snapshots) == 0 {
		return &PerformanceMetrics{
			PortfolioID: portfolioID,
			StartDate:   startDate,
			EndDate:     endDate,
		}, nil
	}

	metrics := &PerformanceMetrics{
		PortfolioID: portfolioID,
		StartDate:   startDate,
		EndDate:     endDate,
	}

	// Calculate total return
	startValue := snapshots[0].TotalValue
	endValue := snapshots[len(snapshots)-1].TotalValue
	metrics.TotalReturn = endValue.Sub(startValue)

	if !startValue.IsZero() {
		metrics.TotalReturnPct = metrics.TotalReturn.Div(startValue)
	}

	// Calculate annualized return
	days := endDate.Sub(startDate).Hours() / 24
	if days > 0 && !startValue.IsZero() {
		years := days / 365.25
		if years > 0 {
			returnRatio := endValue.Div(startValue)
			metrics.AnnualizedReturn = decimal.NewFromFloat(math.Pow(returnRatio.InexactFloat64(), 1/years) - 1)
		}
	}

	// Calculate volatility (standard deviation of daily returns)
	if len(snapshots) > 1 {
		var sumSquaredDiff float64
		var meanReturn float64

		returns := make([]float64, len(snapshots)-1)
		for i := 1; i < len(snapshots); i++ {
			if !snapshots[i-1].TotalValue.IsZero() {
				returns[i-1] = snapshots[i].TotalValue.Sub(snapshots[i-1].TotalValue).
					Div(snapshots[i-1].TotalValue).InexactFloat64()
				meanReturn += returns[i-1]
			}
		}

		if len(returns) > 0 {
			meanReturn /= float64(len(returns))
			for _, r := range returns {
				diff := r - meanReturn
				sumSquaredDiff += diff * diff
			}
			volatility := math.Sqrt(sumSquaredDiff / float64(len(returns)))
			metrics.Volatility = decimal.NewFromFloat(volatility)

			// Calculate Sharpe ratio (assuming 5% risk-free rate)
			if volatility > 0 {
				riskFreeRate := 0.05
				annualizedExcessReturn := metrics.AnnualizedReturn.InexactFloat64() - riskFreeRate
				metrics.SharpeRatio = decimal.NewFromFloat(annualizedExcessReturn / volatility)
			}
		}
	}

	// Calculate max drawdown
	var peak decimal.Decimal
	var maxDrawdown decimal.Decimal
	for _, snapshot := range snapshots {
		if peak.IsZero() || snapshot.TotalValue.GreaterThan(peak) {
			peak = snapshot.TotalValue
		}
		if !peak.IsZero() {
			drawdown := peak.Sub(snapshot.TotalValue).Div(peak)
			if drawdown.GreaterThan(maxDrawdown) {
				maxDrawdown = drawdown
			}
		}
	}
	metrics.MaxDrawdown = maxDrawdown

	return metrics, nil
}

// GetLivePrice retrieves the current live price for a symbol.
func (s *Service) GetLivePrice(ctx context.Context, symbol string) (*LivePrice, error) {
	query := `
		SELECT symbol, price, bid, ask, volume, change, change_pct, last_updated
		FROM live_prices
		WHERE symbol = $1`

	var price LivePrice
	if err := s.readDB.GetContext(ctx, &price, query, symbol); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("live price not found for symbol: %s", symbol)
		}
		return nil, fmt.Errorf("failed to get live price: %w", err)
	}

	return &price, nil
}

// UpdatePositionAfterTrade updates positions after a trade is executed.
// This method uses the write connection and handles both BUY and SELL actions.
func (s *Service) UpdatePositionAfterTrade(ctx context.Context, trade *ExecutedTrade) error {
	tx, err := s.writeDB.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	switch trade.Action {
	case "BUY":
		if err := s.processBuy(ctx, tx, trade); err != nil {
			return err
		}
	case "SELL":
		if err := s.processSell(ctx, tx, trade); err != nil {
			return err
		}
	default:
		return fmt.Errorf("invalid trade action: %s", trade.Action)
	}

	// Record the executed trade
	if err := s.recordExecutedTrade(ctx, tx, trade); err != nil {
		return err
	}

	// Update portfolio totals
	if err := s.updatePortfolioTotals(ctx, tx, trade.PortfolioID); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	log.Printf("Updated position after trade: %s %s %s @ %s",
		trade.Action, trade.Quantity.String(), trade.Symbol, trade.ExecutedPrice.String())

	return nil
}

// processBuy handles position updates for a BUY trade.
func (s *Service) processBuy(ctx context.Context, tx *sqlx.Tx, trade *ExecutedTrade) error {
	// Check if position exists
	var existingPosition Position
	err := tx.GetContext(ctx, &existingPosition,
		`SELECT id, quantity, avg_cost FROM positions WHERE portfolio_id = $1 AND symbol = $2`,
		trade.PortfolioID, trade.Symbol)

	tradeValue := trade.Quantity.Mul(trade.ExecutedPrice)

	if err == sql.ErrNoRows {
		// Create new position
		positionID := uuid.New().String()
		_, err = tx.ExecContext(ctx, `
			INSERT INTO positions (id, portfolio_id, symbol, quantity, avg_cost, opened_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
			positionID, trade.PortfolioID, trade.Symbol, trade.Quantity, trade.ExecutedPrice)
		if err != nil {
			return fmt.Errorf("failed to create position: %w", err)
		}
	} else if err != nil {
		return fmt.Errorf("failed to check existing position: %w", err)
	} else {
		// Update existing position (average cost calculation)
		oldValue := existingPosition.Quantity.Mul(existingPosition.AvgCost)
		newValue := oldValue.Add(tradeValue)
		newQuantity := existingPosition.Quantity.Add(trade.Quantity)
		newAvgCost := newValue.Div(newQuantity)

		_, err = tx.ExecContext(ctx, `
			UPDATE positions
			SET quantity = $1, avg_cost = $2, updated_at = NOW()
			WHERE portfolio_id = $3 AND symbol = $4`,
			newQuantity, newAvgCost, trade.PortfolioID, trade.Symbol)
		if err != nil {
			return fmt.Errorf("failed to update position: %w", err)
		}
	}

	// Deduct from cash balance (including commission)
	totalCost := tradeValue.Add(trade.Commission)
	_, err = tx.ExecContext(ctx, `
		UPDATE portfolios
		SET cash_balance = cash_balance - $1, updated_at = NOW()
		WHERE id = $2`,
		totalCost, trade.PortfolioID)
	if err != nil {
		return fmt.Errorf("failed to update cash balance: %w", err)
	}

	return nil
}

// processSell handles position updates for a SELL trade.
func (s *Service) processSell(ctx context.Context, tx *sqlx.Tx, trade *ExecutedTrade) error {
	// Get existing position
	var existingPosition Position
	err := tx.GetContext(ctx, &existingPosition,
		`SELECT id, quantity, avg_cost FROM positions WHERE portfolio_id = $1 AND symbol = $2`,
		trade.PortfolioID, trade.Symbol)

	if err == sql.ErrNoRows {
		return fmt.Errorf("cannot sell: no position found for %s in portfolio", trade.Symbol)
	}
	if err != nil {
		return fmt.Errorf("failed to get position: %w", err)
	}

	// Validate sufficient quantity
	if existingPosition.Quantity.LessThan(trade.Quantity) {
		return fmt.Errorf("insufficient quantity: have %s, trying to sell %s",
			existingPosition.Quantity.String(), trade.Quantity.String())
	}

	tradeValue := trade.Quantity.Mul(trade.ExecutedPrice)
	costBasis := trade.Quantity.Mul(existingPosition.AvgCost)
	realizedPnL := tradeValue.Sub(costBasis).Sub(trade.Commission)

	newQuantity := existingPosition.Quantity.Sub(trade.Quantity)

	if newQuantity.IsZero() {
		// Close position completely
		_, err = tx.ExecContext(ctx, `
			DELETE FROM positions WHERE portfolio_id = $1 AND symbol = $2`,
			trade.PortfolioID, trade.Symbol)
		if err != nil {
			return fmt.Errorf("failed to close position: %w", err)
		}
	} else {
		// Reduce position
		_, err = tx.ExecContext(ctx, `
			UPDATE positions
			SET quantity = $1, realized_pnl = realized_pnl + $2, updated_at = NOW()
			WHERE portfolio_id = $3 AND symbol = $4`,
			newQuantity, realizedPnL, trade.PortfolioID, trade.Symbol)
		if err != nil {
			return fmt.Errorf("failed to update position: %w", err)
		}
	}

	// Add to cash balance (minus commission)
	proceeds := tradeValue.Sub(trade.Commission)
	_, err = tx.ExecContext(ctx, `
		UPDATE portfolios
		SET cash_balance = cash_balance + $1, updated_at = NOW()
		WHERE id = $2`,
		proceeds, trade.PortfolioID)
	if err != nil {
		return fmt.Errorf("failed to update cash balance: %w", err)
	}

	return nil
}

// recordExecutedTrade inserts a record of the executed trade.
func (s *Service) recordExecutedTrade(ctx context.Context, tx *sqlx.Tx, trade *ExecutedTrade) error {
	trade.ID = uuid.New().String()

	query := `
		INSERT INTO executed_trades (
			id, proposal_id, portfolio_id, symbol, action,
			quantity, executed_price, commission, executed_at
		) VALUES (
			:id, :proposal_id, :portfolio_id, :symbol, :action,
			:quantity, :executed_price, :commission, NOW()
		)`

	_, err := tx.NamedExecContext(ctx, query, trade)
	if err != nil {
		return fmt.Errorf("failed to record executed trade: %w", err)
	}

	return nil
}

// updatePortfolioTotals recalculates and updates portfolio totals.
func (s *Service) updatePortfolioTotals(ctx context.Context, tx *sqlx.Tx, portfolioID string) error {
	// Calculate invested value from positions
	var investedValue decimal.Decimal
	err := tx.GetContext(ctx, &investedValue, `
		SELECT COALESCE(SUM(quantity * current_price), 0)
		FROM positions
		WHERE portfolio_id = $1`,
		portfolioID)
	if err != nil {
		return fmt.Errorf("failed to calculate invested value: %w", err)
	}

	// Update portfolio totals
	_, err = tx.ExecContext(ctx, `
		UPDATE portfolios
		SET invested_value = $1,
		    total_value = cash_balance + $1,
		    updated_at = NOW()
		WHERE id = $2`,
		investedValue, portfolioID)
	if err != nil {
		return fmt.Errorf("failed to update portfolio totals: %w", err)
	}

	return nil
}

// CreatePortfolio creates a new portfolio.
func (s *Service) CreatePortfolio(ctx context.Context, req *CreatePortfolioRequest) (*Portfolio, error) {
	portfolioID := uuid.New().String()

	query := `
		INSERT INTO portfolios (id, user_id, name, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, user_id, name, description, base_currency,
		          total_value, cash_balance, invested_value,
		          day_pnl, day_pnl_pct, total_pnl, total_pnl_pct,
		          is_active, created_at, updated_at`

	var portfolio Portfolio
	err := s.writeDB.QueryRowxContext(ctx, query,
		portfolioID, req.UserID, req.Name, req.Description).StructScan(&portfolio)
	if err != nil {
		return nil, fmt.Errorf("failed to create portfolio: %w", err)
	}

	log.Printf("Created portfolio: %s for user %s", portfolioID, req.UserID)
	return &portfolio, nil
}

// GetExecutedTrades retrieves trade history for a portfolio.
func (s *Service) GetExecutedTrades(ctx context.Context, portfolioID string, limit int) ([]ExecutedTrade, error) {
	query := `
		SELECT id, proposal_id, portfolio_id, symbol, action,
		       quantity, executed_price, commission, executed_at
		FROM executed_trades
		WHERE portfolio_id = $1
		ORDER BY executed_at DESC
		LIMIT $2`

	var trades []ExecutedTrade
	if err := s.readDB.SelectContext(ctx, &trades, query, portfolioID, limit); err != nil {
		return nil, fmt.Errorf("failed to get executed trades: %w", err)
	}

	return trades, nil
}

// Close closes both database connections.
func (s *Service) Close() error {
	var errs []error

	if err := s.readDB.Close(); err != nil {
		errs = append(errs, fmt.Errorf("failed to close read DB: %w", err))
	}
	if err := s.writeDB.Close(); err != nil {
		errs = append(errs, fmt.Errorf("failed to close write DB: %w", err))
	}

	if len(errs) > 0 {
		return fmt.Errorf("errors closing connections: %v", errs)
	}

	return nil
}
