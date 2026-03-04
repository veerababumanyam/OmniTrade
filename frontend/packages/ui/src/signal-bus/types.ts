/**
 * Signal Bus Types for OmniTrade GenUI
 *
 * High-frequency inter-module communication system based on EventTarget.
 * Supports typed signal topics for AI-driven component orchestration.
 *
 * Signal topics follow the pattern: `namespace:entity:action`
 * - namespace: Category of signal (ui, nav, form, modal, toast, etc.)
 * - entity: The specific component or element (button, input, sidebar, etc.)
 * - action: The event that occurred (click, focus, blur, submit, etc.)
 */

// ============================================================================
// Signal Categories
// ============================================================================

/**
 * Signal category namespaces for organizing signals
 */
export type SignalCategory =
  | 'ui'       // General UI interactions
  | 'form'     // Form-related signals
  | 'nav'      // Navigation signals
  | 'modal'    // Modal/dialog signals
  | 'toast'    // Toast/notification signals
  | 'chat'     // Chat communication signals
  | 'trade'    // Trade lifecycle signals
  | 'theme'    // Theme and branding signals
  | 'ai'       // AI orchestration signals
  | 'app'      // Application-level signals
  | 'error'    // Error tracking signals
  | 'lifecycle'; // Component lifecycle signals

// ============================================================================
// Click/Interaction Signals
// ============================================================================

/**
 * Click signal payload
 */
export interface ClickSignalPayload {
  /** Element identifier */
  elementId?: string;
  /** Element type that was clicked */
  elementType: string;
  /** Human-readable label of the clicked element */
  label?: string;
  /** Position in a list or grid */
  index?: number;
  /** Whether modifier keys were pressed */
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  /** Timestamp of the click */
  timestamp: number;
}

/**
 * Interaction signal payload for general interactions
 */
export interface InteractionSignalPayload {
  /** Element identifier */
  elementId?: string;
  /** Type of interaction */
  interactionType: 'tap' | 'longpress' | 'swipe' | 'pinch' | 'drag';
  /** Element type */
  elementType: string;
  /** Additional data */
  data?: Record<string, unknown>;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Lifecycle Signals
// ============================================================================

/**
 * Component mount signal payload
 */
export interface MountSignalPayload {
  /** Component name */
  component: string;
  /** Component instance ID */
  instanceId?: string;
  /** Props at mount time */
  props?: Record<string, unknown>;
  /** Timestamp */
  timestamp: number;
}

/**
 * Component unmount signal payload
 */
export interface UnmountSignalPayload {
  /** Component name */
  component: string;
  /** Component instance ID */
  instanceId?: string;
  /** Reason for unmount */
  reason?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Component update signal payload
 */
export interface UpdateSignalPayload {
  /** Component name */
  component: string;
  /** Component instance ID */
  instanceId?: string;
  /** Changed prop keys */
  changedProps?: string[];
  /** Previous props */
  previousProps?: Record<string, unknown>;
  /** New props */
  newProps?: Record<string, unknown>;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// User Behavior Signals
// ============================================================================

/**
 * Focus signal payload
 */
export interface FocusSignalPayload {
  /** Element identifier */
  elementId?: string;
  /** Element type */
  elementType: string;
  /** Whether focus was gained (true) or lost (false) */
  focused: boolean;
  /** Previous element that had focus */
  previousElementId?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Hover signal payload
 */
export interface HoverSignalPayload {
  /** Element identifier */
  elementId?: string;
  /** Element type */
  elementType: string;
  /** Whether element is being hovered */
  hovered: boolean;
  /** Duration of hover in ms (on unhover) */
  duration?: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Hesitation signal payload (user pauses over an element without acting)
 */
export interface HesitationSignalPayload {
  /** Element identifier */
  elementId?: string;
  /** Element type */
  elementType: string;
  /** Duration of hesitation in ms */
  duration: number;
  /** Whether user eventually acted */
  acted?: boolean;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Error Tracking Signals
// ============================================================================

/**
 * Error signal payload
 */
export interface ErrorSignalPayload {
  /** Error type */
  errorType: 'render' | 'network' | 'validation' | 'permission' | 'unknown';
  /** Error message */
  message: string;
  /** Error code */
  code?: string | number;
  /** Component where error occurred */
  component?: string;
  /** Stack trace */
  stack?: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Whether error was recovered */
  recovered?: boolean;
  /** Timestamp */
  timestamp: number;
}

/**
 * Warning signal payload
 */
export interface WarningSignalPayload {
  /** Warning type */
  warningType: string;
  /** Warning message */
  message: string;
  /** Component where warning occurred */
  component?: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Form Signals
// ============================================================================

/**
 * Form input signal payload
 */
export interface FormInputSignalPayload {
  /** Form identifier */
  formId?: string;
  /** Field name */
  fieldName: string;
  /** Field value */
  value: unknown;
  /** Previous value */
  previousValue?: unknown;
  /** Whether input is valid */
  valid?: boolean;
  /** Validation errors */
  errors?: string[];
  /** Timestamp */
  timestamp: number;
}

/**
 * Form change signal payload
 */
export interface FormChangeSignalPayload {
  /** Form identifier */
  formId?: string;
  /** Changed fields */
  changedFields: Record<string, unknown>;
  /** Whether form is valid */
  valid?: boolean;
  /** Timestamp */
  timestamp: number;
}

/**
 * Form submit signal payload
 */
export interface FormSubmitSignalPayload {
  /** Form identifier */
  formId?: string;
  /** Form data */
  data: Record<string, unknown>;
  /** Whether submission is valid */
  valid: boolean;
  /** Validation errors */
  errors?: Record<string, string[]>;
  /** Submit method */
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Timestamp */
  timestamp: number;
}

/**
 * Form validation signal payload
 */
export interface FormValidationSignalPayload {
  /** Form identifier */
  formId?: string;
  /** Field name (for single field validation) */
  fieldName?: string;
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors by field */
  errors: Record<string, string[]>;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Navigation Signals
// ============================================================================

/**
 * Navigation signal payload
 */
export interface NavigationSignalPayload {
  /** Destination route or URL */
  destination: string;
  /** Previous route */
  previous?: string;
  /** Navigation type */
  type: 'push' | 'replace' | 'pop' | 'external';
  /** Navigation parameters */
  params?: Record<string, string>;
  /** Query parameters */
  query?: Record<string, string>;
  /** Timestamp */
  timestamp: number;
}

/**
 * Sidebar toggle signal payload
 */
export interface SidebarToggleSignalPayload {
  /** Sidebar identifier */
  sidebarId?: string;
  /** Whether sidebar is now collapsed */
  collapsed: boolean;
  /** Previous state */
  previousState: boolean;
  /** Timestamp */
  timestamp: number;
}

/**
 * Sidebar item click signal payload
 */
export interface SidebarItemSignalPayload {
  /** Sidebar identifier */
  sidebarId?: string;
  /** Item identifier */
  itemId: string;
  /** Item label */
  label?: string;
  /** Action type */
  action: 'click' | 'expand' | 'collapse';
  /** Timestamp */
  timestamp: number;
}

/**
 * Sidebar search signal payload
 */
export interface SidebarSearchSignalPayload {
  /** Sidebar identifier */
  sidebarId?: string;
  /** Search query */
  query: string;
  /** Number of results */
  resultsCount?: number;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Modal/Dialog Signals
// ============================================================================

/**
 * Modal open signal payload
 */
export interface ModalOpenSignalPayload {
  /** Modal identifier */
  modalId: string;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: string;
  /** Modal type */
  type?: 'modal' | 'dialog' | 'drawer' | 'sheet';
  /** Timestamp */
  timestamp: number;
}

/**
 * Modal close signal payload
 */
export interface ModalCloseSignalPayload {
  /** Modal identifier */
  modalId: string;
  /** Close reason */
  reason: 'overlay' | 'esc' | 'closeButton' | 'action' | 'programmatic' | 'backdrop';
  /** Action that triggered close (if applicable) */
  actionId?: string;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Feedback Signals (Toast, Notification)
// ============================================================================

/**
 * Toast show signal payload
 */
export interface ToastShowSignalPayload {
  /** Toast identifier */
  toastId: string;
  /** Toast type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Toast title */
  title?: string;
  /** Position */
  position?: string;
  /** Duration */
  duration?: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Toast dismiss signal payload
 */
export interface ToastDismissSignalPayload {
  /** Toast identifier */
  toastId: string;
  /** Toast type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Dismiss reason */
  reason: 'auto' | 'user' | 'programmatic';
  /** How long toast was visible */
  visibleDuration: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Notification show signal payload
 */
export interface NotificationShowSignalPayload {
  /** Notification identifier */
  notificationId: string;
  /** Notification type */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Notification title */
  title: string;
  /** Notification body */
  body?: string;
  /** Priority */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  /** Timestamp */
  timestamp: number;
}

/**
 * Notification dismiss signal payload
 */
export interface NotificationDismissSignalPayload {
  /** Notification identifier */
  notificationId: string;
  /** Dismiss reason */
  reason: 'auto' | 'user' | 'programmatic' | 'timeout';
  /** Whether notification was actioned */
  actioned?: boolean;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Table/Data Grid Signals
// ============================================================================

/**
 * Table row select signal payload
 */
export interface TableRowSelectSignalPayload {
  /** Table identifier */
  tableId: string;
  /** Row identifier */
  rowId: string | number;
  /** Row data */
  rowData?: Record<string, unknown>;
  /** Whether row is selected */
  selected: boolean;
  /** Total selected count */
  selectedCount: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Table sort change signal payload
 */
export interface TableSortChangeSignalPayload {
  /** Table identifier */
  tableId: string;
  /** Column being sorted */
  columnId: string;
  /** Sort direction */
  direction: 'asc' | 'desc' | null;
  /** Timestamp */
  timestamp: number;
}

/**
 * Table page change signal payload
 */
export interface TablePageChangeSignalPayload {
  /** Table identifier */
  tableId: string;
  /** New page number */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total items */
  totalItems: number;
  /** Total pages */
  totalPages: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Table filter change signal payload
 */
export interface TableFilterChangeSignalPayload {
  /** Table identifier */
  tableId: string;
  /** Filter column */
  columnId?: string;
  /** Filter value */
  value: string;
  /** Filter operator */
  operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Search Signals
// ============================================================================

/**
 * Search query signal payload
 */
export interface SearchQuerySignalPayload {
  /** Search input identifier */
  searchId?: string;
  /** Search query */
  query: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Search result select signal payload
 */
export interface SearchResultSelectSignalPayload {
  /** Search input identifier */
  searchId?: string;
  /** Selected result identifier */
  resultId: string;
  /** Result label */
  resultLabel?: string;
  /** Result index in list */
  index?: number;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Chat Signals
// ============================================================================

/**
 * Chat message send signal payload
 */
export interface ChatMessageSendSignalPayload {
  /** Chat identifier */
  chatId?: string;
  /** Message content */
  message: string;
  /** Attachments */
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
  }>;
  /** Timestamp */
  timestamp: number;
}

/**
 * Chat message receive signal payload
 */
export interface ChatMessageReceiveSignalPayload {
  /** Chat identifier */
  chatId?: string;
  /** Message identifier */
  messageId: string;
  /** Message content */
  message: string;
  /** Sender identifier */
  senderId?: string;
  /** Sender type */
  senderType?: 'user' | 'ai' | 'system';
  /** Timestamp */
  timestamp: number;
}

/**
 * Chat typing signal payload
 */
export interface ChatTypingSignalPayload {
  /** Chat identifier */
  chatId?: string;
  /** Whether user is typing */
  isTyping: boolean;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Trade Signals
// ============================================================================

/**
 * Trade propose signal payload
 */
export interface TradeProposeSignalPayload {
  /** Trade identifier */
  tradeId?: string;
  /** Trading symbol */
  symbol: string;
  /** Trade action */
  action: 'BUY' | 'SELL';
  /** Quantity */
  quantity: number;
  /** Price */
  price?: number;
  /** AI confidence score */
  confidence?: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Trade approve signal payload
 */
export interface TradeApproveSignalPayload {
  /** Trade identifier */
  tradeId: string;
  /** Approver identifier */
  approverId?: string;
  /** Approval timestamp */
  timestamp: number;
}

/**
 * Trade reject signal payload
 */
export interface TradeRejectSignalPayload {
  /** Trade identifier */
  tradeId: string;
  /** Rejector identifier */
  rejectorId?: string;
  /** Rejection reason */
  reason?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Trade execute signal payload
 */
export interface TradeExecuteSignalPayload {
  /** Trade identifier */
  tradeId: string;
  /** Execution price */
  executionPrice: number;
  /** Execution status */
  status: 'filled' | 'partial' | 'failed';
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Theme Signals
// ============================================================================

/**
 * Theme change signal payload
 */
export interface ThemeChangeSignalPayload {
  /** New theme name */
  theme: string;
  /** Previous theme */
  previousTheme?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Theme mode toggle signal payload
 */
export interface ThemeModeToggleSignalPayload {
  /** New mode */
  mode: 'light' | 'dark' | 'system';
  /** Previous mode */
  previousMode?: string;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// AI Orchestration Signals
// ============================================================================

/**
 * AI intent detected signal payload
 */
export interface AIIntentDetectedSignalPayload {
  /** Detected intent */
  intent: string;
  /** Confidence score */
  confidence: number;
  /** Entities extracted */
  entities?: Record<string, unknown>;
  /** Raw input */
  rawInput?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * AI component assemble signal payload
 */
export interface AIComponentAssembleSignalPayload {
  /** Component type to assemble */
  componentType: string;
  /** Component props */
  props?: Record<string, unknown>;
  /** Assembly confidence */
  confidence?: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * AI action suggest signal payload
 */
export interface AIActionSuggestSignalPayload {
  /** Suggested action */
  action: string;
  /** Action parameters */
  params?: Record<string, unknown>;
  /** Confidence score */
  confidence: number;
  /** Reasoning */
  reasoning?: string;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Signal Topic Types
// ============================================================================

/**
 * Signal topics are strictly typed for type-safe pub/sub communication.
 * Topics follow a pattern: `namespace:entity:action`
 *
 * Note: We also allow arbitrary strings for flexibility in user-defined topics.
 */
export type SignalTopic =
  // Click/interaction signals
  | `ui:${string}:click`
  | `ui:${string}:interaction`
  // Lifecycle signals
  | `lifecycle:${string}:mount`
  | `lifecycle:${string}:unmount`
  | `lifecycle:${string}:update`
  // Focus/hover signals
  | `ui:${string}:focus`
  | `ui:${string}:blur`
  | `ui:${string}:hover`
  | `ui:${string}:unhover`
  | `ui:${string}:hesitation`
  // Error signals
  | `error:${string}:occurred`
  | `error:${string}:recovered`
  | `warning:${string}:occurred`
  // Form signals
  | `form:${string}:input`
  | `form:${string}:change`
  | `form:${string}:submit`
  | `form:${string}:validate`
  | `form:${string}:reset`
  // Navigation signals
  | `nav:navigate:${string}`
  | `nav:back`
  | `nav:forward`
  | `nav:sidebar:toggle`
  | `nav:sidebar:item`
  | `nav:sidebar:search`
  // Modal signals
  | `ui:modal:open`
  | `ui:modal:close`
  | `ui:drawer:open`
  | `ui:drawer:close`
  | `ui:dialog:open`
  | `ui:dialog:close`
  // Toast/notification signals
  | `ui:toast:show`
  | `ui:toast:dismiss`
  | `ui:notification:show`
  | `ui:notification:dismiss`
  // Table signals
  | `ui:table:row:select`
  | `ui:table:sort:change`
  | `ui:table:page:change`
  | `ui:table:filter:change`
  // Search signals
  | `ui:search:query`
  | `ui:search:result:select`
  // Chat signals
  | `chat:${string}:send`
  | `chat:${string}:receive`
  | `chat:${string}:typing`
  // Trade lifecycle signals
  | `trade:${string}:propose`
  | `trade:${string}:approve`
  | `trade:${string}:reject`
  | `trade:${string}:execute`
  // Theme signals
  | `theme:change`
  | `theme:mode:toggle`
  | `theme:brand:switch`
  // Date picker signals
  | `ui:datepicker:change`
  // Button signals
  | `ui:button:click`
  // AI orchestration signals
  | `ai:intent:detected`
  | `ai:component:assemble`
  | `ai:action:suggest`
  // Allow any string for user-defined topics (with prefix requirements)
  | `ui:${string}:${string}`
  | `app:${string}:${string}`
  | `custom:${string}:${string}`;

// ============================================================================
// Signal Metadata
// ============================================================================

/**
 * Metadata for signal payloads, supporting AI-generated signals.
 */
export interface SignalMetadata {
  /** Whether this signal was generated by an AI agent */
  aiGenerated?: boolean;
  /** Confidence score for AI-generated signals (0-1) */
  confidence?: number;
  /** Optional correlation ID for tracing signal chains */
  correlationId?: string;
  /** Optional priority for signal processing (higher = more urgent) */
  priority?: SignalPriority;
  /** Optional TTL in milliseconds for time-sensitive signals */
  ttl?: number;
  /** Source component or module */
  source?: string;
  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Signal priority levels
 */
export type SignalPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Signal priority numeric values for comparison
 */
export const SIGNAL_PRIORITY_VALUES: Record<SignalPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
} as const;

// ============================================================================
// Signal Payload
// ============================================================================

/**
 * Standard payload structure for all signals.
 * @template T - The type of data being transmitted
 */
export interface SignalPayload<T = unknown> {
  /** Identifier of the signal source (component, module, or agent) */
  source: string;
  /** Unix timestamp in milliseconds when the signal was created */
  timestamp: number;
  /** The actual data payload */
  data: T;
  /** Optional metadata for AI and tracing support */
  metadata?: SignalMetadata;
}

// ============================================================================
// Signal Event
// ============================================================================

/**
 * Event type for SignalBus extending CustomEvent.
 * @template T - The type of the signal payload data
 */
export interface SignalEvent<T = unknown> extends CustomEvent<SignalPayload<T>> {
  readonly type: SignalTopic;
}

// ============================================================================
// Signal Handler
// ============================================================================

/**
 * Handler function type for signal subscriptions.
 * @template T - The type of the signal payload data
 */
export type SignalHandler<T = unknown> = (payload: SignalPayload<T>) => void;

// ============================================================================
// Signal Bus Configuration
// ============================================================================

/**
 * Configuration options for the SignalBus.
 */
export interface SignalBusConfig {
  /** Enable debug logging for signal flow */
  debug?: boolean;
  /** Maximum number of handlers per topic (prevents memory leaks) */
  maxHandlersPerTopic?: number;
  /** Enable signal history for debugging */
  enableHistory?: boolean;
  /** Maximum history entries to retain */
  maxHistorySize?: number;
}

// ============================================================================
// Signal Bus Statistics
// ============================================================================

/**
 * Statistics about signal bus usage.
 */
export interface SignalBusStats {
  /** Total signals published */
  totalPublished: number;
  /** Total subscriptions */
  totalSubscriptions: number;
  /** Signals published per topic */
  signalsByTopic: Map<SignalTopic, number>;
  /** Current subscriber count per topic */
  subscribersByTopic: Map<SignalTopic, number>;
}

// ============================================================================
// Publish Options
// ============================================================================

/**
 * Options for publishing a signal.
 */
export interface PublishOptions {
  /** Override the auto-generated timestamp */
  timestamp?: number;
  /** Metadata to attach to the signal */
  metadata?: SignalMetadata;
  /** Whether to cancel if no subscribers exist */
  cancelIfNoSubscribers?: boolean;
}

// ============================================================================
// Signal Subscription
// ============================================================================

/**
 * Subscription handle returned from subscribe() for cleanup.
 */
export interface SignalSubscription {
  /** The topic that was subscribed to */
  readonly topic: SignalTopic;
  /** Unsubscribe from the topic */
  unsubscribe: () => void;
  /** Whether the subscription is still active */
  readonly active: boolean;
}

// ============================================================================
// Signal Type Map (for type-safe signal handling)
// ============================================================================

/**
 * Maps signal topics to their payload types for type-safe signal handling.
 */
export interface SignalTypeMap {
  // Click/Interaction
  'ui:button:click': ClickSignalPayload;
  'ui:element:click': ClickSignalPayload;
  'ui:element:interaction': InteractionSignalPayload;

  // Lifecycle
  'lifecycle:component:mount': MountSignalPayload;
  'lifecycle:component:unmount': UnmountSignalPayload;
  'lifecycle:component:update': UpdateSignalPayload;

  // Focus/Hover
  'ui:element:focus': FocusSignalPayload;
  'ui:element:blur': FocusSignalPayload;
  'ui:element:hover': HoverSignalPayload;
  'ui:element:unhover': HoverSignalPayload;
  'ui:element:hesitation': HesitationSignalPayload;

  // Error
  'error:application:occurred': ErrorSignalPayload;
  'error:application:recovered': ErrorSignalPayload;
  'warning:application:occurred': WarningSignalPayload;

  // Form
  'form:field:input': FormInputSignalPayload;
  'form:field:change': FormChangeSignalPayload;
  'form:document:submit': FormSubmitSignalPayload;
  'form:document:validate': FormValidationSignalPayload;
  'form:document:reset': { formId?: string; timestamp: number };

  // Navigation
  'nav:navigate:route': NavigationSignalPayload;
  'nav:back': NavigationSignalPayload;
  'nav:forward': NavigationSignalPayload;
  'nav:sidebar:toggle': SidebarToggleSignalPayload;
  'nav:sidebar:item': SidebarItemSignalPayload;
  'nav:sidebar:search': SidebarSearchSignalPayload;

  // Modal
  'ui:modal:open': ModalOpenSignalPayload;
  'ui:modal:close': ModalCloseSignalPayload;
  'ui:drawer:open': ModalOpenSignalPayload;
  'ui:drawer:close': ModalCloseSignalPayload;
  'ui:dialog:open': ModalOpenSignalPayload;
  'ui:dialog:close': ModalCloseSignalPayload;

  // Toast/Notification
  'ui:toast:show': ToastShowSignalPayload;
  'ui:toast:dismiss': ToastDismissSignalPayload;
  'ui:notification:show': NotificationShowSignalPayload;
  'ui:notification:dismiss': NotificationDismissSignalPayload;

  // Table
  'ui:table:row:select': TableRowSelectSignalPayload;
  'ui:table:sort:change': TableSortChangeSignalPayload;
  'ui:table:page:change': TablePageChangeSignalPayload;
  'ui:table:filter:change': TableFilterChangeSignalPayload;

  // Search
  'ui:search:query': SearchQuerySignalPayload;
  'ui:search:result:select': SearchResultSelectSignalPayload;

  // Chat
  'chat:conversation:send': ChatMessageSendSignalPayload;
  'chat:conversation:receive': ChatMessageReceiveSignalPayload;
  'chat:conversation:typing': ChatTypingSignalPayload;

  // Trade
  'trade:asset:propose': TradeProposeSignalPayload;
  'trade:asset:approve': TradeApproveSignalPayload;
  'trade:asset:reject': TradeRejectSignalPayload;
  'trade:asset:execute': TradeExecuteSignalPayload;

  // Theme
  'theme:change': ThemeChangeSignalPayload;
  'theme:mode:toggle': ThemeModeToggleSignalPayload;

  // AI
  'ai:intent:detected': AIIntentDetectedSignalPayload;
  'ai:component:assemble': AIComponentAssembleSignalPayload;
  'ai:action:suggest': AIActionSuggestSignalPayload;

  // Date Picker
  'ui:datepicker:change': { dateId?: string; value: Date | null; timestamp: number };
}
