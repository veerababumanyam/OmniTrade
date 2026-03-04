/**
 * Checkbox Component
 * Liquid Glass Design System - OmniTrade
 * Atomic Component - Z-axis: translateZ(2px)
 *
 * Features:
 * - Indeterminate state
 * - Custom icons
 * - Error state
 * - AI-readable metadata
 * - Signal: emit 'ui:checkbox:change' on change
 */

import React, { forwardRef, useCallback, useId } from 'react';
import { cn } from '../../utils/cn';
import type { SignalTopic } from '../../signal-bus';
import { signalBus } from '../../signal-bus';
import styles from './styles.module.css';

// ============================================================================
// Types
// ============================================================================

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Signal topic to emit on change */
  signalTopic?: SignalTopic;
}

// ============================================================================
// Check Icon
// ============================================================================

const CheckIcon: React.FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="2,6 4.5,8.5 10,3" />
  </svg>
);

// ============================================================================
// Minus Icon (for indeterminate)
// ============================================================================

const MinusIcon: React.FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="2" y1="6" x2="10" y2="6" />
  </svg>
);

// ============================================================================
// Checkbox Component
// ============================================================================

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      indeterminate = false,
      disabled,
      className,
      id: providedId,
      onChange,
      checked,
      'data-ai-readable': aiReadable = true,
      'data-testid': testId,
      signalTopic,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = providedId || generatedId;

    // Handle change with signal emission
    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (signalTopic) {
          signalBus.publish(
            signalTopic,
            {
              checked: event.target.checked,
              name: event.target.name,
              value: event.target.value,
            },
            { source: 'Checkbox' }
          );
        }

        onChange?.(event);
      },
      [signalTopic, onChange]
    );

    // Build class names
    const containerClasses = cn(
      styles.container,
      disabled && styles['container--disabled'],
      error && styles['container--error'],
      className
    );

    const checkboxClasses = cn(
      styles.checkbox,
      checked && styles['checkbox--checked'],
      indeterminate && styles['checkbox--indeterminate']
    );

    return (
      <>
        <div className={containerClasses}>
          <div className={styles.checkboxWrapper}>
            <input
              ref={(el) => {
                if (typeof ref === 'function') {
                  ref(el);
                } else if (ref) {
                  ref.current = el;
                }
                if (el) {
                  el.indeterminate = indeterminate;
                }
              }}
              type="checkbox"
              id={checkboxId}
              className={styles.input}
              disabled={disabled}
              checked={checked}
              onChange={handleChange}
              data-ai-readable={aiReadable}
              data-testid={testId}
              aria-invalid={!!error}
              {...props}
            />
            <div className={checkboxClasses}>
              <span className={styles.icon}>
                {indeterminate ? <MinusIcon /> : <CheckIcon />}
              </span>
            </div>
          </div>

          {label && <label className={styles.label} htmlFor={checkboxId}>{label}</label>}
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}
      </>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
