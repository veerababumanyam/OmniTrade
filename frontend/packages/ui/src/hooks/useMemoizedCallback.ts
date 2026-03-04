/**
 * useMemoizedCallback - Alternative to useCallback with deep dependency comparison
 *
 * Unlike useCallback which uses reference equality for dependencies,
 * this hook performs a deep comparison to determine if the callback should change.
 * Useful when dependencies are objects or arrays that may be recreated frequently.
 */
import { useCallback, useRef } from 'react';

/**
 * Performs a deep comparison between two values.
 * Handles primitives, arrays, objects, dates, and regex.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  // Fast path for primitives and same references
  if (a === b) return true;

  // Handle null/undefined
  if (a == null || b == null) return a === b;

  // Handle different types
  if (typeof a !== typeof b) return false;

  // Handle Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // Handle Array
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  // Handle Object
  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

/**
 * Alternative to useCallback with deep dependency comparison.
 *
 * This hook is useful when your dependencies are objects or arrays that
 * may be recreated on each render but have the same values. Unlike useCallback
 * which uses reference equality, this hook performs a deep comparison.
 *
 * @param callback - The callback function to memoize
 * @param deps - Dependency array to compare deeply
 * @returns The memoized callback function
 *
 * @example
 * // With regular useCallback, this would create a new callback on every render
 * // because the options object is recreated
 * const options = { sort: true, filter: 'active' };
 * const callback = useMemoizedCallback(() => fetchData(options), [options]);
 *
 * @example
 * // Works with multiple dependencies
 * const callback = useMemoizedCallback(
 *   (id: string) => updateItem(id, data),
 *   [data, config]
 * );
 */
export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  const depsRef = useRef<React.DependencyList>(deps);
  const memoizedCallbackRef = useRef<T | null>(null);

  // Check if dependencies have changed using deep comparison
  const hasDepsChanged = !depsRef.current || depsRef.current.length !== deps.length ||
    !depsRef.current.every((dep, index) => deepEqual(dep, deps[index]));

  if (hasDepsChanged) {
    depsRef.current = deps;
    callbackRef.current = callback;
    // Create a new memoized callback when deps change
    memoizedCallbackRef.current = null;
  }

  // Create memoized callback if needed
  if (!memoizedCallbackRef.current) {
    memoizedCallbackRef.current = ((...args: Parameters<T>) =>
      callbackRef.current(...args)) as T;
  }

  return memoizedCallbackRef.current;
}

/**
 * A version of useMemoizedCallback that accepts a factory function.
 * Useful when the callback creation is expensive.
 *
 * @param factory - Factory function that creates the callback
 * @param deps - Dependency array to compare deeply
 * @returns The memoized callback function
 *
 * @example
 * const callback = useMemoizedCallbackFactory(
 *   () => (id: string) => expensiveOperation(id, config),
 *   [config]
 * );
 */
export function useMemoizedCallbackFactory<T extends (...args: unknown[]) => unknown>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const factoryRef = useRef(factory);
  const depsRef = useRef<React.DependencyList>(deps);
  const callbackRef = useRef<T | null>(null);

  // Check if dependencies have changed using deep comparison
  const hasDepsChanged = !depsRef.current || depsRef.current.length !== deps.length ||
    !depsRef.current.every((dep, index) => deepEqual(dep, deps[index]));

  if (hasDepsChanged) {
    depsRef.current = deps;
    factoryRef.current = factory;
    callbackRef.current = null;
  }

  if (!callbackRef.current) {
    callbackRef.current = factoryRef.current();
  }

  return callbackRef.current;
}

export default useMemoizedCallback;
