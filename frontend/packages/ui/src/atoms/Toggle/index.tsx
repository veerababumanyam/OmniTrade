/**
 * Toggle Component
 * Liquid Glass Design System - OmniTrade
 * Atomic Component - Z-axis: translateZ(2px)
 *
 * Features:
 * - Labels for on/off states
 * - Size variants: sm, md, lg
 * - Label positioning
 * - AI-readable metadata
 * - Signal: emit 'ui:toggle:change' on change
 */

import React, { forwardRef, useCallback, useId } from 'react';
import { cn } from '../../utils/cn';
import type { SignalTopic } from '../../signal-bus';
import { signalBus } from '../../signal-bus';
import styles from './styles.module.css';

// ============================================================================
// Types
// ============================================================================

export type ToggleSize = 'sm' | 'md' | 'lg';
export type LabelPosition = 'left' | 'right';

export interface ToggleProps {
  /** Controlled checked state */
  checked?: boolean;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Position of the label */
  labelPosition?: LabelPosition;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: ToggleSize;
  /** Required for form validation */
  required?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Element ID */
  id?: string;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Signal topic to emit on change */
  signalTopic?: SignalTopic;
  /** Name for form submission */
  name?: string;
  /** Value for form submission */
  value?: string;
}

// ============================================================================
// Toggle Component
// ============================================================================

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked,
      defaultChecked = false,
      onChange,
      label,
      labelPosition = 'right',
      disabled = false,
      size = 'md',
      required = false,
      className,
      id: providedId,
      'data-ai-readable': aiReadable = true,
      'data-testid': testId,
      signalTopic,
      name,
      value,
    },
    ref
  ) => {
    const generatedId = useId();
    const toggleId = providedId || generatedId;

    // Determine current state
    const isChecked = checked ?? defaultChecked;

    // Handle toggle
    const handleToggle = useCallback(() => {
      if (disabled) return;

      const newValue = !isChecked;

      // Emit signal if topic provided
      if (signalTopic) {
        signalBus.publish(
          signalTopic,
          {
            checked: newValue,
            name,
            value,
          },
          { source: 'Toggle' }
        );
      }

      onChange?.(newValue);
    }, [disabled, isChecked, signalTopic, name, value, onChange]);

    // Handle keyboard interaction
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleToggle();
        }
      },
      [handleToggle]
    );

    // Build class names
    const containerClasses = cn(
      styles.container,
      disabled && styles['container--disabled'],
      className
    );

    const toggleClasses = cn(
      styles.toggle,
      styles[`toggle--${size}`],
      isChecked && styles['toggle--checked']
    );

    const labelClasses = cn(
      styles.label,
      labelPosition === 'left' && styles['label--left']
    );

    return (
      <div className={containerClasses}>
        {label && labelPosition === 'left' && (
          <label className={labelClasses} htmlFor={toggleId}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}

        <button
          ref={ref}
          id={toggleId}
          type="button"
          role="switch"
          className={toggleClasses}
          aria-checked={isChecked}
          aria-required={required}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          data-ai-readable={aiReadable}
          data-testid={testId}
          name={name}
          value={value}
        >
          <span className={styles.thumb} />
        </button>

        {label && labelPosition === 'right' && (
          <label className={labelClasses} htmlFor={toggleId}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
