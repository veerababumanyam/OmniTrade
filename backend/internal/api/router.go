package api

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/v13478/omnitrade/backend/internal/action"
	"github.com/v13478/omnitrade/backend/internal/database"
	"github.com/v13478/omnitrade/backend/internal/portfolio"
)

// API struct holds dependencies for handlers.
type API struct {
	DB     *database.DB
	Redis  *database.RedisDB
	Router chi.Router
	WSHub  *WebSocketHub
}

// NewAPI initializes the API and its routes.
func NewAPI(db *database.DB, redisDB *database.RedisDB, actionDB *action.ActionPlaneDB, portfolioService *portfolio.Service, wsHub *WebSocketHub) *API {
	r := chi.NewRouter()

	// Standard middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.SetHeader("Content-Type", "application/json"))

	// Redis-based rate limiting
	if redisDB != nil && redisDB.Client != nil {
		r.Use(RedisRateLimit(redisDB, 100, time.Minute))
	} else {
		r.Use(middleware.Throttle(100))
	}

	// Authentication middleware
	authConfig := DefaultAuthConfig()
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		authConfig.JWTSecret = secret
	}
	auth := NewAuthMiddleware(authConfig)

	api := &API{
		DB:     db,
		Redis:  redisDB,
		Router: r,
		WSHub:  wsHub,
	}

	// ── Public Routes ──────────────────────────────────
	api.Router.Get("/health", api.HandleHealth)
	api.Router.Post("/api/v1/auth/login", auth.HandleLogin)

	// WebSocket endpoint for price streaming
	if wsHub != nil {
		api.Router.Get("/ws/prices", wsHub.HandlePriceStream)
	}

	// ── Secured Routes (/api/v1) ──────────────────────
	api.Router.Route("/api/v1", func(r chi.Router) {
		r.Use(auth.Handler)

		// Intelligence Plane (Read-Only)
		r.Get("/assets", api.HandleGetAssets)
		r.Get("/assets/{symbol}", api.HandleGetAssetBySymbol)
		r.Get("/market/{symbol}", api.HandleGetMarketData)
		r.Get("/market/{symbol}/range", api.HandleGetMarketDataRange)
		r.Get("/proposals", api.HandleGetProposals)
		r.Get("/proposals/{id}", api.HandleGetProposalByID)

		// Portfolio routes - Mounted if service is available
		if portfolioService != nil {
			portfolioAPI := portfolio.NewAPI(portfolioService)
			portfolioAPI.SetupRoutes(r)
		}

		// Action Plane (Write access) - Mounted if available
		if actionDB != nil {
			actionAPI := NewActionPlaneAPI(actionDB)
			actionAPI.SetupActionRoutes(r)
		}
	})

	return api
}

// RedisRateLimit provides distributed, sliding-window rate limiting
func RedisRateLimit(redisDB *database.RedisDB, limit int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr
			key := fmt.Sprintf("ratelimit:%s", ip)

			ctx := r.Context()
			count, err := redisDB.Client.Incr(ctx, key).Result()
			if err != nil {
				log.Printf("Rate limit error: %v", err)
				next.ServeHTTP(w, r)
				return
			}

			if count == 1 {
				redisDB.Client.Expire(ctx, key, window)
			}

			if count > int64(limit) {
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
