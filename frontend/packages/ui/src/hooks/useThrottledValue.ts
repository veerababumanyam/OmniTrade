/**
 * useThrottledValue - Throttle any value for high-frequency updates
 *
 * Returns a throttled value that updates at most once per specified interval.
 * Useful for scroll events, mouse movements, and other high-frequency updates.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Options for the useThrottledValue hook.
 */
export interface UseThrottledValueOptions {
  /** Throttle interval in milliseconds (default: 100) */
  interval?: number;
  /** Whether to update immediately on the first change (default: true) */
  leading?: boolean;
  /** Whether to update with the last value after the interval (default: true) */
  trailing?: boolean;
}

/**
 * Return type for useThrottledValue hook.
 */
export interface UseThrottledValueReturn<T> {
  /** The throttled value */
  throttledValue: T;
  /** Whether the value is currently being throttled */
  isPending: boolean;
  /** Function to immediately flush the pending value */
  flush: () => void;
  /** Function to cancel the pending update */
  cancel: () => void;
}

/**
 * Throttles a value with configurable options.
 *
 * @param value - The value to throttle
 * @param options - Configuration options
 * @returns Object containing throttled value and control functions
 *
 * @example
 * // Throttle scroll position updates
 * const { throttledValue } = useThrottledValue(scrollY, { interval: 100 });
 *
 * useEffect(() => {
 *   // Updates at most every 100ms
 *   updateScrollIndicator(throttledValue);
 * }, [throttledValue]);
 *
 * @example
 * // With trailing disabled (discard values during throttle period)
 * const { throttledValue } = useThrottledValue(mousePosition, {
 *   interval: 50,
 *   trailing: false, // Don't update with the last value
 * });
 */
export function useThrottledValue<T>(
  value: T,
  options: UseThrottledValueOptions = {}
): UseThrottledValueReturn<T> {
  const {
    interval = 100,
    leading = true,
    trailing = true,
  } = options;

  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [isPending, setIsPending] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExecTimeRef = useRef<number>(0);
  const pendingValueRef = useRef<T>(value);
  const valueRef = useRef(value);

  // Keep value ref updated
  useEffect(() => {
    valueRef.current = value;
    pendingValueRef.current = value;
  }, [value]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPending(false);
  }, []);

  // Flush function - immediately apply pending value
  const flush = useCallback(() => {
    cleanup();
    setThrottledValue(pendingValueRef.current);
    lastExecTimeRef.current = Date.now();
  }, [cleanup]);

  // Cancel function - discard pending update
  const cancel = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Main throttle effect
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExec = now - lastExecTimeRef.current;
    const canExecute = timeSinceLastExec >= interval;

    // Leading edge: execute immediately if allowed
    if (leading && canExecute && lastExecTimeRef.current === 0) {
      setThrottledValue(value);
      lastExecTimeRef.current = now;
      return;
    }

    // If we can execute (enough time has passed)
    if (canExecute) {
      setThrottledValue(value);
      lastExecTimeRef.current = now;
      setIsPending(false);
    } else {
      // We're in the throttle period
      setIsPending(true);
      pendingValueRef.current = value;

      // Set up trailing execution
      if (trailing && !timeoutRef.current) {
        const remainingTime = interval - timeSinceLastExec;
        timeoutRef.current = setTimeout(() => {
          setThrottledValue(pendingValueRef.current);
          lastExecTimeRef.current = Date.now();
          timeoutRef.current = null;
          setIsPending(false);
        }, remainingTime);
      }
    }

    return cleanup;
  }, [value, interval, leading, trailing, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    throttledValue,
    isPending,
    flush,
    cancel,
  };
}

/**
 * Hook for throttling a callback function.
 *
 * @param callback - The callback to throttle
 * @param interval - Throttle interval in milliseconds (default: 100)
 * @param options - Additional options
 * @returns Throttled callback function
 *
 * @example
 * const throttledScroll = useThrottledCallback(
 *   (position) => saveScrollPosition(position),
 *   200
 * );
 *
 * onScroll={() => throttledScroll(scrollY)}
 */
export function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  interval: number = 100,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  const { leading = true, trailing = true } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExecTimeRef = useRef<number>(0);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastExec = now - lastExecTimeRef.current;
      const canExecute = timeSinceLastExec >= interval;

      // Leading edge execution
      if (leading && canExecute && lastExecTimeRef.current === 0) {
        callbackRef.current(...args);
        lastExecTimeRef.current = now;
        return;
      }

      // If we can execute
      if (canExecute) {
        callbackRef.current(...args);
        lastExecTimeRef.current = now;
      } else {
        // Store pending args for trailing execution
        pendingArgsRef.current = args;

        // Set up trailing execution
        if (trailing && !timeoutRef.current) {
          const remainingTime = interval - timeSinceLastExec;
          timeoutRef.current = setTimeout(() => {
            if (pendingArgsRef.current) {
              callbackRef.current(...pendingArgsRef.current);
              pendingArgsRef.current = null;
            }
            lastExecTimeRef.current = Date.now();
            timeoutRef.current = null;
          }, remainingTime);
        }
      }
    }) as T,
    [interval, leading, trailing]
  );
}

export default useThrottledValue;
