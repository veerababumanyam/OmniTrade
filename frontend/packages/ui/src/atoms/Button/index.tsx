/**
 * Button Component
 * Liquid Glass Design System - OmniTrade
 * Atomic Component - Z-axis: translateZ(4px)
 *
 * Features:
 * - Variants: primary, secondary, ghost, danger, link
 * - Sizes: sm, md, lg
 * - Loading state with spinner
 * - Full width option
 * - Icon support (leading/trailing)
 * - AI-readable metadata
 * - Signal: emit 'ui:button:click' on click
 */

import React, { forwardRef, useCallback, useRef } from 'react';
import { cn } from '../../utils/cn';
import { signalBus, type SignalTopic } from '../../signal-bus';
import styles from './styles.module.css';

// ============================================================================
// Types
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Make button full width of container */
  fullWidth?: boolean;
  /** Icon to show before the label */
  leadingIcon?: React.ReactNode;
  /** Icon to show after the label */
  trailingIcon?: React.ReactNode;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Signal topic to emit on click */
  signalTopic?: SignalTopic;
  /** Additional context for signal */
  signalContext?: Record<string, unknown>;
}

// ============================================================================
// Loading Spinner
// ============================================================================

const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => {
  const sizeMap = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const strokeWidth = size === 'sm' ? 2.5 : 2;

  return (
    <svg
      className={styles.spinner}
      width={sizeMap[size]}
      height={sizeMap[size]}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
};

// ============================================================================
// Button Component
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      leadingIcon,
      trailingIcon,
      className,
      onClick,
      'data-ai-readable': aiReadable = true,
      'data-testid': testId,
      signalTopic,
      signalContext,
      ...props
    },
    ref
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const mergedRef = ref || buttonRef;

    // Handle click with signal emission
    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (loading || disabled) return;

        // Emit signal if topic provided
        if (signalTopic) {
          signalBus.publish(
            signalTopic,
            {
              buttonLabel: typeof children === 'string' ? children : undefined,
              variant,
              size,
              ...signalContext,
            },
            { source: 'Button' }
          );
        }

        // Always emit UI event
        signalBus.publish(
          'ui:button:click',
          {
            variant,
            size,
            disabled: false,
          },
          { source: 'Button' }
        );

        onClick?.(event);
      },
      [loading, disabled, signalTopic, signalContext, variant, size, children, onClick]
    );

    // Build class names
    const buttonClasses = cn(
      styles.button,
      styles[`button--${variant}`],
      styles[`button--${size}`],
      fullWidth && styles['button--fullWidth'],
      loading && styles['button--loading'],
      disabled && styles['button--disabled'],
      className
    );

    return (
      <button
        ref={mergedRef}
        className={buttonClasses}
        disabled={disabled || loading}
        onClick={handleClick}
        data-ai-readable={aiReadable}
        data-testid={testId}
        aria-busy={loading}
        {...props}
      >
        {loading && <LoadingSpinner size={size} />}

        {!loading && leadingIcon && (
          <span className={cn(styles.icon, styles['icon--leading'])}>{leadingIcon}</span>
        )}

        {!loading && children}

        {!loading && trailingIcon && (
          <span className={cn(styles.icon, styles['icon--trailing'])}>{trailingIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
