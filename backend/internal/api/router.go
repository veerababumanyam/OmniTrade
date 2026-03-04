package api

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/v13478/omnitrade/backend/internal/database"
)

// API struct holds dependencies for handlers.
type API struct {
	DB     *database.DB
	Redis  *database.RedisDB
	Router chi.Router
}

// NewAPI initializes the API and its routes.
func NewAPI(db *database.DB, redisDB *database.RedisDB) *API {
	r := chi.NewRouter()

	// Standard middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.SetHeader("Content-Type", "application/json"))

	// Redis-based rate limiting: 100 requests per minute per IP
	if redisDB != nil && redisDB.Client != nil {
		r.Use(RedisRateLimit(redisDB, 100, time.Minute))
	} else {
		// Fallback to in-memory if Redis isn't available
		r.Use(middleware.Throttle(100))
	}

	api := &API{
		DB:     db,
		Redis:  redisDB,
		Router: r,
	}

	api.setupRoutes()
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

func (a *API) setupRoutes() {
	a.Router.Get("/health", a.HandleHealth)

	a.Router.Route("/api/v1", func(r chi.Router) {
		// Authentication middleware (disabled for development)
		// r.Use(AuthMiddleware)

		r.Get("/assets", a.HandleGetAssets)
		r.Get("/assets/{symbol}", a.HandleGetAssetBySymbol)
		r.Get("/market/{symbol}", a.HandleGetMarketData)
		r.Get("/market/{symbol}/range", a.HandleGetMarketDataRange)
		r.Get("/proposals", a.HandleGetProposals)
		r.Get("/proposals/{id}", a.HandleGetProposalByID)
	})
}
