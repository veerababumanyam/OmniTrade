/**
 * OmniTrade Plugin Management UI Components
 * React 19 components with Liquid Glass design system
 *
 * @module @omnitrade/plugins-ui
 * @version 1.0.0
 */

// Styles
import './styles/liquid-glass.css';
import './styles/components.css';

// Type Definitions
export type {
  Plugin,
  PluginStatus,
  PluginCategory,
  PluginConfig,
  ConfigSchema,
  ConfigProperty,
  PluginHealth,
  ToolDefinition,
  ToolCategory,
  JSONSchema,
  ToolExecutionResult,
  HookDefinition,
  HookType,
  HookExecution,
  HookError,
  HookMetrics,
  PluginCatalogEntry,
  PluginFilter,
  ToolFilter,
  TabConfig,
  NotificationState,
  ApiResponse,
  PaginatedResponse,
} from './types';

// Components
export { PluginCard } from './PluginCard';
export { PluginDashboard } from './PluginDashboard';
export { ToolBrowser } from './ToolBrowser';
export { ToolTester } from './ToolTester';
export { HookMonitor } from './HookMonitor';
export { HookTimeline } from './HookTimeline';

// Hooks
export {
  usePluginManager,
  useToolManager,
  useHookMonitor,
  useDebounce,
  useKeyboardShortcut,
} from './hooks/usePluginManager';

// Default export - main dashboard component
export { PluginDashboard as default } from './PluginDashboard';
