/**
 * Signal Bus Constants for OmniTrade GenUI
 *
 * Standardized signal names and configurations for consistent usage
 * across all components.
 */

import type {
  SignalCategory,
  SignalPriority,
  SIGNAL_PRIORITY_VALUES,
} from './types';

// ============================================================================
// Signal Categories
// ============================================================================

/**
 * Signal category constants for organizing signals
 */
export const SIGNAL_CATEGORIES = {
  UI: 'ui' as SignalCategory,
  FORM: 'form' as SignalCategory,
  NAV: 'nav' as SignalCategory,
  MODAL: 'modal' as SignalCategory,
  TOAST: 'toast' as SignalCategory,
  CHAT: 'chat' as SignalCategory,
  TRADE: 'trade' as SignalCategory,
  THEME: 'theme' as SignalCategory,
  AI: 'ai' as SignalCategory,
  APP: 'app' as SignalCategory,
  ERROR: 'error' as SignalCategory,
  LIFECYCLE: 'lifecycle' as SignalCategory,
  USER: 'user' as SignalCategory,
  PERFORMANCE: 'performance' as SignalCategory,
  ACCESSIBILITY: 'a11y' as SignalCategory,
  ANIMATION: 'animation' as SignalCategory,
} as const;

// ============================================================================
// UI Signals
// ============================================================================

/**
 * UI interaction signal names
 */
export const UI_SIGNALS = {
  // Click/Interaction
  BUTTON_CLICK: 'ui:button:click',
  ELEMENT_CLICK: 'ui:element:click',
  ELEMENT_INTERACTION: 'ui:element:interaction',

  // Focus/Blur
  ELEMENT_FOCUS: 'ui:element:focus',
  ELEMENT_BLUR: 'ui:element:blur',
  INPUT_FOCUS: 'ui:input:focus',
  INPUT_BLUR: 'ui:input:blur',

  // Hover
  ELEMENT_HOVER: 'ui:element:hover',
  ELEMENT_UNHOVER: 'ui:element:unhover',
  HESITATION: 'ui:element:hesitation',

  // Date Picker
  DATEPICKER_CHANGE: 'ui:datepicker:change',

  // Search
  SEARCH_QUERY: 'ui:search:query',
  SEARCH_RESULT_SELECT: 'ui:search:result:select',

  // Table
  TABLE_ROW_SELECT: 'ui:table:row:select',
  TABLE_SORT_CHANGE: 'ui:table:sort:change',
  TABLE_PAGE_CHANGE: 'ui:table:page:change',
  TABLE_FILTER_CHANGE: 'ui:table:filter:change',
} as const;

// ============================================================================
// Modal/Dialog Signals
// ============================================================================

/**
 * Modal and dialog signal names
 */
export const MODAL_SIGNALS = {
  MODAL_OPEN: 'ui:modal:open',
  MODAL_CLOSE: 'ui:modal:close',
  DRAWER_OPEN: 'ui:drawer:open',
  DRAWER_CLOSE: 'ui:drawer:close',
  DIALOG_OPEN: 'ui:dialog:open',
  DIALOG_CLOSE: 'ui:dialog:close',
} as const;

// ============================================================================
// Toast/Notification Signals
// ============================================================================

/**
 * Toast and notification signal names
 */
export const FEEDBACK_SIGNALS = {
  TOAST_SHOW: 'ui:toast:show',
  TOAST_DISMISS: 'ui:toast:dismiss',
  NOTIFICATION_SHOW: 'ui:notification:show',
  NOTIFICATION_DISMISS: 'ui:notification:dismiss',
} as const;

// ============================================================================
// Form Signals
// ============================================================================

/**
 * Form signal names
 */
export const FORM_SIGNALS = {
  FIELD_INPUT: 'form:field:input',
  FIELD_CHANGE: 'form:field:change',
  FORM_SUBMIT: 'form:document:submit',
  FORM_VALIDATE: 'form:document:validate',
  FORM_RESET: 'form:document:reset',
} as const;

// ============================================================================
// Navigation Signals
// ============================================================================

/**
 * Navigation signal names
 */
export const NAV_SIGNALS = {
  NAVIGATE: 'nav:navigate:route',
  BACK: 'nav:back',
  FORWARD: 'nav:forward',
  SIDEBAR_TOGGLE: 'nav:sidebar:toggle',
  SIDEBAR_ITEM: 'nav:sidebar:item',
  SIDEBAR_SEARCH: 'nav:sidebar:search',
} as const;

// ============================================================================
// Lifecycle Signals
// ============================================================================

/**
 * Component lifecycle signal names
 */
export const LIFECYCLE_SIGNALS = {
  COMPONENT_MOUNT: 'lifecycle:component:mount',
  COMPONENT_UNMOUNT: 'lifecycle:component:unmount',
  COMPONENT_UPDATE: 'lifecycle:component:update',
} as const;

// ============================================================================
// Error Signals
// ============================================================================

/**
 * Error tracking signal names
 */
export const ERROR_SIGNALS = {
  ERROR_OCCURRED: 'error:application:occurred',
  ERROR_RECOVERED: 'error:application:recovered',
  WARNING_OCCURRED: 'warning:application:occurred',
} as const;

// ============================================================================
// Chat Signals
// ============================================================================

/**
 * Chat communication signal names
 */
export const CHAT_SIGNALS = {
  MESSAGE_SEND: 'chat:conversation:send',
  MESSAGE_RECEIVE: 'chat:conversation:receive',
  TYPING: 'chat:conversation:typing',
} as const;

// ============================================================================
// Trade Signals
// ============================================================================

/**
 * Trade lifecycle signal names
 */
export const TRADE_SIGNALS = {
  PROPOSE: 'trade:asset:propose',
  APPROVE: 'trade:asset:approve',
  REJECT: 'trade:asset:reject',
  EXECUTE: 'trade:asset:execute',
} as const;

// ============================================================================
// Theme Signals
// ============================================================================

/**
 * Theme signal names
 */
export const THEME_SIGNALS = {
  THEME_CHANGE: 'theme:change',
  MODE_TOGGLE: 'theme:mode:toggle',
  BRAND_SWITCH: 'theme:brand:switch',
} as const;

// ============================================================================
// AI Signals
// ============================================================================

/**
 * AI orchestration signal names
 */
export const AI_SIGNALS = {
  INTENT_DETECTED: 'ai:intent:detected',
  COMPONENT_ASSEMBLE: 'ai:component:assemble',
  ACTION_SUGGEST: 'ai:action:suggest',
  CONFIDENCE_UPDATE: 'ai:confidence:update',
  ERROR_BOUNDARY: 'ai:error:boundary',
} as const;

// ============================================================================
// User Behavior Signals
// ============================================================================

/**
 * User behavior tracking signal names for AI-driven UX adaptation
 */
export const USER_SIGNALS = {
  // Hesitation detection (>5s idle during flow)
  HESITATION_DETECTED: 'user:behavior:hesitation',
  HESITATION_RESOLVED: 'user:behavior:hesitation:resolved',

  // Interaction patterns
  INTERACTION_VELOCITY: 'user:behavior:velocity',
  INTERACTION_PATTERN: 'user:behavior:pattern',
  RAPID_INTERACTION: 'user:behavior:rapid',
  SLOW_INTERACTION: 'user:behavior:slow',

  // Focus tracking
  FOCUS_SESSION_START: 'user:focus:session:start',
  FOCUS_SESSION_END: 'user:focus:session:end',
  ATTENTION drift: 'user:focus:drift',

  // Preference changes
  PREFERENCE_DENSITY: 'user:preference:density',
  PREFERENCE_MOTION: 'user:preference:motion',
  PREFERENCE_CONTRAST: 'user:preference:contrast',
} as const;

// ============================================================================
// Performance Signals
// ============================================================================

/**
 * Performance monitoring signal names
 */
export const PERFORMANCE_SIGNALS = {
  // Render performance
  COMPONENT_RENDER_START: 'perf:component:render:start',
  COMPONENT_RENDER_END: 'perf:component:render:end',
  RENDER_THRESHOLD_EXCEEDED: 'perf:render:threshold:exceeded',

  // Resource loading
  LAZY_LOAD_START: 'perf:lazy:load:start',
  LAZY_LOAD_COMPLETE: 'perf:lazy:load:complete',
  RESOURCE_FETCH: 'perf:resource:fetch',

  // Energy efficiency
  ENERGY_STATE_CHANGE: 'perf:energy:state:change',
  SUB_PIXEL_CULL: 'perf:render:sub-pixel:cul',
  BATTERY_LOW: 'perf:system:battery:low',
} as const;

// ============================================================================
// Accessibility Signals
// ============================================================================

/**
 * Accessibility monitoring signal names
 */
export const ACCESSIBILITY_SIGNALS = {
  // Screen reader
  SCREEN_READER_ACTIVE: 'a11y:screen-reader:active',
  SCREEN_READER_ANNOUNCE: 'a11y:screen-reader:announce',

  // Keyboard navigation
  KEYBOARD_NAV_START: 'a11y:keyboard:nav:start',
  KEYBOARD_NAV_END: 'a11y:keyboard:nav:end',
  FOCUS_TRAP_ENGAGED: 'a11y:focus:trap:engaged',
  FOCUS_TRAP_RELEASED: 'a11y:focus:trap:released',

  // Assistive preferences
  REDUCED_MOTION: 'a11y:preference:reduced-motion',
  HIGH_CONTRAST: 'a11y:preference:high-contrast',
  FONT_SCALE: 'a11y:preference:font:scale',

  // Calm mode (neuro-diversity)
  CALM_MODE_ENTER: 'a11y:calm:mode:enter',
  CALM_MODE_EXIT: 'a11y:calm:mode:exit',
} as const;

// ============================================================================
// Animation Signals
// ============================================================================

/**
 * Animation lifecycle signal names
 */
export const ANIMATION_SIGNALS = {
  ANIMATION_START: 'anim:transition:start',
  ANIMATION_END: 'anim:transition:end',
  ANIMATION_CANCEL: 'anim:transition:cancel',
  SPRING_COMPLETE: 'anim:spring:complete',
  KEYFRAME_COMPLETE: 'anim:keyframe:complete',
} as const;

// ============================================================================
// All Signals Combined
// ============================================================================

/**
 * All standardized signal names
 */
export const SIGNALS = {
  ...UI_SIGNALS,
  ...MODAL_SIGNALS,
  ...FEEDBACK_SIGNALS,
  ...FORM_SIGNALS,
  ...NAV_SIGNALS,
  ...LIFECYCLE_SIGNALS,
  ...ERROR_SIGNALS,
  ...CHAT_SIGNALS,
  ...TRADE_SIGNALS,
  ...THEME_SIGNALS,
  ...AI_SIGNALS,
  ...USER_SIGNALS,
  ...PERFORMANCE_SIGNALS,
  ...ACCESSIBILITY_SIGNALS,
  ...ANIMATION_SIGNALS,
} as const;

// ============================================================================
// Signal Priority Levels
// ============================================================================

/**
 * Signal priority level values for comparison
 */
export const SIGNAL_PRIORITY = {
  LOW: 'low' as SignalPriority,
  NORMAL: 'normal' as SignalPriority,
  HIGH: 'high' as SignalPriority,
  CRITICAL: 'critical' as SignalPriority,
} as const;

// ============================================================================
// Signal Builders
// ============================================================================

/**
 * Helper functions to build signal topics with proper formatting
 */
export const SignalBuilders = {
  /**
   * Build a UI signal topic
   * @param entity - The entity (e.g., 'button', 'input', 'modal')
   * @param action - The action (e.g., 'click', 'focus', 'open')
   */
  ui: (entity: string, action: string): `ui:${string}:${string}` =>
    `ui:${entity}:${action}` as const,

  /**
   * Build a form signal topic
   * @param entity - The form or field identifier
   * @param action - The action (e.g., 'input', 'change', 'submit')
   */
  form: (entity: string, action: string): `form:${string}:${string}` =>
    `form:${entity}:${action}` as const,

  /**
   * Build a navigation signal topic
   * @param entity - The navigation entity (e.g., 'sidebar', 'route')
   * @param action - The action (e.g., 'toggle', 'navigate', 'item')
   */
  nav: (entity: string, action: string): `nav:${string}:${string}` =>
    `nav:${entity}:${action}` as const,

  /**
   * Build a chat signal topic
   * @param chatId - The chat identifier
   * @param action - The action (e.g., 'send', 'receive', 'typing')
   */
  chat: (chatId: string, action: string): `chat:${string}:${string}` =>
    `chat:${chatId}:${action}` as const,

  /**
   * Build a trade signal topic
   * @param symbol - The trading symbol
   * @param action - The action (e.g., 'propose', 'approve', 'execute')
   */
  trade: (symbol: string, action: string): `trade:${string}:${string}` =>
    `trade:${symbol}:${action}` as const,

  /**
   * Build a lifecycle signal topic
   * @param component - The component name
   * @param action - The action ('mount', 'unmount', 'update')
   */
  lifecycle: (component: string, action: string): `lifecycle:${string}:${string}` =>
    `lifecycle:${component}:${action}` as const,

  /**
   * Build an error signal topic
   * @param category - The error category
   * @param action - The action ('occurred', 'recovered')
   */
  error: (category: string, action: string): `error:${string}:${string}` =>
    `error:${category}:${action}` as const,

  /**
   * Build an app-level signal topic
   * @param module - The module name
   * @param action - The action
   */
  app: (module: string, action: string): `app:${string}:${string}` =>
    `app:${module}:${action}` as const,

  /**
   * Build a custom signal topic
   * @param namespace - The custom namespace
   * @param entity - The entity
   * @param action - The action
   */
  custom: (namespace: string, entity: string, action: string): `custom:${string}:${string}` =>
    `custom:${entity}:${action}` as const,
} as const;

// ============================================================================
// Signal Payload Factories
// ============================================================================

/**
 * Factory functions for creating typed signal payloads
 */
export const SignalPayloads = {
  /**
   * Create a click signal payload
   */
  click: (
    elementType: string,
    options?: {
      elementId?: string;
      label?: string;
      index?: number;
      modifiers?: ClickSignalPayload['modifiers'];
    }
  ) => ({
    elementType,
    elementId: options?.elementId,
    label: options?.label,
    index: options?.index,
    modifiers: options?.modifiers,
    timestamp: Date.now(),
  }),

  /**
   * Create a focus signal payload
   */
  focus: (
    elementType: string,
    focused: boolean,
    options?: {
      elementId?: string;
      previousElementId?: string;
    }
  ) => ({
    elementType,
    focused,
    elementId: options?.elementId,
    previousElementId: options?.previousElementId,
    timestamp: Date.now(),
  }),

  /**
   * Create a hover signal payload
   */
  hover: (
    elementType: string,
    hovered: boolean,
    options?: {
      elementId?: string;
      duration?: number;
    }
  ) => ({
    elementType,
    hovered,
    elementId: options?.elementId,
    duration: options?.duration,
    timestamp: Date.now(),
  }),

  /**
   * Create a form input signal payload
   */
  formInput: (
    fieldName: string,
    value: unknown,
    options?: {
      formId?: string;
      previousValue?: unknown;
      valid?: boolean;
      errors?: string[];
    }
  ) => ({
    fieldName,
    value,
    formId: options?.formId,
    previousValue: options?.previousValue,
    valid: options?.valid,
    errors: options?.errors,
    timestamp: Date.now(),
  }),

  /**
   * Create a navigation signal payload
   */
  navigate: (
    destination: string,
    options?: {
      previous?: string;
      type?: 'push' | 'replace' | 'pop' | 'external';
      params?: Record<string, string>;
      query?: Record<string, string>;
    }
  ) => ({
    destination,
    previous: options?.previous,
    type: options?.type ?? 'push',
    params: options?.params,
    query: options?.query,
    timestamp: Date.now(),
  }),

  /**
   * Create a modal open signal payload
   */
  modalOpen: (
    modalId: string,
    options?: {
      title?: string;
      size?: string;
      type?: 'modal' | 'dialog' | 'drawer' | 'sheet';
    }
  ) => ({
    modalId,
    title: options?.title,
    size: options?.size,
    type: options?.type ?? 'modal',
    timestamp: Date.now(),
  }),

  /**
   * Create a modal close signal payload
   */
  modalClose: (
    modalId: string,
    reason: 'overlay' | 'esc' | 'closeButton' | 'action' | 'programmatic' | 'backdrop',
    options?: {
      actionId?: string;
    }
  ) => ({
    modalId,
    reason,
    actionId: options?.actionId,
    timestamp: Date.now(),
  }),

  /**
   * Create a toast show signal payload
   */
  toastShow: (
    toastId: string,
    type: 'success' | 'error' | 'warning' | 'info',
    options?: {
      title?: string;
      position?: string;
      duration?: number;
    }
  ) => ({
    toastId,
    type,
    title: options?.title,
    position: options?.position,
    duration: options?.duration,
    timestamp: Date.now(),
  }),

  /**
   * Create a toast dismiss signal payload
   */
  toastDismiss: (
    toastId: string,
    type: 'success' | 'error' | 'warning' | 'info',
    reason: 'auto' | 'user' | 'programmatic',
    visibleDuration: number
  ) => ({
    toastId,
    type,
    reason,
    visibleDuration,
    timestamp: Date.now(),
  }),

  /**
   * Create a table row select signal payload
   */
  tableRowSelect: <T extends Record<string, unknown>>(
    tableId: string,
    rowId: string | number,
    selected: boolean,
    selectedCount: number,
    rowData?: T
  ) => ({
    tableId,
    rowId,
    selected,
    selectedCount,
    rowData,
    timestamp: Date.now(),
  }),

  /**
   * Create a table sort change signal payload
   */
  tableSortChange: (
    tableId: string,
    columnId: string,
    direction: 'asc' | 'desc' | null
  ) => ({
    tableId,
    columnId,
    direction,
    timestamp: Date.now(),
  }),

  /**
   * Create a table page change signal payload
   */
  tablePageChange: (
    tableId: string,
    page: number,
    pageSize: number,
    totalItems: number,
    totalPages: number
  ) => ({
    tableId,
    page,
    pageSize,
    totalItems,
    totalPages,
    timestamp: Date.now(),
  }),

  /**
   * Create an error signal payload
   */
  error: (
    errorType: 'render' | 'network' | 'validation' | 'permission' | 'unknown',
    message: string,
    options?: {
      code?: string | number;
      component?: string;
      stack?: string;
      context?: Record<string, unknown>;
      recovered?: boolean;
    }
  ) => ({
    errorType,
    message,
    code: options?.code,
    component: options?.component,
    stack: options?.stack,
    context: options?.context,
    recovered: options?.recovered,
    timestamp: Date.now(),
  }),

  /**
   * Create a lifecycle mount signal payload
   */
  mount: (
    component: string,
    options?: {
      instanceId?: string;
      props?: Record<string, unknown>;
    }
  ) => ({
    component,
    instanceId: options?.instanceId,
    props: options?.props,
    timestamp: Date.now(),
  }),

  /**
   * Create a lifecycle unmount signal payload
   */
  unmount: (
    component: string,
    options?: {
      instanceId?: string;
      reason?: string;
    }
  ) => ({
    component,
    instanceId: options?.instanceId,
    reason: options?.reason,
    timestamp: Date.now(),
  }),

  /**
   * Create a chat message send signal payload
   */
  chatMessageSend: (
    message: string,
    options?: {
      chatId?: string;
      attachments?: Array<{ id: string; name: string; size: number; type: string }>;
    }
  ) => ({
    message,
    chatId: options?.chatId,
    attachments: options?.attachments,
    timestamp: Date.now(),
  }),

  /**
   * Create a trade propose signal payload
   */
  tradePropose: (
    symbol: string,
    action: 'BUY' | 'SELL',
    quantity: number,
    options?: {
      tradeId?: string;
      price?: number;
      confidence?: number;
    }
  ) => ({
    symbol,
    action,
    quantity,
    tradeId: options?.tradeId,
    price: options?.price,
    confidence: options?.confidence,
    timestamp: Date.now(),
  }),

  /**
   * Create a theme change signal payload
   */
  themeChange: (
    theme: string,
    previousTheme?: string
  ) => ({
    theme,
    previousTheme,
    timestamp: Date.now(),
  }),

  /**
   * Create an AI intent detected signal payload
   */
  aiIntentDetected: (
    intent: string,
    confidence: number,
    options?: {
      entities?: Record<string, unknown>;
      rawInput?: string;
    }
  ) => ({
    intent,
    confidence,
    entities: options?.entities,
    rawInput: options?.rawInput,
    timestamp: Date.now(),
  }),
} as const;

// ============================================================================
// Type Imports for Factories
// ============================================================================

import type { ClickSignalPayload } from './types';
