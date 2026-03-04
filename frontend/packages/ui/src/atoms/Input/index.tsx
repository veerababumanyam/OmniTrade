/**
 * Input Component
 * Liquid Glass Design System - OmniTrade
 *
 * @todo Implement Input component with:
 * - types: text, password, email, number
 * - states: error, disabled, readonly
 * - icons: leading, trailing
 */

import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={className}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <input id={inputId} {...props} />
      {error && <span role="alert">{error}</span>}
      {hint && !error && <span>{hint}</span>}
    </div>
  );
};

Input.displayName = 'Input';

export default Input;
