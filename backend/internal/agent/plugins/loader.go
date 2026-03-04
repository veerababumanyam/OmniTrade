package plugins

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"plugin"
	"reflect"
	"strings"
	"sync"
	"time"
)

// LoaderConfig holds configuration for the plugin loader
type LoaderConfig struct {
	// Paths to search for plugins
	Paths []string
	// FilePatterns to match plugin files
	FilePatterns []string
	// AutoDiscovery enables automatic plugin discovery
	AutoDiscovery bool
	// HotReload enables hot reloading of plugins
	HotReload bool
	// WatchInterval for hot reload checks
	WatchInterval time.Duration
}

// DefaultLoaderConfig returns the default loader configuration
func DefaultLoaderConfig() LoaderConfig {
	return LoaderConfig{
		Paths:         []string{"./plugins", "./extensions"},
		FilePatterns:  []string{"*.so", "*.dll"},
		AutoDiscovery: true,
		HotReload:     false,
		WatchInterval: 5 * time.Second,
	}
}

// Loader handles plugin discovery and loading
type Loader struct {
	config   LoaderConfig
	registry *Registry

	mu sync.RWMutex

	// loadedPlugins tracks loaded plugin files
	loadedPlugins map[string]*loadedPlugin

	// fileModTimes tracks file modification times for hot reload
	fileModTimes map[string]time.Time

	// stopChan for graceful shutdown
	stopChan chan struct{}
}

type loadedPlugin struct {
	path     string
	symbol   string
	instance Plugin
	loadTime time.Time
}

// NewLoader creates a new plugin loader
func NewLoader(config LoaderConfig, registry *Registry) *Loader {
	if registry == nil {
		registry = NewRegistry()
	}

	return &Loader{
		config:        config,
		registry:      registry,
		loadedPlugins: make(map[string]*loadedPlugin),
		fileModTimes:  make(map[string]time.Time),
		stopChan:      make(chan struct{}),
	}
}

// Discover searches for plugins in configured paths
func (l *Loader) Discover(ctx context.Context) ([]string, error) {
	l.mu.Lock()
	defer l.mu.Unlock()

	var discovered []string

	for _, searchPath := range l.config.Paths {
		// Check if path exists
		if _, err := os.Stat(searchPath); os.IsNotExist(err) {
			continue
		}

		// Walk the directory
		err := filepath.Walk(searchPath, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return nil // Skip files we can't access
			}

			if info.IsDir() {
				return nil
			}

			// Check if file matches patterns
			for _, pattern := range l.config.FilePatterns {
				matched, err := filepath.Match(pattern, info.Name())
				if err != nil {
					continue
				}
				if matched {
					discovered = append(discovered, path)
					l.fileModTimes[path] = info.ModTime()
					break
				}
			}

			return nil
		})

		if err != nil {
			return nil, fmt.Errorf("error walking path %s: %w", searchPath, err)
		}
	}

	return discovered, nil
}

// Load loads a plugin from the given path
func (l *Loader) Load(ctx context.Context, path string) (Plugin, error) {
	l.mu.Lock()
	defer l.mu.Unlock()

	// Check if already loaded
	if lp, exists := l.loadedPlugins[path]; exists {
		return lp.instance, nil
	}

	// Load the shared library
	plug, err := plugin.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open plugin %s: %w", path, err)
	}

	// Look for exported symbols
	symbols := []string{"Plugin", "NewPlugin", "CreatePlugin"}
	var pluginInstance Plugin

	for _, symbol := range symbols {
		sym, err := plug.Lookup(symbol)
		if err != nil {
			continue
		}

		// Try different types
		switch v := sym.(type) {
		case Plugin:
			pluginInstance = v
		case func() Plugin:
			pluginInstance = v()
		case *Plugin:
			pluginInstance = *v
		default:
			// Try reflection for factory functions
			if reflect.TypeOf(sym).Kind() == reflect.Func {
				fn := reflect.ValueOf(sym)
				if fn.Type().NumOut() == 1 {
					result := fn.Call(nil)
					if p, ok := result[0].Interface().(Plugin); ok {
						pluginInstance = p
					}
				}
			}
		}

		if pluginInstance != nil {
			break
		}
	}

	if pluginInstance == nil {
		return nil, fmt.Errorf("no valid plugin symbol found in %s", path)
	}

	// Register with registry
	if err := l.registry.Register(func() Plugin {
		return pluginInstance
	}); err != nil {
		return nil, fmt.Errorf("failed to register plugin from %s: %w", path, err)
	}

	// Track loaded plugin
	metadata := pluginInstance.Metadata()
	l.loadedPlugins[path] = &loadedPlugin{
		path:     path,
		symbol:   metadata.ID,
		instance: pluginInstance,
		loadTime: time.Now(),
	}

	return pluginInstance, nil
}

// LoadAll discovers and loads all plugins
func (l *Loader) LoadAll(ctx context.Context) ([]Plugin, error) {
	paths, err := l.Discover(ctx)
	if err != nil {
		return nil, fmt.Errorf("discovery failed: %w", err)
	}

	var plugins []Plugin
	var errors []error

	for _, path := range paths {
		p, err := l.Load(ctx, path)
		if err != nil {
			errors = append(errors, fmt.Errorf("failed to load %s: %w", path, err))
			continue
		}
		plugins = append(plugins, p)
	}

	if len(errors) > 0 {
		return plugins, fmt.Errorf("some plugins failed to load: %v", errors)
	}

	return plugins, nil
}

// Unload unloads a plugin by path
func (l *Loader) Unload(ctx context.Context, path string) error {
	l.mu.Lock()
	defer l.mu.Unlock()

	lp, exists := l.loadedPlugins[path]
	if !exists {
		return fmt.Errorf("plugin %s is not loaded", path)
	}

	// Shutdown the plugin
	pluginCtx := &PluginContext{
		Context:   ctx,
		Timestamp: time.Now(),
	}

	if err := lp.instance.Shutdown(pluginCtx); err != nil {
		return fmt.Errorf("failed to shutdown plugin %s: %w", path, err)
	}

	// Unregister from registry
	metadata := lp.instance.Metadata()
	if err := l.registry.Unregister(metadata.ID); err != nil {
		return fmt.Errorf("failed to unregister plugin %s: %w", path, err)
	}

	// Remove from tracking
	delete(l.loadedPlugins, path)

	return nil
}

// UnloadAll unloads all loaded plugins
func (l *Loader) UnloadAll(ctx context.Context) error {
	l.mu.Lock()
	defer l.mu.Unlock()

	var errors []error

	for path, lp := range l.loadedPlugins {
		pluginCtx := &PluginContext{
			Context:   ctx,
			Timestamp: time.Now(),
		}

		if err := lp.instance.Shutdown(pluginCtx); err != nil {
			errors = append(errors, fmt.Errorf("failed to shutdown %s: %w", path, err))
			continue
		}

		metadata := lp.instance.Metadata()
		l.registry.Unregister(metadata.ID)
		delete(l.loadedPlugins, path)
	}

	l.loadedPlugins = make(map[string]*loadedPlugin)

	if len(errors) > 0 {
		return fmt.Errorf("errors during unload: %v", errors)
	}

	return nil
}

// Reload reloads a plugin by path
func (l *Loader) Reload(ctx context.Context, path string) (Plugin, error) {
	if err := l.Unload(ctx, path); err != nil {
		// Continue even if unload fails
	}

	return l.Load(ctx, path)
}

// StartWatcher starts watching for plugin changes (hot reload)
func (l *Loader) StartWatcher(ctx context.Context) error {
	if !l.config.HotReload {
		return nil
	}

	go func() {
		ticker := time.NewTicker(l.config.WatchInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-l.stopChan:
				return
			case <-ticker.C:
				l.checkForChanges(ctx)
			}
		}
	}()

	return nil
}

// StopWatcher stops the hot reload watcher
func (l *Loader) StopWatcher() {
	close(l.stopChan)
}

func (l *Loader) checkForChanges(ctx context.Context) {
	l.mu.Lock()
	defer l.mu.Unlock()

	for path, lastModTime := range l.fileModTimes {
		info, err := os.Stat(path)
		if err != nil {
			continue
		}

		if info.ModTime().After(lastModTime) {
			// File has changed, trigger reload
			l.fileModTimes[path] = info.ModTime()

			// Reload in background
			go func(p string) {
				_, _ = l.Reload(ctx, p)
			}(path)
		}
	}
}

// GetLoaded returns all loaded plugins
func (l *Loader) GetLoaded() []Plugin {
	l.mu.RLock()
	defer l.mu.RUnlock()

	plugins := make([]Plugin, 0, len(l.loadedPlugins))
	for _, lp := range l.loadedPlugins {
		plugins = append(plugins, lp.instance)
	}

	return plugins
}

// GetLoadedPaths returns paths of all loaded plugins
func (l *Loader) GetLoadedPaths() []string {
	l.mu.RLock()
	defer l.mu.RUnlock()

	paths := make([]string, 0, len(l.loadedPlugins))
	for path := range l.loadedPlugins {
		paths = append(paths, path)
	}

	return paths
}

// IsLoaded checks if a plugin path is loaded
func (l *Loader) IsLoaded(path string) bool {
	l.mu.RLock()
	defer l.mu.RUnlock()

	_, exists := l.loadedPlugins[path]
	return exists
}

// LoaderStats holds loader statistics
type LoaderStats struct {
	TotalLoaded   int                `json:"total_loaded"`
	Paths         []string           `json:"paths"`
	LoadedPlugins []LoadedPluginInfo `json:"loaded_plugins"`
	LastDiscovery time.Time          `json:"last_discovery"`
}

// LoadedPluginInfo contains information about a loaded plugin
type LoadedPluginInfo struct {
	Path     string    `json:"path"`
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Version  string    `json:"version"`
	LoadTime time.Time `json:"load_time"`
}

// Stats returns loader statistics
func (l *Loader) Stats() LoaderStats {
	l.mu.RLock()
	defer l.mu.RUnlock()

	loadedPlugins := make([]LoadedPluginInfo, 0, len(l.loadedPlugins))
	for _, lp := range l.loadedPlugins {
		metadata := lp.instance.Metadata()
		loadedPlugins = append(loadedPlugins, LoadedPluginInfo{
			Path:     lp.path,
			ID:       metadata.ID,
			Name:     metadata.Name,
			Version:  metadata.Version,
			LoadTime: lp.loadTime,
		})
	}

	return LoaderStats{
		TotalLoaded:   len(l.loadedPlugins),
		Paths:         l.config.Paths,
		LoadedPlugins: loadedPlugins,
	}
}

// StaticLoader loads plugins from statically registered factories
type StaticLoader struct {
	registry *Registry
	factories map[string]PluginFactory
}

// NewStaticLoader creates a new static loader
func NewStaticLoader(registry *Registry) *StaticLoader {
	if registry == nil {
		registry = NewRegistry()
	}

	return &StaticLoader{
		registry:  registry,
		factories: make(map[string]PluginFactory),
	}
}

// Register adds a factory to the static loader
func (s *StaticLoader) Register(id string, factory PluginFactory) {
	s.factories[id] = factory
}

// LoadAll loads all statically registered plugins
func (s *StaticLoader) LoadAll(ctx context.Context) ([]Plugin, error) {
	var plugins []Plugin
	var errors []error

	for id, factory := range s.factories {
		if err := s.registry.Register(factory); err != nil {
			errors = append(errors, fmt.Errorf("failed to register %s: %w", id, err))
			continue
		}

		plugin := factory()
		plugins = append(plugins, plugin)
	}

	if len(errors) > 0 {
		return plugins, fmt.Errorf("some plugins failed to load: %v", errors)
	}

	return plugins, nil
}

// PluginScanner scans for plugin definitions in code
type PluginScanner struct {
	// Types to look for
	interfaceTypes []reflect.Type
}

// NewPluginScanner creates a new plugin scanner
func NewPluginScanner() *PluginScanner {
	return &PluginScanner{
		interfaceTypes: []reflect.Type{
			reflect.TypeOf((*Plugin)(nil)).Elem(),
		},
	}
}

// ScanStruct checks if a struct implements Plugin interface
func (s *PluginScanner) ScanStruct(v interface{}) (Plugin, bool) {
	if p, ok := v.(Plugin); ok {
		return p, true
	}
	return nil, false
}

// ScanMap scans a map for plugin implementations
func (s *PluginScanner) ScanMap(m map[string]interface{}) map[string]Plugin {
	plugins := make(map[string]Plugin)

	for key, value := range m {
		if p, ok := value.(Plugin); ok {
			plugins[key] = p
		} else if fn, ok := value.(func() Plugin); ok {
			plugins[key] = fn()
		}
	}

	return plugins
}

// ParsePluginID extracts plugin ID from filename
func ParsePluginID(filename string) string {
	// Remove extension
	ext := filepath.Ext(filename)
	name := strings.TrimSuffix(filename, ext)

	// Clean up common prefixes/suffixes
	name = strings.TrimPrefix(name, "plugin_")
	name = strings.TrimSuffix(name, "_plugin")
	name = strings.TrimSuffix(name, ".plugin")

	// Convert to lowercase with underscores
	name = strings.ToLower(name)
	name = strings.ReplaceAll(name, "-", "_")

	return name
}
