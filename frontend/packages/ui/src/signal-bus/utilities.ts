/**
 * Signal Bus Utilities for OmniTrade GenUI
 *
 * Helper functions for common signal patterns, type-safe signal emitters,
 * and signal batching utilities.
 */

import type {
  SignalTopic,
  SignalPayload,
  SignalHandler,
  SignalMetadata,
  SignalPriority,
  SignalSubscription,
  SignalTypeMap,
  ClickSignalPayload,
  FocusSignalPayload,
  HoverSignalPayload,
  FormInputSignalPayload,
  FormChangeSignalPayload,
  FormSubmitSignalPayload,
  ModalOpenSignalPayload,
  ModalCloseSignalPayload,
  ToastShowSignalPayload,
  ToastDismissSignalPayload,
  TableRowSelectSignalPayload,
  TableSortChangeSignalPayload,
  TablePageChangeSignalPayload,
  NavigationSignalPayload,
  ErrorSignalPayload,
  MountSignalPayload,
  UnmountSignalPayload,
  ChatMessageSendSignalPayload,
  TradeProposeSignalPayload,
  ThemeChangeSignalPayload,
  AIIntentDetectedSignalPayload,
} from './types';
import { SignalBus } from './index';
import { SignalBuilders, SIGNAL_PRIORITY } from './constants';

// ============================================================================
// Type-Safe Signal Emitter
// ============================================================================

/**
 * Creates a type-safe signal emitter for a specific source.
 * Use this to ensure consistent source naming across all signals.
 *
 * @param source - The source identifier for all emitted signals
 * @returns Object with typed emit methods
 *
 * @example
 * ```typescript
 * const emitter = createTypedEmitter('TradeCard');
 *
 * // Type-safe emission
 * emitter.emit('ui:button:click', { elementType: 'button', label: 'Approve' });
 *
 * // Emit with AI metadata
 * emitter.emitAI('ai:action:suggest', { action: 'approve', confidence: 0.95 }, 0.95);
 * ```
 */
export function createTypedEmitter<TSource extends string>(source: TSource) {
  return {
    /**
     * Emit a typed signal
     */
    emit<T extends SignalTopic>(
      topic: T,
      data: T extends keyof SignalTypeMap ? SignalTypeMap[T] : unknown,
      metadata?: SignalMetadata
    ): boolean {
      return SignalBus.publish(topic, data, { source, metadata });
    },

    /**
     * Emit an AI-generated signal with confidence metadata
     */
    emitAI<T extends SignalTopic>(
      topic: T,
      data: T extends keyof SignalTypeMap ? SignalTypeMap[T] : unknown,
      confidence: number,
      metadata?: Omit<SignalMetadata, 'aiGenerated' | 'confidence'>
    ): boolean {
      return SignalBus.publishAI(topic, data, {
        source,
        confidence,
        metadata,
      });
    },

    /**
     * Emit a signal with priority
     */
    emitWithPriority<T extends SignalTopic>(
      topic: T,
      data: T extends keyof SignalTypeMap ? SignalTypeMap[T] : unknown,
      priority: SignalPriority,
      metadata?: Omit<SignalMetadata, 'priority'>
    ): boolean {
      return SignalBus.publish(topic, data, {
        source,
        metadata: { ...metadata, priority },
      });
    },

    /**
     * Get the source identifier
     */
    getSource: (): TSource => source,
  };
}

// ============================================================================
// Component Signal Helpers
// ============================================================================

/**
 * Creates a signal emitter bound to a specific component.
 * Automatically includes component name and optional instance ID in signals.
 *
 * @param componentName - The component name
 * @param instanceId - Optional unique instance identifier
 * @returns Bound signal emitter
 *
 * @example
 * ```typescript
 * const emit = createComponentSignalEmitter('Modal', 'modal-123');
 *
 * emit.modalOpen({ modalId: 'modal-123', title: 'Confirm' });
 * emit.modalClose('closeButton');
 * ```
 */
export function createComponentSignalEmitter(
  componentName: string,
  instanceId?: string
) {
  const source = instanceId ? `${componentName}:${instanceId}` : componentName;

  return {
    source,
    instanceId,

    // Lifecycle signals
    mount: (props?: Record<string, unknown>) =>
      SignalBus.publish<MountSignalPayload>(
        'lifecycle:component:mount' as SignalTopic,
        { component: componentName, instanceId, props, timestamp: Date.now() },
        { source }
      ),

    unmount: (reason?: string) =>
      SignalBus.publish<UnmountSignalPayload>(
        'lifecycle:component:unmount' as SignalTopic,
        { component: componentName, instanceId, reason, timestamp: Date.now() },
        { source }
      ),

    // Click signal
    click: (elementType: string, options?: Partial<ClickSignalPayload>) =>
      SignalBus.publish<ClickSignalPayload>('ui:button:click' as SignalTopic, {
        elementType,
        elementId: instanceId,
        timestamp: Date.now(),
        ...options,
      }, { source }),

    // Focus signals
    focus: (elementType: string) =>
      SignalBus.publish<FocusSignalPayload>('ui:element:focus' as SignalTopic, {
        elementType,
        elementId: instanceId,
        focused: true,
        timestamp: Date.now(),
      }, { source }),

    blur: (elementType: string, previousElementId?: string) =>
      SignalBus.publish<FocusSignalPayload>('ui:element:blur' as SignalTopic, {
        elementType,
        elementId: instanceId,
        focused: false,
        previousElementId,
        timestamp: Date.now(),
      }, { source }),

    // Hover signals
    hover: (elementType: string) =>
      SignalBus.publish<HoverSignalPayload>('ui:element:hover' as SignalTopic, {
        elementType,
        elementId: instanceId,
        hovered: true,
        timestamp: Date.now(),
      }, { source }),

    unhover: (elementType: string, duration?: number) =>
      SignalBus.publish<HoverSignalPayload>('ui:element:unhover' as SignalTopic, {
        elementType,
        elementId: instanceId,
        hovered: false,
        duration,
        timestamp: Date.now(),
      }, { source }),

    // Modal signals
    modalOpen: (data: Omit<ModalOpenSignalPayload, 'timestamp'>) =>
      SignalBus.publish<ModalOpenSignalPayload>('ui:modal:open' as SignalTopic, {
        ...data,
        timestamp: Date.now(),
      }, { source }),

    modalClose: (reason: ModalCloseSignalPayload['reason']) =>
      SignalBus.publish<ModalCloseSignalPayload>('ui:modal:close' as SignalTopic, {
        modalId: instanceId ?? 'modal',
        reason,
        timestamp: Date.now(),
      }, { source }),

    // Toast signals
    toastShow: (data: Omit<ToastShowSignalPayload, 'timestamp'>) =>
      SignalBus.publish<ToastShowSignalPayload>('ui:toast:show' as SignalTopic, {
        ...data,
        timestamp: Date.now(),
      }, { source }),

    toastDismiss: (data: Omit<ToastDismissSignalPayload, 'timestamp'>) =>
      SignalBus.publish<ToastDismissSignalPayload>('ui:toast:dismiss' as SignalTopic, {
        ...data,
        timestamp: Date.now(),
      }, { source }),

    // Error signal
    error: (data: Omit<ErrorSignalPayload, 'timestamp'>) =>
      SignalBus.publish<ErrorSignalPayload>('error:application:occurred' as SignalTopic, {
        ...data,
        component: componentName,
        timestamp: Date.now(),
      }, { source }),

    // Generic emit for custom signals
    emit: <T>(topic: SignalTopic, data: T, metadata?: SignalMetadata) =>
      SignalBus.publish(topic, data, { source, metadata }),
  };
}

// ============================================================================
// Form Signal Helpers
// ============================================================================

/**
 * Creates a signal emitter for form-related signals.
 *
 * @param formId - The form identifier
 * @returns Form signal emitter
 *
 * @example
 * ```typescript
 * const formSignals = createFormSignalEmitter('login-form');
 *
 * formSignals.input('email', 'user@example.com');
 * formSignals.submit({ email: 'user@example.com', password: '...' });
 * ```
 */
export function createFormSignalEmitter(formId: string) {
  const source = `Form:${formId}`;

  return {
    formId,
    source,

    input: (
      fieldName: string,
      value: unknown,
      options?: {
        previousValue?: unknown;
        valid?: boolean;
        errors?: string[];
      }
    ) =>
      SignalBus.publish<FormInputSignalPayload>('form:field:input' as SignalTopic, {
        formId,
        fieldName,
        value,
        previousValue: options?.previousValue,
        valid: options?.valid,
        errors: options?.errors,
        timestamp: Date.now(),
      }, { source }),

    change: (
      changedFields: Record<string, unknown>,
      valid?: boolean
    ) =>
      SignalBus.publish<FormChangeSignalPayload>('form:field:change' as SignalTopic, {
        formId,
        changedFields,
        valid,
        timestamp: Date.now(),
      }, { source }),

    submit: (
      data: Record<string, unknown>,
      options?: {
        valid?: boolean;
        errors?: Record<string, string[]>;
        method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      }
    ) =>
      SignalBus.publish<FormSubmitSignalPayload>('form:document:submit' as SignalTopic, {
        formId,
        data,
        valid: options?.valid ?? true,
        errors: options?.errors,
        method: options?.method,
        timestamp: Date.now(),
      }, { source }),

    validate: (
      valid: boolean,
      errors: Record<string, string[]>,
      fieldName?: string
    ) =>
      SignalBus.publish('form:document:validate' as SignalTopic, {
        formId,
        fieldName,
        valid,
        errors,
        timestamp: Date.now(),
      }, { source }),

    reset: () =>
      SignalBus.publish('form:document:reset' as SignalTopic, {
        formId,
        timestamp: Date.now(),
      }, { source }),
  };
}

// ============================================================================
// Table Signal Helpers
// ============================================================================

/**
 * Creates a signal emitter for table-related signals.
 *
 * @param tableId - The table identifier
 * @returns Table signal emitter
 *
 * @example
 * ```typescript
 * const tableSignals = createTableSignalEmitter('trades-table');
 *
 * tableSignals.rowSelect('row-1', true, 1, tradeData);
 * tableSignals.sortChange('symbol', 'asc');
 * tableSignals.pageChange(2, 10, 100, 10);
 * ```
 */
export function createTableSignalEmitter(tableId: string) {
  const source = `DataTable:${tableId}`;

  return {
    tableId,
    source,

    rowSelect: <T extends Record<string, unknown>>(
      rowId: string | number,
      selected: boolean,
      selectedCount: number,
      rowData?: T
    ) =>
      SignalBus.publish<TableRowSelectSignalPayload>('ui:table:row:select' as SignalTopic, {
        tableId,
        rowId,
        selected,
        selectedCount,
        rowData,
        timestamp: Date.now(),
      }, { source }),

    sortChange: (columnId: string, direction: 'asc' | 'desc' | null) =>
      SignalBus.publish<TableSortChangeSignalPayload>('ui:table:sort:change' as SignalTopic, {
        tableId,
        columnId,
        direction,
        timestamp: Date.now(),
      }, { source }),

    pageChange: (page: number, pageSize: number, totalItems: number, totalPages: number) =>
      SignalBus.publish<TablePageChangeSignalPayload>('ui:table:page:change' as SignalTopic, {
        tableId,
        page,
        pageSize,
        totalItems,
        totalPages,
        timestamp: Date.now(),
      }, { source }),

    filterChange: (
      value: string,
      options?: {
        columnId?: string;
        operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith';
      }
    ) =>
      SignalBus.publish('ui:table:filter:change' as SignalTopic, {
        tableId,
        columnId: options?.columnId,
        value,
        operator: options?.operator,
        timestamp: Date.now(),
      }, { source }),
  };
}

// ============================================================================
// Navigation Signal Helpers
// ============================================================================

/**
 * Creates a signal emitter for navigation-related signals.
 *
 * @returns Navigation signal emitter
 *
 * @example
 * ```typescript
 * const navSignals = createNavigationSignalEmitter();
 *
 * navSignals.navigate('/dashboard', '/home');
 * navSignals.sidebarToggle(true, false);
 * ```
 */
export function createNavigationSignalEmitter() {
  const source = 'Navigation';

  return {
    source,

    navigate: (
      destination: string,
      previous?: string,
      options?: {
        type?: 'push' | 'replace' | 'pop' | 'external';
        params?: Record<string, string>;
        query?: Record<string, string>;
      }
    ) =>
      SignalBus.publish<NavigationSignalPayload>('nav:navigate:route' as SignalTopic, {
        destination,
        previous,
        type: options?.type ?? 'push',
        params: options?.params,
        query: options?.query,
        timestamp: Date.now(),
      }, { source }),

    back: (destination?: string, previous?: string) =>
      SignalBus.publish<NavigationSignalPayload>('nav:back' as SignalTopic, {
        destination: destination ?? '',
        previous,
        type: 'pop',
        timestamp: Date.now(),
      }, { source }),

    forward: (destination: string, previous?: string) =>
      SignalBus.publish<NavigationSignalPayload>('nav:forward' as SignalTopic, {
        destination,
        previous,
        type: 'push',
        timestamp: Date.now(),
      }, { source }),

    sidebarToggle: (collapsed: boolean, previousState: boolean, sidebarId?: string) =>
      SignalBus.publish('nav:sidebar:toggle' as SignalTopic, {
        sidebarId,
        collapsed,
        previousState,
        timestamp: Date.now(),
      }, { source }),

    sidebarItem: (
      itemId: string,
      action: 'click' | 'expand' | 'collapse',
      options?: { sidebarId?: string; label?: string }
    ) =>
      SignalBus.publish('nav:sidebar:item' as SignalTopic, {
        sidebarId: options?.sidebarId,
        itemId,
        label: options?.label,
        action,
        timestamp: Date.now(),
      }, { source }),

    sidebarSearch: (query: string, resultsCount?: number, sidebarId?: string) =>
      SignalBus.publish('nav:sidebar:search' as SignalTopic, {
        sidebarId,
        query,
        resultsCount,
        timestamp: Date.now(),
      }, { source }),
  };
}

// ============================================================================
// Chat Signal Helpers
// ============================================================================

/**
 * Creates a signal emitter for chat-related signals.
 *
 * @param chatId - The chat/conversation identifier
 * @returns Chat signal emitter
 *
 * @example
 * ```typescript
 * const chatSignals = createChatSignalEmitter('trade-chat');
 *
 * chatSignals.send('Hello!', attachments);
 * chatSignals.typing(true);
 * ```
 */
export function createChatSignalEmitter(chatId: string) {
  const source = `Chat:${chatId}`;

  return {
    chatId,
    source,

    send: (
      message: string,
      attachments?: ChatMessageSendSignalPayload['attachments']
    ) =>
      SignalBus.publish<ChatMessageSendSignalPayload>(`chat:${chatId}:send` as SignalTopic, {
        chatId,
        message,
        attachments,
        timestamp: Date.now(),
      }, { source }),

    receive: (
      messageId: string,
      message: string,
      options?: {
        senderId?: string;
        senderType?: 'user' | 'ai' | 'system';
      }
    ) =>
      SignalBus.publish(`chat:${chatId}:receive` as SignalTopic, {
        chatId,
        messageId,
        message,
        senderId: options?.senderId,
        senderType: options?.senderType,
        timestamp: Date.now(),
      }, { source }),

    typing: (isTyping: boolean) =>
      SignalBus.publish(`chat:${chatId}:typing` as SignalTopic, {
        chatId,
        isTyping,
        timestamp: Date.now(),
      }, { source }),
  };
}

// ============================================================================
// Trade Signal Helpers
// ============================================================================

/**
 * Creates a signal emitter for trade-related signals.
 *
 * @param symbol - The trading symbol
 * @returns Trade signal emitter
 *
 * @example
 * ```typescript
 * const tradeSignals = createTradeSignalEmitter('BTC-USD');
 *
 * tradeSignals.propose('BUY', 0.5, { confidence: 0.92 });
 * tradeSignals.approve('trade-123');
 * ```
 */
export function createTradeSignalEmitter(symbol: string) {
  const source = `Trade:${symbol}`;

  return {
    symbol,
    source,

    propose: (
      action: 'BUY' | 'SELL',
      quantity: number,
      options?: {
        tradeId?: string;
        price?: number;
        confidence?: number;
      }
    ) =>
      SignalBus.publish<TradeProposeSignalPayload>(`trade:${symbol}:propose` as SignalTopic, {
        symbol,
        action,
        quantity,
        tradeId: options?.tradeId,
        price: options?.price,
        confidence: options?.confidence,
        timestamp: Date.now(),
      }, { source }),

    approve: (tradeId: string, approverId?: string) =>
      SignalBus.publish(`trade:${symbol}:approve` as SignalTopic, {
        tradeId,
        approverId,
        timestamp: Date.now(),
      }, { source }),

    reject: (tradeId: string, reason?: string, rejectorId?: string) =>
      SignalBus.publish(`trade:${symbol}:reject` as SignalTopic, {
        tradeId,
        reason,
        rejectorId,
        timestamp: Date.now(),
      }, { source }),

    execute: (
      tradeId: string,
      executionPrice: number,
      status: 'filled' | 'partial' | 'failed'
    ) =>
      SignalBus.publish(`trade:${symbol}:execute` as SignalTopic, {
        tradeId,
        executionPrice,
        status,
        timestamp: Date.now(),
      }, { source }),
  };
}

// ============================================================================
// Signal Batching Utilities
// ============================================================================

/**
 * Batched signal emitter that collects signals and emits them in batches.
 * Useful for high-frequency signals that should be processed together.
 *
 * @param options - Batching configuration
 * @returns Batched signal emitter
 *
 * @example
 * ```typescript
 * const batcher = createSignalBatcher({ batchWindow: 100, maxBatchSize: 50 });
 *
 * // Add signals to batch
 * batcher.add('ui:table:row:select', { rowId: '1', selected: true });
 * batcher.add('ui:table:row:select', { rowId: '2', selected: true });
 *
 * // Flush manually or wait for batch window
 * batcher.flush();
 * ```
 */
export function createSignalBatcher(options?: {
  /** Time window in ms to collect signals before flushing (default: 100) */
  batchWindow?: number;
  /** Maximum signals per batch before auto-flush (default: 50) */
  maxBatchSize?: number;
  /** Callback when batch is flushed */
  onFlush?: (signals: Array<{ topic: SignalTopic; payload: SignalPayload }>) => void;
}) {
  const batchWindow = options?.batchWindow ?? 100;
  const maxBatchSize = options?.maxBatchSize ?? 50;
  const onFlush = options?.onFlush;

  let batch: Array<{ topic: SignalTopic; payload: SignalPayload }> = [];
  let flushTimeout: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (batch.length === 0) return;

    const signalsToEmit = [...batch];
    batch = [];

    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }

    // Call custom handler or emit each signal
    if (onFlush) {
      onFlush(signalsToEmit);
    } else {
      signalsToEmit.forEach(({ topic, payload }) => {
        SignalBus.publish(topic, payload.data, {
          source: payload.source,
          metadata: { ...payload.metadata, batched: true },
        });
      });
    }
  };

  const scheduleFlush = () => {
    if (flushTimeout) return;
    flushTimeout = setTimeout(flush, batchWindow);
  };

  return {
    add: <T>(topic: SignalTopic, data: T, options?: { source?: string; metadata?: SignalMetadata }) => {
      batch.push({
        topic,
        payload: {
          source: options?.source ?? 'batcher',
          timestamp: Date.now(),
          data,
          metadata: options?.metadata,
        },
      });

      if (batch.length >= maxBatchSize) {
        flush();
      } else {
        scheduleFlush();
      }
    },

    flush,

    clear: () => {
      batch = [];
      if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
      }
    },

    size: () => batch.length,

    pending: () => flushTimeout !== null,
  };
}

// ============================================================================
// Signal Debouncing Utilities
// ============================================================================

/**
 * Creates a debounced signal emitter.
 * Useful for signals that fire rapidly (e.g., typing, scrolling).
 *
 * @param topic - The signal topic to emit
 * @param wait - Debounce wait time in ms
 * @param options - Debounce options
 * @returns Debounced signal emitter
 *
 * @example
 * ```typescript
 * const debouncedSearch = createDebouncedSignal('ui:search:query', 300);
 *
 * // Rapid calls will only emit once after 300ms
 * debouncedSearch.emit({ query: 'a' });
 * debouncedSearch.emit({ query: 'ab' });
 * debouncedSearch.emit({ query: 'abc' }); // Only this one is emitted
 * ```
 */
export function createDebouncedSignal<T>(
  topic: SignalTopic,
  wait: number,
  options?: {
    source?: string;
    leading?: boolean;
    maxWait?: number;
  }
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastData: T | null = null;

  const emit = (data: T) => {
    lastData = data;
    lastCallTime = Date.now();

    if (options?.leading && !timeoutId) {
      SignalBus.publish(topic, data, { source: options?.source ?? 'debounced' });
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (lastData !== null && !options?.leading) {
        SignalBus.publish(topic, lastData, { source: options?.source ?? 'debounced' });
      }
      timeoutId = null;
    }, wait);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastData = null;
  };

  const flush = () => {
    if (timeoutId && lastData !== null) {
      SignalBus.publish(topic, lastData, { source: options?.source ?? 'debounced' });
      cancel();
    }
  };

  return { emit, cancel, flush };
}

// ============================================================================
// Signal Throttling Utilities
// ============================================================================

/**
 * Creates a throttled signal emitter.
 * Useful for signals that should not fire more than once per time period.
 *
 * @param topic - The signal topic to emit
 * @param limit - Minimum time between signals in ms
 * @param options - Throttle options
 * @returns Throttled signal emitter
 *
 * @example
 * ```typescript
 * const throttledScroll = createThrottledSignal('ui:scroll:position', 100);
 *
 * // Will only emit at most once every 100ms
 * throttledScroll.emit({ scrollTop: 100 });
 * ```
 */
export function createThrottledSignal<T>(
  topic: SignalTopic,
  limit: number,
  options?: {
    source?: string;
    leading?: boolean;
    trailing?: boolean;
  }
) {
  let lastEmitTime = 0;
  let lastData: T | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const emit = (data: T) => {
    const now = Date.now();
    const timeSinceLastEmit = now - lastEmitTime;

    lastData = data;

    if (timeSinceLastEmit >= limit) {
      lastEmitTime = now;
      SignalBus.publish(topic, data, { source: options?.source ?? 'throttled' });
    } else if (options?.trailing && !timeoutId) {
      timeoutId = setTimeout(() => {
        if (lastData !== null) {
          SignalBus.publish(topic, lastData, { source: options?.source ?? 'throttled' });
        }
        timeoutId = null;
      }, limit - timeSinceLastEmit);
    }
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastData = null;
  };

  return { emit, cancel };
}

// ============================================================================
// Signal Aggregation Utilities
// ============================================================================

/**
 * Aggregates multiple signals into a single subscription.
 * Useful for listening to multiple related signals with one handler.
 *
 * @param topics - Array of topics to subscribe to
 * @param handler - Handler function called for any of the topics
 * @returns Subscription handle
 *
 * @example
 * ```typescript
 * const subscription = aggregateSignals(
 *   ['ui:modal:open', 'ui:drawer:open', 'ui:dialog:open'],
 *   (payload, topic) => {
 *     console.log(`${topic} fired:`, payload);
 *   }
 * );
 *
 * subscription.unsubscribe();
 * ```
 */
export function aggregateSignals<T = unknown>(
  topics: SignalTopic[],
  handler: (payload: SignalPayload<T>, topic: SignalTopic) => void
): SignalSubscription & { unsubscribeAll: () => void } {
  const subscriptions: SignalSubscription[] = topics.map((topic) =>
    SignalBus.subscribe<T>(topic, (payload) => handler(payload, topic))
  );

  return {
    topic: topics[0] ?? ('aggregate' as SignalTopic),
    active: true,
    unsubscribe: () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    },
    unsubscribeAll: () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    },
  };
}

// ============================================================================
// Signal History Utilities
// ============================================================================

/**
 * Creates a signal history tracker.
 * Useful for debugging and replaying signal sequences.
 *
 * @param options - History configuration
 * @returns Signal history tracker
 *
 * @example
 * ```typescript
 * const history = createSignalHistory({ maxSize: 100 });
 *
 * // Start tracking
 * history.start(['ui:button:click', 'ui:modal:open']);
 *
 * // Later, get history
 * const signals = history.getHistory();
 * console.log(signals);
 *
 * history.stop();
 * ```
 */
export function createSignalHistory(options?: {
  maxSize?: number;
  topics?: SignalTopic[];
}) {
  const maxSize = options?.maxSize ?? 100;
  const topics = options?.topics;
  const history: Array<{ topic: SignalTopic; payload: SignalPayload; receivedAt: number }> = [];
  let subscriptions: SignalSubscription[] = [];

  const handler = <T>(topic: SignalTopic, payload: SignalPayload<T>) => {
    history.push({
      topic,
      payload,
      receivedAt: Date.now(),
    });

    if (history.length > maxSize) {
      history.shift();
    }
  };

  return {
    start: (specificTopics?: SignalTopic[]) => {
      const topicsToTrack = specificTopics ?? topics;
      if (!topicsToTrack) {
        console.warn('SignalHistory: No topics specified. Call start() with topics.');
        return;
      }

      subscriptions = topicsToTrack.map((topic) =>
        SignalBus.subscribe(topic, (payload) => handler(topic, payload))
      );
    },

    stop: () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
      subscriptions = [];
    },

    getHistory: () => [...history],

    clear: () => {
      history.length = 0;
    },

    size: () => history.length,

    getLast: (topic?: SignalTopic) => {
      if (topic) {
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].topic === topic) {
            return history[i];
          }
        }
        return null;
      }
      return history[history.length - 1] ?? null;
    },

    getByTopic: (topic: SignalTopic) =>
      history.filter((entry) => entry.topic === topic),
  };
}

// ============================================================================
// Signal Filter Utilities
// ============================================================================

/**
 * Creates a filtered signal subscription.
 * Only emits when the filter function returns true.
 *
 * @param topic - Topic to subscribe to
 * @param handler - Handler function
 * @param filter - Filter function
 * @returns Subscription handle
 *
 * @example
 * ```typescript
 * const subscription = createFilteredSignal(
 *   'trade:BTC-USD:propose',
 *   (payload) => console.log('High confidence trade:', payload),
 *   (payload) => payload.data.confidence && payload.data.confidence > 0.9
 * );
 * ```
 */
export function createFilteredSignal<T = unknown>(
  topic: SignalTopic,
  handler: SignalHandler<T>,
  filter: (payload: SignalPayload<T>) => boolean
): SignalSubscription {
  return SignalBus.subscribe<T>(topic, (payload) => {
    if (filter(payload)) {
      handler(payload);
    }
  });
}

// ============================================================================
// Signal Transform Utilities
// ============================================================================

/**
 * Creates a transformed signal subscription.
 * Transforms the payload before passing to the handler.
 *
 * @param topic - Topic to subscribe to
 * @param handler - Handler function
 * @param transform - Transform function
 * @returns Subscription handle
 *
 * @example
 * ```typescript
 * const subscription = createTransformedSignal(
 *   'ui:table:row:select',
 *   (payload) => console.log('Row ID:', payload),
 *   (payload) => ({ rowId: payload.data.rowId, timestamp: payload.timestamp })
 * );
 * ```
 */
export function createTransformedSignal<T = unknown, R = unknown>(
  topic: SignalTopic,
  handler: (transformed: R, original: SignalPayload<T>) => void,
  transform: (payload: SignalPayload<T>) => R
): SignalSubscription {
  return SignalBus.subscribe<T>(topic, (payload) => {
    const transformed = transform(payload);
    handler(transformed, payload);
  });
}

// ============================================================================
// Export All Utilities
// ============================================================================

export {
  createTypedEmitter,
  createComponentSignalEmitter,
  createFormSignalEmitter,
  createTableSignalEmitter,
  createNavigationSignalEmitter,
  createChatSignalEmitter,
  createTradeSignalEmitter,
  createSignalBatcher,
  createDebouncedSignal,
  createThrottledSignal,
  aggregateSignals,
  createSignalHistory,
  createFilteredSignal,
  createTransformedSignal,
};
