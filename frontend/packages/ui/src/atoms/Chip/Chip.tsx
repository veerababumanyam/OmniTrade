/**
 * Chip Component
 * Liquid Glass Design System - OmniTrade
 * Atomic Component - Z-axis: translateZ(2px)
 *
 * Features:
 * - Filter tags/selections
 * - Avatar support
 * - Dismissible with close button
 * - Size variants: sm, md, lg
 * - Selectable state
 * - AI-readable metadata
 * - Signal: emit on dismiss and click
 */

import React, { forwardRef, useCallback } from 'react';
import { cn } from '../../utils/cn';
import type { SignalTopic } from '../../signal-bus';
import { signalBus } from '../../signal-bus';
import styles from './styles.module.css';

// ============================================================================
// Types
// ============================================================================

export type ChipSize = 'sm' | 'md' | 'lg';
export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

export interface ChipProps {
  /** Label text */
  label: React.ReactNode;
  /** Avatar element to display before label */
  avatar?: React.ReactElement;
  /** Icon to display before label */
  icon?: React.ReactElement;
  /** Show dismiss button and handle dismissal */
  onDismiss?: () => void;
  /** Selected/active state */
  selected?: boolean;
  /** Click handler for selectable chips */
  onClick?: () => void;
  /** Visual style variant */
  variant?: ChipVariant;
  /** Size variant */
  size?: ChipSize;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Signal topic to emit on interactions */
  signalTopic?: SignalTopic;
}

// ============================================================================
// Close Icon
// ============================================================================

const CloseIcon: React.FC<{ size?: ChipSize }> = ({ size = 'md' }) => (
  <svg
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={cn(styles.closeIcon, styles[`closeIcon--${size}`])}
  >
    <line x1="2" y1="2" x2="8" y2="8" />
    <line x1="8" y1="2" x2="2" y2="8" />
  </svg>
);

// ============================================================================
// Chip Component
// ============================================================================

export const Chip = forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      label,
      avatar,
      icon,
      onDismiss,
      selected = false,
      onClick,
      variant = 'default',
      size = 'md',
      disabled = false,
      className,
      'data-ai-readable': aiReadable = true,
      'data-testid': testId,
      signalTopic,
    },
    ref
  ) => {
    const isClickable = !!onClick && !disabled;
    const isDismissible = !!onDismiss && !disabled;

    // Handle click
    const handleClick = useCallback(() => {
      if (disabled) return;

      if (signalTopic) {
        signalBus.publish(
          signalTopic,
          {
            label,
            variant,
            selected: !selected,
            action: 'click' as const,
          },
          { source: 'Chip' }
        );
      }

      onClick?.();
    }, [disabled, signalTopic, label, variant, selected, onClick]);

    // Handle dismiss
    const handleDismiss = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();

        if (signalTopic) {
          signalBus.publish(
            signalTopic,
            {
              label,
              variant,
              action: 'dismiss' as const,
            },
            { source: 'Chip' }
          );
        }

        onDismiss?.();
      },
      [signalTopic, label, variant, onDismiss]
    );

    // Handle keyboard interaction
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }

        // Backspace or Delete to dismiss
        if (isDismissible && (event.key === 'Backspace' || event.key === 'Delete')) {
          event.preventDefault();
          onDismiss?.();
        }
      },
      [disabled, handleClick, isDismissible, onDismiss]
    );

    // Build class names
    const chipClasses = cn(
      styles.chip,
      styles[`chip--${size}`],
      styles[`chip--${variant}`],
      selected && styles['chip--selected'],
      isClickable && styles['chip--clickable'],
      disabled && styles['chip--disabled'],
      className
    );

    return (
      <div
        ref={ref}
        className={chipClasses}
        onClick={isClickable ? handleClick : undefined}
        onKeyDown={isClickable ? handleKeyDown : undefined}
        tabIndex={isClickable ? 0 : undefined}
        role={isClickable ? 'button' : undefined}
        aria-pressed={isClickable ? selected : undefined}
        aria-disabled={disabled}
        data-ai-readable={aiReadable}
        data-testid={testId}
      >
        {avatar && <span className={styles.avatar}>{avatar}</span>}

        {icon && !avatar && <span className={styles.icon}>{icon}</span>}

        <span className={styles.label}>{label}</span>

        {isDismissible && (
          <button
            type="button"
            className={styles.dismissButton}
            onClick={handleDismiss}
            aria-label={`Remove ${typeof label === 'string' ? label : 'chip'}`}
            tabIndex={-1}
          >
            <CloseIcon size={size} />
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = 'Chip';

export default Chip;
