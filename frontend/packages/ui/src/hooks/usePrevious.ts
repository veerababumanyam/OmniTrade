/**
 * usePrevious - Get previous value for comparison
 *
 * Returns the previous value of a variable, useful for comparing
 * current and previous states in effects or computed values.
 */
import { useRef, useEffect } from 'react';

/**
 * Hook that returns the previous value of a variable.
 *
 * @param value - The current value
 * @returns The previous value, or undefined on first render
 *
 * @example
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const prevCount = usePrevious(count);
 *
 *   return (
 *     <div>
 *       Previous: {prevCount}, Current: {count}
 *       Direction: {count > (prevCount ?? 0) ? 'up' : 'down'}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Detecting value changes
 * const prevUserId = usePrevious(userId);
 *
 * useEffect(() => {
 *   if (prevUserId !== userId) {
 *     // User ID changed, fetch new data
 *     fetchUserData(userId);
 *   }
 * }, [userId, prevUserId]);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook that returns the previous value with an initial value.
 *
 * @param value - The current value
 * @param initialValue - The initial previous value
 * @returns The previous value
 *
 * @example
 * const prevCount = usePreviousWithInitial(count, 0);
 * // On first render, prevCount will be 0 instead of undefined
 */
export function usePreviousWithInitial<T>(value: T, initialValue: T): T {
  const ref = useRef<T>(initialValue);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook that returns both current and previous value with change detection.
 *
 * @param value - The current value
 * @returns Object with current, previous value, and whether it changed
 *
 * @example
 * const { current, previous, hasChanged } = useChangeDetection(userId);
 *
 * if (hasChanged) {
 *   console.log(`User changed from ${previous} to ${current}`);
 * }
 */
export function useChangeDetection<T>(value: T): {
  current: T;
  previous: T | undefined;
  hasChanged: boolean;
  isFirstRender: boolean;
} {
  const prevRef = useRef<T | undefined>(undefined);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
    }
    prevRef.current = value;
  }, [value]);

  return {
    current: value,
    previous: prevRef.current,
    hasChanged: prevRef.current !== value && !isFirstRenderRef.current,
    isFirstRender: isFirstRenderRef.current,
  };
}

/**
 * Hook that tracks the history of a value over time.
 *
 * @param value - The current value
 * @param maxHistory - Maximum number of historical values to keep (default: 10)
 * @returns Array of historical values (most recent last)
 *
 * @example
 * const history = useValueHistory(searchTerm, 5);
 * // Returns last 5 search terms
 */
export function useValueHistory<T>(value: T, maxHistory: number = 10): T[] {
  const historyRef = useRef<T[]>([]);

  useEffect(() => {
    historyRef.current = [...historyRef.current, value].slice(-maxHistory);
  }, [value, maxHistory]);

  return historyRef.current;
}

/**
 * Hook that returns the previous distinct value (ignoring duplicates).
 *
 * @param value - The current value
 * @returns The previous distinct value
 *
 * @example
 * const [count, setCount] = useState(0);
 * const prevDistinct = usePreviousDistinct(count);
 *
 * // If count goes 0 -> 1 -> 1 -> 2
 * // prevDistinct will be undefined -> 0 -> 0 -> 1
 */
export function usePreviousDistinct<T>(value: T): T | undefined {
  const prevRef = useRef<T | undefined>(undefined);
  const currentRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (currentRef.current !== value) {
      prevRef.current = currentRef.current;
      currentRef.current = value;
    }
  }, [value]);

  return prevRef.current;
}

export default usePrevious;
