/**
 * Memoize - Deep memoization utility
 *
 * Provides deep memoization for functions with complex arguments.
 * Useful for expensive computations, API calls, and derived data.
 */

/**
 * Cache entry for memoized values.
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/**
 * Options for memoization.
 */
export interface MemoizeOptions {
  /** Maximum number of cached results (default: 100) */
  maxSize?: number;
  /** Time-to-live in milliseconds (default: Infinity) */
  ttl?: number;
  /** Custom key generator (default: JSON.stringify) */
  keyGenerator?: (...args: unknown[]) => string;
  /** Whether to use weak map for object arguments (default: false) */
  weak?: boolean;
}

/**
 * Deep equality check for cache comparison.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

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
 * Default key generator using JSON.stringify with sorted keys.
 */
function defaultKeyGenerator(...args: unknown[]): string {
  return JSON.stringify(args, (_, value) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Sort object keys for consistent serialization
      return Object.keys(value)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = value[key];
          return acc;
        }, {});
    }
    return value;
  });
}

/**
 * Creates a memoized version of a function.
 *
 * @param fn - The function to memoize
 * @param options - Memoization options
 * @returns Memoized function
 *
 * @example
 * const expensiveCalculation = memoize((data: Data[]) => {
 *   return data.reduce((sum, item) => sum + item.value, 0);
 * });
 *
 * // First call computes and caches
 * expensiveCalculation(largeData);
 * // Second call returns cached result
 * expensiveCalculation(largeData);
 *
 * @example
 * // With TTL
 * const fetchUser = memoize(
 *   async (id: string) => api.getUser(id),
 *   { ttl: 60000 } // Cache for 1 minute
 * );
 *
 * @example
 * // With custom key generator
 * const formatCurrency = memoize(
 *   (amount: number, currency: string) => `${currency}${amount.toFixed(2)}`,
 *   { keyGenerator: (amount, currency) => `${amount}-${currency}` }
 * );
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoizeOptions = {}
): T & { clear: () => void; cache: Map<string, CacheEntry<ReturnType<T>>> } {
  const {
    maxSize = 100,
    ttl = Infinity,
    keyGenerator = defaultKeyGenerator,
  } = options;

  const cache = new Map<string, CacheEntry<ReturnType<T>>>();

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args);

    // Check cache
    const cached = cache.get(key);
    if (cached) {
      // Check TTL
      if (ttl !== Infinity && Date.now() - cached.timestamp > ttl) {
        cache.delete(key);
      } else {
        return cached.value;
      }
    }

    // Compute new value
    const value = fn(...args) as ReturnType<T>;

    // Manage cache size (LRU eviction)
    if (cache.size >= maxSize) {
      // Delete oldest entry
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    // Store in cache
    cache.set(key, {
      value,
      timestamp: Date.now(),
    });

    return value;
  }) as T & { clear: () => void; cache: Map<string, CacheEntry<ReturnType<T>>> };

  // Add cache management methods
  memoized.clear = () => cache.clear();
  memoized.cache = cache;

  return memoized;
}

/**
 * Creates a memoized function that compares arguments deeply.
 *
 * @param fn - The function to memoize
 * @param options - Memoization options
 * @returns Memoized function with deep argument comparison
 *
 * @example
 * const processConfig = memoizeDeep((config: Config) => {
 *   // Expensive processing
 *   return transformConfig(config);
 * });
 *
 * // Even if config object is recreated, deep comparison finds it's the same
 * processConfig({ theme: 'dark', locale: 'en' });
 * processConfig({ theme: 'dark', locale: 'en' }); // Returns cached result
 */
export function memoizeDeep<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: Omit<MemoizeOptions, 'keyGenerator'> = {}
): T & { clear: () => void } {
  const { maxSize = 100, ttl = Infinity } = options;

  const cacheEntries: { args: unknown[]; result: unknown; timestamp: number }[] = [];

  const findCachedIndex = (args: unknown[]): number => {
    return cacheEntries.findIndex((entry) =>
      entry.args.length === args.length &&
      entry.args.every((arg, i) => deepEqual(arg, args[i]))
    );
  };

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const cachedIndex = findCachedIndex(args);

    if (cachedIndex !== -1) {
      const cached = cacheEntries[cachedIndex];

      // Check TTL
      if (ttl !== Infinity && Date.now() - cached.timestamp > ttl) {
        cacheEntries.splice(cachedIndex, 1);
      } else {
        // Move to end (most recently used)
        cacheEntries.splice(cachedIndex, 1);
        cacheEntries.push(cached);
        return cached.result as ReturnType<T>;
      }
    }

    // Compute new value
    const result = fn(...args);

    // Manage cache size
    if (cacheEntries.length >= maxSize) {
      cacheEntries.shift();
    }

    // Store in cache
    cacheEntries.push({
      args,
      result,
      timestamp: Date.now(),
    });

    return result as ReturnType<T>;
  }) as T & { clear: () => void };

  memoized.clear = () => {
    cacheEntries.length = 0;
  };

  return memoized;
}

/**
 * Memoize for async functions with promise caching.
 *
 * @param fn - The async function to memoize
 * @param options - Memoization options
 * @returns Memoized async function
 *
 * @example
 * const fetchUser = memoizeAsync(async (id: string) => {
 *   const response = await fetch(`/api/users/${id}`);
 *   return response.json();
 * }, { ttl: 30000 });
 *
 * // Multiple concurrent calls share the same promise
 * Promise.all([
 *   fetchUser('123'),
 *   fetchUser('123'), // Reuses the same promise
 * ]);
 */
export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: MemoizeOptions = {}
): T & { clear: () => void; cache: Map<string, CacheEntry<ReturnType<T>>> } {
  const {
    maxSize = 100,
    ttl = Infinity,
    keyGenerator = defaultKeyGenerator,
  } = options;

  const cache = new Map<string, CacheEntry<ReturnType<T>>>();

  const memoized = (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = keyGenerator(...args);

    // Check cache
    const cached = cache.get(key);
    if (cached) {
      // Check TTL
      if (ttl !== Infinity && Date.now() - cached.timestamp > ttl) {
        cache.delete(key);
      } else {
        return cached.value;
      }
    }

    // Compute new value (store promise to dedupe concurrent calls)
    const promise = fn(...args) as ReturnType<T>;

    // Manage cache size
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    // Store promise in cache immediately
    cache.set(key, {
      value: promise,
      timestamp: Date.now(),
    });

    try {
      return await promise;
    } catch (error) {
      // Remove from cache on error
      cache.delete(key);
      throw error;
    }
  }) as T & { clear: () => void; cache: Map<string, CacheEntry<ReturnType<T>>> };

  memoized.clear = () => cache.clear();
  memoized.cache = cache;

  return memoized;
}

/**
 * Creates a memoized selector for derived state.
 * Similar to reselect, useful for Redux or state management.
 *
 * @param selectors - Input selectors
 * @param combiner - Function to combine selector results
 * @returns Memoized selector
 *
 * @example
 * const selectFilteredItems = createSelector(
 *   (state: State) => state.items,
 *   (state: State) => state.filter,
 *   (items, filter) => items.filter(item => item.type === filter)
 * );
 *
 * // Only recomputes if items or filter changes
 * const filtered = selectFilteredItems(state);
 */
export function createSelector<S, R1, Result>(
  selector1: (state: S) => R1,
  combiner: (r1: R1) => Result
): (state: S) => Result;

export function createSelector<S, R1, R2, Result>(
  selector1: (state: S) => R1,
  selector2: (state: S) => R2,
  combiner: (r1: R1, r2: R2) => Result
): (state: S) => Result;

export function createSelector<S, R1, R2, R3, Result>(
  selector1: (state: S) => R1,
  selector2: (state: S) => R2,
  selector3: (state: S) => R3,
  combiner: (r1: R1, r2: R2, r3: R3) => Result
): (state: S) => Result;

export function createSelector<S, Result>(
  ...args: [...selectors: Array<(state: S) => unknown>, combiner: (...results: unknown[]) => Result]
): (state: S) => Result {
  const selectors = args.slice(0, -1) as Array<(state: S) => unknown>;
  const combiner = args[args.length - 1] as (...results: unknown[]) => Result;

  let lastArgs: unknown[] | undefined;
  let lastResult: Result;

  return (state: S): Result => {
    const currentArgs = selectors.map((selector) => selector(state));

    // Check if any argument changed
    const hasChanged = !lastArgs ||
      currentArgs.some((arg, i) => !deepEqual(arg, lastArgs![i]));

    if (hasChanged) {
      lastArgs = currentArgs;
      lastResult = combiner(...currentArgs);
    }

    return lastResult;
  };
}

export default memoize;
