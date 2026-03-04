/**
 * useDebouncedValue - Debounce any value with proper cleanup
 *
 * Returns a debounced value that only updates after the specified delay
 * has passed without the value changing. Useful for search inputs,
 * resize handlers, and other frequently changing values.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Options for the useDebouncedValue hook.
 */
export interface UseDebouncedValueOptions {
  /** Debounce delay in milliseconds (default: 300) */
  delay?: number;
  /** Whether to update immediately on the first change (default: false) */
  leading?: boolean;
  /** Maximum time to wait before forcing an update (default: Infinity) */
  maxWait?: number;
  /** Whether to update on the trailing edge (default: true) */
  trailing?: boolean;
}

/**
 * Return type for useDebouncedValue hook.
 */
export interface UseDebouncedValueReturn<T> {
  /** The debounced value */
  debouncedValue: T;
  /** Whether the value is currently being debounced */
  isPending: boolean;
  /** Function to immediately flush the pending value */
  flush: () => void;
  /** Function to cancel the pending update */
  cancel: () => void;
}

/**
 * Debounces a value with configurable options.
 *
 * @param value - The value to debounce
 * @param options - Configuration options
 * @returns Object containing debounced value and control functions
 *
 * @example
 * const { debouncedValue, isPending, flush, cancel } = useDebouncedValue(searchTerm, {
 *   delay: 300,
 *   leading: false,
 * });
 *
 * useEffect(() => {
 *   // Only runs 300ms after user stops typing
 *   searchAPI(debouncedValue);
 * }, [debouncedValue]);
 *
 * @example
 * // With leading edge update (immediate first update)
 * const { debouncedValue } = useDebouncedValue(value, {
 *   delay: 500,
 *   leading: true, // Update immediately on first change
 * });
 */
export function useDebouncedValue<T>(
  value: T,
  options: UseDebouncedValueOptions = {}
): UseDebouncedValueReturn<T> {
  const {
    delay = 300,
    leading = false,
    maxWait = Infinity,
    trailing = true,
  } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isPending, setIsPending] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leadingExecutedRef = useRef(false);
  const valueRef = useRef(value);

  // Keep value ref updated
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    setIsPending(false);
    leadingExecutedRef.current = false;
  }, []);

  // Flush function - immediately apply pending value
  const flush = useCallback(() => {
    cleanup();
    setDebouncedValue(valueRef.current);
  }, [cleanup]);

  // Cancel function - discard pending update
  const cancel = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Main debounce effect
  useEffect(() => {
    // Leading edge: update immediately on first change
    if (leading && !leadingExecutedRef.current) {
      leadingExecutedRef.current = true;
      setDebouncedValue(value);
      setIsPending(false);

      // If trailing is disabled and leading is enabled, we're done
      if (!trailing) {
        return;
      }
    }

    setIsPending(true);

    // Set up max wait timeout
    if (maxWait !== Infinity && !maxWaitTimeoutRef.current) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(valueRef.current);
        cleanup();
      }, maxWait);
    }

    // Set up trailing edge timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(valueRef.current);
        cleanup();
      }, delay);
    }

    return cleanup;
  }, [value, delay, leading, maxWait, trailing, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    debouncedValue,
    isPending,
    flush,
    cancel,
  };
}

/**
 * Simple debounced value hook with just a delay.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds (default: 300)
 * @returns The debounced value
 *
 * @example
 * const debouncedSearch = useDebouncedValue(searchTerm, 300);
 */
export function useSimpleDebouncedValue<T>(value: T, delay: number = 300): T {
  const { debouncedValue } = useDebouncedValue(value, { delay });
  return debouncedValue;
}

export default useDebouncedValue;
