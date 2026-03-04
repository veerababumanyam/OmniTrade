package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Health response
func (a *API) HandleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "OmniTrade Intelligence Plane is healthy!"})
}

// HandleGetAssets retrieves a list of tracked stock assets.
func (a *API) HandleGetAssets(w http.ResponseWriter, r *http.Request) {
	// TODO: Replace with actual database query using a.DB
	// mock data for now
	type Asset struct {
		Symbol      string `json:"symbol"`
		CompanyName string `json:"company_name"`
		Sector      string `json:"sector"`
	}

	mockAssets := []Asset{
		{Symbol: "AAPL", CompanyName: "Apple Inc.", Sector: "Technology"},
		{Symbol: "MSFT", CompanyName: "Microsoft Corp.", Sector: "Technology"},
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(mockAssets)
}

// HandleGetProposals retrieves trade proposals.
func (a *API) HandleGetProposals(w http.ResponseWriter, r *http.Request) {
	// TODO: Replace with actual database query
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode([]interface{}{}) // Return empty list initially
}

// HandleGetProposalByID retrieves a specific proposal by its ID.
func (a *API) HandleGetProposalByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "missing proposal ID", http.StatusBadRequest)
		return
	}

	// TODO: Replace with actual database query
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "PENDING"})
}
