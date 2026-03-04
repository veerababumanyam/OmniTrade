/**
 * Tag Component
 * Liquid Glass Design System - OmniTrade
 *
 * A versatile tag component with multiple color variants,
 * removable support, and editable mode.
 */

import { forwardRef, useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  TagProps,
  TagRemoveSignalData,
} from './types';
import styles from './styles.module.css';

// ============================================
// Icons (inline for minimal dependencies)
// ============================================

function CloseIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================
// Tag Component
// ============================================

export const Tag = forwardRef<HTMLElement, TagProps>(function Tag(
  {
    label,
    color = 'default',
    icon: Icon,
    iconPosition = 'start',
    removable = false,
    onRemove,
    onClick,
    size = 'md',
    avatar,
    editable = false,
    editValue: controlledEditValue,
    onSave,
    disabled = false,
    selected = false,
    className,
    testId,
  },
  ref
) {
  // Editable state
  const [internalEditValue, setInternalEditValue] = useState<string>(
    typeof label === 'string' ? label : ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const editValue = controlledEditValue ?? internalEditValue;

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle remove click
  const handleRemove = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      event.stopPropagation();

      // Emit signal for inter-module communication
      const signalData: TagRemoveSignalData = {
        label: typeof label === 'string' ? label : '',
        color,
        event: event.nativeEvent,
      };
      signalBus.publish('ui:tag:remove', signalData, { source: 'Tag' });

      onRemove?.(event);
    },
    [disabled, label, color, onRemove]
  );

  // Handle tag click
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (disabled || isEditing) return;

      // If editable, enter edit mode on click
      if (editable) {
        setIsEditing(true);
        return;
      }

      onClick?.(event);
    },
    [disabled, isEditing, editable, onClick]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInternalEditValue(event.target.value);
    },
    []
  );

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave && editValue.trim()) {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, onSave]);

  // Handle key down in input
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSave();
      } else if (event.key === 'Escape') {
        setIsEditing(false);
        setInternalEditValue(typeof label === 'string' ? label : '');
      }
    },
    [handleSave, label]
  );

  // Handle blur
  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  // Determine if clickable
  const isClickable = !!onClick || editable;

  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      className={cn(
        styles.tag,
        size === 'xs' && styles.sizeXs,
        size === 'sm' && styles.sizeSm,
        size === 'md' && styles.sizeMd,
        size === 'lg' && styles.sizeLg,
        color === 'default' && styles.colorDefault,
        color === 'primary' && styles.colorPrimary,
        color === 'secondary' && styles.colorSecondary,
        color === 'success' && styles.colorSuccess,
        color === 'warning' && styles.colorWarning,
        color === 'error' && styles.colorError,
        color === 'info' && styles.colorInfo,
        isClickable && styles.clickable,
        selected && styles.selected,
        disabled && styles.disabled,
        className
      )}
      onClick={isClickable ? handleClick : undefined}
      tabIndex={isClickable && !disabled ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-pressed={isClickable ? selected : undefined}
      aria-disabled={disabled}
      data-testid={testId}
    >
      {/* Avatar */}
      {avatar && (
        <span
          className={cn(
            styles.avatar,
            size === 'xs' && styles.avatarSizeXs,
            size === 'sm' && styles.avatarSizeSm,
            size === 'md' && styles.avatarSizeMd,
            size === 'lg' && styles.avatarSizeLg
          )}
        >
          {avatar}
        </span>
      )}

      {/* Start Icon */}
      {Icon && iconPosition === 'start' && !isEditing && (
        <span className={cn(styles.icon, styles.iconStart)}>
          <Icon size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
        </span>
      )}

      {/* Label or Input */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled}
          aria-label="Edit tag"
        />
      ) : (
        <span className={styles.label}>{label}</span>
      )}

      {/* End Icon */}
      {Icon && iconPosition === 'end' && !isEditing && !removable && (
        <span className={cn(styles.icon, styles.iconEnd)}>
          <Icon size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
        </span>
      )}

      {/* Remove Button */}
      {removable && !isEditing && (
        <button
          type="button"
          className={cn(
            styles.removeButton,
            size === 'xs' && styles.removeButtonSizeXs,
            size === 'sm' && styles.removeButtonSizeSm,
            size === 'md' && styles.removeButtonSizeMd,
            size === 'lg' && styles.removeButtonSizeLg
          )}
          onClick={handleRemove}
          disabled={disabled}
          aria-label={`Remove ${typeof label === 'string' ? label : 'tag'}`}
        >
          <CloseIcon size={size === 'xs' || size === 'sm' ? 8 : size === 'md' ? 10 : 12} />
        </button>
      )}
    </span>
  );
});

export default Tag;
