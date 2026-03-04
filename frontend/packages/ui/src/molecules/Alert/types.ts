/**
 * Alert Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode, HTMLAttributes } from 'react';
import type { IconName } from '../../atoms/Icon/types';

/**
 * Alert variant types
 */
export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * Alert size variants
 */
export type AlertSize = 'sm' | 'md' | 'lg';

/**
 * Alert action button definition
 */
export interface AlertAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Whether this action is loading */
  loading?: boolean;
  /** Whether this action is disabled */
  disabled?: boolean;
}

/**
 * Props for the Alert component
 */
export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Visual variant of the alert */
  variant?: AlertVariant;
  /** Alert title/heading */
  title?: ReactNode;
  /** Alert description/body content */
  description?: ReactNode;
  /** Action buttons to display */
  actions?: AlertAction[];
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Auto-close after this many milliseconds (0 = disabled) */
  autoClose?: number;
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
  /** Whether to show the variant icon */
  showIcon?: boolean;
  /** Custom icon to use instead of variant default */
  icon?: IconName;
  /** Size variant */
  size?: AlertSize;
  /** Additional CSS class */
  className?: string;
  /** Whether to use liquid glass styling */
  glass?: boolean;
  /** Unique identifier for the alert */
  id?: string;
  /** ARIA live region politeness */
  ariaLive?: 'polite' | 'assertive' | 'off';
  /** Whether to animate the alert entrance/exit */
  animated?: boolean;
  /** Stack index for multiple alerts */
  stackIndex?: number;
}

/**
 * Props for AlertTitle component
 */
export interface AlertTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Size variant */
  size?: AlertSize;
}

/**
 * Props for AlertDescription component
 */
export interface AlertDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Size variant */
  size?: AlertSize;
}

/**
 * Props for AlertActions component
 */
export interface AlertActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Action buttons */
  actions: AlertAction[];
  /** Size variant */
  size?: AlertSize;
}

/**
 * Props for AlertIcon component
 */
export interface AlertIconProps {
  /** Alert variant */
  variant: AlertVariant;
  /** Custom icon name */
  icon?: IconName;
  /** Size variant */
  size?: AlertSize;
  /** Additional CSS class */
  className?: string;
}

/**
 * Signal payload for alert dismiss events
 */
export interface AlertDismissSignalPayload {
  /** Alert unique identifier */
  alertId: string;
  /** Alert variant */
  variant: AlertVariant;
  /** Alert title */
  title?: string;
  /** Whether the alert was auto-closed */
  autoClosed: boolean;
  /** Stack index if part of a stack */
  stackIndex?: number;
  /** Source component name */
  source: 'Alert';
}

/**
 * CSS custom properties for alert
 */
export interface AlertStyleVars {
  '--alert-accent-color': string;
  '--alert-bg-color': string;
  '--alert-border-color': string;
  '--alert-text-color': string;
  '--alert-icon-color': string;
}

/**
 * Alert context for stacked alerts
 */
export interface AlertContextValue {
  /** Dismiss a specific alert by ID */
  dismiss: (id: string) => void;
  /** Dismiss all alerts */
  dismissAll: () => void;
  /** Current alerts in the stack */
  alerts: AlertProps[];
  /** Register a new alert */
  register: (alert: AlertProps) => string;
}
