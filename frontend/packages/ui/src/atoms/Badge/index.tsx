/**
 * Badge Component
 * Liquid Glass Design System - OmniTrade
 * Atomic Component - Z-axis: translateZ(2px)
 *
 * Features:
 * - Variants: default, primary, success, warning, error
 * - Sizes: xs, sm, md, lg
 * - Dot indicator
 * - Pill shape
 * - Solid variant
 * - Removable
 * - AI-readable metadata
 * - Signal: emit 'ui:badge:remove' on remove
 */

import React, { useCallback } from 'react';
import { cn } from '../../utils/cn';
import type { SignalTopic } from '../../signal-bus';
import { signalBus } from '../../signal-bus';
import styles from './styles.module.css';

// ============================================================================
// Types
// ============================================================================

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Show as dot indicator */
  dot?: boolean;
  /** Pill shape (rounded ends) */
  pill?: boolean;
  /** Solid background variant */
  solid?: boolean;
  /** Show remove button */
  removable?: boolean;
  /** Remove handler */
  onRemove?: () => void;
  /** Additional CSS class */
  className?: string;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Signal topic to emit on remove */
  signalTopic?: SignalTopic;
}

// ============================================================================
// Close Icon
// ============================================================================

const CloseIcon: React.FC = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="2" x2="8" y2="8" />
    <line x1="8" y1="2" x2="2" y2="8" />
  </svg>
);

// ============================================================================
// Badge Component
// ============================================================================

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pill = false,
  solid = false,
  removable = false,
  onRemove,
  className,
  'data-ai-readable': aiReadable = true,
  'data-testid': testId,
  signalTopic,
}) => {
  // Handle remove
  const handleRemove = useCallback(() => {
    if (signalTopic) {
      signalBus.publish(
        signalTopic,
        {
          variant,
          action: 'remove',
        },
        { source: 'Badge' }
      );
    }

    onRemove?.();
  }, [signalTopic, variant, onRemove]);

  // Build class names
  const badgeClasses = cn(
    styles.badge,
    styles[`badge--${variant}`],
    styles[`badge--${size}`],
    dot && styles['badge--dot'],
    pill && styles['badge--pill'],
    solid && styles['badge--solid']
  );

  // For dot variant, don't render content
  if (dot) {
    return (
      <span
        className={badgeClasses}
        data-ai-readable={aiReadable}
        data-testid={testId}
        aria-label={typeof children === 'string' ? children : undefined}
      />
    );
  }

  return (
    <span
      className={cn(badgeClasses, className)}
      data-ai-readable={aiReadable}
      data-testid={testId}
    >
      {children}

      {removable && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={handleRemove}
          aria-label="Remove"
        >
          <CloseIcon />
        </button>
      )}
    </span>
  );
};

Badge.displayName = 'Badge';

export default Badge;
