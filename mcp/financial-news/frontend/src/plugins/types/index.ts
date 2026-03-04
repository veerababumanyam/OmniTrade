/**
 * OmniTrade Plugin Management Types
 * Type definitions for the plugin system UI components
 */

// Plugin Status
export type PluginStatus = 'installed' | 'available' | 'updating' | 'error' | 'disabled';

// Plugin Category
export type PluginCategory =
  | 'data-source'
  | 'analysis'
  | 'execution'
  | 'notification'
  | 'integration'
  | 'utility';

// Plugin Interface
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: PluginCategory;
  status: PluginStatus;
  enabled: boolean;
  installedAt?: string;
  lastUpdated?: string;
  icon?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  dependencies?: string[];
  config?: PluginConfig;
  health?: PluginHealth;
  tools?: ToolDefinition[];
  hooks?: HookDefinition[];
}

// Plugin Configuration
export interface PluginConfig {
  schema: ConfigSchema;
  values: Record<string, unknown>;
}

export interface ConfigSchema {
  type: 'object';
  properties: Record<string, ConfigProperty>;
  required?: string[];
}

export interface ConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

// Plugin Health Status
export interface PluginHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: string;
  uptime: number;
  errorCount: number;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    requestCount: number;
    avgResponseTime: number;
  };
}

// Tool Definition
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  pluginId: string;
  category: ToolCategory;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  enabled: boolean;
  executionCount?: number;
  avgExecutionTime?: number;
  lastExecuted?: string;
}

export type ToolCategory =
  | 'market-data'
  | 'analysis'
  | 'trading'
  | 'risk'
  | 'reporting'
  | 'utility';

export interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

// Tool Execution Result
export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime: number;
  timestamp: string;
}

// Hook Definition
export interface HookDefinition {
  id: string;
  name: string;
  type: HookType;
  pluginId: string;
  description: string;
  enabled: boolean;
  priority: number;
  timeout?: number;
}

export type HookType =
  | 'pre-trade'
  | 'post-trade'
  | 'pre-analysis'
  | 'post-analysis'
  | 'on-error'
  | 'on-signal'
  | 'schedule';

// Hook Execution Record
export interface HookExecution {
  id: string;
  hookId: string;
  hookName: string;
  pluginId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  startTime: string;
  endTime?: string;
  duration?: number;
  input?: unknown;
  output?: unknown;
  error?: HookError;
}

export interface HookError {
  message: string;
  stack?: string;
  code?: string;
}

// Hook Performance Metrics
export interface HookMetrics {
  hookId: string;
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  errorCount: number;
  timeoutCount: number;
}

// Plugin Catalog Entry (for marketplace)
export interface PluginCatalogEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: PluginCategory;
  downloads: number;
  rating: number;
  reviewCount: number;
  icon?: string;
  tags: string[];
  latestVersion: string;
  installed?: boolean;
  installedVersion?: string;
}

// Search and Filter Types
export interface PluginFilter {
  search?: string;
  category?: PluginCategory | 'all';
  status?: PluginStatus | 'all';
  installed?: boolean;
}

export interface ToolFilter {
  search?: string;
  category?: ToolCategory | 'all';
  pluginId?: string;
  enabled?: boolean;
}

// UI State Types
export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

export interface NotificationState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
