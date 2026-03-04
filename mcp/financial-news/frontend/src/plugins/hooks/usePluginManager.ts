/**
 * OmniTrade Plugin Manager Hook
 * Custom React hooks for plugin state management
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  Plugin,
  PluginFilter,
  PluginCatalogEntry,
  ToolDefinition,
  ToolFilter,
  ToolExecutionResult,
  HookExecution,
  HookMetrics,
  NotificationState,
} from '../types';

// Mock data for development - in production, this would come from API
const mockPlugins: Plugin[] = [
  {
    id: 'financial-news',
    name: 'Financial News',
    version: '1.0.0',
    description: 'Real-time financial news, sentiment analysis, and analyst ratings from multiple sources.',
    author: 'OmniTrade',
    category: 'data-source',
    status: 'installed',
    enabled: true,
    installedAt: '2024-01-15T10:30:00Z',
    lastUpdated: '2024-02-20T14:22:00Z',
    icon: 'newspaper',
    license: 'MIT',
    health: {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      uptime: 99.9,
      errorCount: 0,
      metrics: {
        cpuUsage: 2.5,
        memoryUsage: 45.2,
        requestCount: 1547,
        avgResponseTime: 120,
      },
    },
    tools: [
      {
        id: 'get_news_headlines',
        name: 'Get News Headlines',
        description: 'Fetch recent news headlines for a stock symbol',
        pluginId: 'financial-news',
        category: 'market-data',
        enabled: true,
        executionCount: 523,
        avgExecutionTime: 245,
        inputSchema: {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Stock symbol' },
            limit: { type: 'number', description: 'Max results' },
          },
          required: ['symbol'],
        },
      },
      {
        id: 'get_news_sentiment',
        name: 'Get News Sentiment',
        description: 'Analyze sentiment for a symbol based on news',
        pluginId: 'financial-news',
        category: 'analysis',
        enabled: true,
        executionCount: 312,
        avgExecutionTime: 380,
        inputSchema: {
          type: 'object',
          properties: {
            symbol: { type: 'string' },
            days: { type: 'number' },
          },
          required: ['symbol'],
        },
      },
    ],
    hooks: [
      {
        id: 'pre-trade-news-check',
        name: 'Pre-Trade News Check',
        type: 'pre-trade',
        pluginId: 'financial-news',
        description: 'Check for significant news before executing trades',
        enabled: true,
        priority: 10,
        timeout: 5000,
      },
    ],
  },
  {
    id: 'market-data',
    name: 'Market Data Provider',
    version: '2.1.0',
    description: 'Real-time and historical market data from major exchanges with WebSocket streaming.',
    author: 'OmniTrade',
    category: 'data-source',
    status: 'installed',
    enabled: true,
    installedAt: '2024-01-10T08:00:00Z',
    lastUpdated: '2024-02-28T09:15:00Z',
    icon: 'chart-line',
    license: 'MIT',
    health: {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      uptime: 99.95,
      errorCount: 2,
      metrics: {
        cpuUsage: 5.8,
        memoryUsage: 128.5,
        requestCount: 45230,
        avgResponseTime: 45,
      },
    },
    tools: [],
    hooks: [],
  },
  {
    id: 'technical-analysis',
    name: 'Technical Analysis',
    version: '1.5.0',
    description: 'Comprehensive technical analysis tools including indicators, patterns, and signals.',
    author: 'OmniTrade',
    category: 'analysis',
    status: 'installed',
    enabled: false,
    installedAt: '2024-02-01T12:00:00Z',
    icon: 'chart-bar',
    license: 'MIT',
    health: {
      status: 'degraded',
      lastCheck: new Date().toISOString(),
      uptime: 98.5,
      errorCount: 15,
      metrics: {
        cpuUsage: 12.3,
        memoryUsage: 256.8,
        requestCount: 8920,
        avgResponseTime: 320,
      },
    },
    tools: [],
    hooks: [],
  },
  {
    id: 'risk-manager',
    name: 'Risk Manager',
    version: '1.2.0',
    description: 'Portfolio risk assessment, position sizing, and exposure management.',
    author: 'OmniTrade',
    category: 'analysis',
    status: 'installed',
    enabled: true,
    installedAt: '2024-02-10T16:45:00Z',
    icon: 'shield',
    license: 'MIT',
    health: {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      uptime: 99.8,
      errorCount: 1,
      metrics: {
        cpuUsage: 1.2,
        memoryUsage: 64.3,
        requestCount: 2156,
        avgResponseTime: 85,
      },
    },
    tools: [],
    hooks: [],
  },
  {
    id: 'alpha-vantage',
    name: 'Alpha Vantage',
    version: '3.0.0',
    description: 'Alpha Vantage API integration for global equities, forex, and crypto data.',
    author: 'Community',
    category: 'integration',
    status: 'available',
    enabled: false,
    icon: 'database',
    license: 'Apache-2.0',
    tools: [],
    hooks: [],
  },
  {
    id: 'discord-notifier',
    name: 'Discord Notifications',
    version: '1.0.5',
    description: 'Send trade alerts and notifications to Discord channels via webhooks.',
    author: 'Community',
    category: 'notification',
    status: 'available',
    enabled: false,
    icon: 'bell',
    license: 'MIT',
    tools: [],
    hooks: [],
  },
];

const mockHookExecutions: HookExecution[] = [
  {
    id: 'hook-exec-1',
    hookId: 'pre-trade-news-check',
    hookName: 'Pre-Trade News Check',
    pluginId: 'financial-news',
    status: 'completed',
    startTime: new Date(Date.now() - 5000).toISOString(),
    endTime: new Date(Date.now() - 4800).toISOString(),
    duration: 200,
    input: { symbol: 'AAPL', action: 'buy' },
    output: { hasSignificantNews: false, proceed: true },
  },
  {
    id: 'hook-exec-2',
    hookId: 'pre-trade-news-check',
    hookName: 'Pre-Trade News Check',
    pluginId: 'financial-news',
    status: 'completed',
    startTime: new Date(Date.now() - 10000).toISOString(),
    endTime: new Date(Date.now() - 9750).toISOString(),
    duration: 250,
    input: { symbol: 'GOOGL', action: 'sell' },
    output: { hasSignificantNews: true, proceed: false, reason: 'Negative sentiment detected' },
  },
  {
    id: 'hook-exec-3',
    hookId: 'pre-trade-news-check',
    hookName: 'Pre-Trade News Check',
    pluginId: 'financial-news',
    status: 'failed',
    startTime: new Date(Date.now() - 15000).toISOString(),
    endTime: new Date(Date.now() - 14500).toISOString(),
    duration: 500,
    input: { symbol: 'TSLA', action: 'buy' },
    error: {
      message: 'API rate limit exceeded',
      code: 'RATE_LIMIT',
      stack: 'Error: API rate limit exceeded\n    at fetchNews...',
    },
  },
];

const mockHookMetrics: HookMetrics = {
  hookId: 'pre-trade-news-check',
  totalExecutions: 1547,
  successRate: 98.2,
  avgDuration: 215,
  p50Duration: 180,
  p95Duration: 450,
  p99Duration: 820,
  errorCount: 28,
  timeoutCount: 3,
};

/**
 * Hook for managing plugins
 */
export function usePluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>(mockPlugins);
  const [filter, setFilter] = useState<PluginFilter>({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Filtered plugins based on current filter
  const filteredPlugins = useMemo(() => {
    return plugins.filter((plugin) => {
      if (filter.search) {
        const search = filter.search.toLowerCase();
        const matchesName = plugin.name.toLowerCase().includes(search);
        const matchesDesc = plugin.description.toLowerCase().includes(search);
        if (!matchesName && !matchesDesc) return false;
      }

      if (filter.category && filter.category !== 'all') {
        if (plugin.category !== filter.category) return false;
      }

      if (filter.status && filter.status !== 'all') {
        if (plugin.status !== filter.status) return false;
      }

      if (filter.installed !== undefined) {
        const isInstalled = plugin.status === 'installed';
        if (filter.installed !== isInstalled) return false;
      }

      return true;
    });
  }, [plugins, filter]);

  // Installed plugins only
  const installedPlugins = useMemo(() => {
    return plugins.filter((p) => p.status === 'installed');
  }, [plugins]);

  // Plugin counts
  const pluginCounts = useMemo(() => {
    return {
      total: plugins.length,
      installed: installedPlugins.length,
      enabled: plugins.filter((p) => p.enabled).length,
      healthy: plugins.filter((p) => p.health?.status === 'healthy').length,
    };
  }, [plugins, installedPlugins]);

  // Toggle plugin enabled state
  const togglePlugin = useCallback(async (pluginId: string) => {
    setLoading(true);
    try {
      setPlugins((prev) =>
        prev.map((p) =>
          p.id === pluginId ? { ...p, enabled: !p.enabled } : p
        )
      );
      const plugin = plugins.find((p) => p.id === pluginId);
      setNotification({
        type: 'success',
        message: `Plugin ${plugin?.name} ${plugin?.enabled ? 'disabled' : 'enabled'} successfully`,
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to toggle plugin: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  }, [plugins]);

  // Install plugin
  const installPlugin = useCallback(async (pluginId: string) => {
    setLoading(true);
    try {
      setPlugins((prev) =>
        prev.map((p) =>
          p.id === pluginId
            ? {
                ...p,
                status: 'installed' as const,
                enabled: true,
                installedAt: new Date().toISOString(),
                health: {
                  status: 'healthy' as const,
                  lastCheck: new Date().toISOString(),
                  uptime: 100,
                  errorCount: 0,
                  metrics: {
                    cpuUsage: 0,
                    memoryUsage: 0,
                    requestCount: 0,
                    avgResponseTime: 0,
                  },
                },
              }
            : p
        )
      );
      const plugin = plugins.find((p) => p.id === pluginId);
      setNotification({
        type: 'success',
        message: `Plugin ${plugin?.name} installed successfully`,
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to install plugin: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  }, [plugins]);

  // Uninstall plugin
  const uninstallPlugin = useCallback(async (pluginId: string) => {
    setLoading(true);
    try {
      setPlugins((prev) =>
        prev.map((p) =>
          p.id === pluginId
            ? {
                ...p,
                status: 'available' as const,
                enabled: false,
                installedAt: undefined,
                health: undefined,
              }
            : p
        )
      );
      const plugin = plugins.find((p) => p.id === pluginId);
      setNotification({
        type: 'success',
        message: `Plugin ${plugin?.name} uninstalled successfully`,
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to uninstall plugin: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  }, [plugins]);

  // Update plugin
  const updatePlugin = useCallback(async (pluginId: string) => {
    setLoading(true);
    try {
      setPlugins((prev) =>
        prev.map((p) =>
          p.id === pluginId
            ? {
                ...p,
                status: 'updating' as const,
              }
            : p
        )
      );

      // Simulate update delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setPlugins((prev) =>
        prev.map((p) =>
          p.id === pluginId
            ? {
                ...p,
                status: 'installed' as const,
                lastUpdated: new Date().toISOString(),
              }
            : p
        )
      );

      const plugin = plugins.find((p) => p.id === pluginId);
      setNotification({
        type: 'success',
        message: `Plugin ${plugin?.name} updated successfully`,
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to update plugin: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  }, [plugins]);

  // Clear notification
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    plugins,
    filteredPlugins,
    installedPlugins,
    pluginCounts,
    filter,
    setFilter,
    loading,
    notification,
    clearNotification,
    togglePlugin,
    installPlugin,
    uninstallPlugin,
    updatePlugin,
  };
}

/**
 * Hook for managing tools
 */
export function useToolManager() {
  const [tools, setTools] = useState<ToolDefinition[]>(() => {
    return mockPlugins.flatMap((p) => p.tools || []);
  });
  const [filter, setFilter] = useState<ToolFilter>({});
  const [executing, setExecuting] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<ToolExecutionResult | null>(null);

  // Filtered tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      if (filter.search) {
        const search = filter.search.toLowerCase();
        const matchesName = tool.name.toLowerCase().includes(search);
        const matchesDesc = tool.description.toLowerCase().includes(search);
        if (!matchesName && !matchesDesc) return false;
      }

      if (filter.category && filter.category !== 'all') {
        if (tool.category !== filter.category) return false;
      }

      if (filter.pluginId) {
        if (tool.pluginId !== filter.pluginId) return false;
      }

      if (filter.enabled !== undefined) {
        if (tool.enabled !== filter.enabled) return false;
      }

      return true;
    });
  }, [tools, filter]);

  // Execute tool
  const executeTool = useCallback(async (toolId: string, params: Record<string, unknown>) => {
    setExecuting(toolId);
    const startTime = performance.now();

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

      const endTime = performance.now();
      const result: ToolExecutionResult = {
        success: true,
        data: {
          message: 'Tool executed successfully',
          params,
          result: 'Sample output data',
        },
        executionTime: Math.round(endTime - startTime),
        timestamp: new Date().toISOString(),
      };

      setExecutionResult(result);

      // Update tool stats
      setTools((prev) =>
        prev.map((t) =>
          t.id === toolId
            ? {
                ...t,
                executionCount: (t.executionCount || 0) + 1,
                lastExecuted: new Date().toISOString(),
              }
            : t
        )
      );

      return result;
    } catch (error) {
      const endTime = performance.now();
      const result: ToolExecutionResult = {
        success: false,
        error: String(error),
        executionTime: Math.round(endTime - startTime),
        timestamp: new Date().toISOString(),
      };
      setExecutionResult(result);
      return result;
    } finally {
      setExecuting(null);
    }
  }, []);

  // Clear result
  const clearResult = useCallback(() => {
    setExecutionResult(null);
  }, []);

  return {
    tools,
    filteredTools,
    filter,
    setFilter,
    executing,
    executionResult,
    clearResult,
    executeTool,
  };
}

/**
 * Hook for monitoring hooks
 */
export function useHookMonitor() {
  const [executions, setExecutions] = useState<HookExecution[]>(mockHookExecutions);
  const [metrics, setMetrics] = useState<Record<string, HookMetrics>>({
    'pre-trade-news-check': mockHookMetrics,
  });
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Simulated real-time stream
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const newExecution: HookExecution = {
        id: `hook-exec-${Date.now()}`,
        hookId: 'pre-trade-news-check',
        hookName: 'Pre-Trade News Check',
        pluginId: 'financial-news',
        status: Math.random() > 0.1 ? 'completed' : 'failed',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 150 + Math.random() * 300).toISOString(),
        duration: 150 + Math.random() * 300,
        input: {
          symbol: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'][Math.floor(Math.random() * 5)],
          action: Math.random() > 0.5 ? 'buy' : 'sell',
        },
        output: { hasSignificantNews: Math.random() > 0.7, proceed: Math.random() > 0.2 },
      };

      if (newExecution.status === 'failed') {
        newExecution.error = {
          message: 'Connection timeout',
          code: 'TIMEOUT',
        };
      }

      setExecutions((prev) => [newExecution, ...prev.slice(0, 99)]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Toggle streaming
  const toggleStreaming = useCallback(() => {
    setIsStreaming((prev) => !prev);
  }, []);

  // Get metrics for a specific hook
  const getHookMetrics = useCallback((hookId: string) => {
    return metrics[hookId] || null;
  }, [metrics]);

  // Clear executions
  const clearExecutions = useCallback(() => {
    setExecutions([]);
  }, []);

  return {
    executions,
    metrics,
    selectedHook,
    setSelectedHook,
    isStreaming,
    toggleStreaming,
    getHookMetrics,
    clearExecutions,
  };
}

/**
 * Hook for debounced search
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        (!modifiers.ctrl || event.ctrlKey) &&
        (!modifiers.shift || event.shiftKey) &&
        (!modifiers.alt || event.altKey)
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, modifiers]);
}
