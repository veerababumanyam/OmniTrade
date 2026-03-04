package plugins

import (
	"fmt"
	"sort"
	"sync"
	"time"
)

// Registry maintains a collection of registered plugins
type Registry struct {
	mu sync.RWMutex

	// plugins stores plugin instances by ID
	plugins map[string]Plugin

	// factories stores plugin factories by ID
	factories map[string]PluginFactory

	// metadata stores plugin metadata by ID
	metadata map[string]PluginMetadata

	// capabilityIndex maps capabilities to plugin IDs
	capabilityIndex map[PluginCapability][]string

	// dependencyGraph stores plugin dependencies
	dependencyGraph map[string][]string

	// configs stores plugin configurations
	configs map[string]PluginConfig

	// states stores plugin states
	states map[string]PluginState

	// healthStatus stores last known health status
	healthStatus map[string]*PluginResult
}

// NewRegistry creates a new plugin registry
func NewRegistry() *Registry {
	return &Registry{
		plugins:         make(map[string]Plugin),
		factories:       make(map[string]PluginFactory),
		metadata:        make(map[string]PluginMetadata),
		capabilityIndex: make(map[PluginCapability][]string),
		dependencyGraph: make(map[string][]string),
		configs:         make(map[string]PluginConfig),
		states:          make(map[string]PluginState),
		healthStatus:    make(map[string]*PluginResult),
	}
}

// Register registers a plugin factory
func (r *Registry) Register(factory PluginFactory) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Create temporary instance to get metadata
	tempPlugin := factory()
	metadata := tempPlugin.Metadata()

	if metadata.ID == "" {
		return fmt.Errorf("plugin has empty ID")
	}

	if _, exists := r.factories[metadata.ID]; exists {
		return fmt.Errorf("plugin with ID %s is already registered", metadata.ID)
	}

	// Store factory and metadata
	r.factories[metadata.ID] = factory
	r.metadata[metadata.ID] = metadata
	r.states[metadata.ID] = StateUnloaded

	// Index capabilities
	for _, cap := range metadata.Capabilities {
		r.capabilityIndex[cap] = append(r.capabilityIndex[cap], metadata.ID)
	}

	// Store dependencies
	if len(metadata.Dependencies) > 0 {
		r.dependencyGraph[metadata.ID] = metadata.Dependencies
	}

	// Set default config
	r.configs[metadata.ID] = PluginConfig{
		Enabled:    true,
		Settings:   make(map[string]interface{}),
		Timeout:    30 * time.Second,
		MaxRetries: 3,
		CircuitBreaker: CircuitBreakerConfig{
			Enabled:          true,
			FailureThreshold: 5,
			SuccessThreshold: 2,
			Timeout:          30 * time.Second,
		},
	}

	return nil
}

// Unregister removes a plugin from the registry
func (r *Registry) Unregister(pluginID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.factories[pluginID]; !exists {
		return fmt.Errorf("plugin %s is not registered", pluginID)
	}

	metadata := r.metadata[pluginID]

	// Remove from capability index
	for _, cap := range metadata.Capabilities {
		ids := r.capabilityIndex[cap]
		for i, id := range ids {
			if id == pluginID {
				r.capabilityIndex[cap] = append(ids[:i], ids[i+1:]...)
				break
			}
		}
	}

	// Remove from dependency graph
	delete(r.dependencyGraph, pluginID)

	// Remove all entries
	delete(r.factories, pluginID)
	delete(r.metadata, pluginID)
	delete(r.configs, pluginID)
	delete(r.states, pluginID)
	delete(r.healthStatus, pluginID)
	delete(r.plugins, pluginID)

	return nil
}

// Get retrieves a plugin instance by ID
func (r *Registry) Get(pluginID string) (Plugin, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	plugin, exists := r.plugins[pluginID]
	return plugin, exists
}

// GetMetadata retrieves plugin metadata by ID
func (r *Registry) GetMetadata(pluginID string) (PluginMetadata, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	metadata, exists := r.metadata[pluginID]
	return metadata, exists
}

// GetConfig retrieves plugin configuration by ID
func (r *Registry) GetConfig(pluginID string) (PluginConfig, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	config, exists := r.configs[pluginID]
	return config, exists
}

// SetConfig sets the configuration for a plugin
func (r *Registry) SetConfig(pluginID string, config PluginConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.factories[pluginID]; !exists {
		return fmt.Errorf("plugin %s is not registered", pluginID)
	}

	r.configs[pluginID] = config
	return nil
}

// GetState retrieves the current state of a plugin
func (r *Registry) GetState(pluginID string) (PluginState, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	state, exists := r.states[pluginID]
	return state, exists
}

// SetState updates the state of a plugin
func (r *Registry) SetState(pluginID string, state PluginState) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.states[pluginID] = state
}

// GetByCapability retrieves all plugins with a specific capability
func (r *Registry) GetByCapability(capability PluginCapability) []Plugin {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var plugins []Plugin
	if ids, exists := r.capabilityIndex[capability]; exists {
		for _, id := range ids {
			if plugin, ok := r.plugins[id]; ok {
				plugins = append(plugins, plugin)
			}
		}
	}

	// Sort by priority
	sort.Slice(plugins, func(i, j int) bool {
		return plugins[i].Metadata().Priority > plugins[j].Metadata().Priority
	})

	return plugins
}

// GetAll returns all registered plugin instances
func (r *Registry) GetAll() []Plugin {
	r.mu.RLock()
	defer r.mu.RUnlock()

	plugins := make([]Plugin, 0, len(r.plugins))
	for _, plugin := range r.plugins {
		plugins = append(plugins, plugin)
	}

	// Sort by priority
	sort.Slice(plugins, func(i, j int) bool {
		return plugins[i].Metadata().Priority > plugins[j].Metadata().Priority
	})

	return plugins
}

// GetAllMetadata returns all registered plugin metadata
func (r *Registry) GetAllMetadata() []PluginMetadata {
	r.mu.RLock()
	defer r.mu.RUnlock()

	metadata := make([]PluginMetadata, 0, len(r.metadata))
	for _, m := range r.metadata {
		metadata = append(metadata, m)
	}

	// Sort by priority
	sort.Slice(metadata, func(i, j int) bool {
		return metadata[i].Priority > metadata[j].Priority
	})

	return metadata
}

// GetDependencies returns the dependencies of a plugin
func (r *Registry) GetDependencies(pluginID string) []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	deps := r.dependencyGraph[pluginID]
	if deps == nil {
		return []string{}
	}
	return append([]string{}, deps...)
}

// ResolveDependencies returns plugins in dependency order
func (r *Registry) ResolveDependencies() ([]string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Topological sort using Kahn's algorithm
	inDegree := make(map[string]int)
	graph := make(map[string][]string)

	// Initialize
	for id := range r.factories {
		inDegree[id] = 0
		graph[id] = []string{}
	}

	// Build graph
	for pluginID, deps := range r.dependencyGraph {
		for _, dep := range deps {
			if _, exists := r.factories[dep]; !exists {
				return nil, fmt.Errorf("plugin %s depends on non-existent plugin %s", pluginID, dep)
			}
			graph[dep] = append(graph[dep], pluginID)
			inDegree[pluginID]++
		}
	}

	// Find nodes with no dependencies
	queue := []string{}
	for id, degree := range inDegree {
		if degree == 0 {
			queue = append(queue, id)
		}
	}

	// Sort queue by priority for deterministic ordering
	sort.Slice(queue, func(i, j int) bool {
		return r.metadata[queue[i]].Priority > r.metadata[queue[j]].Priority
	})

	result := []string{}
	for len(queue) > 0 {
		// Pop first
		current := queue[0]
		queue = queue[1:]
		result = append(result, current)

		// Process neighbors
		neighbors := graph[current]
		sort.Slice(neighbors, func(i, j int) bool {
			return r.metadata[neighbors[i]].Priority > r.metadata[neighbors[j]].Priority
		})

		for _, neighbor := range neighbors {
			inDegree[neighbor]--
			if inDegree[neighbor] == 0 {
				queue = append(queue, neighbor)
			}
		}
	}

	if len(result) != len(r.factories) {
		return nil, fmt.Errorf("circular dependency detected in plugins")
	}

	return result, nil
}

// SetHealthStatus updates the health status of a plugin
func (r *Registry) SetHealthStatus(pluginID string, result *PluginResult) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.healthStatus[pluginID] = result
}

// GetHealthStatus retrieves the last known health status of a plugin
func (r *Registry) GetHealthStatus(pluginID string) (*PluginResult, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result, exists := r.healthStatus[pluginID]
	return result, exists
}

// CreateInstance creates a new plugin instance from its factory
func (r *Registry) CreateInstance(pluginID string) (Plugin, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	factory, exists := r.factories[pluginID]
	if !exists {
		return nil, fmt.Errorf("plugin %s is not registered", pluginID)
	}

	plugin := factory()
	r.plugins[pluginID] = plugin
	r.states[pluginID] = StateLoaded

	return plugin, nil
}

// List returns a list of all registered plugin IDs
func (r *Registry) List() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	ids := make([]string, 0, len(r.factories))
	for id := range r.factories {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// Count returns the number of registered plugins
func (r *Registry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.factories)
}

// CountByState returns the number of plugins in a specific state
func (r *Registry) CountByState(state PluginState) int {
	r.mu.RLock()
	defer r.mu.RUnlock()

	count := 0
	for _, s := range r.states {
		if s == state {
			count++
		}
	}
	return count
}

// RegistryInfo contains summary information about the registry
type RegistryInfo struct {
	TotalPlugins   int                        `json:"total_plugins"`
	ByState        map[string]int             `json:"by_state"`
	ByCapability   map[string]int             `json:"by_capability"`
	Plugins        []PluginMetadata           `json:"plugins"`
	LastUpdated    time.Time                  `json:"last_updated"`
}

// Info returns summary information about the registry
func (r *Registry) Info() RegistryInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	byState := make(map[string]int)
	for _, state := range r.states {
		byState[string(state)]++
	}

	byCapability := make(map[string]int)
	for cap, ids := range r.capabilityIndex {
		byCapability[string(cap)] = len(ids)
	}

	plugins := make([]PluginMetadata, 0, len(r.metadata))
	for _, m := range r.metadata {
		plugins = append(plugins, m)
	}

	sort.Slice(plugins, func(i, j int) bool {
		return plugins[i].Priority > plugins[j].Priority
	})

	return RegistryInfo{
		TotalPlugins: len(r.factories),
		ByState:      byState,
		ByCapability: byCapability,
		Plugins:      plugins,
		LastUpdated:  time.Now(),
	}
}

// ValidateDependencies checks if all dependencies are satisfied
func (r *Registry) ValidateDependencies() error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for pluginID, deps := range r.dependencyGraph {
		for _, dep := range deps {
			if _, exists := r.factories[dep]; !exists {
				return fmt.Errorf("plugin %s depends on missing plugin %s", pluginID, dep)
			}
		}
	}

	// Check for circular dependencies
	_, err := r.resolveDependenciesUnsafe()
	return err
}

// resolveDependenciesUnsafe is the internal version without locks
func (r *Registry) resolveDependenciesUnsafe() ([]string, error) {
	// Simplified check for circular dependencies
	visited := make(map[string]bool)
	recStack := make(map[string]bool)

	var dfs func(string) error
	dfs = func(node string) error {
		visited[node] = true
		recStack[node] = true

		for _, dep := range r.dependencyGraph[node] {
			if !visited[dep] {
				if err := dfs(dep); err != nil {
					return err
				}
			} else if recStack[dep] {
				return fmt.Errorf("circular dependency detected: %s -> %s", node, dep)
			}
		}

		recStack[node] = false
		return nil
	}

	for id := range r.factories {
		if !visited[id] {
			if err := dfs(id); err != nil {
				return nil, err
			}
		}
	}

	return nil, nil
}

// Global registry instance
var globalRegistry = NewRegistry()

// DefaultRegistry returns the global registry instance
func DefaultRegistry() *Registry {
	return globalRegistry
}

// RegisterPlugin registers a plugin factory with the global registry
func RegisterPlugin(factory PluginFactory) error {
	return globalRegistry.Register(factory)
}

// GetPlugin retrieves a plugin from the global registry
func GetPlugin(id string) (Plugin, bool) {
	return globalRegistry.Get(id)
}
