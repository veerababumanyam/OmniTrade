package portfolio

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shopspring/decimal"
)

// API handles HTTP requests for portfolio endpoints.
type API struct {
	service *Service
}

// NewAPI creates a new portfolio API handler.
func NewAPI(service *Service) *API {
	return &API{service: service}
}

// SetupRoutes registers portfolio routes on the provided chi router.
func (a *API) SetupRoutes(r chi.Router) {
	r.Route("/portfolios", func(r chi.Router) {
		// Portfolio collection endpoints
		r.Get("/", a.HandleGetPortfolios)
		r.Post("/", a.HandleCreatePortfolio)

		// Single portfolio endpoints
		r.Route("/{portfolioId}", func(r chi.Router) {
			r.Get("/", a.HandleGetPortfolio)

			// Positions
			r.Get("/positions", a.HandleGetPositions)
			r.Get("/positions/{symbol}", a.HandleGetPosition)

			// Performance
			r.Get("/performance", a.HandleGetPerformance)

			// Trades
			r.Get("/trades", a.HandleGetTrades)
			r.Post("/trades", a.HandleExecuteTrade)
		})
	})

	// Live prices
	r.Get("/prices/{symbol}", a.HandleGetLivePrice)
}

// HandleGetPortfolios retrieves all portfolios for the authenticated user.
func (a *API) HandleGetPortfolios(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get user ID from context (set by auth middleware)
	userID := ctx.Value("user_id")
	if userID == nil {
		userID = "default" // Fallback for development
	}

	portfolios, err := a.service.GetPortfoliosByUser(ctx, userID.(string))
	if err != nil {
		http.Error(w, "failed to get portfolios: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolios)
}

// HandleGetPortfolio retrieves a single portfolio by ID.
func (a *API) HandleGetPortfolio(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	portfolioID := chi.URLParam(r, "portfolioId")

	if portfolioID == "" {
		http.Error(w, "missing portfolio ID", http.StatusBadRequest)
		return
	}

	portfolio, err := a.service.GetPortfolio(ctx, portfolioID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolio)
}

// HandleCreatePortfolio creates a new portfolio.
func (a *API) HandleCreatePortfolio(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req CreatePortfolioRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" {
		http.Error(w, "missing required field: name", http.StatusBadRequest)
		return
	}

	// Get user ID from context if not provided
	if req.UserID == "" {
		userID := ctx.Value("user_id")
		if userID != nil {
			req.UserID = userID.(string)
		} else {
			req.UserID = "default"
		}
	}

	portfolio, err := a.service.CreatePortfolio(ctx, &req)
	if err != nil {
		http.Error(w, "failed to create portfolio: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(portfolio)
}

// HandleGetPositions retrieves all positions for a portfolio.
func (a *API) HandleGetPositions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	portfolioID := chi.URLParam(r, "portfolioId")

	if portfolioID == "" {
		http.Error(w, "missing portfolio ID", http.StatusBadRequest)
		return
	}

	positions, err := a.service.GetPositions(ctx, portfolioID)
	if err != nil {
		http.Error(w, "failed to get positions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(positions)
}

// HandleGetPosition retrieves a specific position.
func (a *API) HandleGetPosition(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	portfolioID := chi.URLParam(r, "portfolioId")
	symbol := chi.URLParam(r, "symbol")

	if portfolioID == "" || symbol == "" {
		http.Error(w, "missing portfolio ID or symbol", http.StatusBadRequest)
		return
	}

	position, err := a.service.GetPosition(ctx, portfolioID, symbol)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(position)
}

// HandleGetPerformance retrieves performance data for a portfolio.
func (a *API) HandleGetPerformance(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	portfolioID := chi.URLParam(r, "portfolioId")

	if portfolioID == "" {
		http.Error(w, "missing portfolio ID", http.StatusBadRequest)
		return
	}

	// Parse date range from query parameters
	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")

	var startDate, endDate time.Time
	var err error

	if startDateStr != "" {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			http.Error(w, "invalid start_date format (use YYYY-MM-DD)", http.StatusBadRequest)
			return
		}
	} else {
		// Default to 30 days ago
		startDate = time.Now().AddDate(0, 0, -30)
	}

	if endDateStr != "" {
		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			http.Error(w, "invalid end_date format (use YYYY-MM-DD)", http.StatusBadRequest)
			return
		}
	} else {
		endDate = time.Now()
	}

	metrics, err := a.service.CalculatePerformanceMetrics(ctx, portfolioID, startDate, endDate)
	if err != nil {
		http.Error(w, "failed to calculate performance: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

// HandleGetTrades retrieves trade history for a portfolio.
func (a *API) HandleGetTrades(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	portfolioID := chi.URLParam(r, "portfolioId")

	if portfolioID == "" {
		http.Error(w, "missing portfolio ID", http.StatusBadRequest)
		return
	}

	// Parse limit from query parameter
	limitStr := r.URL.Query().Get("limit")
	limit := 100 // default
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	trades, err := a.service.GetExecutedTrades(ctx, portfolioID, limit)
	if err != nil {
		http.Error(w, "failed to get trades: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trades)
}

// HandleExecuteTrade executes a trade and updates positions.
func (a *API) HandleExecuteTrade(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	portfolioID := chi.URLParam(r, "portfolioId")

	if portfolioID == "" {
		http.Error(w, "missing portfolio ID", http.StatusBadRequest)
		return
	}

	var req TradeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Symbol == "" || req.Action == "" || req.Quantity <= 0 {
		http.Error(w, "missing required fields: symbol, action, quantity", http.StatusBadRequest)
		return
	}

	// Validate action
	if req.Action != "BUY" && req.Action != "SELL" {
		http.Error(w, "action must be BUY or SELL", http.StatusBadRequest)
		return
	}

	// Get current live price for the symbol
	livePrice, err := a.service.GetLivePrice(ctx, req.Symbol)
	if err != nil {
		http.Error(w, "failed to get current price: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Create executed trade record
	trade := &ExecutedTrade{
		PortfolioID:   portfolioID,
		Symbol:        req.Symbol,
		Action:        req.Action,
		Quantity:      decimal.NewFromFloat(req.Quantity),
		ExecutedPrice: livePrice.Price,
		Commission:    decimal.NewFromFloat(0), // TODO: Add commission calculation
	}

	if req.ProposalID != "" {
		trade.ProposalID.String = req.ProposalID
		trade.ProposalID.Valid = true
	}

	// Execute the trade
	if err := a.service.UpdatePositionAfterTrade(ctx, trade); err != nil {
		http.Error(w, "failed to execute trade: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":             trade.ID,
		"portfolio_id":   portfolioID,
		"symbol":         trade.Symbol,
		"action":         trade.Action,
		"quantity":       trade.Quantity,
		"executed_price": trade.ExecutedPrice,
		"executed_at":    trade.ExecutedAt,
	})
}

// HandleGetLivePrice retrieves the current live price for a symbol.
func (a *API) HandleGetLivePrice(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	symbol := chi.URLParam(r, "symbol")

	if symbol == "" {
		http.Error(w, "missing symbol", http.StatusBadRequest)
		return
	}

	price, err := a.service.GetLivePrice(ctx, symbol)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(price)
}
