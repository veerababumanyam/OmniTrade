package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/v13478/omnitrade/backend/internal/mcp"
	"github.com/v13478/omnitrade/backend/internal/indexer"
)

func main() {
	mcpMode := flag.Bool("mcp", false, "Run as an MCP server")
	workspace := flag.String("workspace", ".", "Workspace directory to index")
	clearMode := flag.Bool("clear", false, "Clear all indexed data and exit")
	flag.Parse()

	// Initialize the indexer engine
	engine, err := indexer.NewEngine(*workspace)
	if err != nil {
		log.Fatalf("Failed to initialize index engine: %v", err)
	}

	// Handle clear mode
	if *clearMode {
		if err := engine.ClearAll(); err != nil {
			log.Fatalf("Failed to clear data: %v", err)
		}
		log.Println("All codebase data cleared successfully")
		return
	}

	// Start background indexing
	go engine.StartWatcher()
	// Start Branch Watcher
	branchWatcher := indexer.NewBranchWatcher(engine, *workspace)
	branchWatcher.Start()

	if *mcpMode {
		log.Println("Starting RAG MCP Server...")
		mcpServer := mcp.NewServer(engine)
		if err := mcpServer.Run(); err != nil {
			log.Fatalf("MCP Server error: %v", err)
		}
	} else {
		// Just run indexing in foreground
		log.Println("Running indexer in foreground...")
		engine.IndexAll()
		
		// Wait for interruption
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
	}
}
