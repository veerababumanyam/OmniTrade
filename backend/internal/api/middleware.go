package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
)

// JWT claims structure
type Claims struct {
	UserID string   `json:"user_id"`
	Roles  []string `json:"roles"`
	jwt.RegisteredClaims
}

// AuthConfig holds authentication configuration
type AuthConfig struct {
	JWTSecret          string
	TokenExpiry        time.Duration
	RefreshTokenExpiry time.Duration
}

// DefaultAuthConfig returns default authentication configuration
func DefaultAuthConfig() *AuthConfig {
	secret := "change_me_in_production" // TODO: Load from environment
	return &AuthConfig{
		JWTSecret:          secret,
		TokenExpiry:        24 * time.Hour,
		RefreshTokenExpiry: 7 * 24 * time.Hour,
	}
}

// AuthMiddleware provides JWT authentication
type AuthMiddleware struct {
	config *AuthConfig
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(config *AuthConfig) *AuthMiddleware {
	return &AuthMiddleware{config: config}
}

// Handler returns the authentication handler
func (a *AuthMiddleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip auth for health check and certain development routes
		path := r.URL.Path
		if path == "/health" || path == "/api/v1/auth/login" || path == "/api/v1/auth/register" {
			next.ServeHTTP(w, r)
			return
		}

		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "missing authorization header", http.StatusUnauthorized)
			return
		}

		// Bearer token format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "invalid authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Parse and validate token
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(a.config.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Add claims to context
		ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
		ctx = context.WithValue(ctx, "user_roles", claims.Roles)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole creates middleware that requires specific roles
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRoles, ok := r.Context().Value("user_roles").([]string)
			if !ok {
				http.Error(w, "unauthorized", http.StatusForbidden)
				return
			}

			// Check if user has any of the required roles
			for _, required := range roles {
				for _, userRole := range userRoles {
					if userRole == required {
						next.ServeHTTP(w, r)
						return
					}
				}
			}

			http.Error(w, "insufficient permissions", http.StatusForbidden)
		})
	}
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
	UserID       string `json:"user_id"`
	Roles        []string `json:"roles"`
}

// HandleLogin handles user login
func (a *AuthMiddleware) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// TODO: Validate credentials against database
	// For now, accept any login for development
	userID := "dev-user-001"
	roles := []string{"trader", "analyst"}

	// Generate JWT token
	expiresAt := time.Now().Add(a.config.TokenExpiry)
	claims := &Claims{
		UserID: userID,
		Roles:  roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(a.config.JWTSecret))
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	// Generate refresh token
	refreshExpiresAt := time.Now().Add(a.config.RefreshTokenExpiry)
	refreshClaims := &Claims{
		UserID: userID,
		Roles:  roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(refreshExpiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "refresh",
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(a.config.JWTSecret))
	if err != nil {
		http.Error(w, "failed to generate refresh token", http.StatusInternalServerError)
		return
	}

	response := LoginResponse{
		Token:        tokenString,
		RefreshToken: refreshTokenString,
		ExpiresAt:    expiresAt.Unix(),
		UserID:       userID,
		Roles:        roles,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetUserID extracts user ID from context
func GetUserID(ctx context.Context) string {
	if userID, ok := ctx.Value("user_id").(string); ok {
		return userID
	}
	return ""
}

// GetUserRoles extracts user roles from context
func GetUserRoles(ctx context.Context) []string {
	if roles, ok := ctx.Value("user_roles").([]string); ok {
		return roles
	}
	return []string{}
}

// SetupAuthRoutes sets up authentication routes
func (a *AuthMiddleware) SetupAuthRoutes(r chi.Router) {
	r.Post("/api/v1/auth/login", a.HandleLogin)
}

// CurrentUser returns the current authenticated user
func CurrentUser(r *http.Request) (string, []string) {
	return GetUserID(r.Context()), GetUserRoles(r.Context())
}
