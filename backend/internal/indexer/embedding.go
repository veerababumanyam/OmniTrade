package indexer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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
	// LiteLLM Gateway normally runs on 4000
	return &EmbeddingClient{
		BaseURL:   "http://localhost:4000",
		Model:     "embeddinggemma",
		MasterKey: "sk-omnitrade-master-key", // Default from docker-compose.yml
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

	url := fmt.Sprintf("%s/v1/embeddings", c.BaseURL)
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
