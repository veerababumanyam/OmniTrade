/**
 * useSkipToContent - Generates skip links for keyboard navigation
 * Implements WCAG 2.1 AA requirement for bypass blocks (2.4.1)
 *
 * Features:
 * - Generate skip links for keyboard navigation
 * - Support for multiple skip targets
 * - Hidden by default, visible on focus
 * - Manages focus movement to target elements
 */
import { useCallback, useMemo, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface SkipTarget {
  /** Unique identifier for the target */
  id: string;
  /** Label for the skip link */
  label: string;
  /** Optional description for screen readers */
  description?: string;
  /** Priority order (lower = higher priority, appears first) */
  priority?: number;
}

export interface UseSkipToContentOptions {
  /** Array of skip targets to generate links for */
  targets: SkipTarget[];
  /** Prefix for link IDs (default: 'skip-link') */
  idPrefix?: string;
  /** Callback when a skip link is activated */
  onSkip?: (targetId: string) => void;
}

export interface SkipLink {
  /** Unique ID for the link element */
  id: string;
  /** Target element ID to skip to */
  targetId: string;
  /** Accessible label for the link */
  label: string;
  /** Optional description for screen readers */
  description?: string;
  /** Handler to activate the skip link */
  activate: () => void;
  /** Props to spread onto the link element */
  linkProps: {
    id: string;
    href: string;
    onClick: (e: React.MouseEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}

export interface UseSkipToContentReturn {
  /** Array of skip link configurations */
  skipLinks: SkipLink[];
  /** Focus a specific target by ID */
  focusTarget: (targetId: string) => void;
  /** Get props for a target element to ensure it can receive focus */
  getTargetProps: (targetId: string) => { id: string; tabIndex: -1 };
  /** Currently active target ID (if any) */
  activeTarget: string | null;
}

// ============================================================================
// Default Targets
// ============================================================================

export const DEFAULT_SKIP_TARGETS: SkipTarget[] = [
  { id: 'main-content', label: 'Skip to main content', priority: 1 },
  { id: 'navigation', label: 'Skip to navigation', priority: 2 },
  { id: 'search', label: 'Skip to search', priority: 3 },
];

// ============================================================================
// Utilities
// ============================================================================

/**
 * Ensures a target element can receive focus by setting tabIndex if needed
 */
function ensureFocusable(element: HTMLElement): void {
  if (element.tabIndex < 0) {
    element.tabIndex = -1;
  }
}

/**
 * Moves focus to a target element with smooth scrolling
 */
function moveToTarget(targetId: string): boolean {
  const target = document.getElementById(targetId);
  if (!target) {
    console.warn(`SkipToContent: Target element "${targetId}" not found`);
    return false;
  }

  // Ensure the element can receive focus
  ensureFocusable(target);

  // Scroll to element
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Focus the element
  target.focus({ preventScroll: true });

  return true;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for generating skip-to-content links for keyboard navigation.
 * Essential for meeting WCAG 2.4.1 (Bypass Blocks) requirement.
 *
 * @param options - Configuration options for skip links
 * @returns Object containing skip links and utility functions
 *
 * @example
 * // Basic usage with default targets
 * const { skipLinks, getTargetProps } = useSkipToContent({
 *   targets: [
 *     { id: 'main-content', label: 'Skip to main content' },
 *     { id: 'sidebar', label: 'Skip to sidebar' },
 *   ],
 * });
 *
 * return (
 *   <>
 *     {skipLinks.map((link) => (
 *       <a key={link.id} {...link.linkProps}>{link.label}</a>
 *     ))}
 *     <nav id="navigation" {...getTargetProps('navigation')}>
 *       ...
 *     </nav>
 *     <main id="main-content" {...getTargetProps('main-content')}>
 *       ...
 *     </main>
 *   </>
 * );
 *
 * @example
 * // With callback
 * const { skipLinks } = useSkipToContent({
 *   targets: DEFAULT_SKIP_TARGETS,
 *   onSkip: (targetId) => {
 *     analytics.track('skip_link_used', { target: targetId });
 *   },
 * });
 */
export function useSkipToContent(
  options: UseSkipToContentOptions
): UseSkipToContentReturn {
  const { targets, idPrefix = 'skip-link', onSkip } = options;

  // Track active skip link for styling
  const [activeTarget, setActiveTarget] = useState<string | null>(null);

  // Focus a specific target
  const focusTarget = useCallback(
    (targetId: string) => {
      const success = moveToTarget(targetId);
      if (success) {
        setActiveTarget(targetId);
        onSkip?.(targetId);
      }
    },
    [onSkip]
  );

  // Sort targets by priority
  const sortedTargets = useMemo(() => {
    return [...targets].sort((a, b) => {
      const priorityA = a.priority ?? 999;
      const priorityB = b.priority ?? 999;
      return priorityA - priorityB;
    });
  }, [targets]);

  // Generate skip links
  const skipLinks = useMemo<SkipLink[]>(() => {
    return sortedTargets.map((target, index) => {
      const linkId = `${idPrefix}-${index}`;

      const activate = () => {
        focusTarget(target.id);
      };

      const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        activate();
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      };

      return {
        id: linkId,
        targetId: target.id,
        label: target.label,
        description: target.description,
        activate,
        linkProps: {
          id: linkId,
          href: `#${target.id}`,
          onClick: handleClick,
          onKeyDown: handleKeyDown,
        },
      };
    });
  }, [sortedTargets, idPrefix, focusTarget]);

  // Get props for target elements
  const getTargetProps = useCallback(
    (targetId: string) => ({
      id: targetId,
      tabIndex: -1 as const,
    }),
    []
  );

  return {
    skipLinks,
    focusTarget,
    getTargetProps,
    activeTarget,
  };
}

export default useSkipToContent;
