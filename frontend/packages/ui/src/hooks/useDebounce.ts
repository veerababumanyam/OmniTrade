/**
 * useDebounce - Debounces a value by a specified delay
 * Returns the debounced value that only updates after the delay has passed
 * without the value changing.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounces a value by a specified delay.
 * Useful for search inputs, resize handlers, and other frequently changing values.
 *
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // This effect only runs 300ms after the user stops typing
 *   searchAPI(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout to update the debounced value
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup on unmount or when value/delay changes
    return (): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Returns a debounced callback function.
 * The callback will only execute after the specified delay has passed
 * since the last invocation.
 *
 * @param callback - The function to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns The debounced callback function
 *
 * @example
 * const debouncedSave = useDebouncedCallback((data) => {
 *   saveToAPI(data);
 * }, 500);
 *
 * handleChange={(e) => {
 *   debouncedSave(e.target.value);
 * }}
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

export default useDebounce;
