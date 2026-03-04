/**
 * OmniTrade Plugin UI Example Usage
 * Demonstrates how to integrate the plugin management components
 */

import React from 'react';
import {
  PluginDashboard,
  ToolBrowser,
  HookMonitor,
  usePluginManager,
  useToolManager,
  useHookMonitor,
} from './plugins';
import type { Plugin, ToolDefinition, HookExecution } from './plugins';

/**
 * Main Application Component
 * Shows the complete plugin management interface
 */
export const App: React.FC = () => {
  return (
    <div className="app">
      <PluginDashboard
        onPluginSelect={(plugin: Plugin) => {
          console.log('Selected plugin:', plugin);
        }}
        onPluginConfigure={(plugin: Plugin) => {
          console.log('Configure plugin:', plugin);
        }}
      />
    </div>
  );
};

/**
 * Standalone Tool Browser Example
 */
export const ToolBrowserExample: React.FC = () => {
  const handleToolSelect = (tool: ToolDefinition) => {
    console.log('Selected tool:', tool);
  };

  const handleToolExecute = async (toolId: string, params: Record<string, unknown>) => {
    console.log('Executing tool:', toolId, params);
  };

  return (
    <ToolBrowser
      onToolSelect={handleToolSelect}
      onToolExecute={handleToolExecute}
    />
  );
};

/**
 * Standalone Hook Monitor Example
 */
export const HookMonitorExample: React.FC = () => {
  return <HookMonitor />;
};

/**
 * Custom Hook Usage Example
 * Shows how to use the hooks directly for custom implementations
 */
export const CustomPluginManager: React.FC = () => {
  const {
    plugins,
    filteredPlugins,
    pluginCounts,
    loading,
    notification,
    togglePlugin,
    installPlugin,
    uninstallPlugin,
    updatePlugin,
  } = usePluginManager();

  const {
    tools,
    filteredTools,
    executing,
    executionResult,
    executeTool,
  } = useToolManager();

  const {
    executions,
    metrics,
    isStreaming,
    toggleStreaming,
    clearExecutions,
  } = useHookMonitor();

  return (
    <div className="custom-plugin-manager">
      {/* Stats Display */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Plugins</h3>
          <span>{pluginCounts.total}</span>
        </div>
        <div className="stat-card">
          <h3>Installed</h3>
          <span>{pluginCounts.installed}</span>
        </div>
        <div className="stat-card">
          <h3>Active</h3>
          <span>{pluginCounts.enabled}</span>
        </div>
        <div className="stat-card">
          <h3>Healthy</h3>
          <span>{pluginCounts.healthy}</span>
        </div>
      </div>

      {/* Plugin List */}
      <div className="plugin-list">
        {filteredPlugins.map((plugin) => (
          <div key={plugin.id} className="plugin-item">
            <h4>{plugin.name}</h4>
            <p>{plugin.description}</p>
            <div className="plugin-actions">
              <button onClick={() => togglePlugin(plugin.id)}>
                {plugin.enabled ? 'Disable' : 'Enable'}
              </button>
              {plugin.status === 'installed' && (
                <button onClick={() => uninstallPlugin(plugin.id)}>
                  Uninstall
                </button>
              )}
              {plugin.status === 'available' && (
                <button onClick={() => installPlugin(plugin.id)}>
                  Install
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tools List */}
      <div className="tools-section">
        <h2>Available Tools</h2>
        <div className="tools-list">
          {filteredTools.map((tool) => (
            <div key={tool.id} className="tool-item">
              <h4>{tool.name}</h4>
              <p>{tool.description}</p>
              <button
                onClick={() => executeTool(tool.id, { symbol: 'AAPL' })}
                disabled={executing === tool.id}
              >
                {executing === tool.id ? 'Executing...' : 'Test'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hook Monitoring */}
      <div className="hooks-section">
        <h2>Hook Monitoring</h2>
        <div className="hook-controls">
          <button onClick={toggleStreaming}>
            {isStreaming ? 'Pause' : 'Start'} Stream
          </button>
          <button onClick={clearExecutions}>Clear</button>
        </div>
        <div className="executions-list">
          {executions.slice(0, 10).map((exec) => (
            <div key={exec.id} className={`execution-item status-${exec.status}`}>
              <span className="exec-name">{exec.hookName}</span>
              <span className="exec-status">{exec.status}</span>
              <span className="exec-duration">{exec.duration}ms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Display */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

/**
 * Integration with External API
 * Shows how to connect the components to a real backend
 */
export const APIIntegrationExample: React.FC = () => {
  // Custom fetch wrapper for API calls
  const apiCall = async <T,>(endpoint: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`/api/v1${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  };

  // Custom plugin manager with API integration
  const useAPIPluginManager = () => {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch plugins on mount
    useEffect(() => {
      const fetchPlugins = async () => {
        setLoading(true);
        try {
          const data = await apiCall<{ plugins: Plugin[] }>('/plugins');
          setPlugins(data.plugins);
        } catch (error) {
          console.error('Failed to fetch plugins:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPlugins();
    }, []);

    // Install plugin via API
    const installPlugin = async (pluginId: string) => {
      setLoading(true);
      try {
        await apiCall(`/plugins/${pluginId}/install`, { method: 'POST' });
        setPlugins((prev) =>
          prev.map((p) =>
            p.id === pluginId ? { ...p, status: 'installed', enabled: true } : p
          )
        );
      } catch (error) {
        console.error('Failed to install plugin:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    // Toggle plugin via API
    const togglePlugin = async (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId);
      if (!plugin) return;

      try {
        await apiCall(`/plugins/${pluginId}/${plugin.enabled ? 'disable' : 'enable'}`, {
          method: 'POST',
        });
        setPlugins((prev) =>
          prev.map((p) => (p.id === pluginId ? { ...p, enabled: !p.enabled } : p))
        );
      } catch (error) {
        console.error('Failed to toggle plugin:', error);
        throw error;
      }
    };

    return { plugins, loading, installPlugin, togglePlugin };
  };

  return (
    <PluginDashboard
      onPluginSelect={(plugin) => {
        // Navigate to plugin details page
        window.history.pushState({}, '', `/plugins/${plugin.id}`);
      }}
      onPluginConfigure={(plugin) => {
        // Open configuration modal
        console.log('Configure:', plugin);
      }}
    />
  );
};

export default App;
