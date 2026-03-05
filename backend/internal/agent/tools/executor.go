package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// ExecutorConfig configures the tool executor
type ExecutorConfig struct {
	DefaultTimeout time.Duration
	EnableCaching  bool
	CacheTTL       time.Duration
	MaxConcurrent  int
	EnableRetries  bool
	MaxRetries     int
	RetryDelay     time.Duration
}

// DefaultExecutorConfig returns the default executor configuration
func DefaultExecutorConfig() ExecutorConfig {
	return ExecutorConfig{
		DefaultTimeout: 30 * time.Second,
		EnableCaching:  true,
		CacheTTL:       5 * time.Minute,
		MaxConcurrent:  100,
		EnableRetries:  true,
		MaxRetries:     3,
		RetryDelay:     100 * time.Millisecond,
	}
}

// BatchExecutor handles batch execution of multiple tools
type BatchExecutor struct {
	registry *Registry
	config   ExecutorConfig
}

// NewBatchExecutor creates a new batch executor
func NewBatchExecutor(registry *Registry, config ExecutorConfig) *BatchExecutor {
	if registry == nil {
		registry = GetGlobalRegistry()
	}

	return &BatchExecutor{
		registry: registry,
		config:   config,
	}
}

// BatchRequest represents a batch execution request
type BatchRequest struct {
	Requests    []*ExecutionInput `json:"requests"`
	StopOnError bool              `json:"stop_on_error"`
	Parallel    bool              `json:"parallel"`
}

// BatchResult represents the result of a batch execution
type BatchResult struct {
	Results []*ExecutionResult `json:"results"`
	Errors  []BatchError       `json:"errors,omitempty"`
}

// BatchError represents an error in batch execution
type BatchError struct {
	Index   int    `json:"index"`
	ToolID  string `json:"tool_id"`
	Message string `json:"message"`
}

// ExecuteBatch executes multiple tool requests
func (be *BatchExecutor) ExecuteBatch(ctx context.Context, req *BatchRequest) (*BatchResult, error) {
	results := make([]*ExecutionResult, len(req.Requests))
	errors := []BatchError{}

	if req.Parallel {
		return be.executeParallel(ctx, req)
	}

	// Sequential execution
	for i, input := range req.Requests {
		result, err := be.registry.Execute(ctx, input)
		if err != nil {
			batchErr := BatchError{
				Index:   i,
				ToolID:  input.ToolID,
				Message: err.Error(),
			}
			errors = append(errors, batchErr)

			if req.StopOnError {
				return &BatchResult{
					Results: results[:i],
					Errors:  errors,
				}, nil
			}
			continue
		}
		results[i] = result
	}

	return &BatchResult{
		Results: results,
		Errors:  errors,
	}, nil
}

// executeParallel executes requests in parallel
func (be *BatchExecutor) executeParallel(ctx context.Context, req *BatchRequest) (*BatchResult, error) {
	results := make([]*ExecutionResult, len(req.Requests))
	errors := []BatchError{}
	errChan := make(chan BatchError, len(req.Requests))
	resultChan := make(chan struct {
		index  int
		result *ExecutionResult
	}, len(req.Requests))

	// Launch goroutines
	for i, input := range req.Requests {
		go func(idx int, in *ExecutionInput) {
			result, err := be.registry.Execute(ctx, in)
			if err != nil {
				errChan <- BatchError{
					Index:   idx,
					ToolID:  in.ToolID,
					Message: err.Error(),
				}
				return
			}
			resultChan <- struct {
				index  int
				result *ExecutionResult
			}{idx, result}
		}(i, input)
	}

	// Collect results
	completed := 0
	for completed < len(req.Requests) {
		select {
		case err := <-errChan:
			errors = append(errors, err)
			completed++
			if req.StopOnError {
				return &BatchResult{
					Results: results,
					Errors:  errors,
				}, nil
			}
		case res := <-resultChan:
			results[res.index] = res.result
			completed++
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}

	return &BatchResult{
		Results: results,
		Errors:  errors,
	}, nil
}

// StreamingExecutor handles streaming tool execution
type StreamingExecutor struct {
	registry *Registry
	config   ExecutorConfig
}

// NewStreamingExecutor creates a new streaming executor
func NewStreamingExecutor(registry *Registry, config ExecutorConfig) *StreamingExecutor {
	if registry == nil {
		registry = GetGlobalRegistry()
	}

	return &StreamingExecutor{
		registry: registry,
		config:   config,
	}
}

// StreamChunk represents a chunk of streaming output
type StreamChunk struct {
	ToolID   string          `json:"tool_id"`
	Index    int             `json:"index"`
	Data     json.RawMessage `json:"data"`
	Finished bool            `json:"finished"`
	Error    *ExecutionError `json:"error,omitempty"`
}

// ExecuteStream executes a tool with streaming output
func (se *StreamingExecutor) ExecuteStream(ctx context.Context, input *ExecutionInput, chunkHandler func(*StreamChunk) error) error {
	executor, exists := se.registry.Get(input.ToolID)
	if !exists {
		return fmt.Errorf("tool not found: %s", input.ToolID)
	}

	def := executor.Definition()

	// Check if tool supports streaming
	if def.ExecutionMode != ExecutionStreaming {
		// Fall back to regular execution
		result, err := se.registry.Execute(ctx, input)
		if err != nil {
			return err
		}

		chunk := &StreamChunk{
			ToolID:   input.ToolID,
			Index:    0,
			Data:     result.Data,
			Finished: true,
			Error:    result.Error,
		}
		return chunkHandler(chunk)
	}

	// For streaming tools, we would need the tool to implement a streaming interface
	// For now, return the result as a single chunk
	result, err := se.registry.Execute(ctx, input)
	if err != nil {
		return err
	}

	chunk := &StreamChunk{
		ToolID:   input.ToolID,
		Index:    0,
		Data:     result.Data,
		Finished: true,
		Error:    result.Error,
	}
	return chunkHandler(chunk)
}

// RetryPolicy defines how retries should be handled
type RetryPolicy struct {
	MaxRetries      int           `json:"max_retries"`
	InitialDelay    time.Duration `json:"initial_delay"`
	MaxDelay        time.Duration `json:"max_delay"`
	Multiplier      float64       `json:"multiplier"`
	RetryableErrors []string      `json:"retryable_errors"`
}

// DefaultRetryPolicy returns the default retry policy
func DefaultRetryPolicy() RetryPolicy {
	return RetryPolicy{
		MaxRetries:      3,
		InitialDelay:    100 * time.Millisecond,
		MaxDelay:        5 * time.Second,
		Multiplier:      2.0,
		RetryableErrors: []string{"TIMEOUT", "RATE_LIMIT", "TEMPORARY"},
	}
}

// IsRetryable checks if an error is retryable
func (rp RetryPolicy) IsRetryable(err *ExecutionError) bool {
	for _, retryableCode := range rp.RetryableErrors {
		if err.Code == retryableCode {
			return true
		}
	}
	return false
}

// CalculateDelay calculates the delay for a retry attempt
func (rp RetryPolicy) CalculateDelay(attempt int) time.Duration {
	delay := time.Duration(float64(rp.InitialDelay) * pow(rp.Multiplier, float64(attempt)))
	if delay > rp.MaxDelay {
		delay = rp.MaxDelay
	}
	return delay
}

func pow(base, exp float64) float64 {
	result := 1.0
	for i := 0; i < int(exp); i++ {
		result *= base
	}
	return result
}
