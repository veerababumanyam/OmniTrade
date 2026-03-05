// Copyright 2026 OmniTrade Authors
// SPDX-License-Identifier: Apache-2.0

package adk

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"google.golang.org/adk/model"
	"google.golang.org/genai"
)

func TestLiteLLMModel_Name(t *testing.T) {
	cfg := LiteLLMModelConfig{
		BaseURL:   "http://localhost:4000",
		APIKey:    "test-key",
		ModelName: "gpt-5.3",
	}

	m := NewLiteLLMModel(cfg)

	if m.Name() != "gpt-5.3" {
		t.Errorf("Expected model name 'gpt-5.3', got '%s'", m.Name())
	}
}

func TestLiteLLMModel_GenerateContent_NonStreaming(t *testing.T) {
	// Create mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request headers
		if r.Header.Get("Authorization") != "Bearer test-key" {
			t.Errorf("Expected Authorization header 'Bearer test-key', got '%s'", r.Header.Get("Authorization"))
		}
		if r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("Expected Content-Type 'application/json', got '%s'", r.Header.Get("Content-Type"))
		}

		// Return mock response
		resp := openAIResponse{
			ID:      "test-id",
			Object:  "chat.completion",
			Created: time.Now().Unix(),
			Model:   "gpt-5.3",
			Choices: []openAIChoice{
				{
					Index: 0,
					Message: openAIMessage{
						Role:    "assistant",
						Content: "Test response content",
					},
					FinishReason: "stop",
				},
			},
			Usage: openAIUsage{
				PromptTokens:     10,
				CompletionTokens: 5,
				TotalTokens:      15,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := LiteLLMModelConfig{
		BaseURL:   server.URL,
		APIKey:    "test-key",
		ModelName: "gpt-5.3",
		Timeout:   10 * time.Second,
	}

	m := NewLiteLLMModel(cfg)

	// Create test request
	req := &model.LLMRequest{
		Model: "gpt-5.3",
		Contents: []*genai.Content{
			{
				Role: "user",
				Parts: []*genai.Part{
					{Text: "Hello, world!"},
				},
			},
		},
	}

	// Execute request
	ctx := context.Background()
	var response *model.LLMResponse
	var lastError error

	for resp, err := range m.GenerateContent(ctx, req, false) {
		if err != nil {
			lastError = err
			break
		}
		response = resp
	}

	if lastError != nil {
		t.Fatalf("GenerateContent failed: %v", lastError)
	}

	if response == nil {
		t.Fatal("Expected non-nil response")
	}

	if response.Content == nil {
		t.Fatal("Expected non-nil content in response")
	}

	if len(response.Content.Parts) == 0 {
		t.Fatal("Expected at least one part in content")
	}

	if response.Content.Parts[0].Text != "Test response content" {
		t.Errorf("Expected text 'Test response content', got '%s'", response.Content.Parts[0].Text)
	}

	if !response.TurnComplete {
		t.Error("Expected TurnComplete to be true for non-streaming response")
	}
}

func TestLiteLLMModel_GenerateContent_Streaming(t *testing.T) {
	// Create mock streaming server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		flusher, ok := w.(http.Flusher)
		if !ok {
			t.Fatal("ResponseWriter does not support flushing")
		}

		// Send streaming chunks
		chunks := []string{
			`data: {"id":"test","object":"chat.completion.chunk","created":1234567890,"model":"gpt-5.3","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":""}]}`,
			`data: {"id":"test","object":"chat.completion.chunk","created":1234567890,"model":"gpt-5.3","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":""}]}`,
			`data: {"id":"test","object":"chat.completion.chunk","created":1234567890,"model":"gpt-5.3","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":"stop"}]}`,
			`data: [DONE]`,
		}

		for _, chunk := range chunks {
			w.Write([]byte(chunk + "\n\n"))
			flusher.Flush()
		}
	}))
	defer server.Close()

	cfg := LiteLLMModelConfig{
		BaseURL:   server.URL,
		APIKey:    "test-key",
		ModelName: "gpt-5.3",
		Timeout:   10 * time.Second,
	}

	m := NewLiteLLMModel(cfg)

	req := &model.LLMRequest{
		Model: "gpt-5.3",
		Contents: []*genai.Content{
			{
				Role: "user",
				Parts: []*genai.Part{
					{Text: "Say hello"},
				},
			},
		},
	}

	ctx := context.Background()
	var responses []*model.LLMResponse
	var lastError error

	for resp, err := range m.GenerateContent(ctx, req, true) {
		if err != nil {
			lastError = err
			break
		}
		responses = append(responses, resp)
	}

	if lastError != nil {
		t.Fatalf("GenerateContent streaming failed: %v", lastError)
	}

	if len(responses) == 0 {
		t.Fatal("Expected at least one streaming response")
	}

	// Check that we received partial updates
	partialCount := 0
	for _, resp := range responses {
		if resp.Partial {
			partialCount++
		}
	}

	if partialCount == 0 {
		t.Error("Expected at least one partial response during streaming")
	}

	// Check that final response is complete
	finalResp := responses[len(responses)-1]
	if !finalResp.TurnComplete {
		t.Error("Expected final response to have TurnComplete=true")
	}
}

func TestLiteLLMModel_GenerateContent_WithToolCalls(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := openAIResponse{
			ID:      "test-id",
			Object:  "chat.completion",
			Created: time.Now().Unix(),
			Model:   "gpt-5.3",
			Choices: []openAIChoice{
				{
					Index: 0,
					Message: openAIMessage{
						Role: "assistant",
						ToolCalls: []openAIToolCall{
							{
								ID:   "call-123",
								Type: "function",
								Function: openAIFunctionCall{
									Name:      "fetch_price",
									Arguments: `{"symbol":"AAPL"}`,
								},
							},
						},
					},
					FinishReason: "tool_calls",
				},
			},
			Usage: openAIUsage{
				PromptTokens:     20,
				CompletionTokens: 10,
				TotalTokens:      30,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := LiteLLMModelConfig{
		BaseURL:   server.URL,
		APIKey:    "test-key",
		ModelName: "gpt-5.3",
	}

	m := NewLiteLLMModel(cfg)

	req := &model.LLMRequest{
		Model: "gpt-5.3",
		Contents: []*genai.Content{
			{
				Role: "user",
				Parts: []*genai.Part{
					{Text: "What is the price of AAPL?"},
				},
			},
		},
	}

	ctx := context.Background()
	var response *model.LLMResponse
	var lastError error

	for resp, err := range m.GenerateContent(ctx, req, false) {
		if err != nil {
			lastError = err
			break
		}
		response = resp
	}

	if lastError != nil {
		t.Fatalf("GenerateContent failed: %v", lastError)
	}

	if response == nil || response.Content == nil {
		t.Fatal("Expected non-nil response with content")
	}

	// Check for function call
	foundFunctionCall := false
	for _, part := range response.Content.Parts {
		if part.FunctionCall != nil && part.FunctionCall.Name == "fetch_price" {
			foundFunctionCall = true
			if part.FunctionCall.Args["symbol"] != "AAPL" {
				t.Errorf("Expected symbol 'AAPL', got '%v'", part.FunctionCall.Args["symbol"])
			}
		}
	}

	if !foundFunctionCall {
		t.Error("Expected to find function call 'fetch_price' in response")
	}
}

func TestLiteLLMModel_GenerateContent_ErrorHandling(t *testing.T) {
	// Test server error
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "Internal server error"}`))
	}))
	defer server.Close()

	cfg := LiteLLMModelConfig{
		BaseURL:   server.URL,
		APIKey:    "test-key",
		ModelName: "gpt-5.3",
	}

	m := NewLiteLLMModel(cfg)

	req := &model.LLMRequest{
		Model: "gpt-5.3",
		Contents: []*genai.Content{
			{
				Role: "user",
				Parts: []*genai.Part{
					{Text: "Hello"},
				},
			},
		},
	}

	ctx := context.Background()
	var lastError error

	for _, err := range m.GenerateContent(ctx, req, false) {
		if err != nil {
			lastError = err
			break
		}
	}

	if lastError == nil {
		t.Error("Expected error for server error response")
	}
}

func TestLiteLLMModel_ConvertFinishReason(t *testing.T) {
	m := &LiteLLMModel{}

	tests := []struct {
		input    string
		expected genai.FinishReason
	}{
		{"stop", genai.FinishReasonStop},
		{"length", genai.FinishReasonMaxTokens},
		{"tool_calls", genai.FinishReasonStop},
		{"function_call", genai.FinishReasonStop},
		{"unknown", genai.FinishReasonUnspecified},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := m.convertFinishReason(tt.input)
			if result != tt.expected {
				t.Errorf("convertFinishReason(%s) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestLiteLLMModel_Timeout(t *testing.T) {
	// Test with custom timeout
	cfg := LiteLLMModelConfig{
		BaseURL:   "http://localhost:4000",
		APIKey:    "test-key",
		ModelName: "gpt-5.3",
		Timeout:   30 * time.Second,
	}

	m := NewLiteLLMModel(cfg)

	if m.httpClient.Timeout != 30*time.Second {
		t.Errorf("Expected timeout 30s, got %v", m.httpClient.Timeout)
	}

	// Test default timeout
	cfgDefault := LiteLLMModelConfig{
		BaseURL:   "http://localhost:4000",
		APIKey:    "test-key",
		ModelName: "gpt-5.3",
	}

	mDefault := NewLiteLLMModel(cfgDefault)

	if mDefault.httpClient.Timeout != 120*time.Second {
		t.Errorf("Expected default timeout 120s, got %v", mDefault.httpClient.Timeout)
	}
}
