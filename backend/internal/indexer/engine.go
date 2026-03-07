package indexer

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/fsnotify/fsnotify"
	_ "github.com/glebarez/go-sqlite"
)

// Engine is the central orchestrator for the RAG indexer
type Engine struct {
	workspaceDir string
	status       IndexStatus
	statusMu     sync.RWMutex

	filterer   *Filterer
	parser     *Parser
	embedder   *EmbeddingClient
	vectorDB   *VectorStore
	cacheDB    *sql.DB // Local SQLite for hash caching to prevent re-embedding
	watcher    *fsnotify.Watcher
	indexingCh chan string // Channel for files needing indexing
}

// NewEngine initializes a new indexing engine
func NewEngine(workspaceDir string) (*Engine, error) {
	// 1. Setup local sqlite cache
	cacheDB, err := sql.Open("sqlite", ".rag_cache.db")
	if err != nil {
		return nil, fmt.Errorf("failed to open local cache db: %w", err)
	}

	_, err = cacheDB.Exec(`
		CREATE TABLE IF NOT EXISTS file_hashes (
			file_path TEXT PRIMARY KEY,
			content_hash TEXT
		);
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize cache schema: %w", err)
	}

	// 2. Setup Vector DB (pgvector)
	// Hardcoded for OmniTrade local dev environment for now
	dbURL := "postgres://postgres:postgres@127.0.0.1:5432/omnitrade?sslmode=disable"
	vdb, err := NewVectorStore(dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to pgvector database: %w", err)
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("failed to create watcher: %w", err)
	}

	e := &Engine{
		workspaceDir: workspaceDir,
		status:       StatusStandby,
		filterer:     NewFilterer(workspaceDir),
		parser:       NewParser(),
		embedder:     NewEmbeddingClient(),
		vectorDB:     vdb,
		cacheDB:      cacheDB,
		watcher:      watcher,
		indexingCh:   make(chan string, 100),
	}

	return e, nil
}

// SetStatus updates the current status
func (e *Engine) SetStatus(status IndexStatus) {
	e.statusMu.Lock()
	defer e.statusMu.Unlock()
	e.status = status
}

// GetStatus returns the current indexing status
func (e *Engine) GetStatus() IndexStatus {
	e.statusMu.RLock()
	defer e.statusMu.RUnlock()
	return e.status
}

// IndexAll performs a full scan of the workspace
func (e *Engine) IndexAll() error {
	e.SetStatus(StatusIndexing)
	log.Println("Starting full workspace index...")

	files, err := e.filterer.DiscoverFiles()
	if err != nil {
		e.SetStatus(StatusError)
		return fmt.Errorf("failed to discover files: %w", err)
	}

	log.Printf("Discovered %d files to check", len(files))

	ctx := context.Background()
	for _, file := range files {
		e.processFile(ctx, file)
	}

	e.SetStatus(StatusIndexed)
	log.Println("Full indexing complete.")
	return nil
}

// processFile reads, chunks, and embeddings a single file if it has changed
func (e *Engine) processFile(ctx context.Context, filePath string) {
	chunks, err := e.parser.Parse(filePath)
	if err != nil {
		log.Printf("Warning: Failed to parse %s: %v", filePath, err)
		return
	}

	category := e.determineCategory(filePath)
	metadata := e.generateMetadata(filePath)

	// Calculate a combined hash for the entire file's semantic chunks
	hash := sha256.New()
	for i := range chunks {
		chunks[i].Category = category
		chunks[i].Metadata = metadata
		hash.Write([]byte(chunks[i].Content))
	}
	fileHash := fmt.Sprintf("%x", hash.Sum(nil))

	// Check against local cache
	var cachedHash string
	err = e.cacheDB.QueryRow("SELECT content_hash FROM file_hashes WHERE file_path = ?", filePath).Scan(&cachedHash)
	if err == nil && cachedHash == fileHash {
		// File hasn't fundamentally changed, skip costly embedding calls
		return
	}

	log.Printf("Indexing %s (%d chunks)", filePath, len(chunks))

	// Clear old chunks in pgvector since the file changed
	if err := e.vectorDB.DeleteByFilePath(ctx, filePath); err != nil {
		log.Printf("Error clearing old vector chunks for %s: %v", filePath, err)
	}

	// Embed & Insert new chunks
	for _, chunk := range chunks {
		chunkHashBytes := sha256.Sum256([]byte(chunk.Content))
		chunkHash := fmt.Sprintf("%x", chunkHashBytes)

		vector, err := e.embedder.GenerateEmbeddings(ctx, chunk.Content)
		if err != nil {
			log.Printf("Error generating embedding for %s: %v", filePath, err)
			continue
		}

		err = e.vectorDB.UpsertChunk(ctx, chunk, chunkHash, vector)
		if err != nil {
			log.Printf("Error persisting chunk for %s: %v", filePath, err)
		}
	}

	// Update local cache
	_, _ = e.cacheDB.Exec(`
		INSERT INTO file_hashes (file_path, content_hash) 
		VALUES (?, ?) 
		ON CONFLICT(file_path) DO UPDATE SET content_hash = ?`,
		filePath, fileHash, fileHash)
}

// StartWatcher starts the background filesystem monitoring
func (e *Engine) StartWatcher() {
	// Add current workspace to watcher. In a real implementation this would need
	// to walk and add all subdirectories, but fsnotify only watches the immediate dir by default.
	// For MVP, we will just poll periodically or assume the IDE handles saves.
	
	// A robust watcher requires walking and adding all non-ignored directories.
	_ = e.watcher.Add(e.workspaceDir)

	go func() {
		ctx := context.Background()
		for {
			select {
			case event, ok := <-e.watcher.Events:
				if !ok {
					return
				}
				if event.Has(fsnotify.Write) || event.Has(fsnotify.Create) {
					// Check if it's a file we care about
					if info, err := os.Stat(event.Name); err == nil && e.filterer.ShouldIndex(event.Name, info) {
						
						// Debounce indexing by sending to a worker channel
						e.SetStatus(StatusIndexing)
						e.processFile(ctx, event.Name)
						e.SetStatus(StatusIndexed)
					}
				}
			case err, ok := <-e.watcher.Errors:
				if !ok {
					return
				}
				log.Println("Watcher error:", err)
			}
		}
	}()
	
	// Also start initial index
	go e.IndexAll()
}

// ClearAll removes all indexed codebase data from the vector store
func (e *Engine) ClearAll() error {
	ctx := context.Background()
	if err := e.vectorDB.DeleteByCategory(ctx, "codebase"); err != nil {
		return fmt.Errorf("failed to clear codebase embeddings: %w", err)
	}
	// Also clear local cache
	_, err := e.cacheDB.Exec("DELETE FROM file_hashes")
	if err != nil {
		return fmt.Errorf("failed to clear local cache: %w", err)
	}
	log.Println("Cleared all codebase embeddings")
	return nil
}

// Search performs a vector search via pgvector across all categories
func (e *Engine) Search(ctx context.Context, query string, limit int) ([]SearchResult, error) {
	return e.SearchByCategory(ctx, query, "", limit)
}

// SearchByCategory performs a vector search via pgvector filtered by category
func (e *Engine) SearchByCategory(ctx context.Context, query string, category string, limit int) ([]SearchResult, error) {
	queryVector, err := e.embedder.GenerateEmbeddings(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to embed search query: %w", err)
	}

	return e.vectorDB.SearchByCategory(ctx, queryVector, category, limit)
}
func (e *Engine) determineCategory(filePath string) string {
	lowerPath := strings.ToLower(filePath)
	if strings.Contains(lowerPath, "docs/") || strings.Contains(lowerPath, "documentation/") {
		return "project"
	}
	if strings.Contains(lowerPath, "education/") || strings.Contains(lowerPath, "learning/") || strings.Contains(lowerPath, "lessons/") {
		return "education"
	}
	return "codebase"
}

func (e *Engine) generateMetadata(filePath string) map[string]interface{} {
	ext := filepath.Ext(filePath)
	if ext != "" {
		ext = ext[1:]
	}
	return map[string]interface{}{
		"language": ext,
		"filename": filepath.Base(filePath),
		"path":     filePath,
	}
}
