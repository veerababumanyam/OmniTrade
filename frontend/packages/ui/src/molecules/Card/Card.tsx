/**
 * Card Component
 * Liquid Glass Design System - OmniTrade
 *
 * A versatile card component with refractive volume effect,
 * hover elevation, and selectable state.
 */

import { forwardRef, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardSkeletonProps,
  CardClickSignalData,
} from './types';
import styles from './styles.module.css';

// ============================================
// Card Sub-components
// ============================================

/** Card Header with title, subtitle, and action slots */
function CardHeader({
  title,
  subtitle,
  actions,
  checkbox,
  size = 'md',
  className,
}: CardHeaderProps) {
  if (!title && !subtitle && !actions && !checkbox) {
    return null;
  }

  return (
    <div
      className={cn(
        styles.header,
        size === 'sm' && styles.headerSizeSm,
        size === 'md' && styles.headerSizeMd,
        size === 'lg' && styles.headerSizeLg,
        className
      )}
    >
      {checkbox && <div className={styles.checkbox}>{checkbox}</div>}
      <div className={styles.headerContent}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

/** Card Body content area */
function CardBody({ children, size = 'md', className }: CardBodyProps) {
  return (
    <div
      className={cn(
        styles.body,
        size === 'sm' && styles.bodySizeSm,
        size === 'md' && styles.bodySizeMd,
        size === 'lg' && styles.bodySizeLg,
        className
      )}
    >
      <div className={styles.bodyContent}>{children}</div>
    </div>
  );
}

/** Card Footer with action alignment */
function CardFooter({
  children,
  size = 'md',
  align = 'right',
  className,
}: CardFooterProps) {
  return (
    <div
      className={cn(
        styles.footer,
        size === 'sm' && styles.footerSizeSm,
        size === 'md' && styles.footerSizeMd,
        size === 'lg' && styles.footerSizeLg,
        align === 'left' && styles.footerAlignLeft,
        align === 'center' && styles.footerAlignCenter,
        align === 'right' && styles.footerAlignRight,
        align === 'between' && styles.footerAlignBetween,
        className
      )}
    >
      {children}
    </div>
  );
}

/** Card Skeleton for loading state */
function CardSkeleton({
  size = 'md',
  header = true,
  lines = 3,
  footer = false,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        styles.card,
        styles.skeleton,
        size === 'sm' && styles.sizeSm,
        size === 'md' && styles.sizeMd,
        size === 'lg' && styles.sizeLg,
        className
      )}
    >
      {header && (
        <>
          <div
            className={cn(
              styles.skeletonHeader,
              size === 'sm' && styles.headerSizeSm,
              size === 'md' && styles.headerSizeMd,
              size === 'lg' && styles.headerSizeLg
            )}
          >
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonSubtitle} />
          </div>
          <div className={cn(styles.divider, size === 'sm' ? styles.bodySizeSm : size === 'md' ? styles.bodySizeMd : styles.bodySizeLg)} style={{ margin: '0', padding: '0 var(--card-padding)', height: '1px' }} />
        </>
      )}
      <div
        className={cn(
          styles.skeletonBody,
          size === 'sm' && styles.bodySizeSm,
          size === 'md' && styles.bodySizeMd,
          size === 'lg' && styles.bodySizeLg
        )}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={styles.skeletonLine} />
        ))}
      </div>
      {footer && (
        <div
          className={cn(
            styles.skeletonFooter,
            size === 'sm' && styles.footerSizeSm,
            size === 'md' && styles.footerSizeMd,
            size === 'lg' && styles.footerSizeLg
          )}
        >
          <div className={styles.skeletonButton} />
          <div className={styles.skeletonButton} />
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Card Component
// ============================================

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
    title,
    subtitle,
    actions,
    children,
    footer,
    variant = 'default',
    size = 'md',
    hoverable = false,
    selectable = false,
    selected = false,
    loading = false,
    onClick,
    className,
    as: Component = 'article',
    testId,
  },
  ref
) {
  // Emit signal on click
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (onClick) {
        onClick(event);
      }

      // Emit signal for inter-module communication
      const signalData: CardClickSignalData = {
        selected,
        event: event.nativeEvent,
      };
      signalBus.publish('ui:card:click', signalData, { source: 'Card' });
    },
    [onClick, selected]
  );

  // Show skeleton during loading
  if (loading) {
    return (
      <CardSkeleton
        size={size}
        header={!!title || !!subtitle}
        lines={3}
        footer={!!footer}
        className={className}
      />
    );
  }

  const hasHeader = title || subtitle || actions || selectable;
  const hasFooter = !!footer;

  return (
    <Component
      ref={ref as React.Ref<any>}
      className={cn(
        styles.card,
        variant === 'default' && styles.default,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        size === 'sm' && styles.sizeSm,
        size === 'md' && styles.sizeMd,
        size === 'lg' && styles.sizeLg,
        hoverable && styles.hoverable,
        selectable && styles.selectable,
        selected && styles.selected,
        className
      )}
      onClick={selectable || onClick ? handleClick : onClick}
      tabIndex={selectable ? 0 : undefined}
      role={selectable ? 'button' : undefined}
      aria-pressed={selectable ? selected : undefined}
      data-testid={testId}
    >
      {hasHeader && (
        <CardHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
          size={size}
        />
      )}

      {hasHeader && children && <div className={styles.divider} style={{ margin: 'var(--header-gap) 0 0' }} />}

      {children && <CardBody size={size}>{children}</CardBody>}

      {hasFooter && children && <div className={styles.divider} style={{ margin: '0 0 var(--header-gap)' }} />}

      {hasFooter && <CardFooter size={size}>{footer}</CardFooter>}
    </Component>
  );
});

// Type for Card component with sub-components
type CardComponent = typeof Card & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
  Skeleton: typeof CardSkeleton;
};

// Export sub-components
(Card as CardComponent).Header = CardHeader;
(Card as CardComponent).Body = CardBody;
(Card as CardComponent).Footer = CardFooter;
(Card as CardComponent).Skeleton = CardSkeleton;

export { CardHeader, CardBody, CardFooter, CardSkeleton };

export default Card as CardComponent;
