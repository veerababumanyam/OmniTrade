/**
 * Card Component (Compound Pattern)
 * OmniTrade UI Library - Liquid Glass Design System
 *
 * A versatile card component with compound sub-components:
 * supporting the compound pattern for flexible composition.
 */

import { forwardRef, from 'react';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  CardProps,
  CardHeaderProps
  CardBodyProps
  CardFooterProps
  CardClickSignalData,
} from './types';
import styles from './styles.module.css';

// ============================================
// Card Sub-components
// ============================================

interface CardHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface CardBodyProps {
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface CardFooterProps {
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right' | 'between';
  className?: string;
}

// ============================================
// Card Header Component
// ============================================
const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle
  actions
  size = 'md'
  className
}) => {
  if (!title && !subtitle && !actions) {
    return null;
  }

  return (
    <div className={styles.cardHeader}>
      <div className={styles.headerContent}>
        {title && <h3 className={styles.cardTitle}>{title}</h3>}
        {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.cardActions}>{actions}</div>}
    </div>
  );
};

// ============================================
// Card Body Component
// ============================================
const CardBody: React.FC<CardBodyProps> = ({
  children
  size = 'md'
  className
}) => {
  return (
    <div className={cn(styles.cardBody, styles[`body--${size}`])}>
      {children}
    </div>
  );
};

// ============================================
// Card Footer Component
// ============================================
const CardFooter: React.FC<CardFooterProps> = ({
  children
  size = 'md'
  align = 'right'
  className
}) => {
  return (
    <div className={cn(
      styles.cardFooter,
      styles[`footer--${size}`],
      styles[`footer--${align}`]
    )}>
      {children}
    </div>
  );
};

// ============================================
// Main Card Component with Compound Pattern
// ============================================
export const CardCompound = forwardRef<HTMLDivElement, CardProps>(
  {
    variant = 'default',
    size = 'md',
    hoverable = false,
    interactive = false,
    className,
    children,
    as: Component = 'div',
    ...props
  },
  ref
) => {
  // Combine variant classes
  const cardClasses = cn(
    styles.card,
    styles[`variant--${variant}`],
    styles[`size--${size}`],
    hoverable && styles.hoverable,
    interactive && styles.interactive,
    className
  );

  // Determine if interactive for accessibility
  const isInteractive = interactive || hoverable;

  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={cardClasses}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      aria-pressed={isInteractive ? !!pressed : undefined}
      data-testid={testId}
    >
      {children}
    </Component>
  );
});

// ============================================
// Compound Pattern Support
// ============================================

CardCompound.Header = CardHeader;
CardCompound.Body = CardBody;
CardCompound.Footer = CardFooter;

// Type for compound component
type CardComponent = typeof CardCompound & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
};

export default CardCompound;
