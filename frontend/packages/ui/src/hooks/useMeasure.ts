/**
 * useMeasure - Measure element dimensions with ResizeObserver
 *
 * Provides real-time measurements of an element's dimensions and position.
 * Uses ResizeObserver for efficient updates without layout thrashing.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Rect-like interface for measurements.
 */
export interface Rect {
  /** Width of the element */
  width: number;
  /** Height of the element */
  height: number;
  /** X position relative to viewport */
  x: number;
  /** Y position relative to viewport */
  y: number;
  /** Top position (same as y) */
  top: number;
  /** Left position (same as x) */
  left: number;
  /** Bottom position (top + height) */
  bottom: number;
  /** Right position (left + width) */
  right: number;
}

/**
 * Options for the useMeasure hook.
 */
export interface UseMeasureOptions {
  /** Whether to continuously observe changes (default: true) */
  continuous?: boolean;
  /** Debounce delay for measurements in ms (default: 0) */
  debounce?: number;
  /** Whether measurements are enabled (default: true) */
  enabled?: boolean;
  /** Called when measurements change */
  onChange?: (rect: Rect) => void;
}

/**
 * Return type for useMeasure hook.
 */
export interface UseMeasureReturn<E extends Element = Element> {
  /** Ref to attach to the element to measure */
  ref: (node: E | null) => void;
  /** Current measurements */
  rect: Rect;
  /** Whether the element is being observed */
  isObserving: boolean;
  /** Manually trigger a measurement */
  measure: () => void;
  /** Stop observing */
  stop: () => void;
  /** Start observing */
  start: () => void;
}

const DEFAULT_RECT: Rect = {
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
};

/**
 * Hook for measuring element dimensions and position.
 *
 * @param options - Configuration options
 * @returns Object containing ref and measurements
 *
 * @example
 * function MeasuredComponent() {
 *   const { ref, rect } = useMeasure();
 *
 *   return (
 *     <div ref={ref}>
 *       Width: {rect.width}px, Height: {rect.height}px
 *     </div>
 *   );
 * }
 *
 * @example
 * // With debounce for performance
 * const { ref, rect } = useMeasure({ debounce: 100 });
 *
 * @example
 * // With change callback
 * const { ref } = useMeasure({
 *   onChange: (rect) => {
 *     console.log('Element resized:', rect.width, rect.height);
 *   },
 * });
 */
export function useMeasure<E extends Element = Element>(
  options: UseMeasureOptions = {}
): UseMeasureReturn<E> {
  const {
    continuous = true,
    debounce = 0,
    enabled = true,
    onChange,
  } = options;

  const [rect, setRect] = useState<Rect>(DEFAULT_RECT);
  const [isObserving, setIsObserving] = useState(false);

  const elementRef = useRef<E | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Measure the element
  const measure = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    const domRect = element.getBoundingClientRect();

    const newRect: Rect = {
      width: domRect.width,
      height: domRect.height,
      x: domRect.x,
      y: domRect.y,
      top: domRect.top,
      left: domRect.left,
      bottom: domRect.bottom,
      right: domRect.right,
    };

    setRect(newRect);
    onChangeRef.current?.(newRect);
  }, []);

  // Stop observing
  const stop = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    setIsObserving(false);
  }, []);

  // Start observing
  const start = useCallback(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    // Check for ResizeObserver support
    if (typeof ResizeObserver === 'undefined') {
      // Fallback: just measure once
      measure();
      return;
    }

    // Initial measurement
    measure();

    // Create observer
    observerRef.current = new ResizeObserver(() => {
      if (debounce > 0) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          measure();
        }, debounce);
      } else {
        measure();
      }
    });

    observerRef.current.observe(element);
    setIsObserving(true);
  }, [enabled, debounce, measure]);

  // Ref callback
  const ref = useCallback(
    (node: E | null) => {
      // Cleanup previous
      stop();

      elementRef.current = node;

      if (node && enabled) {
        if (continuous) {
          start();
        } else {
          measure();
        }
      }
    },
    [enabled, continuous, stop, start, measure]
  );

  // Re-measure on window resize
  useEffect(() => {
    if (!continuous || !enabled) return;

    const handleResize = () => {
      if (debounce > 0) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(measure, debounce);
      } else {
        measure();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [continuous, enabled, debounce, measure]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    ref,
    rect,
    isObserving,
    measure,
    stop,
    start,
  };
}

/**
 * Hook for measuring multiple elements at once.
 *
 * @param options - Configuration options
 * @returns Function to create refs and array of measurements
 *
 * @example
 * function MultiMeasure() {
 *   const { getRef, rects } = useMeasureMultiple();
 *
 *   return (
 *     <div>
 *       <div ref={getRef(0)}>Item 1: {rects[0]?.width}px</div>
 *       <div ref={getRef(1)}>Item 2: {rects[1]?.width}px</div>
 *     </div>
 *   );
 * }
 */
export function useMeasureMultiple<E extends Element = Element>(
  options: UseMeasureOptions = {}
): {
  getRef: (index: number) => (node: E | null) => void;
  rects: Rect[];
  measureAll: () => void;
} {
  const [rects, setRects] = useState<Rect[]>([]);
  const elementsRef = useRef<Map<number, E>>(new Map());
  const measureFnsRef = useRef<Map<number, () => void>>(new Map());

  const getRef = useCallback(
    (index: number) => {
      return (node: E | null) => {
        if (node) {
          elementsRef.current.set(index, node);

          // Create measure function for this element
          const measureFn = () => {
            const element = elementsRef.current.get(index);
            if (!element) return;

            const domRect = element.getBoundingClientRect();
            const newRect: Rect = {
              width: domRect.width,
              height: domRect.height,
              x: domRect.x,
              y: domRect.y,
              top: domRect.top,
              left: domRect.left,
              bottom: domRect.bottom,
              right: domRect.right,
            };

            setRects((prev) => {
              const next = [...prev];
              next[index] = newRect;
              return next;
            });
          };

          measureFnsRef.current.set(index, measureFn);
          measureFn();
        } else {
          elementsRef.current.delete(index);
          measureFnsRef.current.delete(index);
        }
      };
    },
    []
  );

  const measureAll = useCallback(() => {
    measureFnsRef.current.forEach((measureFn) => measureFn());
  }, []);

  return { getRef, rects, measureAll };
}

export default useMeasure;
