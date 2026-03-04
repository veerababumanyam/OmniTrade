/**
 * SkipToContent Component
 * Liquid Glass Design System - OmniTrade
 * Atomic Component - Accessibility Enhancement
 *
 * Features:
 * - Renders skip links for keyboard navigation
 * - Configurable targets with custom labels
 * - Hidden by default, visible on focus
 * - WCAG 2.1 AA compliant (2.4.1 Bypass Blocks)
 */

import React, { forwardRef, useMemo } from 'react';
import { cn } from '../../utils/cn';
import {
  useSkipToContent,
  type SkipTarget,
} from '../../hooks/useSkipToContent';
import styles from './styles.module.css';

// ============================================================================
// Types
// ============================================================================

export interface SkipToContentProps extends React.HTMLAttributes<HTMLElement> {
  /** Skip targets configuration */
  targets?: SkipTarget[];
  /** Custom class name for the container */
  className?: string;
  /** Custom class name for individual links */
  linkClassName?: string;
  /** Render as nav element instead of div (default: true) */
  asNav?: boolean;
  /** Visual style variant */
  variant?: 'default' | 'minimal' | 'prominent';
  /** Position of skip links */
  position?: 'top-left' | 'top-center' | 'top-right';
  /** Include a visually hidden label for the nav */
  navLabel?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// ============================================================================
// Default Targets
// ============================================================================

const DEFAULT_TARGETS: SkipTarget[] = [
  { id: 'main-content', label: 'Skip to main content', priority: 1 },
  { id: 'navigation', label: 'Skip to navigation', priority: 2 },
  { id: 'search', label: 'Skip to search', priority: 3 },
];

// ============================================================================
// Skip Link Component
// ============================================================================

interface SkipLinkProps {
  id: string;
  href: string;
  label: string;
  description?: string;
  variant: 'default' | 'minimal' | 'prominent';
  linkClassName?: string;
  onClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(
  (
    {
      id,
      href,
      label,
      description,
      variant,
      linkClassName,
      onClick,
      onKeyDown,
    },
    ref
  ) => {
    return (
      <a
        ref={ref}
        id={id}
        href={href}
        className={cn(
          styles.skipLink,
          styles[`skipLink--${variant}`],
          linkClassName
        )}
        onClick={onClick}
        onKeyDown={onKeyDown}
        aria-label={description}
        data-testid={`skip-link-${id}`}
      >
        {label}
      </a>
    );
  }
);

SkipLink.displayName = 'SkipLink';

// ============================================================================
// Internal Container Components
// ============================================================================

interface ContainerProps {
  asNav: boolean;
  className: string;
  navLabel: string;
  testId?: string;
  children: React.ReactNode;
  props: Omit<React.HTMLAttributes<HTMLElement>, 'ref'>;
  ref?: React.Ref<HTMLElement>;
}

const NavContainer = forwardRef<HTMLElement, Omit<ContainerProps, 'asNav'>>(
  ({ className, navLabel, testId, children, props, ...rest }, ref) => (
    <nav
      ref={ref}
      className={className}
      aria-label={navLabel}
      data-testid={testId}
      {...props}
      {...rest}
    >
      {children}
    </nav>
  )
);

NavContainer.displayName = 'NavContainer';

const DivContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'asNav'>>(
  ({ className, navLabel, testId, children, props, ...rest }, ref) => (
    <div
      ref={ref}
      className={className}
      role="navigation"
      aria-label={navLabel}
      data-testid={testId}
      {...props}
      {...rest}
    >
      {children}
    </div>
  )
);

DivContainer.displayName = 'DivContainer';

// ============================================================================
// SkipToContent Component
// ============================================================================

/**
 * SkipToContent component renders skip links for keyboard navigation.
 * These links allow keyboard users to bypass repetitive content and
 * navigate directly to main sections of the page.
 *
 * @example
 * // Basic usage with default targets
 * <SkipToContent />
 *
 * @example
 * // With custom targets
 * <SkipToContent
 *   targets={[
 *     { id: 'main', label: 'Skip to main content' },
 *     { id: 'sidebar', label: 'Skip to sidebar' },
 *     { id: 'footer', label: 'Skip to footer' },
 *   ]}
 * />
 *
 * @example
 * // Prominent variant for high visibility
 * <SkipToContent variant="prominent" />
 *
 * @example
 * // Complete page structure
 * <div>
 *   <SkipToContent targets={[{ id: 'main', label: 'Skip to content' }]} />
 *   <header>...</header>
 *   <nav id="navigation">...</nav>
 *   <main id="main">...</main>
 *   <footer>...</footer>
 * </div>
 */
export const SkipToContent = forwardRef<HTMLElement, SkipToContentProps>(
  (
    {
      targets = DEFAULT_TARGETS,
      className,
      linkClassName,
      asNav = true,
      variant = 'default',
      position = 'top-left',
      navLabel = 'Skip links',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Generate skip links using the hook
    const { skipLinks } = useSkipToContent({
      targets,
      idPrefix: 'skip-link',
    });

    // Memoize the rendered links
    const renderedLinks = useMemo(() => {
      return skipLinks.map((link) => (
        <SkipLink
          key={link.id}
          id={link.id}
          href={link.linkProps.href}
          label={link.label}
          description={link.description}
          variant={variant}
          linkClassName={linkClassName}
          onClick={link.linkProps.onClick}
          onKeyDown={link.linkProps.onKeyDown}
        />
      ));
    }, [skipLinks, variant, linkClassName]);

    // Container classes
    const containerClasses = cn(
      styles.container,
      styles[`container--${position}`],
      className
    );

    // Common props for containers
    const containerProps = {
      className: containerClasses,
      navLabel,
      testId,
      children: renderedLinks,
      props: props as Omit<React.HTMLAttributes<HTMLElement>, 'ref'>,
    };

    // Render as nav or div based on asNav prop
    if (asNav) {
      return (
        <NavContainer
          ref={ref}
          {...containerProps}
        />
      );
    }

    return (
      <DivContainer
        ref={ref as React.Ref<HTMLDivElement>}
        {...containerProps}
      />
    );
  }
);

SkipToContent.displayName = 'SkipToContent';

// ============================================================================
// Exports
// ============================================================================

export default SkipToContent;

// Re-export types for convenience
export type { SkipTarget } from '../../hooks/useSkipToContent';
