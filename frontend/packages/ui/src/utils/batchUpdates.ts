/**
 * BatchUpdates - React batching for multiple state updates
 *
 * Provides utilities for batching multiple state updates to reduce
 * re-renders and improve performance.
 */

import { unstable_batchUpdates as reactBatchUpdates } from 'react-dom';

/**
 * Batches multiple state updates into a single re-render.
 * Uses React's built-in batchUpdates when available.
 *
 * @param callback - Function containing multiple state updates
 *
 * @example
 * batchUpdates(() => {
 *   setCount(prev => prev + 1);
 *   setName('New Name');
 *   setActive(true);
 *   // Only triggers one re-render after all updates
 * });
 */
export function batchUpdates(callback: () => void): void {
  if (typeof reactBatchUpdates === 'function') {
    reactBatchUpdates(callback);
  } else {
    callback();
  }
}

/**
 * Creates a batched version of a callback.
 * Multiple rapid calls are batched into a single execution.
 *
 * @param callback - The callback to batch
 * @param delay - Delay in ms to wait for more calls (default: 0 = next tick)
 * @returns Batched callback
 *
 * @example
 * const batchedUpdate = createBatchedCallback((items) => {
 *   // Receives all items from batched calls
 *   updateItems(items);
 * });
 *
 * // These are batched into a single call
 * batchedUpdate(item1);
 * batchedUpdate(item2);
 * batchedUpdate(item3);
 */
export function createBatchedCallback<T>(
  callback: (items: T[]) => void,
  delay: number = 0
): (item: T) => void {
  let pendingItems: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (pendingItems.length > 0) {
      callback([...pendingItems]);
      pendingItems = [];
    }
    timeoutId = null;
  };

  return (item: T) => {
    pendingItems.push(item);

    if (!timeoutId) {
      timeoutId = setTimeout(flush, delay);
    }
  };
}

/**
 * Options for createBatchedFunction.
 */
export interface BatchedFunctionOptions {
  /** Maximum batch size before forcing execution (default: Infinity) */
  maxBatchSize?: number;
  /** Maximum time to wait before forcing execution in ms (default: 100) */
  maxWait?: number;
}

/**
 * Creates a function that batches multiple calls with arguments.
 *
 * @param callback - Function to call with batched arguments
 * @param options - Batching options
 * @returns Batched function
 *
 * @example
 * const batchedFetch = createBatchedFunction(
 *   async (ids: string[]) => {
 *     const response = await fetch('/api/items', {
 *       method: 'POST',
 *       body: JSON.stringify({ ids }),
 *     });
 *     return response.json();
 *   },
 *   { maxBatchSize: 50, maxWait: 10 }
 * );
 *
 * // Multiple calls batched into single request
 * batchedFetch('id1');
 * batchedFetch('id2');
 * batchedFetch('id3');
 */
export function createBatchedFunction<T, R>(
  callback: (items: T[]) => Promise<R[]>,
  options: BatchedFunctionOptions = {}
): (item: T) => Promise<R> {
  const { maxBatchSize = Infinity, maxWait = 100 } = options;

  let pendingItems: T[] = [];
  let pendingResolvers: Array<{
    resolve: (value: R) => void;
    reject: (error: Error) => void;
    index: number;
  }> = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let batchIndex = 0;

  const flush = async () => {
    const items = pendingItems;
    const resolvers = pendingResolvers;
    pendingItems = [];
    pendingResolvers = [];
    timeoutId = null;
    const currentBatchIndex = batchIndex++;

    try {
      const results = await callback(items);
      resolvers.forEach(({ resolve, index }) => {
        resolve(results[index]);
      });
    } catch (error) {
      resolvers.forEach(({ reject }) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    }
  };

  const scheduleFlush = () => {
    if (!timeoutId) {
      timeoutId = setTimeout(flush, maxWait);
    }
  };

  return (item: T): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      const index = pendingItems.length;
      pendingItems.push(item);
      pendingResolvers.push({ resolve, reject, index });

      // Force flush if max batch size reached
      if (pendingItems.length >= maxBatchSize) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        flush();
      } else {
        scheduleFlush();
      }
    });
  };
}

/**
 * Batches updates using requestAnimationFrame.
 * Useful for visual updates that should sync with the browser's paint cycle.
 *
 * @param callback - Callback to execute on next frame
 * @returns Function to cancel the scheduled callback
 *
 * @example
 * const cancel = rafBatch(() => {
 *   updateVisuals();
 * });
 *
 * // Cancel if needed
 * cancel();
 */
export function rafBatch(callback: () => void): () => void {
  let cancelled = false;
  let rafId: number | null = null;

  rafId = requestAnimationFrame(() => {
    if (!cancelled) {
      callback();
    }
  });

  return () => {
    cancelled = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
}

/**
 * Creates a callback that only executes once per animation frame.
 *
 * @param callback - The callback to throttle to animation frames
 * @returns Frame-throttled callback
 *
 * @example
 * const updateOnFrame = createFrameCallback((scrollY) => {
 *   updateParallax(scrollY);
 * });
 *
 * window.addEventListener('scroll', () => updateOnFrame(window.scrollY));
 */
export function createFrameCallback<T extends (...args: unknown[]) => void>(
  callback: T
): T {
  let pending = false;
  let pendingArgs: Parameters<T> | null = null;
  let rafId: number | null = null;

  const flush = () => {
    if (pending && pendingArgs) {
      callback(...pendingArgs);
    }
    pending = false;
    pendingArgs = null;
    rafId = null;
  };

  return ((...args: Parameters<T>) => {
    pendingArgs = args;

    if (!pending) {
      pending = true;
      rafId = requestAnimationFrame(flush);
    }
  }) as T;
}

/**
 * Queues microtasks for batching updates outside of React's batchedUpdates.
 * Uses queueMicrotask when available, falls back to Promise.then.
 *
 * @param callback - Callback to execute as a microtask
 *
 * @example
 * queueMicrotaskBatch(() => {
 *   // Runs after current synchronous code completes
 *   updateState();
 * });
 */
export function queueMicrotaskBatch(callback: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback);
  }
}

/**
 * Debounces a callback using requestAnimationFrame.
 *
 * @param callback - The callback to debounce
 * @returns Debounced callback with cancel method
 *
 * @example
 * const debouncedResize = rafDebounce(() => {
 *   recalculateLayout();
 * });
 *
 * window.addEventListener('resize', debouncedResize);
 *
 * // Cancel pending execution
 * debouncedResize.cancel();
 */
export function rafDebounce<T extends (...args: unknown[]) => void>(
  callback: T
): T & { cancel: () => void } {
  let rafId: number | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      callback(...args);
      rafId = null;
    });
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return debounced;
}

export default batchUpdates;
