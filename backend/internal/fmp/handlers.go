package fmp

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Handler handles REST API requests for FMP data
type Handler struct {
	service *Service
}

// NewHandler creates a new FMP handler instance
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// SetupRoutes registers FMP REST routes
func (h *Handler) SetupRoutes(r chi.Router) {
	r.Route("/fmp", func(r chi.Router) {
		r.Get("/{symbol}", h.HandleGetAllData)
		r.Get("/{symbol}/{category}", h.HandleGetCategoryData)
		r.Get("/derived/{symbol}", h.HandleGetDerivedMetrics)
		r.Get("/status/{symbol}", h.HandleGetSyncStatus)
	})
}

// HandleGetAllData returns all available FMP data categories for a symbol
func (h *Handler) HandleGetAllData(w http.ResponseWriter, r *http.Request) {
	symbol := chi.URLParam(r, "symbol")
	data, err := h.service.GetAllData(r.Context(), symbol)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(data)
}

// HandleGetCategoryData returns a specific FMP data category for a symbol
func (h *Handler) HandleGetCategoryData(w http.ResponseWriter, r *http.Request) {
	symbol := chi.URLParam(r, "symbol")
	category := chi.URLParam(r, "category")
	data, err := h.service.GetData(r.Context(), symbol, category)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(data)
}

// HandleGetSyncStatus returns the sync freshness status for a symbol
func (h *Handler) HandleGetSyncStatus(w http.ResponseWriter, r *http.Request) {
	symbol := chi.URLParam(r, "symbol")
	status, err := h.service.GetSyncStatus(r.Context(), symbol)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(status)
}

// HandleGetDerivedMetrics returns advanced derived metrics computed by quant analytics workers
func (h *Handler) HandleGetDerivedMetrics(w http.ResponseWriter, r *http.Request) {
	symbol := chi.URLParam(r, "symbol")
	data, err := h.service.GetDerivedMetrics(r.Context(), symbol)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(data) == 0 {
		http.Error(w, "No derived metrics found for symbol", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(data)
}
