/**
 * Notification Component Types
 * Liquid Glass Design System
 * Macro-Volume Organism
 *
 * Enhanced toast notifications with rich content support
 */

import type { ReactNode, CSSProperties } from 'react';

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationPosition =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'left'
  | 'right'
  | 'center';

// ============================================================================
// Notification Data
// ============================================================================

export interface NotificationAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Button icon */
  icon?: ReactNode;
}

export interface NotificationData {
  /** Unique identifier for the notification */
  id: string;
  /** Notification type */
  type?: NotificationType;
  /** Notification title */
  title?: ReactNode;
  /** Notification description/message (supports rich HTML) */
  description?: ReactNode;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Show progress bar for auto-dismiss countdown */
  showProgress?: boolean;
  /** Show countdown timer */
  showCountdown?: boolean;
  /** Dismissible by user */
  dismissible?: boolean;
  /** Action buttons */
  actions?: NotificationAction[];
  /** Custom icon (overrides type default) */
  icon?: ReactNode;
  /** Custom CSS class */
  className?: string;
  /** Created timestamp */
  createdAt?: number;
  /** Pause on hover */
  pauseOnHover?: boolean;
  /** Rich HTML content support */
  html?: string;
  /** Custom image or visual */
  image?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Callback when notification is dismissed */
  onDismiss?: (id: string) => void;
  /** Callback when notification action is clicked */
  onAction?: (id: string, actionIndex: number) => void;
}

// ============================================================================
// Notification Props
// ============================================================================

export interface NotificationProps extends NotificationData {
  /** Position in the queue */
  index?: number;
  /** Total visible notifications */
  totalVisible?: number;
  /** Position of container */
  position?: NotificationPosition;
  /** Callback to dismiss this notification */
  onDismissCallback?: (id: string) => void;
}

// ============================================================================
// NotificationContainer Props
// ============================================================================

export interface NotificationContainerProps {
  /** Array of notifications to display */
  notifications: NotificationData[];
  /** Position of notification container */
  position?: NotificationPosition;
  /** Maximum visible notifications */
  maxVisible?: number;
  /** Default duration for auto-dismiss */
  defaultDuration?: number;
  /** Callback when notification is dismissed */
  onDismiss?: (id: string) => void;
  /** Additional CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Custom notification renderer */
  renderNotification?: (notification: NotificationData, index: number) => ReactNode;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
  /** New notifications appear at top (for top positions) or bottom (for bottom positions) */
  newestOnTop?: boolean;
  /** Gap between notifications */
  gap?: number;
  /** Offset from edge */
  offset?: string | number;
}

// ============================================================================
// NotificationProvider Props
// ============================================================================

export interface NotificationProviderProps extends Omit<NotificationContainerProps, 'notifications'> {
  /** Children */
  children: ReactNode;
}

// ============================================================================
// Notification Context
// ============================================================================

export interface NotificationContextValue {
  /** Add a new notification */
  notify: (notification: Omit<NotificationData, 'id' | 'createdAt'>) => string;
  /** Add a success notification */
  success: (title: ReactNode, description?: ReactNode, options?: Partial<NotificationData>) => string;
  /** Add an error notification */
  error: (title: ReactNode, description?: ReactNode, options?: Partial<NotificationData>) => string;
  /** Add a warning notification */
  warning: (title: ReactNode, description?: ReactNode, options?: Partial<NotificationData>) => string;
  /** Add an info notification */
  info: (title: ReactNode, description?: ReactNode, options?: Partial<NotificationData>) => string;
  /** Dismiss a notification by ID */
  dismiss: (id: string) => void;
  /** Dismiss all notifications */
  dismissAll: () => void;
  /** Update a notification */
  update: (id: string, updates: Partial<NotificationData>) => void;
  /** Get all active notifications */
  notifications: NotificationData[];
  /** Check if a notification is active */
  isActive: (id: string) => boolean;
}

// ============================================================================
// Signal Types
// ============================================================================

export interface NotificationDismissSignal {
  notificationId: string;
  type: NotificationType;
  reason: 'auto' | 'user' | 'programmatic';
  duration: number;
}

export interface NotificationShowSignal {
  notificationId: string;
  type: NotificationType;
  title?: string;
  position: NotificationPosition;
}

// ============================================================================
// Animation Config
// ============================================================================

export interface NotificationAnimationConfig {
  /** Enter animation duration */
  enterDuration: number;
  /** Exit animation duration */
  exitDuration: number;
  /** Spring easing */
  springEasing: string;
  /** Stagger delay between notifications */
  staggerDelay: number;
}

export const NOTIFICATION_ANIMATION: NotificationAnimationConfig = {
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
export const DEFAULT_POSITION: NotificationPosition = 'bottom-right';
export const DEFAULT_GAP = 12;

export const NOTIFICATION_ICONS: Record<NotificationType, ReactNode> = {
  success: null,
  error: null,
  warning: null,
  info: null,
} as const;

export const NOTIFICATION_COLORS: Record<NotificationType, { bg: string; border: string; icon: string }> = {
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
