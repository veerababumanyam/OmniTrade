/**
 * Select Component
 * Liquid Glass Design System - OmniTrade
 * Atomic Component - Z-axis: translateZ(2px)
 *
 * Features:
 * - Single/multi select
 * - Placeholder support
 * - Error states
 * - Size variants
 * - AI-readable metadata
 * - Signal: emit 'ui:select:change' on change
 */

import React, { forwardRef, useState, useCallback, useId } from 'react';
import { cn } from '../../utils/cn';
import type { SignalTopic } from '../../signal-bus';
import { signalBus } from '../../signal-bus';
import styles from './styles.module.css';

// ============================================================================
// Types
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Array of options */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text shown below select */
  hint?: string;
  /** Size variant */
  size?: SelectSize;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Signal topic to emit on change */
  signalTopic?: SignalTopic;
}

// ============================================================================
// Dropdown Icon
// ============================================================================

const DropdownIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M4 6l4 4 4-4" />
  </svg>
);

// ============================================================================
// Select Component
// ============================================================================

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      placeholder = 'Select an option',
      label,
      error,
      hint,
      size = 'md',
      disabled,
      className,
      id: providedId,
      onChange,
      value,
      defaultValue,
      'data-ai-readable': aiReadable = true,
      'data-testid': testId,
      signalTopic,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = providedId || generatedId;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    const [isOpen, setIsOpen] = useState(false);

    // Handle change with signal emission
    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        if (signalTopic) {
          signalBus.publish(
            signalTopic,
            {
              value: event.target.value,
              name: event.target.name,
            },
            { source: 'Select' }
          );
        }

        onChange?.(event);
      },
      [signalTopic, onChange]
    );

    // Focus handlers for open state
    const handleFocus = useCallback(
      (event: React.FocusEvent<HTMLSelectElement>) => {
        setIsOpen(true);
        props.onFocus?.(event);
      },
      [props]
    );

    const handleBlur = useCallback(
      (event: React.FocusEvent<HTMLSelectElement>) => {
        setIsOpen(false);
        props.onBlur?.(event);
      },
      [props]
    );

    // Build class names
    const selectClasses = cn(
      styles.select,
      styles[`select--${size}`],
      error && styles['select--error'],
      disabled && styles['select--disabled'],
      className
    );

    const wrapperClasses = cn(
      styles.selectWrapper,
      isOpen && styles['selectWrapper--open']
    );

    // Determine aria-describedby
    const ariaDescribedBy = [error && errorId, hint && !error && hintId]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={styles.container}>
        {label && (
          <label className={styles.label} htmlFor={selectId}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}

        <div className={wrapperClasses}>
          <select
            ref={ref}
            id={selectId}
            className={selectClasses}
            disabled={disabled}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            data-ai-readable={aiReadable}
            data-testid={testId}
            required={required}
            {...props}
          >
            <option value="" disabled hidden>
              {placeholder}
            </option>
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <span className={styles.dropdownIcon}>
            <DropdownIcon />
          </span>
        </div>

        {error && (
          <div className={styles.error} id={errorId} role="alert">
            {error}
          </div>
        )}

        {hint && !error && (
          <div className={styles.hint} id={hintId}>
            {hint}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
