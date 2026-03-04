package mcp

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/v13478/omnitrade/backend/internal/indexer"
)

// Minimal standalone MCP Server implementation mapped to Stdio

type JSONRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      interface{}     `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params"`
}

type JSONRPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Result  interface{} `json:"result,omitempty"`
	Error   *RPCError   `json:"error,omitempty"`
}

type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Server acts as the stdio bridge between an MCP client and the local indexing engine
type Server struct {
	engine *indexer.Engine
}

func NewServer(engine *indexer.Engine) *Server {
	return &Server{
		engine: engine,
	}
}

func (s *Server) Run() error {
	scanner := bufio.NewScanner(os.Stdin)
	
	for scanner.Scan() {
		line := scanner.Text()
		var req JSONRPCRequest
		if err := json.Unmarshal([]byte(line), &req); err != nil {
			log.Printf("MCP parse error: %v", err)
			s.sendError(nil, -32700, "Parse error")
			continue
		}

		s.handleRequest(req)
	}

	return scanner.Err()
}

func (s *Server) handleRequest(req JSONRPCRequest) {
	ctx := context.Background()

	switch req.Method {
	case "initialize":
		s.sendResponse(req.ID, map[string]interface{}{
			"protocolVersion": "2024-11-05", // MCP modern protocol version
			"capabilities": map[string]interface{}{
				"tools": map[string]interface{}{},
			},
			"serverInfo": map[string]interface{}{
				"name":    "rag-codebase-indexer",
				"version": "1.0.0",
			},
		})

	case "tools/list":
		s.sendResponse(req.ID, map[string]interface{}{
			"tools": []map[string]interface{}{
				{
					"name":        "codebase_search",
					"description": "Searches the codebase using semantic vector embeddings. Supports categories: 'codebase' (default), 'project' (docs), and 'education'.",
					"inputSchema": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"query": map[string]interface{}{
								"type":        "string",
								"description": "The semantic search query.",
							},
							"category": map[string]interface{}{
								"type":        "string",
								"description": "Filter by category: 'codebase', 'project', or 'education'. Empty for all.",
							},
							"limit": map[string]interface{}{
								"type":        "number",
								"description": "Max number of chunks to return. Default 5. Max 20.",
							},
						},
						"required": []string{"query"},
					},
				},
				{
					"name":        "indexer_status",
					"description": "Gets the current real-time status of the local background codebase indexing engine (Standby, Indexing, Indexed, Error).",
					"inputSchema": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{},
					},
				},
			},
		})

	case "tools/call":
		s.handleToolCall(ctx, req)

	case "ping":
		s.sendResponse(req.ID, map[string]interface{}{})

	case "notifications/initialized":
		// Ignore, just a client lifecycle hook
		
	default:
		s.sendError(req.ID, -32601, "Method not found: "+req.Method)
	}
}

func (s *Server) handleToolCall(ctx context.Context, req JSONRPCRequest) {
	var params struct {
		Name      string          `json:"name"`
		Arguments json.RawMessage `json:"arguments"`
	}

	if err := json.Unmarshal(req.Params, &params); err != nil {
		s.sendError(req.ID, -32602, "Invalid params")
		return
	}

	switch params.Name {
	case "codebase_search":
		var args struct {
			Query    string  `json:"query"`
			Category string  `json:"category"`
			Limit    float64 `json:"limit"`
		}
		if err := json.Unmarshal(params.Arguments, &args); err != nil {
			s.sendError(req.ID, -32602, "Invalid arguments for codebase_search")
			return
		}

		limit := int(args.Limit)
		if limit <= 0 {
			limit = 5
		} else if limit > 20 {
			limit = 20
		}

		results, err := s.engine.SearchByCategory(ctx, args.Query, args.Category, limit)
		if err != nil {
			s.sendError(req.ID, -32000, fmt.Sprintf("Search failed: %v", err))
			return
		}

		var textContent string
		if len(results) == 0 {
			textContent = "No relevant code found for query."
		} else {
			textContent = fmt.Sprintf("Found %d semantic matches:\n\n", len(results))
			for i, r := range results {
				textContent += fmt.Sprintf("Match %d: File: %s (Type: %s, Lines: %d-%d, Similarity Score: %.2f)\n```\n%s\n```\n\n",
					i+1, r.FilePath, r.ChunkType, r.StartLine, r.EndLine, r.Similarity, r.Content)
			}
		}

		s.sendResponse(req.ID, map[string]interface{}{
			"content": []map[string]interface{}{
				{
					"type": "text",
					"text": textContent,
				},
			},
		})

	case "indexer_status":
		status := s.engine.GetStatus()
		s.sendResponse(req.ID, map[string]interface{}{
			"content": []map[string]interface{}{
				{
					"type": "text",
					"text": fmt.Sprintf("Current Indexer Status: %s", status),
				},
			},
		})

	default:
		s.sendError(req.ID, -32601, "Tool not found: "+params.Name)
	}
}

func (s *Server) sendResponse(id interface{}, result interface{}) {
	resp := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
	}
	s.writeJSON(resp)
}

func (s *Server) sendError(id interface{}, code int, message string) {
	resp := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error: &RPCError{
			Code:    code,
			Message: message,
		},
	}
	s.writeJSON(resp)
}

func (s *Server) writeJSON(v interface{}) {
	b, err := json.Marshal(v)
	if err != nil {
		log.Printf("Failed to marshal MCP response: %v", err)
		return
	}
	// MCP requires simple newline-delimited JSON over stdio
	fmt.Printf("%s\n", b)
}
