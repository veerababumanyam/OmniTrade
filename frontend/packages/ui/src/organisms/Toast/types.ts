/**
 * Toast Component Types
 * Liquid Glass Design System
 * Macro-Volume Organism
 */

import type { ReactNode, CSSProperties } from 'react';

// ============================================================================
// Toast Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

// ============================================================================
// Toast Data
// ============================================================================

export interface ToastAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface ToastData {
  /** Unique identifier for the toast */
  id: string;
  /** Toast type */
  type?: ToastType;
  /** Toast title */
  title?: ReactNode;
  /** Toast description/message */
  description?: ReactNode;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Show progress bar for auto-dismiss */
  showProgress?: boolean;
  /** Dismissible by user */
  dismissible?: boolean;
  /** Action buttons */
  actions?: ToastAction[];
  /** Custom icon (overrides type default) */
  icon?: ReactNode;
  /** Custom CSS class */
  className?: string;
  /** Created timestamp */
  createdAt?: number;
  /** Pause on hover */
  pauseOnHover?: boolean;
  /** Callback when toast is dismissed */
  onDismiss?: (id: string) => void;
  /** Callback when toast action is clicked */
  onAction?: (id: string, actionIndex: number) => void;
}

// ============================================================================
// Toast Props
// ============================================================================

export interface ToastProps extends ToastData {
  /** Position in the queue */
  index?: number;
  /** Total visible toasts */
  totalVisible?: number;
  /** Callback to dismiss this toast */
  onDismissCallback?: (id: string) => void;
}

// ============================================================================
// ToastContainer Props
// ============================================================================

export interface ToastContainerProps {
  /** Array of toasts to display */
  toasts: ToastData[];
  /** Position of toast container */
  position?: ToastPosition;
  /** Maximum visible toasts */
  maxVisible?: number;
  /** Default duration for auto-dismiss */
  defaultDuration?: number;
  /** Callback when toast is dismissed */
  onDismiss?: (id: string) => void;
  /** Additional CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Custom toast renderer */
  renderToast?: (toast: ToastData, index: number) => ReactNode;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
  /** New toasts appear at top (for top positions) or bottom (for bottom positions) */
  newestOnTop?: boolean;
  /** Gap between toasts */
  gap?: number;
  /** Offset from edge */
  offset?: string | number;
}

// ============================================================================
// ToastProvider Props
// ============================================================================

export interface ToastProviderProps extends Omit<ToastContainerProps, 'toasts'> {
  /** Children */
  children: ReactNode;
}

// ============================================================================
// Toast Context
// ============================================================================

export interface ToastContextValue {
  /** Add a new toast */
  addToast: (toast: Omit<ToastData, 'id' | 'createdAt'>) => string;
  /** Dismiss a toast by ID */
  dismissToast: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
  /** Update a toast */
  updateToast: (id: string, updates: Partial<ToastData>) => void;
  /** Get all active toasts */
  toasts: ToastData[];
  /** Check if a toast is active */
  isToastActive: (id: string) => boolean;
}

// ============================================================================
// Signal Types
// ============================================================================

export interface ToastDismissSignal {
  toastId: string;
  type: ToastType;
  reason: 'auto' | 'user' | 'programmatic';
  duration: number;
}

export interface ToastShowSignal {
  toastId: string;
  type: ToastType;
  title?: string;
  position: ToastPosition;
}

// ============================================================================
// Animation Config
// ============================================================================

export interface ToastAnimationConfig {
  /** Enter animation duration */
  enterDuration: number;
  /** Exit animation duration */
  exitDuration: number;
  /** Spring easing */
  springEasing: string;
  /** Stagger delay between toasts */
  staggerDelay: number;
}

export const TOAST_ANIMATION: ToastAnimationConfig = {
  enterDuration: 300,
  exitDuration: 200,
  springEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  staggerDelay: 50,
} as const;

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_DURATION = 5000;
export const DEFAULT_MAX_VISIBLE = 5;
export const DEFAULT_POSITION: ToastPosition = 'bottom-right';
export const DEFAULT_GAP = 12;

export const TOAST_ICONS: Record<ToastType, ReactNode> = {
  success: null,
  error: null,
  warning: null,
  info: null,
} as const;

export const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'var(--ot-color-success-bg)',
    border: 'var(--ot-color-success-border)',
    icon: 'var(--ot-color-success-icon)',
  },
  error: {
    bg: 'var(--ot-color-error-bg)',
    border: 'var(--ot-color-error-border)',
    icon: 'var(--ot-color-error-icon)',
  },
  warning: {
    bg: 'var(--ot-color-warning-bg)',
    border: 'var(--ot-color-warning-border)',
    icon: 'var(--ot-color-warning-icon)',
  },
  info: {
    bg: 'var(--ot-color-info-bg)',
    border: 'var(--ot-color-info-border)',
    icon: 'var(--ot-color-info-icon)',
  },
} as const;
