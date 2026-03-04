package hooks

import (
	"context"
	"fmt"
	"runtime/debug"
	"sync"
	"time"

	"go.uber.org/zap"
)

// Executor handles the execution of hooks
type Executor struct {
	registry   *Registry
	logger     *zap.Logger
	timeout    time.Duration
	maxRetries int
	panicHandler func(recovery interface{}, hook Hook, event *Event)
}

// ExecutorConfig contains configuration for the executor
type ExecutorConfig struct {
	Registry     *Registry
	Logger       *zap.Logger
	Timeout      time.Duration
	MaxRetries   int
	PanicHandler func(recovery interface{}, hook Hook, event *Event)
}

// NewExecutor creates a new hook executor
func NewExecutor(config ExecutorConfig) *Executor {
	if config.Logger == nil {
		config.Logger = zap.NewNop()
	}
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}

	return &Executor{
		registry:     config.Registry,
		logger:       config.Logger,
		timeout:      config.Timeout,
		maxRetries:   config.MaxRetries,
		panicHandler: config.PanicHandler,
	}
}

// ExecutionResult contains the result of executing hooks for an event
type ExecutionResult struct {
	Event          *Event
	Results        []*HookResult
	TotalDuration  time.Duration
	HooksExecuted  int
	HooksSkipped   int
	HooksFailed    int
	Stopped        bool
	StopReason     string
	PanicRecovered bool
}

// Execute executes all hooks for an event
func (e *Executor) Execute(ctx context.Context, event *Event) *ExecutionResult {
	start := time.Now()

	result := &ExecutionResult{
		Event:   event,
		Results: make([]*HookResult, 0),
	}

	// Validate event
	if err := e.registry.ValidateEvent(event); err != nil {
		e.logger.Error("event validation failed",
			zap.String("event_id", event.ID),
			zap.Error(err),
		)
		return result
	}

	// Get hooks for this event type
	hooks := e.registry.GetMatchingHooks(event.Type)
	if len(hooks) == 0 {
		e.logger.Debug("no hooks registered for event type",
			zap.String("event_id", event.ID),
			zap.String("event_type", string(event.Type)),
		)
		return result
	}

	// Build middleware chain
	baseExecutor := e.buildMiddlewareChain(e.executeHook)

	// Execute hooks
	currentEvent := event
	for _, hook := range hooks {
		// Skip disabled hooks
		if !hook.IsEnabled() {
			result.HooksSkipped++
			continue
		}

		// Check context cancellation
		select {
		case <-ctx.Done():
			result.Stopped = true
			result.StopReason = "context cancelled"
			break
		default:
		}

		// Execute with panic recovery
		hookResult := e.executeWithRecovery(ctx, hook, currentEvent, baseExecutor)
		result.Results = append(result.Results, hookResult)
		result.HooksExecuted++

		if hookResult.Error != nil {
			result.HooksFailed++
		}

		// Update event if modified
		if hookResult.ModifiedEvent != nil {
			currentEvent = hookResult.ModifiedEvent
		}

		// Stop if hook says not to proceed
		if !hookResult.Proceed {
			result.Stopped = true
			result.StopReason = "hook returned proceed=false"
			break
		}
	}

	// Update final event
	result.Event = currentEvent
	result.TotalDuration = time.Since(start)

	return result
}

// ExecuteSync executes hooks synchronously and returns the final event
func (e *Executor) ExecuteSync(ctx context.Context, event *Event) (*Event, error) {
	result := e.Execute(ctx, event)

	if result.HooksFailed > 0 {
		return result.Event, fmt.Errorf("%d hooks failed", result.HooksFailed)
	}

	return result.Event, nil
}

// ExecuteAsync executes hooks asynchronously
func (e *Executor) ExecuteAsync(ctx context.Context, event *Event, callback func(*ExecutionResult)) {
	go func() {
		result := e.Execute(ctx, event)
		if callback != nil {
			callback(result)
		}
	}()
}

// executeWithRecovery executes a hook with panic recovery
func (e *Executor) executeWithRecovery(ctx context.Context, hook Hook, event *Event, executor HookExecutor) (result *HookResult) {
	defer func() {
		if recovery := recover(); recovery != nil {
			stack := string(debug.Stack())

			e.logger.Error("panic recovered in hook execution",
				zap.String("hook_id", hook.ID()),
				zap.String("hook_name", hook.Name()),
				zap.String("event_id", event.ID),
				zap.Any("panic", recovery),
				zap.String("stack", stack),
			)

			// Call custom panic handler if set
			if e.panicHandler != nil {
				e.panicHandler(recovery, hook, event)
			}

			result = &HookResult{
				Proceed: true, // Continue even after panic
				Error:   fmt.Errorf("panic in hook %s: %v", hook.ID(), recovery),
				Metadata: map[string]interface{}{
					"panic":         recovery,
					"stack":         stack,
					"panic_version": 1,
				},
			}
		}
	}()

	return executor(ctx, hook, event)
}

// executeHook executes a single hook with timeout and retry logic
func (e *Executor) executeHook(ctx context.Context, hook Hook, event *Event) *HookResult {
	// Determine timeout
	timeout := e.timeout
	if hook.Timeout() > 0 {
		timeout = time.Duration(hook.Timeout()) * time.Millisecond
	}

	// Create timeout context
	execCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	// Execute with retries
	var result *HookResult
	maxAttempts := e.maxRetries + 1
	if hookMaxRetries := e.getHookMaxRetries(hook); hookMaxRetries > e.maxRetries {
		maxAttempts = hookMaxRetries + 1
	}

	for attempt := 0; attempt < maxAttempts; attempt++ {
		start := time.Now()

		// Execute the hook
		result = hook.Execute(execCtx, event)
		duration := time.Since(start)

		// Record stats
		e.registry.stats.RecordExecution(
			event.Type,
			duration,
			result.Error != nil,
			hook.ID(),
		)

		// Log execution
		e.logger.Debug("hook executed",
			zap.String("hook_id", hook.ID()),
			zap.String("hook_name", hook.Name()),
			zap.String("event_id", event.ID),
			zap.Duration("duration", duration),
			zap.Bool("proceed", result.Proceed),
			zap.Bool("error", result.Error != nil),
			zap.Int("attempt", attempt+1),
		)

		// Check for success or non-retryable error
		if result.Error == nil || !e.isRetryableError(result.Error) {
			break
		}

		// Wait before retry
		if attempt < maxAttempts-1 {
			select {
			case <-time.After(e.getRetryDelay(attempt)):
			case <-execCtx.Done():
				result.Error = execCtx.Err()
				break
			}
		}
	}

	return result
}

// buildMiddlewareChain builds the middleware chain
func (e *Executor) buildMiddlewareChain(final HookExecutor) HookExecutor {
	executor := final

	// Apply middlewares in reverse order
	middlewares := e.registry.GetMiddlewares()
	for i := len(middlewares) - 1; i >= 0; i-- {
		executor = middlewares[i](executor)
	}

	return executor
}

// getHookMaxRetries gets the max retries for a hook
func (e *Executor) getHookMaxRetries(hook Hook) int {
	// Check if hook has a config with max retries
	if config, ok := hook.(interface{ Config() HookConfig }); ok {
		hookConfig := config.Config()
		if hookConfig.MaxRetries > 0 {
			return hookConfig.MaxRetries
		}
	}
	return e.maxRetries
}

// getRetryDelay calculates the retry delay based on attempt
func (e *Executor) getRetryDelay(attempt int) time.Duration {
	// Exponential backoff: 100ms, 200ms, 400ms, etc.
	delay := time.Duration(100*(1<<attempt)) * time.Millisecond
	maxDelay := 5 * time.Second
	if delay > maxDelay {
		delay = maxDelay
	}
	return delay
}

// isRetryableError determines if an error is retryable
func (e *Executor) isRetryableError(err error) bool {
	if err == nil {
		return false
	}

	// Context errors are not retryable
	if err == context.Canceled || err == context.DeadlineExceeded {
		return false
	}

	// Add more retryable error conditions as needed
	return true
}

// BatchExecutor handles batch execution of multiple events
type BatchExecutor struct {
	executor  *Executor
	workers   int
	queueSize int
}

// BatchExecutorConfig contains configuration for batch executor
type BatchExecutorConfig struct {
	Executor  *Executor
	Workers   int
	QueueSize int
}

// NewBatchExecutor creates a new batch executor
func NewBatchExecutor(config BatchExecutorConfig) *BatchExecutor {
	if config.Workers <= 0 {
		config.Workers = 4
	}
	if config.QueueSize <= 0 {
		config.QueueSize = 100
	}

	return &BatchExecutor{
		executor:  config.Executor,
		workers:   config.Workers,
		queueSize: config.QueueSize,
	}
}

// BatchResult contains the results of batch execution
type BatchResult struct {
	Results    []*ExecutionResult
	TotalTime  time.Duration
	Successes  int
	Failures   int
	Errors     []error
}

// ExecuteBatch executes multiple events in parallel
func (be *BatchExecutor) ExecuteBatch(ctx context.Context, events []*Event) *BatchResult {
	start := time.Now()

	result := &BatchResult{
		Results: make([]*ExecutionResult, len(events)),
		Errors:  make([]error, 0),
	}

	var wg sync.WaitGroup
	var mu sync.Mutex

	// Create a semaphore for worker limit
	sem := make(chan struct{}, be.workers)

	for i, event := range events {
		wg.Add(1)

		go func(idx int, evt *Event) {
			defer wg.Done()

			// Acquire semaphore
			sem <- struct{}{}
			defer func() { <-sem }()

			// Execute
			execResult := be.executor.Execute(ctx, evt)

			mu.Lock()
			result.Results[idx] = execResult
			if execResult.HooksFailed > 0 {
				result.Failures++
				result.Errors = append(result.Errors,
					fmt.Errorf("event %s had %d failed hooks", evt.ID, execResult.HooksFailed))
			} else {
				result.Successes++
			}
			mu.Unlock()
		}(i, event)
	}

	wg.Wait()
	result.TotalTime = time.Since(start)

	return result
}

// EventPipeline provides a pipeline for processing events through multiple stages
type EventPipeline struct {
	executor   *Executor
	stages     []PipelineStage
	logger     *zap.Logger
}

// PipelineStage represents a stage in the event pipeline
type PipelineStage struct {
	Name        string
	EventTypes  []EventType
	Transform   func(*Event) (*Event, error)
	Filter      func(*Event) bool
}

// NewEventPipeline creates a new event pipeline
func NewEventPipeline(executor *Executor, logger *zap.Logger) *EventPipeline {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &EventPipeline{
		executor: executor,
		stages:   make([]PipelineStage, 0),
		logger:   logger,
	}
}

// AddStage adds a stage to the pipeline
func (p *EventPipeline) AddStage(stage PipelineStage) {
	p.stages = append(p.stages, stage)
}

// Process processes an event through the pipeline
func (p *EventPipeline) Process(ctx context.Context, event *Event) (*ExecutionResult, error) {
	currentEvent := event

	// Process through stages
	for _, stage := range p.stages {
		// Check if this stage applies to this event
		if len(stage.EventTypes) > 0 {
			matches := false
			for _, et := range stage.EventTypes {
				if et == currentEvent.Type {
					matches = true
					break
				}
			}
			if !matches {
				continue
			}
		}

		// Apply filter if present
		if stage.Filter != nil && !stage.Filter(currentEvent) {
			continue
		}

		// Apply transform if present
		if stage.Transform != nil {
			transformed, err := stage.Transform(currentEvent)
			if err != nil {
				return nil, fmt.Errorf("stage %s transform failed: %w", stage.Name, err)
			}
			currentEvent = transformed
		}
	}

	// Execute hooks
	return p.executor.Execute(ctx, currentEvent), nil
}

// HookScheduler schedules hooks for execution at specific times or intervals
type HookScheduler struct {
	executor  *Executor
	scheduled map[string]*ScheduledHook
	mu        sync.RWMutex
	stopCh    chan struct{}
	logger    *zap.Logger
}

// ScheduledHook represents a scheduled hook execution
type ScheduledHook struct {
	ID         string
	Event      *Event
	Interval   time.Duration
	NextRun    time.Time
	LastRun    time.Time
	RunCount   int64
	MaxRuns    int64
	StopAfter  time.Time
	Paused     bool
}

// NewHookScheduler creates a new hook scheduler
func NewHookScheduler(executor *Executor, logger *zap.Logger) *HookScheduler {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &HookScheduler{
		executor:  executor,
		scheduled: make(map[string]*ScheduledHook),
		stopCh:    make(chan struct{}),
		logger:    logger,
	}
}

// Schedule schedules a hook for repeated execution
func (s *HookScheduler) Schedule(id string, event *Event, interval time.Duration, opts ...ScheduleOption) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.scheduled[id]; exists {
		return fmt.Errorf("scheduled hook with ID '%s' already exists", id)
	}

	scheduled := &ScheduledHook{
		ID:        id,
		Event:     event,
		Interval:  interval,
		NextRun:   time.Now().Add(interval),
		MaxRuns:   -1, // Unlimited by default
	}

	// Apply options
	for _, opt := range opts {
		opt(scheduled)
	}

	s.scheduled[id] = scheduled

	s.logger.Info("hook scheduled",
		zap.String("schedule_id", id),
		zap.Duration("interval", interval),
		zap.Time("next_run", scheduled.NextRun),
	)

	return nil
}

// ScheduleOption is an option for scheduling
type ScheduleOption func(*ScheduledHook)

// WithMaxRuns sets the maximum number of runs
func WithMaxRuns(max int64) ScheduleOption {
	return func(h *ScheduledHook) {
		h.MaxRuns = max
	}
}

// WithStartTime sets the start time
func WithStartTime(t time.Time) ScheduleOption {
	return func(h *ScheduledHook) {
		h.NextRun = t
	}
}

// WithStopAfter sets when to stop
func WithStopAfter(t time.Time) ScheduleOption {
	return func(h *ScheduledHook) {
		h.StopAfter = t
	}
}

// Start starts the scheduler
func (s *HookScheduler) Start() {
	go s.run()
}

// Stop stops the scheduler
func (s *HookScheduler) Stop() {
	close(s.stopCh)
}

// run runs the scheduler loop
func (s *HookScheduler) run() {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopCh:
			return
		case <-ticker.C:
			s.tick()
		}
	}
}

// tick processes scheduled hooks
func (s *HookScheduler) tick() {
	now := time.Now()

	s.mu.Lock()
	defer s.mu.Unlock()

	for id, scheduled := range s.scheduled {
		if scheduled.Paused {
			continue
		}

		if now.Before(scheduled.NextRun) {
			continue
		}

		// Check stop conditions
		if scheduled.MaxRuns > 0 && scheduled.RunCount >= scheduled.MaxRuns {
			delete(s.scheduled, id)
			continue
		}

		if !scheduled.StopAfter.IsZero() && now.After(scheduled.StopAfter) {
			delete(s.scheduled, id)
			continue
		}

		// Execute
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		s.executor.ExecuteAsync(ctx, scheduled.Event, func(result *ExecutionResult) {
			s.logger.Debug("scheduled hook executed",
				zap.String("schedule_id", id),
				zap.Duration("duration", result.TotalDuration),
			)
			cancel()
		})

		// Update schedule
		scheduled.LastRun = now
		scheduled.NextRun = now.Add(scheduled.Interval)
		scheduled.RunCount++
	}
}

// Pause pauses a scheduled hook
func (s *HookScheduler) Pause(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	scheduled, exists := s.scheduled[id]
	if !exists {
		return fmt.Errorf("scheduled hook '%s' not found", id)
	}

	scheduled.Paused = true
	return nil
}

// Resume resumes a scheduled hook
func (s *HookScheduler) Resume(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	scheduled, exists := s.scheduled[id]
	if !exists {
		return fmt.Errorf("scheduled hook '%s' not found", id)
	}

	scheduled.Paused = false
	scheduled.NextRun = time.Now().Add(scheduled.Interval)
	return nil
}

// Unschedule removes a scheduled hook
func (s *HookScheduler) Unschedule(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.scheduled[id]; !exists {
		return fmt.Errorf("scheduled hook '%s' not found", id)
	}

	delete(s.scheduled, id)
	return nil
}
