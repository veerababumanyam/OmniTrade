package indexer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// EmbeddingClient handles generating vector embeddings via LiteLLM Gateway
type EmbeddingClient struct {
	BaseURL    string
	Model      string
	MasterKey  string
	httpClient *http.Client
}

// LiteLLMEmbeddingRequest represents the payload for the standard OpenAI-compatible embeddings API
type LiteLLMEmbeddingRequest struct {
	Model string `json:"model"`
	Input string `json:"input"`
}

// LiteLLMEmbeddingResponse represents the standard OpenAI-compatible response
type LiteLLMEmbeddingResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
	} `json:"data"`
}

func NewEmbeddingClient() *EmbeddingClient {
	// Docker Model Runner runs on 12434 for local development
	// Falls back to LiteLLM Gateway on 4000 if not available
	baseURL := os.Getenv("EMBEDDING_BASE_URL")
	if baseURL == "" {
		// Try Docker Model Runner first (default for local dev)
		baseURL = "http://localhost:12434/v1"
	}
	model := os.Getenv("EMBEDDING_MODEL")
	if model == "" {
		model = "docker.io/ai/embeddinggemma:latest"
	}
	masterKey := os.Getenv("EMBEDDING_API_KEY")
	if masterKey == "" {
		masterKey = "not-needed" // Docker Model Runner doesn't require auth
	}

	return &EmbeddingClient{
		BaseURL:   baseURL,
		Model:     model,
		MasterKey: masterKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GenerateEmbeddings returns the floating point vector for a given text prompt
func (c *EmbeddingClient) GenerateEmbeddings(ctx context.Context, text string) ([]float32, error) {
	reqBody := LiteLLMEmbeddingRequest{
		Model: c.Model,
		Input: text,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// BaseURL already includes /v1 for Docker Model Runner, so just append /embeddings
	url := fmt.Sprintf("%s/embeddings", c.BaseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.MasterKey))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call LiteLLM API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("LiteLLM API returned status %d: %s", resp.StatusCode, string(body))
	}

	var resData LiteLLMEmbeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&resData); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(resData.Data) == 0 || len(resData.Data[0].Embedding) == 0 {
		return nil, fmt.Errorf("LiteLLM returned empty embedding")
	}

	return resData.Data[0].Embedding, nil
}
