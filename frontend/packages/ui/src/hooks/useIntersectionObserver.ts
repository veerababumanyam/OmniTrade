/**
 * useIntersectionObserver - Detect when element enters viewport
 *
 * A comprehensive hook for using IntersectionObserver with React.
 * Provides visibility detection, scroll tracking, and visibility percentage.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Options for the useIntersectionObserver hook.
 */
export interface UseIntersectionObserverOptions {
  /** Root margin for the intersection observer (default: '0px') */
  rootMargin?: string;
  /** Threshold for intersection (0-1, or array of thresholds, default: 0) */
  threshold?: number | number[];
  /** Root element for intersection observer (default: null = viewport) */
  root?: Element | Document | null;
  /** Whether the observer is enabled (default: true) */
  enabled?: boolean;
  /** Whether to freeze after first intersection (default: false) */
  freezeOnceVisible?: boolean;
  /** Callback when intersection changes */
  onChange?: (entry: IntersectionObserverEntry) => void;
}

/**
 * Return type for useIntersectionObserver hook.
 */
export interface UseIntersectionObserverReturn {
  /** Ref to attach to the element to observe */
  ref: (node: Element | null) => void;
  /** Whether the element is currently intersecting */
  isIntersecting: boolean;
  /** Intersection ratio (0-1) */
  intersectionRatio: number;
  /** Whether the element has been visible at least once */
  hasBeenVisible: boolean;
  /** Whether the element is above the viewport */
  isAboveViewport: boolean;
  /** Whether the element is below the viewport */
  isBelowViewport: boolean;
  /** The intersection observer entry */
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook for detecting when an element enters or leaves the viewport.
 *
 * @param options - Configuration options
 * @returns Object containing ref and visibility state
 *
 * @example
 * function LazyImage({ src, alt }) {
 *   const { ref, isIntersecting } = useIntersectionObserver({
 *     rootMargin: '100px',
 *     freezeOnceVisible: true,
 *   });
 *
 *   return (
 *     <img
 *       ref={ref}
 *       src={isIntersecting ? src : placeholder}
 *       alt={alt}
 *     />
 *   );
 * }
 *
 * @example
 * // Track scroll position
 * const { ref, intersectionRatio } = useIntersectionObserver({
 *   threshold: [0, 0.25, 0.5, 0.75, 1],
 *   onChange: (entry) => {
 *     console.log('Visibility:', entry.intersectionRatio * 100 + '%');
 *   },
 * });
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    rootMargin = '0px',
    threshold = 0,
    root = null,
    enabled = true,
    freezeOnceVisible = false,
    onChange,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const frozenRef = useRef(false);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Ref callback
  const ref = useCallback(
    (node: Element | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      elementRef.current = node;

      if (!node || !enabled || frozenRef.current) return;

      // Check for IntersectionObserver support
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const newEntry = entries[0];
          if (!newEntry) return;

          setEntry(newEntry);
          setIsIntersecting(newEntry.isIntersecting);
          setIntersectionRatio(newEntry.intersectionRatio);

          if (newEntry.isIntersecting) {
            setHasBeenVisible(true);

            if (freezeOnceVisible) {
              frozenRef.current = true;
              observerRef.current?.disconnect();
              observerRef.current = null;
            }
          }

          onChangeRef.current?.(newEntry);
        },
        {
          root: root as Element | null,
          rootMargin,
          threshold,
        }
      );

      observerRef.current.observe(node);
    },
    [rootMargin, threshold, root, enabled, freezeOnceVisible]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Calculate viewport position
  const isAboveViewport = entry
    ? entry.boundingClientRect.bottom < (entry.rootBounds?.top ?? 0)
    : false;
  const isBelowViewport = entry
    ? entry.boundingClientRect.top > (entry.rootBounds?.bottom ?? 0)
    : false;

  return {
    ref,
    isIntersecting,
    intersectionRatio,
    hasBeenVisible,
    isAboveViewport,
    isBelowViewport,
    entry,
  };
}

/**
 * Hook for tracking visibility of multiple elements.
 *
 * @param count - Number of elements to track
 * @param options - Configuration options
 * @returns Array of refs and visibility states
 *
 * @example
 * function ItemList({ items }) {
 *   const itemRefs = useIntersectionObserverMultiple(items.length, {
 *     threshold: 0.5,
 *   });
 *
 *   return items.map((item, i) => (
 *     <div key={item.id} ref={itemRefs[i]}>
 *       {itemRefs[i].isIntersecting && <Item data={item} />}
 *     </div>
 *   ));
 * }
 */
export function useIntersectionObserverMultiple(
  count: number,
  options: UseIntersectionObserverOptions = {}
): Array<{
  ref: (node: Element | null) => void;
  isIntersecting: boolean;
  intersectionRatio: number;
}> {
  const [visibleStates, setVisibleStates] = useState<
    Array<{ isIntersecting: boolean; intersectionRatio: number }>
  >(() =>
    Array.from({ length: count }, () => ({
      isIntersecting: false,
      intersectionRatio: 0,
    }))
  );

  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<number, Element>>(new Map());

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const { rootMargin = '0px', threshold = 0, root = null, enabled = true } = options;

    if (!enabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-observer-index'));
          if (isNaN(index)) return;

          setVisibleStates((prev) => {
            const next = [...prev];
            next[index] = {
              isIntersecting: entry.isIntersecting,
              intersectionRatio: entry.intersectionRatio,
            };
            return next;
          });
        });
      },
      {
        root: root as Element | null,
        rootMargin,
        threshold,
      }
    );

    elementsRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [count, options]);

  return Array.from({ length: count }, (_, index) => ({
    ref: (node: Element | null) => {
      if (node) {
        node.setAttribute('data-observer-index', String(index));
        elementsRef.current.set(index, node);
        observerRef.current?.observe(node);
      } else {
        elementsRef.current.delete(index);
      }
    },
    isIntersecting: visibleStates[index]?.isIntersecting ?? false,
    intersectionRatio: visibleStates[index]?.intersectionRatio ?? 0,
  }));
}

/**
 * Hook for scroll-based visibility tracking (how much of element is visible).
 *
 * @param options - Configuration options
 * @returns Ref and visibility percentage
 *
 * @example
 * const { ref, visibilityPercentage } = useVisibilityPercentage();
 *
 * <div ref={ref}>
 *   {visibilityPercentage}% visible
 * </div>
 */
export function useVisibilityPercentage(
  options: Omit<UseIntersectionObserverOptions, 'threshold'> = {}
): {
  ref: (node: Element | null) => void;
  visibilityPercentage: number;
  isVisible: boolean;
} {
  // Use many thresholds for accurate percentage tracking
  const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);

  const { ref, intersectionRatio, isIntersecting } = useIntersectionObserver({
    ...options,
    threshold: thresholds,
  });

  return {
    ref,
    visibilityPercentage: Math.round(intersectionRatio * 100),
    isVisible: isIntersecting,
  };
}

export default useIntersectionObserver;
