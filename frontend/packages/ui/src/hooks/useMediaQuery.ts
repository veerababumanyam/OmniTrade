/**
 * useMediaQuery - Responsive breakpoints in hooks
 *
 * Provides hooks for responsive design using media queries.
 * Supports both string queries and predefined breakpoint helpers.
 */
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

/**
 * Breakpoint definitions for OmniTrade design system.
 */
export interface Breakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

/**
 * Default breakpoints matching OmniTrade design tokens.
 */
export const DEFAULT_BREAKPOINTS: Breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  xxl: '1536px',
};

/**
 * Options for useMediaQuery hook.
 */
export interface UseMediaQueryOptions {
  /** Whether to get initial value from server-side (default: false) */
  getDefault?: () => boolean;
  /** Custom breakpoints (default: DEFAULT_BREAKPOINTS) */
  breakpoints?: Breakpoints;
}

// Store for media query listeners
const mediaQueryListeners = new Map<string, Set<() => void>>();
const mediaQueryStates = new Map<string, boolean>();

function getMediaQuerySnapshot(query: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!mediaQueryStates.has(query)) {
    mediaQueryStates.set(query, window.matchMedia(query).matches);
  }

  return mediaQueryStates.get(query) ?? false;
}

function subscribeToMediaQuery(query: string, callback: () => void): () => void {
  if (!mediaQueryListeners.has(query)) {
    mediaQueryListeners.set(query, new Set());

    // Set up the listener once
    const mediaQueryList = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => {
      mediaQueryStates.set(query, e.matches);
      mediaQueryListeners.get(query)?.forEach((cb) => cb());
    };

    mediaQueryList.addEventListener('change', handleChange);

    // Store initial value
    mediaQueryStates.set(query, mediaQueryList.matches);
  }

  mediaQueryListeners.get(query)?.add(callback);

  return () => {
    mediaQueryListeners.get(query)?.delete(callback);
  };
}

/**
 * Hook for matching a CSS media query.
 *
 * @param query - CSS media query string
 * @param options - Configuration options
 * @returns Whether the media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 *
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * return <DesktopLayout />;
 *
 * @example
 * // With complex query
 * const isHighDPI = useMediaQuery('(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)');
 *
 * @example
 * // With hover capability
 * const canHover = useMediaQuery('(hover: hover)');
 */
export function useMediaQuery(
  query: string,
  options: UseMediaQueryOptions = {}
): boolean {
  const { getDefault } = options;

  const subscribe = useCallback(
    (callback: () => void) => subscribeToMediaQuery(query, callback),
    [query]
  );

  const getSnapshot = useCallback(() => getMediaQuerySnapshot(query), [query]);

  const getServerSnapshot = useCallback(
    () => getDefault?.() ?? false,
    [getDefault]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Hook for responsive design with predefined breakpoints.
 *
 * @param options - Configuration options
 * @returns Object with breakpoint matches
 *
 * @example
 * const { isXs, isSm, isMd, isLg, isXl } = useBreakpoints();
 *
 * return (
 *   <div>
 *     {isMd ? <DesktopNav /> : <MobileNav />}
 *   </div>
 * );
 */
export function useBreakpoints(options: UseMediaQueryOptions = {}): {
  /** Matches xs breakpoint (>= 320px) */
  isXs: boolean;
  /** Matches sm breakpoint (>= 640px) */
  isSm: boolean;
  /** Matches md breakpoint (>= 768px) */
  isMd: boolean;
  /** Matches lg breakpoint (>= 1024px) */
  isLg: boolean;
  /** Matches xl breakpoint (>= 1280px) */
  isXl: boolean;
  /** Matches xxl breakpoint (>= 1536px) */
  isXxl: boolean;
  /** Is mobile (< 768px) */
  isMobile: boolean;
  /** Is tablet (>= 768px and < 1024px) */
  isTablet: boolean;
  /** Is desktop (>= 1024px) */
  isDesktop: boolean;
  /** Current breakpoint name */
  current: keyof Breakpoints;
} {
  const breakpoints = options.breakpoints ?? DEFAULT_BREAKPOINTS;

  const isXs = useMediaQuery(`(min-width: ${breakpoints.xs})`, options);
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm})`, options);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md})`, options);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg})`, options);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl})`, options);
  const isXxl = useMediaQuery(`(min-width: ${breakpoints.xxl})`, options);

  // Determine current breakpoint
  let current: keyof Breakpoints = 'xs';
  if (isXxl) current = 'xxl';
  else if (isXl) current = 'xl';
  else if (isLg) current = 'lg';
  else if (isMd) current = 'md';
  else if (isSm) current = 'sm';

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    isMobile: !isMd,
    isTablet: isMd && !isLg,
    isDesktop: isLg,
    current,
  };
}

/**
 * Hook for matching a minimum width breakpoint.
 *
 * @param breakpoint - Minimum width (string or number in px)
 * @param options - Configuration options
 * @returns Whether the viewport is at least this width
 *
 * @example
 * const isWideEnough = useMinWidth(1024);
 * // or
 * const isWideEnough = useMinWidth('64rem');
 */
export function useMinWidth(
  breakpoint: string | number,
  options: UseMediaQueryOptions = {}
): boolean {
  const query =
    typeof breakpoint === 'number'
      ? `(min-width: ${breakpoint}px)`
      : `(min-width: ${breakpoint})`;

  return useMediaQuery(query, options);
}

/**
 * Hook for matching a maximum width breakpoint.
 *
 * @param breakpoint - Maximum width (string or number in px)
 * @param options - Configuration options
 * @returns Whether the viewport is at most this width
 *
 * @example
 * const isNarrow = useMaxWidth(768);
 */
export function useMaxWidth(
  breakpoint: string | number,
  options: UseMediaQueryOptions = {}
): boolean {
  const query =
    typeof breakpoint === 'number'
      ? `(max-width: ${breakpoint}px)`
      : `(max-width: ${breakpoint})`;

  return useMediaQuery(query, options);
}

/**
 * Hook for matching a width range.
 *
 * @param min - Minimum width
 * @param max - Maximum width
 * @param options - Configuration options
 * @returns Whether the viewport is within this range
 *
 * @example
 * const isTablet = useWidthRange(768, 1024);
 */
export function useWidthRange(
  min: string | number,
  max: string | number,
  options: UseMediaQueryOptions = {}
): boolean {
  const minQuery =
    typeof min === 'number' ? `(min-width: ${min}px)` : `(min-width: ${min})`;
  const maxQuery =
    typeof max === 'number' ? `(max-width: ${max}px)` : `(max-width: ${max})`;

  return useMediaQuery(`${minQuery} and ${maxQuery}`, options);
}

/**
 * Hook for detecting user's color scheme preference.
 *
 * @param options - Configuration options
 * @returns Whether the user prefers dark mode
 *
 * @example
 * const prefersDark = usePrefersDarkMode();
 * // Use to set initial theme
 */
export function usePrefersDarkMode(
  options: UseMediaQueryOptions = {}
): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)', options);
}

/**
 * Hook for detecting user's reduced motion preference.
 *
 * @param options - Configuration options
 * @returns Whether the user prefers reduced motion
 *
 * @example
 * const prefersReducedMotion = usePrefersReducedMotion();
 *
 * const animation = prefersReducedMotion ? 'none' : 'slide-in';
 */
export function usePrefersReducedMotion(
  options: UseMediaQueryOptions = {}
): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)', options);
}

/**
 * Hook for detecting user's contrast preference.
 *
 * @param options - Configuration options
 * @returns Whether the user prefers high contrast
 */
export function usePrefersHighContrast(
  options: UseMediaQueryOptions = {}
): boolean {
  return useMediaQuery('(prefers-contrast: more)', options);
}

/**
 * Hook for detecting touch capability.
 *
 * @param options - Configuration options
 * @returns Whether the device supports touch
 */
export function useTouchDevice(options: UseMediaQueryOptions = {}): boolean {
  return useMediaQuery('(pointer: coarse)', options);
}

/**
 * Hook for detecting hover capability.
 *
 * @param options - Configuration options
 * @returns Whether the device supports hover
 */
export function useHoverCapable(options: UseMediaQueryOptions = {}): boolean {
  return useMediaQuery('(hover: hover)', options);
}

/**
 * Hook for detecting landscape orientation.
 *
 * @param options - Configuration options
 * @returns Whether the device is in landscape orientation
 */
export function useLandscape(options: UseMediaQueryOptions = {}): boolean {
  return useMediaQuery('(orientation: landscape)', options);
}

/**
 * Hook for detecting portrait orientation.
 *
 * @param options - Configuration options
 * @returns Whether the device is in portrait orientation
 */
export function usePortrait(options: UseMediaQueryOptions = {}): boolean {
  return useMediaQuery('(orientation: portrait)', options);
}

export default useMediaQuery;
