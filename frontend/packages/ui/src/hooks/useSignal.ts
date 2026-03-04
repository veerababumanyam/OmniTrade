/**
 * useSignal Hook for OmniTrade GenUI
 *
 * React hooks for subscribing to and emitting signals from components.
 * Provides seamless integration between React lifecycle and SignalBus.
 *
 * @example
 * ```tsx
 * // Subscribe to signals
 * function TradeMonitor() {
 *   const [lastTrade, setLastTrade] = useState(null);
 *
 *   useSignal<{ symbol: string; action: string }>(
 *     'trade:BTC-USD:execute',
 *     (payload) => setLastTrade(payload.data)
 *   );
 *
 *   return <div>Last trade: {lastTrade?.action}</div>;
 * }
 *
 * // Emit signals
 * function TradeButton({ symbol }) {
 *   const emit = useSignalEmitter();
 *
 *   const handleClick = () => {
 *     emit('trade:BTC-USD:propose', { symbol, quantity: 1 });
 *   };
 *
 *   return <button onClick={handleClick}>Trade</button>;
 * }
 * ```
 */

import { useEffect, useCallback, useRef, useDebugValue } from 'react';
import { SignalBus } from '../signal-bus';
import type { SignalTopic, SignalPayload, SignalHandler, SignalMetadata } from '../signal-bus';

export type { SignalTopic, SignalPayload, SignalHandler, SignalMetadata };

/**
 * Hook for subscribing to a signal topic.
 *
 * Automatically handles subscription lifecycle - subscribes on mount,
 * unsubscribes on unmount. Re-subscribes if the topic or handler changes.
 *
 * @param topic - The signal topic to subscribe to
 * @param handler - Handler function called when signal is received
 * @param deps - Optional dependency array for handler stabilization
 *
 * @example
 * ```tsx
 * function PriceAlert() {
 *   const [alert, setAlert] = useState(null);
 *
 *   useSignal<{ price: number; threshold: number }>(
 *     'trade:BTC-USD:execute',
 *     (payload) => {
 *       if (payload.data.price > payload.data.threshold) {
 *         setAlert(payload.data);
 *       }
 *     },
 *     [] // Empty deps - handler is stable
 *   );
 *
 *   return alert && <div className="alert">Price alert triggered!</div>;
 * }
 * ```
 */
export function useSignal<T = unknown>(
  topic: SignalTopic,
  handler: SignalHandler<T>,
  deps: React.DependencyList = []
): void {
  // Store handler in ref to avoid re-subscription on handler changes
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const subscription = SignalBus.subscribe<T>(topic, (payload) => {
      handlerRef.current(payload);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, ...deps]);

  // Debug value for React DevTools
  useDebugValue(topic);
}

/**
 * Options for useSignalOnce hook.
 */
export interface UseSignalOnceOptions {
  /** Whether to automatically reset after signal is received */
  autoReset?: boolean;
  /** Reset delay in milliseconds (if autoReset is true) */
  resetDelay?: number;
}

/**
 * Hook for subscribing to a signal and capturing the first occurrence.
 *
 * @param topic - The signal topic to subscribe to
 * @param deps - Dependency array for re-subscription
 * @param options - Options for auto-reset behavior
 * @returns The first signal payload received, or null if none yet
 *
 * @example
 * ```tsx
 * function TradeConfirmation() {
 *   const confirmation = useSignalOnce<{ tradeId: string }>('trade:*:approve');
 *
 *   if (!confirmation) {
 *     return <div>Waiting for approval...</div>;
 *   }
 *
 *   return <div>Trade {confirmation.data.tradeId} approved!</div>;
 * }
 * ```
 */
export function useSignalOnce<T = unknown>(
  topic: SignalTopic,
  deps: React.DependencyList = [],
  options: UseSignalOnceOptions = {}
): SignalPayload<T> | null {
  const { autoReset = false, resetDelay = 0 } = options;

  // Use a ref to store the payload to avoid re-renders during subscription
  const payloadRef = useRef<SignalPayload<T> | null>(null);
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    payloadRef.current = null;

    const subscription = SignalBus.subscribe<T>(topic, (payload) => {
      payloadRef.current = payload;
      forceUpdate();

      if (autoReset && resetDelay > 0) {
        setTimeout(() => {
          payloadRef.current = null;
          forceUpdate();
        }, resetDelay);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, autoReset, resetDelay, ...deps]);

  useDebugValue(payloadRef.current?.data);

  return payloadRef.current;
}

// Import useReducer for useSignalOnce
import { useReducer } from 'react';

/**
 * Hook for emitting signals.
 *
 * Returns a stable emit function that can be used to publish signals.
 * The function reference is stable across re-renders.
 *
 * @param defaultSource - Optional default source identifier for emitted signals
 * @returns Emit function for publishing signals
 *
 * @example
 * ```tsx
 * function TradeButton({ symbol, quantity }) {
 *   const emit = useSignalEmitter('TradeButton');
 *
 *   const handlePropose = () => {
 *     emit('trade:BTC-USD:propose', { symbol, quantity });
 *   };
 *
 *   const handleApprove = () => {
 *     emit('trade:BTC-USD:approve', { symbol }, { confidence: 0.95 });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handlePropose}>Propose Trade</button>
 *       <button onClick={handleApprove}>Approve</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSignalEmitter(defaultSource?: string): {
  /**
   * Emit a signal to the given topic.
   *
   * @param topic - Signal topic to publish to
   * @param data - Data payload
   * @param metadata - Optional metadata (will be merged with source)
   */
  <T>(topic: SignalTopic, data: T, metadata?: SignalMetadata): boolean;

  /**
   * Emit an AI-generated signal with confidence.
   *
   * @param topic - Signal topic to publish to
   * @param data - Data payload
   * @param confidence - AI confidence score (0-1)
   * @param metadata - Optional additional metadata
   */
  emitAI: <T>(
    topic: SignalTopic,
    data: T,
    confidence: number,
    metadata?: Omit<SignalMetadata, 'aiGenerated' | 'confidence'>
  ) => boolean;
} {
  const sourceRef = useRef(defaultSource ?? 'unknown');

  // Update source if defaultSource changes
  useEffect(() => {
    if (defaultSource) {
      sourceRef.current = defaultSource;
    }
  }, [defaultSource]);

  const emit = useCallback(
    <T,>(topic: SignalTopic, data: T, metadata?: SignalMetadata): boolean => {
      return SignalBus.publish(topic, data, {
        source: sourceRef.current,
        metadata,
      });
    },
    []
  );

  const emitAI = useCallback(
    <T,>(
      topic: SignalTopic,
      data: T,
      confidence: number,
      metadata?: Omit<SignalMetadata, 'aiGenerated' | 'confidence'>
    ): boolean => {
      return SignalBus.publishAI(topic, data, {
        source: sourceRef.current,
        confidence,
        metadata,
      });
    },
    []
  );

  // Attach emitAI to the emit function
  const emitter = emit as typeof emit & { emitAI: typeof emitAI };
  emitter.emitAI = emitAI;

  useDebugValue(sourceRef.current);

  return emitter;
}

/**
 * Hook for subscribing to multiple signal topics with a single handler.
 *
 * @param topics - Array of signal topics to subscribe to
 * @param handler - Handler function called when any signal is received
 * @param deps - Optional dependency array for handler stabilization
 *
 * @example
 * ```tsx
 * function TradeListener() {
 *   useSignals(
 *     ['trade:BTC-USD:propose', 'trade:BTC-USD:approve', 'trade:BTC-USD:reject'],
 *     (payload, topic) => {
 *       console.log(`Signal ${topic} received:`, payload.data);
 *     }
 *   );
 * }
 * ```
 */
export function useSignals<T = unknown>(
  topics: SignalTopic[],
  handler: (payload: SignalPayload<T>, topic: SignalTopic) => void,
  deps: React.DependencyList = []
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const subscriptions = topics.map((topic) =>
      SignalBus.subscribe<T>(topic, (payload) => {
        handlerRef.current(payload, topic);
      })
    );

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics.join(','), ...deps]);

  useDebugValue(topics);
}

/**
 * Hook for tracking signal bus statistics.
 *
 * @returns Current signal bus statistics
 *
 * @example
 * ```tsx
 * function DebugPanel() {
 *   const stats = useSignalStats();
 *
 *   return (
 *     <div>
 *       <p>Total signals: {stats.totalPublished}</p>
 *       <p>Subscriptions: {stats.totalSubscriptions}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSignalStats() {
  const [stats, setStats] = useState(SignalBus.getStats());

  useEffect(() => {
    // Update stats periodically
    const interval = setInterval(() => {
      setStats(SignalBus.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

// Import useState for useSignalStats
import { useState } from 'react';

/**
 * Hook for creating a bounded signal emitter.
 *
 * Creates an emitter that is pre-configured with a topic prefix.
 * Useful for components that emit multiple related signals.
 *
 * @param topicPrefix - Prefix to prepend to all topics
 * @param source - Source identifier for emitted signals
 * @returns Object with emit function and topic builder
 *
 * @example
 * ```tsx
 * function TradeCard({ tradeId }) {
 *   const { emit, topic } = useBoundSignalEmitter(`trade:${tradeId}`);
 *
 *   return (
 *     <div>
 *       <button onClick={() => emit('approve', { approved: true })}>
 *         Approve
 *       </button>
 *       <button onClick={() => emit('reject', { reason: 'cancelled' })}>
 *         Reject
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBoundSignalEmitter(topicPrefix: string, source?: string): {
  /** Emit a signal with the topic prefix applied */
  emit: <T>(action: string, data: T, metadata?: SignalMetadata) => boolean;
  /** Build a full topic from an action */
  topic: (action: string) => SignalTopic;
  /** Emit an AI-generated signal */
  emitAI: <T>(
    action: string,
    data: T,
    confidence: number,
    metadata?: Omit<SignalMetadata, 'aiGenerated' | 'confidence'>
  ) => boolean;
} {
  const defaultEmitter = useSignalEmitter(source);

  const topic = useCallback(
    (action: string): SignalTopic => {
      return `${topicPrefix}:${action}` as SignalTopic;
    },
    [topicPrefix]
  );

  const emit = useCallback(
    <T,>(action: string, data: T, metadata?: SignalMetadata): boolean => {
      return defaultEmitter(topic(action), data, metadata);
    },
    [defaultEmitter, topic]
  );

  const emitAI = useCallback(
    <T,>(
      action: string,
      data: T,
      confidence: number,
      metadata?: Omit<SignalMetadata, 'aiGenerated' | 'confidence'>
    ): boolean => {
      return defaultEmitter.emitAI(topic(action), data, confidence, metadata);
    },
    [defaultEmitter, topic]
  );

  return { emit, topic, emitAI };
}

/**
 * Hook for conditional signal subscription.
 *
 * Only subscribes when the condition is true, useful for performance
 * optimization and avoiding unnecessary subscriptions.
 *
 * @param topic - The signal topic to subscribe to
 * @param handler - Handler function called when signal is received
 * @param condition - Whether to subscribe (default: true)
 * @param deps - Optional dependency array
 *
 * @example
 * ```tsx
 * function ActiveTradeMonitor({ isActive, tradeId }) {
 *   useSignalWhen(
 *     `trade:${tradeId}:execute`,
 *     handleExecution,
 *     isActive // Only subscribe when this trade is active
 *   );
 * }
 * ```
 */
export function useSignalWhen<T = unknown>(
  topic: SignalTopic,
  handler: SignalHandler<T>,
  condition: boolean = true,
  deps: React.DependencyList = []
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!condition) return;

    const subscription = SignalBus.subscribe<T>(topic, (payload) => {
      handlerRef.current(payload);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, condition, ...deps]);

  useDebugValue(condition ? topic : null);
}

export default useSignal;
