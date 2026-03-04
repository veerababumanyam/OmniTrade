/**
 * Card Component
 * Liquid Glass Design System - OmniTrade
 * Atomic-level component with compound pattern
 *
 * Features:
 * - Compound component pattern with sub-components
 * - Variants: elevated, outlined, flat, glass
 * - Size variants: sm, md, lg
 * - Interactive hover state support
 * - Signal bus integration
 * - AI-readable: true
 */

import { forwardRef, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardCoverProps,
  CardClickSignalData,
} from './types';
import styles from './styles.module.css';

// ============================================
// Card Sub-components
// ============================================

/** Card Cover for images or visual content */
function CardCover({
  src,
  alt = '',
  children,
  aspectRatio = '16/9',
  objectFit = 'cover',
  className,
}: CardCoverProps) {
  const aspectRatioClass = {
    '16/9': styles.coverAspectRatio169,
    '4/3': styles.coverAspectRatio43,
    '1/1': styles.coverAspectRatio11,
    '3/4': styles.coverAspectRatio34,
    'auto': undefined,
  }[aspectRatio];

  const objectFitClass = {
    cover: undefined,
    contain: styles.coverObjectFitContain,
    fill: styles.coverObjectFitFill,
    none: styles.coverObjectFitNone,
  }[objectFit];

  return (
    <div className={cn(styles.cover, aspectRatioClass, className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(styles.coverImage, objectFitClass)}
          loading="lazy"
        />
      ) : (
        <div className={styles.coverContent}>{children}</div>
      )}
    </div>
  );
}

/** Card Header with avatar, title, subtitle, and actions */
function CardHeader({
  children,
  avatar,
  title,
  subtitle,
  actions,
  size = 'md',
  className,
}: CardHeaderProps) {
  const hasContent = title || subtitle || actions || avatar || children;

  if (!hasContent) {
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
      {avatar && <div className={styles.avatar}>{avatar}</div>}
      {(title || subtitle) && (
        <div className={styles.headerContent}>
          {title && (
            <h3
              className={cn(
                styles.title,
                size === 'sm' && styles.titleSizeSm,
                size === 'lg' && styles.titleSizeLg
              )}
            >
              {title}
            </h3>
          )}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
      {children}
    </div>
  );
}

/** Card Body content area */
function CardBody({ children, size = 'md', className }: CardBodyProps) {
  if (!children) {
    return null;
  }

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
  if (!children) {
    return null;
  }

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

// ============================================
// Main Card Component
// ============================================

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
    children,
    variant = 'elevated',
    size = 'md',
    interactive = false,
    clickable = false,
    className,
    style,
    as: Component = 'article',
    onClick,
    testId,
    'data-ai-readable': aiReadable = true,
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
        event: event.nativeEvent,
        timestamp: Date.now(),
      };
      signalBus.publish('ui:card:click', signalData, { source: 'Card' });
    },
    [onClick]
  );

  const isClickable = clickable || !!onClick;

  return (
    <Component
      ref={ref as React.Ref<any>}
      className={cn(
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        variant === 'glass' && styles.glass,
        size === 'sm' && styles.sizeSm,
        size === 'md' && styles.sizeMd,
        size === 'lg' && styles.sizeLg,
        interactive && styles.interactive,
        isClickable && styles.clickable,
        className
      )}
      style={style}
      onClick={isClickable ? handleClick : onClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      data-testid={testId}
      data-ai-readable={aiReadable}
    >
      {children}
    </Component>
  );
});

// Type for Card component with sub-components
type CardComponent = typeof Card & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
  Cover: typeof CardCover;
};

// Export sub-components
(Card as CardComponent).Header = CardHeader;
(Card as CardComponent).Body = CardBody;
(Card as CardComponent).Footer = CardFooter;
(Card as CardComponent).Cover = CardCover;

export { CardHeader, CardBody, CardFooter, CardCover };

Card.displayName = 'Card';
CardHeader.displayName = 'Card.Header';
CardBody.displayName = 'Card.Body';
CardFooter.displayName = 'Card.Footer';
CardCover.displayName = 'Card.Cover';

export default Card as CardComponent;
