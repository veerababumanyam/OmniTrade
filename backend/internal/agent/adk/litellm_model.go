// Copyright 2026 OmniTrade Authors
// SPDX-License-Identifier: Apache-2.0

package adk

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"iter"
	"log"
	"net/http"
	"strings"
	"time"

	"google.golang.org/adk/model"
	"google.golang.org/genai"
)

// LiteLLMModel implements the model.LLM interface, routing requests through
// LiteLLM Gateway for multi-provider LLM access.
//
// LiteLLM Gateway provides a unified OpenAI-compatible API that can route
// requests to various LLM providers (OpenAI, Anthropic, Google, etc.).
type LiteLLMModel struct {
	baseURL    string
	apiKey     string
	modelName  string
	httpClient *http.Client
}

// LiteLLMModelConfig holds configuration for creating a new LiteLLMModel.
type LiteLLMModelConfig struct {
	// BaseURL is the LiteLLM Gateway endpoint (e.g., "http://localhost:4000").
	BaseURL string

	// APIKey is the LiteLLM Gateway API key.
	APIKey string

	// ModelName is the model to use (e.g., "gpt-5.3", "claude-4.6", "gemini-3.1").
	ModelName string

	// Timeout is the HTTP client timeout. Defaults to 120 seconds if not set.
	Timeout time.Duration
}

// NewLiteLLMModel creates a new LiteLLMModel instance.
func NewLiteLLMModel(cfg LiteLLMModelConfig) *LiteLLMModel {
	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 120 * time.Second
	}

	return &LiteLLMModel{
		baseURL:   strings.TrimSuffix(cfg.BaseURL, "/"),
		apiKey:    cfg.APIKey,
		modelName: cfg.ModelName,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// Name returns the model name.
func (m *LiteLLMModel) Name() string {
	return m.modelName
}

// GenerateContent generates content using LiteLLM Gateway.
// It supports both streaming and non-streaming modes.
func (m *LiteLLMModel) GenerateContent(ctx context.Context, req *model.LLMRequest, stream bool) iter.Seq2[*model.LLMResponse, error] {
	return func(yield func(*model.LLMResponse, error) bool) {
		// Convert ADK request to OpenAI format
		openaiReq, err := m.convertToOpenAIRequest(req, stream)
		if err != nil {
			yield(nil, fmt.Errorf("failed to convert request: %w", err))
			return
		}

		// Make HTTP request to LiteLLM
		httpReq, err := m.buildHTTPRequest(ctx, openaiReq)
		if err != nil {
			yield(nil, fmt.Errorf("failed to build HTTP request: %w", err))
			return
		}

		resp, err := m.httpClient.Do(httpReq)
		if err != nil {
			yield(nil, fmt.Errorf("HTTP request failed: %w", err))
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			yield(nil, fmt.Errorf("LiteLLM error (status %d): %s", resp.StatusCode, string(body)))
			return
		}

		if stream {
			m.handleStreamingResponse(resp.Body, yield)
		} else {
			m.handleNonStreamingResponse(resp.Body, yield)
		}
	}
}

// OpenAI request/response types for LiteLLM compatibility

type openAIRequest struct {
	Model       string          `json:"model"`
	Messages    []openAIMessage `json:"messages"`
	Stream      bool            `json:"stream,omitempty"`
	Temperature float64         `json:"temperature,omitempty"`
	MaxTokens   int             `json:"max_tokens,omitempty"`
	Tools       []openAITool    `json:"tools,omitempty"`
}

type openAIMessage struct {
	Role      string          `json:"role"`
	Content   any             `json:"content"`
	ToolCalls []openAIToolCall `json:"tool_calls,omitempty"`
}

type openAIToolCall struct {
	ID       string           `json:"id"`
	Type     string           `json:"type"`
	Function openAIFunctionCall `json:"function"`
}

type openAIFunctionCall struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

type openAITool struct {
	Type     string           `json:"type"`
	Function openAIFunctionDef `json:"function"`
}

type openAIFunctionDef struct {
	Name        string                            `json:"name"`
	Description string                            `json:"description"`
	Parameters  map[string]any                    `json:"parameters"`
}

type openAIResponse struct {
	ID      string           `json:"id"`
	Object  string           `json:"object"`
	Created int64            `json:"created"`
	Model   string           `json:"model"`
	Choices []openAIChoice   `json:"choices"`
	Usage   openAIUsage      `json:"usage"`
}

type openAIChoice struct {
	Index        int            `json:"index"`
	Message      openAIMessage  `json:"message"`
	Delta        *openAIDelta   `json:"delta,omitempty"`
	FinishReason string         `json:"finish_reason"`
}

type openAIDelta struct {
	Role      string           `json:"role,omitempty"`
	Content   string           `json:"content,omitempty"`
	ToolCalls []openAIToolCall `json:"tool_calls,omitempty"`
}

type openAIUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// convertToOpenAIRequest converts ADK LLMRequest to OpenAI format.
func (m *LiteLLMModel) convertToOpenAIRequest(req *model.LLMRequest, stream bool) (*openAIRequest, error) {
	messages := make([]openAIMessage, 0, len(req.Contents))

	for _, content := range req.Contents {
		msg, err := m.convertContentToMessage(content)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	openaiReq := &openAIRequest{
		Model:    m.modelName,
		Messages: messages,
		Stream:   stream,
	}

	// Apply config if present
	if req.Config != nil {
		if req.Config.Temperature != nil {
			openaiReq.Temperature = float64(*req.Config.Temperature)
		}
		if req.Config.MaxOutputTokens > 0 {
			openaiReq.MaxTokens = int(req.Config.MaxOutputTokens)
		}
	}

	return openaiReq, nil
}

// convertContentToMessage converts genai.Content to OpenAI message format.
func (m *LiteLLMModel) convertContentToMessage(content *genai.Content) (openAIMessage, error) {
	msg := openAIMessage{
		Role: string(content.Role),
	}

	var textParts []string
	var toolCalls []openAIToolCall

	for _, part := range content.Parts {
		switch {
		case part.Text != "":
			textParts = append(textParts, part.Text)

		case part.FunctionCall != nil:
			args, err := json.Marshal(part.FunctionCall.Args)
			if err != nil {
				return msg, fmt.Errorf("failed to marshal function args: %w", err)
			}
			toolCalls = append(toolCalls, openAIToolCall{
				ID:   part.FunctionCall.ID,
				Type: "function",
				Function: openAIFunctionCall{
					Name:      part.FunctionCall.Name,
					Arguments: string(args),
				},
			})

		case part.FunctionResponse != nil:
			// Function response - role should be "tool"
			respBytes, err := json.Marshal(part.FunctionResponse.Response)
			if err != nil {
				return msg, fmt.Errorf("failed to marshal function response: %w", err)
			}
			return openAIMessage{
				Role:    "tool",
				Content: string(respBytes),
			}, nil
		}
	}

	if len(textParts) > 0 {
		msg.Content = strings.Join(textParts, "\n")
	}
	if len(toolCalls) > 0 {
		msg.ToolCalls = toolCalls
	}

	return msg, nil
}

// buildHTTPRequest creates the HTTP request for LiteLLM.
func (m *LiteLLMModel) buildHTTPRequest(ctx context.Context, req *openAIRequest) (*http.Request, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", m.baseURL+"/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+m.apiKey)

	return httpReq, nil
}

// handleNonStreamingResponse processes a non-streaming response.
func (m *LiteLLMModel) handleNonStreamingResponse(body io.Reader, yield func(*model.LLMResponse, error) bool) {
	var resp openAIResponse
	if err := json.NewDecoder(body).Decode(&resp); err != nil {
		yield(nil, fmt.Errorf("failed to decode response: %w", err))
		return
	}

	if len(resp.Choices) == 0 {
		yield(nil, fmt.Errorf("no choices in response"))
		return
	}

	llmResp, err := m.convertToLLMResponse(&resp, false)
	if err != nil {
		yield(nil, err)
		return
	}

	yield(llmResp, nil)
}

// handleStreamingResponse processes a streaming SSE response.
func (m *LiteLLMModel) handleStreamingResponse(body io.Reader, yield func(*model.LLMResponse, error) bool) {
	scanner := bufio.NewScanner(body)
	var accumulatedContent strings.Builder
	var accumulatedToolCalls []openAIToolCall

	for scanner.Scan() {
		line := scanner.Text()

		// SSE format: "data: {...}"
		if !strings.HasPrefix(line, "data: ") {
			continue
		}

		data := strings.TrimPrefix(line, "data: ")

		// Check for end of stream
		if data == "[DONE]" {
			// Yield final complete response
			if accumulatedContent.Len() > 0 || len(accumulatedToolCalls) > 0 {
				finalResp := &model.LLMResponse{
					Content: &genai.Content{
						Role:  "model",
						Parts: m.buildParts(accumulatedContent.String(), accumulatedToolCalls),
					},
					TurnComplete: true,
					Partial:      false,
				}
				yield(finalResp, nil)
			}
			return
		}

		var chunk openAIResponse
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			log.Printf("Warning: failed to parse streaming chunk: %v", err)
			continue
		}

		if len(chunk.Choices) == 0 {
			continue
		}

		choice := chunk.Choices[0]

		// Accumulate content
		if choice.Delta != nil && choice.Delta.Content != "" {
			accumulatedContent.WriteString(choice.Delta.Content)

			// Yield partial response for UI updates
			partialResp := &model.LLMResponse{
				Content: &genai.Content{
					Role:  "model",
					Parts: []*genai.Part{{Text: choice.Delta.Content}},
				},
				Partial:      true,
				TurnComplete: false,
			}
			if !yield(partialResp, nil) {
				return
			}
		}

		// Accumulate tool calls
		if choice.Delta != nil && len(choice.Delta.ToolCalls) > 0 {
			accumulatedToolCalls = append(accumulatedToolCalls, choice.Delta.ToolCalls...)
		}

		// Check for completion
		if choice.FinishReason != "" && choice.FinishReason != "null" {
			finalResp := &model.LLMResponse{
				Content: &genai.Content{
					Role:  "model",
					Parts: m.buildParts(accumulatedContent.String(), accumulatedToolCalls),
				},
				TurnComplete:  true,
				Partial:       false,
				FinishReason:  m.convertFinishReason(choice.FinishReason),
			}
			yield(finalResp, nil)
			return
		}
	}

	if err := scanner.Err(); err != nil {
		yield(nil, fmt.Errorf("stream reading error: %w", err))
	}
}

// buildParts creates genai.Part slice from accumulated content.
func (m *LiteLLMModel) buildParts(text string, toolCalls []openAIToolCall) []*genai.Part {
	parts := make([]*genai.Part, 0, 1+len(toolCalls))

	if text != "" {
		parts = append(parts, &genai.Part{Text: text})
	}

	for _, tc := range toolCalls {
		var args map[string]any
		if err := json.Unmarshal([]byte(tc.Function.Arguments), &args); err != nil {
			args = make(map[string]any)
		}

		parts = append(parts, &genai.Part{
			FunctionCall: &genai.FunctionCall{
				ID:   tc.ID,
				Name: tc.Function.Name,
				Args: args,
			},
		})
	}

	return parts
}

// convertToLLMResponse converts OpenAI response to ADK LLMResponse.
func (m *LiteLLMModel) convertToLLMResponse(resp *openAIResponse, partial bool) (*model.LLMResponse, error) {
	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no choices in response")
	}

	choice := resp.Choices[0]

	var parts []*genai.Part
	if msg, ok := choice.Message.Content.(string); ok && msg != "" {
		parts = append(parts, &genai.Part{Text: msg})
	}

	for _, tc := range choice.Message.ToolCalls {
		var args map[string]any
		if err := json.Unmarshal([]byte(tc.Function.Arguments), &args); err != nil {
			args = make(map[string]any)
		}

		parts = append(parts, &genai.Part{
			FunctionCall: &genai.FunctionCall{
				ID:   tc.ID,
				Name: tc.Function.Name,
				Args: args,
			},
		})
	}

	return &model.LLMResponse{
		Content: &genai.Content{
			Role:  "model",
			Parts: parts,
		},
		UsageMetadata: &genai.GenerateContentResponseUsageMetadata{
			PromptTokenCount:     int32(resp.Usage.PromptTokens),
			CandidatesTokenCount: int32(resp.Usage.CompletionTokens),
			TotalTokenCount:      int32(resp.Usage.TotalTokens),
		},
		FinishReason: m.convertFinishReason(choice.FinishReason),
		Partial:      partial,
		TurnComplete: !partial,
	}, nil
}

// convertFinishReason converts OpenAI finish reason to genai FinishReason.
func (m *LiteLLMModel) convertFinishReason(reason string) genai.FinishReason {
	switch reason {
	case "stop":
		return genai.FinishReasonStop
	case "length":
		return genai.FinishReasonMaxTokens
	case "tool_calls", "function_call":
		return genai.FinishReasonStop // Tool calls are normal completion
	default:
		return genai.FinishReasonUnspecified
	}
}
