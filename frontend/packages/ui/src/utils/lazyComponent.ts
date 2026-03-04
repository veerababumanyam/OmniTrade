/**
 * LazyComponent - Higher-order component for lazy loading
 *
 * Provides utilities for lazy loading components with loading states,
 * error boundaries, and intersection observer-based loading.
 */

import React, {
  lazy,
  Suspense,
  ComponentType,
  forwardRef,
  useMemo,
  useCallback,
} from 'react';

/**
 * Options for lazy component loading.
 */
export interface LazyComponentOptions {
  /** Loading fallback component */
  fallback?: React.ReactNode;
  /** Error boundary fallback component */
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Whether to preload on hover (default: false) */
  preloadOnHover?: boolean;
  /** Delay before showing loading state in ms (default: 200) */
  loadingDelay?: number;
  /** Minimum time to show loading state in ms (default: 0) */
  minimumLoadingTime?: number;
  /** Custom error handler */
  onError?: (error: Error) => void;
}

/**
 * Default loading fallback component.
 */
const DefaultLoadingFallback: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100px',
    }}
  >
    <div
      style={{
        width: '24px',
        height: '24px',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  </div>
);

/**
 * Default error fallback component.
 */
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({
  error,
  retry,
}) => (
  <div
    style={{
      padding: '16px',
      color: 'var(--ot-color-flux-500, #ff4444)',
      textAlign: 'center',
    }}
  >
    <p>Failed to load component</p>
    <p style={{ fontSize: '12px', marginBottom: '8px' }}>{error.message}</p>
    <button
      onClick={retry}
      style={{
        padding: '4px 12px',
        cursor: 'pointer',
      }}
    >
      Retry
    </button>
  </div>
);

/**
 * Error Boundary for lazy components.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LazyErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error) => void;
  },
  ErrorBoundaryState
> {
  constructor(props: {
    children: React.ReactNode;
    fallback: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error) => void;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * Creates a lazy-loaded component with loading and error states.
 *
 * @param loader - Function that imports the component
 * @param options - Configuration options
 * @returns Lazy-loaded component
 *
 * @example
 * const LazyChart = createLazyComponent(
 *   () => import('./Chart'),
 *   {
 *     fallback: <ChartSkeleton />,
 *     preloadOnHover: true,
 *   }
 * );
 *
 * <LazyChart data={chartData} />
 */
export function createLazyComponent<T extends ComponentType<unknown>>(
  loader: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): React.FC<React.ComponentProps<T>> {
  const {
    fallback = <DefaultLoadingFallback />,
    errorFallback = DefaultErrorFallback,
    preloadOnHover = false,
    onError,
  } = options;

  // Create the lazy component
  const LazyComponent = lazy(loader);

  // Preload function
  const preload = (): void => {
    loader();
  };

  // Wrapper component
  const LazyWrapper = forwardRef<unknown, React.ComponentProps<T>>(
    (props, ref) => {
      // Preload on hover if enabled
      const handleMouseEnter = useCallback(() => {
        if (preloadOnHover) {
          preload();
        }
      }, []);

      return (
        <LazyErrorBoundary fallback={errorFallback} onError={onError}>
          <Suspense fallback={fallback}>
            <div onMouseEnter={handleMouseEnter}>
              <LazyComponent {...(props as React.ComponentProps<T>)} ref={ref} />
            </div>
          </Suspense>
        </LazyErrorBoundary>
      );
    }
  );

  LazyWrapper.displayName = 'LazyWrapper';

  // Attach preload method
  (LazyWrapper as React.FC<React.ComponentProps<T>> & { preload: () => void }).preload = preload;

  return LazyWrapper as React.FC<React.ComponentProps<T>> & { preload: () => void };
}

/**
 * Creates a lazy component that loads when it enters the viewport.
 *
 * @param loader - Function that imports the component
 * @param options - Configuration options
 * @returns Lazy-loaded component with intersection observer
 *
 * @example
 * const LazyVideo = createVisibleLazyComponent(
 *   () => import('./Video'),
 *   { rootMargin: '200px' }
 * );
 *
 * // Only loads when the component is about to enter viewport
 * <LazyVideo src="video.mp4" />
 */
export function createVisibleLazyComponent<T extends ComponentType<unknown>>(
  loader: () => Promise<{ default: T }>,
  options: LazyComponentOptions & { rootMargin?: string; threshold?: number } = {}
): React.FC<React.ComponentProps<T>> {
  const {
    fallback = <DefaultLoadingFallback />,
    errorFallback = DefaultErrorFallback,
    rootMargin = '200px',
    threshold = 0.1,
    onError,
  } = options;

  const LazyComponent = createLazyComponent(loader, {
    ...options,
    fallback,
    errorFallback,
    onError,
  });

  const VisibleLazyWrapper = forwardRef<unknown, React.ComponentProps<T>>(
    (props, ref) => {
      const [isVisible, setIsVisible] = React.useState(false);
      const [hasLoaded, setHasLoaded] = React.useState(false);
      const elementRef = React.useRef<HTMLDivElement>(null);

      React.useEffect(() => {
        const element = elementRef.current;
        if (!element || typeof IntersectionObserver === 'undefined') {
          setIsVisible(true);
          return;
        }

        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          },
          { rootMargin, threshold }
        );

        observer.observe(element);

        return () => {
          observer.disconnect();
        };
      }, []);

      React.useEffect(() => {
        if (isVisible && !hasLoaded) {
          loader().then(() => setHasLoaded(true));
        }
      }, [isVisible, hasLoaded]);

      return (
        <div ref={elementRef}>
          {isVisible ? (
            <LazyComponent {...(props as React.ComponentProps<T>)} ref={ref} />
          ) : (
            fallback
          )}
        </div>
      );
    }
  );

  VisibleLazyWrapper.displayName = 'VisibleLazyWrapper';

  return VisibleLazyWrapper as React.FC<React.ComponentProps<T>>;
}

/**
 * Preloads multiple lazy components in parallel.
 *
 * @param loaders - Array of loader functions
 * @returns Promise that resolves when all components are loaded
 *
 * @example
 * // Preload components on app initialization
 * preloadComponents([
 *   () => import('./Dashboard'),
 *   () => import('./Charts'),
 *   () => import('./DataTable'),
 * ]);
 */
export async function preloadComponents(
  loaders: Array<() => Promise<unknown>>
): Promise<void> {
  await Promise.all(loaders.map((loader) => loader()));
}

/**
 * Creates a lazy component with retry capability.
 *
 * @param loader - Function that imports the component
 * @param options - Configuration options including retry settings
 * @returns Lazy-loaded component with retry
 *
 * @example
 * const LazyDataGrid = createRetryableLazyComponent(
 *   () => import('./DataGrid'),
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 */
export function createRetryableLazyComponent<T extends ComponentType<unknown>>(
  loader: () => Promise<{ default: T }>,
  options: LazyComponentOptions & { maxRetries?: number; retryDelay?: number } = {}
): React.FC<React.ComponentProps<T>> {
  const { maxRetries = 3, retryDelay = 1000, ...lazyOptions } = options;

  let retryCount = 0;

  const retryableLoader = async (): Promise<{ default: T }> => {
    try {
      const result = await loader();
      retryCount = 0; // Reset on success
      return result;
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return retryableLoader();
      }
      throw error;
    }
  };

  return createLazyComponent(retryableLoader, lazyOptions);
}

/**
 * Higher-order component that adds lazy loading to any component.
 *
 * @param Component - The component to wrap
 * @param options - Configuration options
 * @returns Lazy-loaded version of the component
 *
 * @example
 * const LazyDataTable = withLazyLoading(DataTable, {
 *   fallback: <TableSkeleton rows={10} />,
 * });
 */
export function withLazyLoading<T extends ComponentType<unknown>>(
  Component: T,
  options: LazyComponentOptions = {}
): React.FC<React.ComponentProps<T>> {
  return createLazyComponent(
    () => Promise.resolve({ default: Component }),
    options
  );
}

/**
 * Creates a lazy component that loads after a delay.
 * Useful for non-critical components that shouldn't block initial render.
 *
 * @param loader - Function that imports the component
 * @param delay - Delay in milliseconds before loading
 * @param options - Configuration options
 * @returns Delayed lazy component
 *
 * @example
 * // Load analytics component after 2 seconds
 * const LazyAnalytics = createDelayedLazyComponent(
 *   () => import('./Analytics'),
 *   2000
 * );
 */
export function createDelayedLazyComponent<T extends ComponentType<unknown>>(
  loader: () => Promise<{ default: T }>,
  delay: number,
  options: LazyComponentOptions = {}
): React.FC<React.ComponentProps<T>> {
  const { fallback = <DefaultLoadingFallback />, ...restOptions } = options;

  const LazyComponent = createLazyComponent(loader, {
    ...restOptions,
    fallback: null,
  });

  const DelayedWrapper: React.FC<React.ComponentProps<T>> = (props) => {
    const [shouldLoad, setShouldLoad] = React.useState(false);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, delay);

      return () => clearTimeout(timer);
    }, []);

    if (!shouldLoad) {
      return <>{fallback}</>;
    }

    return <LazyComponent {...props} />;
  };

  return DelayedWrapper;
}

export default createLazyComponent;
