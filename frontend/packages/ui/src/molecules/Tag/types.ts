/**
 * Tag Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode, ComponentType, MouseEventHandler } from 'react';

export type TagColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export type TagSize = 'xs' | 'sm' | 'md' | 'lg';

export interface TagProps {
  /** Label text */
  label: ReactNode;
  /** Color variant */
  color?: TagColor;
  /** Icon component to display before label */
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** Icon position */
  iconPosition?: 'start' | 'end';
  /** Enable removable with close button */
  removable?: boolean;
  /** Remove handler */
  onRemove?: MouseEventHandler<HTMLButtonElement>;
  /** Click handler for filter tags */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Size variant */
  size?: TagSize;
  /** Avatar to display before label (user tags) */
  avatar?: ReactNode;
  /** Enable editable mode */
  editable?: boolean;
  /** Current value when editing */
  editValue?: string;
  /** Save handler for editable mode */
  onSave?: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Selected/active state */
  selected?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

export interface TagRemoveButtonProps {
  /** Click handler */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: TagSize;
}

export interface TagInputProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Save handler */
  onSave: (value: string) => void;
  /** Size variant */
  size?: TagSize;
  /** Cancel handler (Escape key) */
  onCancel?: () => void;
}

export interface TagRemoveSignalData {
  /** Tag label */
  label: string;
  /** Tag color */
  color: TagColor;
  /** Original event */
  event: MouseEvent;
}

// Size mappings
export const TAG_SIZES: Record<TagSize, { height: string; fontSize: string; padding: string; iconSize: number }> = {
  xs: {
    height: '20px',
    fontSize: 'var(--ot-font-size-xs, 12px)',
    padding: 'var(--ot-space-1, 4px) var(--ot-space-2, 8px)',
    iconSize: 12,
  },
  sm: {
    height: '24px',
    fontSize: 'var(--ot-font-size-xs, 12px)',
    padding: 'var(--ot-space-1, 4px) var(--ot-space-2, 8px)',
    iconSize: 14,
  },
  md: {
    height: '28px',
    fontSize: 'var(--ot-font-size-sm, 14px)',
    padding: 'var(--ot-space-1, 4px) var(--ot-space-3, 12px)',
    iconSize: 16,
  },
  lg: {
    height: '32px',
    fontSize: 'var(--ot-font-size-sm, 14px)',
    padding: 'var(--ot-space-2, 8px) var(--ot-space-3, 12px)',
    iconSize: 18,
  },
} as const;

export const TAG_COLORS: Record<TagColor, { bg: string; text: string; border: string }> = {
  default: {
    bg: 'var(--ot-glass-surface-2, rgba(255, 255, 255, 0.08))',
    text: 'var(--ot-text-secondary, rgba(255, 255, 255, 0.72))',
    border: 'var(--ot-glass-edge-light, rgba(255, 255, 255, 0.1))',
  },
  primary: {
    bg: 'rgba(0, 102, 255, 0.15)',
    text: 'var(--ot-color-photon-400, #4d94ff)',
    border: 'rgba(0, 102, 255, 0.3)',
  },
  secondary: {
    bg: 'rgba(121, 0, 255, 0.15)',
    text: 'var(--ot-color-neural-400, #911aff)',
    border: 'rgba(121, 0, 255, 0.3)',
  },
  success: {
    bg: 'rgba(0, 255, 113, 0.15)',
    text: 'var(--ot-color-quantum-500, #00ff71)',
    border: 'rgba(0, 255, 113, 0.3)',
  },
  warning: {
    bg: 'rgba(255, 221, 0, 0.15)',
    text: 'var(--ot-color-flux-500, #ffdd00)',
    border: 'rgba(255, 221, 0, 0.3)',
  },
  error: {
    bg: 'rgba(255, 0, 0, 0.15)',
    text: 'var(--ot-color-entropy-400, #ff1a1a)',
    border: 'rgba(255, 0, 0, 0.3)',
  },
  info: {
    bg: 'rgba(0, 153, 255, 0.15)',
    text: 'var(--ot-color-photon-300, #4d94ff)',
    border: 'rgba(0, 153, 255, 0.3)',
  },
};
