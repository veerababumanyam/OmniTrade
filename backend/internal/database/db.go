package database

import (
	"fmt"
	"log"
	"os"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// DB Wrapper for dependency injection
type DB struct {
	*sqlx.DB
}

func InitDB() (*DB, error) {
	// IMPORTANT: For the Intelligence Plane, this MUST connect using the
	// `medisync_readonly` role as per the PRD security constraints.
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "omnitrade_readonly" // Default to safe role
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "omnitrade"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbUser, dbPassword, dbName)

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	// Verify connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping PostgreSQL: %w", err)
	}

	log.Printf("Successfully connected to the PostgreSQL database as %s", dbUser)

	return &DB{db}, nil
}
