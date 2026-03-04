package plugins

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

// ManagerConfig holds configuration for the plugin manager
type ManagerConfig struct {
	// AutoStart automatically starts plugins after loading
	AutoStart bool
	// HealthCheckInterval for periodic health checks
	HealthCheckInterval time.Duration
	// HealthCheckTimeout for individual health checks
	HealthCheckTimeout time.Duration
	// EnableCircuitBreaker wraps plugins with circuit breaker
	EnableCircuitBreaker bool
	// DefaultCircuitBreakerConfig for all plugins
	DefaultCircuitBreakerConfig CircuitBreakerConfig
	// ShutdownTimeout for graceful shutdown
	ShutdownTimeout time.Duration
	// MaxConcurrentInit limits concurrent plugin initializations
	MaxConcurrentInit int
}

// DefaultManagerConfig returns the default manager configuration
func DefaultManagerConfig() ManagerConfig {
	return ManagerConfig{
		AutoStart:            true,
		HealthCheckInterval:  30 * time.Second,
		HealthCheckTimeout:   5 * time.Second,
		EnableCircuitBreaker: true,
		DefaultCircuitBreakerConfig: CircuitBreakerConfig{
			Enabled:          true,
			FailureThreshold: 5,
			SuccessThreshold: 2,
			Timeout:          30 * time.Second,
		},
		ShutdownTimeout:    30 * time.Second,
		MaxConcurrentInit:  10,
	}
}

// Manager manages plugin lifecycle and orchestration
type Manager struct {
	config   ManagerConfig
	registry *Registry
	loader   *Loader

	mu sync.RWMutex

	// initialized tracks which plugins have been initialized
	initialized map[string]bool

	// started tracks which plugins have been started
	started map[string]bool

	// circuitBreakers stores circuit breakers for plugins
	circuitBreakers map[string]*CircuitBreaker

	// healthCancel cancels the health check goroutine
	healthCancel context.CancelFunc

	// lifecycleHooks for plugin lifecycle events
	lifecycleHooks []LifecycleHook

	// logger for structured logging
	logger PluginLogger
}

// LifecycleHook defines hooks for plugin lifecycle events
type LifecycleHook interface {
	OnPluginLoading(pluginID string)
	OnPluginLoaded(pluginID string, err error)
	OnPluginInitializing(pluginID string)
	OnPluginInitialized(pluginID string, err error)
	OnPluginStarting(pluginID string)
	OnPluginStarted(pluginID string, err error)
	OnPluginStopping(pluginID string)
	OnPluginStopped(pluginID string, err error)
	OnPluginHealthChanged(pluginID string, healthy bool)
}

// NewManager creates a new plugin manager
func NewManager(config ManagerConfig, registry *Registry) *Manager {
	if registry == nil {
		registry = NewRegistry()
	}

	return &Manager{
		config:          config,
		registry:        registry,
		initialized:     make(map[string]bool),
		started:         make(map[string]bool),
		circuitBreakers: make(map[string]*CircuitBreaker),
		lifecycleHooks:  make([]LifecycleHook, 0),
		logger:          &defaultLogger{},
	}
}

// SetLogger sets the logger for the manager
func (m *Manager) SetLogger(logger PluginLogger) {
	m.logger = logger
}

// AddLifecycleHook adds a lifecycle hook
func (m *Manager) AddLifecycleHook(hook LifecycleHook) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.lifecycleHooks = append(m.lifecycleHooks, hook)
}

// Registry returns the plugin registry
func (m *Manager) Registry() *Registry {
	return m.registry
}

// Register registers a plugin factory with the manager
func (m *Manager) Register(factory PluginFactory) error {
	return m.registry.Register(factory)
}

// Load loads plugins using the configured loader
func (m *Manager) Load(ctx context.Context) error {
	if m.loader == nil {
		m.loader = NewLoader(DefaultLoaderConfig(), m.registry)
	}

	plugins, err := m.loader.LoadAll(ctx)
	if err != nil {
		return fmt.Errorf("failed to load plugins: %w", err)
	}

	m.logger.Info("Loaded plugins", "count", len(plugins))

	if m.config.AutoStart {
		return m.InitializeAll(ctx)
	}

	return nil
}

// InitializeAll initializes all registered plugins in dependency order
func (m *Manager) InitializeAll(ctx context.Context) error {
	// Get dependency order
	order, err := m.registry.ResolveDependencies()
	if err != nil {
		return fmt.Errorf("failed to resolve dependencies: %w", err)
	}

	// Use a semaphore for concurrent initialization
	sem := make(chan struct{}, m.config.MaxConcurrentInit)
	var wg sync.WaitGroup
	var initErrors []error
	var errorMu sync.Mutex

	for _, pluginID := range order {
		wg.Add(1)
		go func(id string) {
			defer wg.Done()

			sem <- struct{}{}
			defer func() { <-sem }()

			if err := m.InitializePlugin(ctx, id); err != nil {
				errorMu.Lock()
				initErrors = append(initErrors, fmt.Errorf("failed to initialize %s: %w", id, err))
				errorMu.Unlock()
			}
		}(pluginID)
	}

	wg.Wait()

	if len(initErrors) > 0 {
		return fmt.Errorf("initialization errors: %v", initErrors)
	}

	// Start all initialized plugins
	return m.StartAll(ctx)
}

// InitializePlugin initializes a specific plugin
func (m *Manager) InitializePlugin(ctx context.Context, pluginID string) error {
	m.mu.Lock()
	if m.initialized[pluginID] {
		m.mu.Unlock()
		return nil
	}
	m.mu.Unlock()

	// Notify hooks
	m.notifyHooks(func(h LifecycleHook) {
		h.OnPluginInitializing(pluginID)
	})

	// Get plugin config
	config, exists := m.registry.GetConfig(pluginID)
	if !exists {
		config = PluginConfig{
			Enabled:        true,
			Settings:       make(map[string]interface{}),
			Timeout:        30 * time.Second,
			MaxRetries:     3,
			CircuitBreaker: m.config.DefaultCircuitBreakerConfig,
		}
	}

	// Check if plugin is enabled
	if !config.Enabled {
		m.logger.Info("Plugin is disabled, skipping", "plugin", pluginID)
		return nil
	}

	// Create plugin instance
	plugin, err := m.registry.CreateInstance(pluginID)
	if err != nil {
		m.notifyHooks(func(h LifecycleHook) {
			h.OnPluginInitialized(pluginID, err)
		})
		return fmt.Errorf("failed to create plugin instance: %w", err)
	}

	// Wrap with circuit breaker if enabled
	if m.config.EnableCircuitBreaker && config.CircuitBreaker.Enabled {
		cb := NewCircuitBreaker(config.CircuitBreaker)
		m.mu.Lock()
		m.circuitBreakers[pluginID] = cb
		m.mu.Unlock()
	}

	// Create plugin context
	pluginCtx := &PluginContext{
		Context:     ctx,
		CorrelationID: fmt.Sprintf("init-%s-%d", pluginID, time.Now().UnixNano()),
		Timestamp:   time.Now(),
		Metadata:    make(map[string]interface{}),
		Logger:      m.logger,
	}

	// Initialize the plugin
	if err := plugin.Initialize(pluginCtx, config); err != nil {
		m.registry.SetState(pluginID, StateError)
		m.notifyHooks(func(h LifecycleHook) {
			h.OnPluginInitialized(pluginID, err)
		})
		return fmt.Errorf("plugin initialization failed: %w", err)
	}

	// Update state
	m.registry.SetState(pluginID, StateLoaded)
	m.mu.Lock()
	m.initialized[pluginID] = true
	m.mu.Unlock()

	m.notifyHooks(func(h LifecycleHook) {
		h.OnPluginInitialized(pluginID, nil)
	})

	m.logger.Info("Plugin initialized", "plugin", pluginID)

	return nil
}

// StartAll starts all initialized plugins
func (m *Manager) StartAll(ctx context.Context) error {
	// Get dependency order
	order, err := m.registry.ResolveDependencies()
	if err != nil {
		return fmt.Errorf("failed to resolve dependencies: %w", err)
	}

	var startErrors []error

	for _, pluginID := range order {
		if err := m.StartPlugin(ctx, pluginID); err != nil {
			startErrors = append(startErrors, fmt.Errorf("failed to start %s: %w", pluginID, err))
		}
	}

	if len(startErrors) > 0 {
		return fmt.Errorf("startup errors: %v", startErrors)
	}

	// Start health checks
	m.startHealthChecks()

	return nil
}

// StartPlugin starts a specific plugin
func (m *Manager) StartPlugin(ctx context.Context, pluginID string) error {
	m.mu.Lock()
	if m.started[pluginID] {
		m.mu.Unlock()
		return nil
	}

	if !m.initialized[pluginID] {
		m.mu.Unlock()
		return fmt.Errorf("plugin %s is not initialized", pluginID)
	}
	m.mu.Unlock()

	// Notify hooks
	m.notifyHooks(func(h LifecycleHook) {
		h.OnPluginStarting(pluginID)
	})

	plugin, exists := m.registry.Get(pluginID)
	if !exists {
		return fmt.Errorf("plugin %s not found", pluginID)
	}

	// Create plugin context
	pluginCtx := &PluginContext{
		Context:     ctx,
		CorrelationID: fmt.Sprintf("start-%s-%d", pluginID, time.Now().UnixNano()),
		Timestamp:   time.Now(),
		Metadata:    make(map[string]interface{}),
		Logger:      m.logger,
	}

	// Update state
	m.registry.SetState(pluginID, StateInitializing)

	// Start the plugin
	if err := plugin.Start(pluginCtx); err != nil {
		m.registry.SetState(pluginID, StateError)
		m.notifyHooks(func(h LifecycleHook) {
			h.OnPluginStarted(pluginID, err)
		})
		return fmt.Errorf("plugin start failed: %w", err)
	}

	// Update state
	m.registry.SetState(pluginID, StateActive)
	m.mu.Lock()
	m.started[pluginID] = true
	m.mu.Unlock()

	m.notifyHooks(func(h LifecycleHook) {
		h.OnPluginStarted(pluginID, nil)
	})

	m.logger.Info("Plugin started", "plugin", pluginID)

	return nil
}

// StopAll stops all running plugins
func (m *Manager) StopAll(ctx context.Context) error {
	// Stop health checks first
	if m.healthCancel != nil {
		m.healthCancel()
	}

	// Get reverse dependency order for shutdown
	order, err := m.registry.ResolveDependencies()
	if err != nil {
		// Continue with arbitrary order if dependency resolution fails
		order = m.registry.List()
	}

	// Reverse the order for shutdown
	for i, j := 0, len(order)-1; i < j; i, j = i+1, j-1 {
		order[i], order[j] = order[j], order[i]
	}

	var stopErrors []error

	for _, pluginID := range order {
		if err := m.StopPlugin(ctx, pluginID); err != nil {
			stopErrors = append(stopErrors, fmt.Errorf("failed to stop %s: %w", pluginID, err))
		}
	}

	if len(stopErrors) > 0 {
		return fmt.Errorf("stop errors: %v", stopErrors)
	}

	return nil
}

// StopPlugin stops a specific plugin
func (m *Manager) StopPlugin(ctx context.Context, pluginID string) error {
	m.mu.Lock()
	if !m.started[pluginID] {
		m.mu.Unlock()
		return nil
	}
	m.mu.Unlock()

	// Notify hooks
	m.notifyHooks(func(h LifecycleHook) {
		h.OnPluginStopping(pluginID)
	})

	plugin, exists := m.registry.Get(pluginID)
	if !exists {
		return fmt.Errorf("plugin %s not found", pluginID)
	}

	// Create plugin context with timeout
	timeoutCtx, cancel := context.WithTimeout(ctx, m.config.ShutdownTimeout)
	defer cancel()

	pluginCtx := &PluginContext{
		Context:     timeoutCtx,
		CorrelationID: fmt.Sprintf("stop-%s-%d", pluginID, time.Now().UnixNano()),
		Timestamp:   time.Now(),
		Metadata:    make(map[string]interface{}),
		Logger:      m.logger,
	}

	// Update state
	m.registry.SetState(pluginID, StateStopping)

	// Stop the plugin
	if err := plugin.Stop(pluginCtx); err != nil {
		m.registry.SetState(pluginID, StateError)
		m.notifyHooks(func(h LifecycleHook) {
			h.OnPluginStopped(pluginID, err)
		})
		return fmt.Errorf("plugin stop failed: %w", err)
	}

	// Update state
	m.registry.SetState(pluginID, StateLoaded)
	m.mu.Lock()
	m.started[pluginID] = false
	m.mu.Unlock()

	m.notifyHooks(func(h LifecycleHook) {
		h.OnPluginStopped(pluginID, nil)
	})

	m.logger.Info("Plugin stopped", "plugin", pluginID)

	return nil
}

// Shutdown gracefully shuts down all plugins
func (m *Manager) Shutdown(ctx context.Context) error {
	// Stop all plugins first
	if err := m.StopAll(ctx); err != nil {
		m.logger.Warn("Some plugins failed to stop", "error", err)
	}

	// Shutdown all plugins
	order := m.registry.List()
	var shutdownErrors []error

	for _, pluginID := range order {
		plugin, exists := m.registry.Get(pluginID)
		if !exists {
			continue
		}

		timeoutCtx, cancel := context.WithTimeout(ctx, m.config.ShutdownTimeout)
		pluginCtx := &PluginContext{
			Context:     timeoutCtx,
			CorrelationID: fmt.Sprintf("shutdown-%s-%d", pluginID, time.Now().UnixNano()),
			Timestamp:   time.Now(),
			Metadata:    make(map[string]interface{}),
			Logger:      m.logger,
		}

		if err := plugin.Shutdown(pluginCtx); err != nil {
			shutdownErrors = append(shutdownErrors, fmt.Errorf("failed to shutdown %s: %w", pluginID, err))
		}
		cancel()
	}

	m.mu.Lock()
	m.initialized = make(map[string]bool)
	m.started = make(map[string]bool)
	m.mu.Unlock()

	if len(shutdownErrors) > 0 {
		return fmt.Errorf("shutdown errors: %v", shutdownErrors)
	}

	return nil
}

// Execute runs a plugin's main operation
func (m *Manager) Execute(ctx context.Context, pluginID string, input interface{}) (*PluginResult, error) {
	plugin, exists := m.registry.Get(pluginID)
	if !exists {
		return nil, fmt.Errorf("plugin %s not found", pluginID)
	}

	// Check circuit breaker
	m.mu.RLock()
	cb, hasCB := m.circuitBreakers[pluginID]
	m.mu.RUnlock()

	// Create plugin context
	pluginCtx := &PluginContext{
		Context:     ctx,
		CorrelationID: fmt.Sprintf("exec-%s-%d", pluginID, time.Now().UnixNano()),
		Timestamp:   time.Now(),
		Metadata:    make(map[string]interface{}),
		Logger:      m.logger,
	}

	startTime := time.Now()

	// Execute with circuit breaker if available
	var result *PluginResult
	var err error

	if hasCB {
		var res interface{}
		res, err = cb.ExecuteWithResult(ctx, func(ctx context.Context) (interface{}, error) {
			return plugin.Execute(pluginCtx, input)
		})
		if res != nil {
			result = res.(*PluginResult)
		}
	} else {
		result, err = plugin.Execute(pluginCtx, input)
	}

	if result != nil {
		result.Duration = time.Since(startTime)
		result.FromPluginID = pluginID
	}

	return result, err
}

// Health checks the health of all plugins
func (m *Manager) Health(ctx context.Context) map[string]*PluginResult {
	results := make(map[string]*PluginResult)

	for _, pluginID := range m.registry.List() {
		plugin, exists := m.registry.Get(pluginID)
		if !exists {
			continue
		}

		timeoutCtx, cancel := context.WithTimeout(ctx, m.config.HealthCheckTimeout)

		pluginCtx := &PluginContext{
			Context:     timeoutCtx,
			CorrelationID: fmt.Sprintf("health-%s-%d", pluginID, time.Now().UnixNano()),
			Timestamp:   time.Now(),
			Metadata:    make(map[string]interface{}),
			Logger:      m.logger,
		}

		result, err := plugin.Health(pluginCtx)
		if err != nil {
			result = &PluginResult{
				Success: false,
				Error:   NewPluginError(ErrCodeInternal, err.Error(), false),
			}
		}

		results[pluginID] = result
		m.registry.SetHealthStatus(pluginID, result)

		cancel()
	}

	return results
}

// startHealthChecks starts periodic health checks
func (m *Manager) startHealthChecks() {
	ctx, cancel := context.WithCancel(context.Background())
	m.healthCancel = cancel

	go func() {
		ticker := time.NewTicker(m.config.HealthCheckInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				healthResults := m.Health(ctx)
				for pluginID, result := range healthResults {
					m.notifyHooks(func(h LifecycleHook) {
						h.OnPluginHealthChanged(pluginID, result.Success)
					})
				}
			}
		}
	}()
}

// notifyHooks notifies all lifecycle hooks
func (m *Manager) notifyHooks(fn func(h LifecycleHook)) {
	m.mu.RLock()
	hooks := make([]LifecycleHook, len(m.lifecycleHooks))
	copy(hooks, m.lifecycleHooks)
	m.mu.RUnlock()

	for _, hook := range hooks {
		func() {
			defer func() {
				if r := recover(); r != nil {
					m.logger.Error("Lifecycle hook panic", "error", r)
				}
			}()
			fn(hook)
		}()
	}
}

// GetCircuitBreaker returns the circuit breaker for a plugin
func (m *Manager) GetCircuitBreaker(pluginID string) (*CircuitBreaker, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	cb, exists := m.circuitBreakers[pluginID]
	return cb, exists
}

// ManagerStats holds manager statistics
type ManagerStats struct {
	TotalPlugins     int                      `json:"total_plugins"`
	InitializedCount int                      `json:"initialized_count"`
	StartedCount     int                      `json:"started_count"`
	ByState          map[string]int           `json:"by_state"`
	CircuitBreakers  map[string]CircuitMetrics `json:"circuit_breakers"`
	RegistryInfo     RegistryInfo             `json:"registry_info"`
}

// Stats returns manager statistics
func (m *Manager) Stats() ManagerStats {
	m.mu.RLock()
	defer m.mu.RUnlock()

	cbMetrics := make(map[string]CircuitMetrics)
	for id, cb := range m.circuitBreakers {
		cbMetrics[id] = cb.Metrics()
	}

	return ManagerStats{
		TotalPlugins:     m.registry.Count(),
		InitializedCount: len(m.initialized),
		StartedCount:     len(m.started),
		ByState:          make(map[string]int),
		CircuitBreakers:  cbMetrics,
		RegistryInfo:     m.registry.Info(),
	}
}

// defaultLogger is a basic logger implementation
type defaultLogger struct{}

func (l *defaultLogger) Debug(msg string, fields ...interface{}) {
	log.Printf("[DEBUG] %s %v", msg, fields)
}

func (l *defaultLogger) Info(msg string, fields ...interface{}) {
	log.Printf("[INFO] %s %v", msg, fields)
}

func (l *defaultLogger) Warn(msg string, fields ...interface{}) {
	log.Printf("[WARN] %s %v", msg, fields)
}

func (l *defaultLogger) Error(msg string, fields ...interface{}) {
	log.Printf("[ERROR] %s %v", msg, fields)
}
