/**
 * FloatingTooltip Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * A feature-rich tooltip built on Radix UI with:
 * - Position variants (top, bottom, left, right)
 * - Configurable delays
 * - Optional arrow
 * - Signal bus integration
 */

import type { ReactNode, HTMLAttributes } from 'react';

/**
 * FloatingTooltip position variants
 */
export type FloatingTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * FloatingTooltip delay configuration
 */
export interface FloatingTooltipDelay {
  /** Delay in milliseconds before showing tooltip (default: 200) */
  show?: number;
  /** Delay in milliseconds before hiding tooltip (default: 0) */
  hide?: number;
}

/**
 * Props for the FloatingTooltip component
 */
export interface FloatingTooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /** Element that triggers the tooltip */
  children: ReactNode;
  /** Content to display in the tooltip */
  content: ReactNode;
  /** Position of the tooltip relative to the trigger */
  position?: FloatingTooltipPosition;
  /** Delay configuration for show/hide */
  delay?: FloatingTooltipDelay;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Whether to show the arrow pointer */
  arrow?: boolean;
  /** Custom aria-label for accessibility */
  ariaLabel?: string;
  /** Additional CSS class for the tooltip content */
  className?: string;
  /** Additional CSS class for the arrow */
  arrowClassName?: string;
  /** Offset from the trigger in pixels (default: 8) */
  offset?: number;
  /** Whether to keep the tooltip open when hovering the tooltip content */
  sticky?: boolean;
  /** Custom z-index for the tooltip */
  zIndex?: number;
  /** Maximum width of the tooltip in pixels */
  maxWidth?: number;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Props for FloatingTooltipContent component
 */
export interface FloatingTooltipContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Position of the tooltip */
  position: FloatingTooltipPosition;
  /** Whether to show the arrow */
  arrow: boolean;
  /** Custom arrow class */
  arrowClassName?: string;
  /** Offset from trigger */
  offset: number;
  /** Animation state */
  animating?: 'enter' | 'exit' | null;
}

/**
 * Props for FloatingTooltipArrow component
 */
export interface FloatingTooltipArrowProps extends HTMLAttributes<HTMLDivElement> {
  /** Position of the tooltip (determines arrow direction) */
  position: FloatingTooltipPosition;
  /** Custom class name */
  className?: string;
}

/**
 * Signal payload for FloatingTooltip visibility events
 */
export interface FloatingTooltipVisibilitySignalPayload {
  /** Whether the tooltip is visible */
  visible: boolean;
  /** Position of the tooltip */
  position: FloatingTooltipPosition;
  /** Source component ID (if provided) */
  sourceId?: string;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * CSS custom properties for FloatingTooltip
 */
export interface FloatingTooltipStyleVars {
  '--floating-tooltip-offset': string;
  '--floating-tooltip-max-width': string;
  '--floating-tooltip-z-index': string;
}

/**
 * Default FloatingTooltip configuration
 */
export const DEFAULT_FLOATING_TOOLTIP_DELAY: Required<FloatingTooltipDelay> = {
  show: 200,
  hide: 0,
};

export const DEFAULT_FLOATING_TOOLTIP_OFFSET = 8;
export const DEFAULT_FLOATING_TOOLTIP_MAX_WIDTH = 280;
