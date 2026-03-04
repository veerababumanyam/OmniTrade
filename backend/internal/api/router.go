package api

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/v13478/omnitrade/backend/internal/database"
)

// API struct holds dependencies for handlers.
type API struct {
	DB     *database.DB
	Router chi.Router
}

// NewAPI initializes the API and its routes.
func NewAPI(db *database.DB) *API {
	r := chi.NewRouter()

	// Standard middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.SetHeader("Content-Type", "application/json"))

	api := &API{
		DB:     db,
		Router: r,
	}

	api.setupRoutes()
	return api
}

func (a *API) setupRoutes() {
	a.Router.Get("/health", a.HandleHealth)

	a.Router.Route("/api/v1", func(r chi.Router) {
		// Mock Authentication middleware could be added here
		// r.Use(AuthMiddleware)

		r.Get("/assets", a.HandleGetAssets)
		r.Get("/proposals", a.HandleGetProposals)
		r.Get("/proposals/{id}", a.HandleGetProposalByID)
		// Action Plane endpoints (approve/reject) would also go here eventually
	})
}
