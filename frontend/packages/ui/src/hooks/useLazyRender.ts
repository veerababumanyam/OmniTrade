/**
 * useLazyRender - Lazy render components when they enter viewport
 *
 * Provides utilities for lazy rendering components based on viewport visibility.
 * Uses IntersectionObserver under the hood with fallback for SSR.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Options for the useLazyRender hook.
 */
export interface UseLazyRenderOptions {
  /** Root margin for the intersection observer (default: '200px') */
  rootMargin?: string;
  /** Threshold for intersection (0-1, default: 0.1) */
  threshold?: number | number[];
  /** Whether to disconnect observer after first intersection (default: true) */
  once?: boolean;
  /** Root element for intersection observer (default: null = viewport) */
  root?: Element | null;
  /** Whether the observer is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Return type for useLazyRender hook.
 */
export interface UseLazyRenderReturn {
  /** Ref to attach to the element to observe */
  ref: (node: Element | null) => void;
  /** Whether the element is currently visible */
  isVisible: boolean;
  /** Whether the element has been visible at least once */
  hasBeenVisible: boolean;
  /** Ratio of element that is visible (0-1) */
  intersectionRatio: number;
  /** Manually trigger visibility (useful for SSR fallback) */
  triggerVisibility: () => void;
  /** Reset visibility state */
  reset: () => void;
}

/**
 * Hook for lazy rendering components when they enter the viewport.
 *
 * @param options - Configuration options
 * @returns Object containing ref and visibility state
 *
 * @example
 * function LazyImage({ src, alt }) {
 *   const { ref, isVisible } = useLazyRender({ rootMargin: '100px' });
 *
 *   return (
 *     <div ref={ref} style={{ minHeight: 200 }}>
 *       {isVisible ? <img src={src} alt={alt} /> : <Placeholder />}
 *     </div>
 *   );
 * }
 *
 * @example
 * // With once disabled to track continuous visibility
 * const { ref, isVisible, intersectionRatio } = useLazyRender({
 *   once: false,
 *   threshold: [0, 0.25, 0.5, 0.75, 1],
 * });
 */
export function useLazyRender(
  options: UseLazyRenderOptions = {}
): UseLazyRenderReturn {
  const {
    rootMargin = '200px',
    threshold = 0.1,
    once = true,
    root = null,
    enabled = true,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);

  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback ref that also sets up the observer
  const ref = useCallback(
    (node: Element | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      elementRef.current = node;

      if (!node || !enabled) return;

      // Check for IntersectionObserver support
      if (typeof IntersectionObserver === 'undefined') {
        // Fallback: assume visible (SSR or old browsers)
        setIsVisible(true);
        setHasBeenVisible(true);
        setIntersectionRatio(1);
        return;
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;

          const isIntersecting = entry.isIntersecting;
          const ratio = entry.intersectionRatio;

          setIsVisible(isIntersecting);
          setIntersectionRatio(ratio);

          if (isIntersecting) {
            setHasBeenVisible(true);

            // Disconnect after first intersection if once is true
            if (once && observerRef.current) {
              observerRef.current.disconnect();
              observerRef.current = null;
            }
          }
        },
        {
          root,
          rootMargin,
          threshold,
        }
      );

      observerRef.current.observe(node);
    },
    [rootMargin, threshold, once, root, enabled]
  );

  // Manual trigger for SSR fallback
  const triggerVisibility = useCallback(() => {
    setIsVisible(true);
    setHasBeenVisible(true);
    setIntersectionRatio(1);
  }, []);

  // Reset visibility state
  const reset = useCallback(() => {
    setIsVisible(false);
    setHasBeenVisible(false);
    setIntersectionRatio(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ref,
    isVisible,
    hasBeenVisible,
    intersectionRatio,
    triggerVisibility,
    reset,
  };
}

/**
 * Hook for lazy rendering with a placeholder component.
 *
 * @param renderContent - Function that returns the content to render when visible
 * @param options - Configuration options
 * @returns Object with ref and rendered content
 *
 * @example
 * function LazySection() {
 *   const { ref, content } = useLazyRenderContent(
 *     () => <ExpensiveComponent />,
 *     { rootMargin: '300px' }
 *   );
 *
 *   return <div ref={ref}>{content}</div>;
 * }
 */
export function useLazyRenderContent<T>(
  renderContent: () => T,
  options: UseLazyRenderOptions = {}
): { ref: (node: Element | null) => void; content: T | null; isVisible: boolean } {
  const { ref, isVisible } = useLazyRender(options);

  return {
    ref,
    content: isVisible ? renderContent() : null,
    isVisible,
  };
}

/**
 * Hook for lazy rendering multiple items with staggered loading.
 *
 * @param count - Number of items to track
 * @param options - Configuration options
 * @returns Array of refs and visibility states for each item
 *
 * @example
 * function LazyList({ items }) {
 *   const itemRefs = useLazyRenderMultiple(items.length, {
 *     rootMargin: '100px',
 *     staggerDelay: 50,
 *   });
 *
 *   return items.map((item, i) => (
 *     <div key={item.id} ref={itemRefs[i]}>
 *       {itemRefs[i].isVisible && <Item data={item} />}
 *     </div>
 *   ));
 * }
 */
export function useLazyRenderMultiple(
  count: number,
  options: UseLazyRenderOptions & { staggerDelay?: number } = {}
): Array<{ ref: (node: Element | null) => void; isVisible: boolean }> {
  const { staggerDelay = 0, ...lazyOptions } = options;
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());

  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<number, Element>>(new Map());

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: mark all as visible
      setVisibleIndices(new Set(Array.from({ length: count }, (_, i) => i)));
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-lazy-index'));
          if (isNaN(index)) return;

          if (entry.isIntersecting) {
            if (staggerDelay > 0) {
              // Stagger the visibility
              setTimeout(() => {
                setVisibleIndices((prev) => new Set(prev).add(index));
              }, index * staggerDelay);
            } else {
              setVisibleIndices((prev) => new Set(prev).add(index));
            }
          }
        });
      },
      {
        rootMargin: lazyOptions.rootMargin ?? '200px',
        threshold: lazyOptions.threshold ?? 0.1,
        root: lazyOptions.root ?? null,
      }
    );

    // Observe all elements
    elementsRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [count, staggerDelay, lazyOptions.rootMargin, lazyOptions.threshold, lazyOptions.root]);

  return Array.from({ length: count }, (_, index) => ({
    ref: (node: Element | null) => {
      if (node) {
        node.setAttribute('data-lazy-index', String(index));
        elementsRef.current.set(index, node);
        observerRef.current?.observe(node);
      } else {
        elementsRef.current.delete(index);
      }
    },
    isVisible: visibleIndices.has(index),
  }));
}

export default useLazyRender;
