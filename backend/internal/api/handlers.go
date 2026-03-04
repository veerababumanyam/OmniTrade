package api

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

// The API struct and NewAPI function are now defined in router.go


// The setupRoutes method is now defined in router.go


// Health response with dependency checks
func (a *API) HandleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"services":  map[string]string{},
	}

	// Check database connection
	if err := a.DB.Ping(ctx); err != nil {
		health["status"] = "degraded"
		health["services"].(map[string]string)["database"] = "unhealthy: " + err.Error()
	} else {
		health["services"].(map[string]string)["database"] = "healthy"
	}

	// Check read-only status
	health["database"] = map[string]bool{"read_only": a.DB.IsReadOnly()}

	// Return appropriate status code
	status := http.StatusOK
	if health["status"] == "degraded" {
		status = http.StatusServiceUnavailable
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(health)
}

// HandleGetAssets retrieves a list of tracked stock assets.
func (a *API) HandleGetAssets(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	assets, err := a.DB.FetchAssets(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(assets)
}

// HandleGetAssetBySymbol retrieves a single asset by symbol
func (a *API) HandleGetAssetBySymbol(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	symbol := chi.URLParam(r, "symbol")

	if symbol == "" {
		http.Error(w, "missing symbol parameter", http.StatusBadRequest)
		return
	}

	asset, err := a.DB.FetchAssetBySymbol(ctx, symbol)
	if err != nil {
		http.Error(w, "asset not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(asset)
}

// HandleGetMarketData retrieves the latest market data for a symbol
func (a *API) HandleGetMarketData(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	symbol := chi.URLParam(r, "symbol")

	if symbol == "" {
		http.Error(w, "missing symbol parameter", http.StatusBadRequest)
		return
	}

	data, err := a.DB.FetchLatestMarketData(ctx, symbol)
	if err != nil {
		http.Error(w, "market data not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(data)
}

// HandleGetMarketDataRange retrieves market data for a time range
func (a *API) HandleGetMarketDataRange(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	symbol := chi.URLParam(r, "symbol")
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")

	if symbol == "" {
		http.Error(w, "missing symbol parameter", http.StatusBadRequest)
		return
	}

	if from == "" || to == "" {
		http.Error(w, "missing from/to query parameters (format: YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	data, err := a.DB.FetchMarketDataRange(ctx, symbol, from, to)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(data)
}

// HandleGetProposals retrieves trade proposals.
func (a *API) HandleGetProposals(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	status := r.URL.Query().Get("status")

	proposals, err := a.DB.FetchProposals(ctx, status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(proposals)
}

// HandleGetProposalByID retrieves a specific proposal by its ID.
func (a *API) HandleGetProposalByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	if id == "" {
		http.Error(w, "missing proposal ID", http.StatusBadRequest)
		return
	}

	proposal, err := a.DB.FetchProposalByID(ctx, id)
	if err != nil {
		http.Error(w, "proposal not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(proposal)
}
