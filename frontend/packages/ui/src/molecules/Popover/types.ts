/**
 * Popover Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode, ReactElement, HTMLAttributes } from 'react';

/**
 * Popover placement variants
 * Combines side and alignment
 */
export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/**
 * Popover side (primary direction)
 */
export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';

/**
 * Popover alignment (secondary direction)
 */
export type PopoverAlign = 'start' | 'center' | 'end';

/**
 * Props for the Popover component
 */
export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /** Element that triggers the popover */
  trigger: ReactElement;
  /** Content to display in the popover */
  content: ReactNode;
  /** Placement of the popover relative to the trigger */
  placement?: PopoverPlacement;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Offset from the trigger in pixels (default: 8) */
  offset?: number;
  /** Whether to close when clicking outside */
  closeOnClickOutside?: boolean;
  /** Whether to trap focus within the popover when open */
  trapFocus?: boolean;
  /** Whether to show the arrow pointer */
  arrow?: boolean;
  /** Custom aria-label for accessibility */
  ariaLabel?: string;
  /** Additional CSS class for the popover content */
  className?: string;
  /** Additional CSS class for the arrow */
  arrowClassName?: string;
  /** Custom z-index for the popover */
  zIndex?: number;
  /** Minimum width of the popover */
  minWidth?: number;
  /** Maximum width of the popover */
  maxWidth?: number;
  /** Whether the popover is modal (blocks interaction with outside) */
  modal?: boolean;
  /** Whether to auto-focus the first focusable element */
  autoFocus?: boolean;
  /** Callback when popover should close */
  onClose?: () => void;
  /** Portal container element */
  container?: HTMLElement | null;
}

/**
 * Props for PopoverContent component
 */
export interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Placement of the popover */
  placement: PopoverPlacement;
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
 * Props for PopoverArrow component
 */
export interface PopoverArrowProps extends HTMLAttributes<HTMLDivElement> {
  /** Placement of the popover (determines arrow direction) */
  placement: PopoverPlacement;
  /** Custom class name */
  className?: string;
}

/**
 * Props for PopoverTrigger component
 */
export interface PopoverTriggerProps {
  /** Children to render as the trigger */
  children: ReactElement;
  /** Whether the popover is open */
  isOpen: boolean;
  /** Whether the trigger is disabled */
  disabled?: boolean;
}

/**
 * Signal payload for popover visibility events
 */
export interface PopoverVisibilitySignalPayload {
  /** Whether the popover is visible */
  visible: boolean;
  /** Placement of the popover */
  placement: PopoverPlacement;
  /** Source component ID (if provided) */
  sourceId?: string;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Signal payload for popover close events
 */
export interface PopoverCloseSignalPayload {
  /** Reason for closing */
  reason: 'click-outside' | 'escape' | 'trigger' | 'programmatic';
  /** Source component ID (if provided) */
  sourceId?: string;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * CSS custom properties for popover
 */
export interface PopoverStyleVars {
  '--popover-offset': string;
  '--popover-min-width': string;
  '--popover-max-width': string;
  '--popover-z-index': string;
}

/**
 * Default popover configuration
 */
export const DEFAULT_POPOVER_OFFSET = 8;
export const DEFAULT_POPOVER_MIN_WIDTH = 200;
export const DEFAULT_POPOVER_MAX_WIDTH = 400;

/**
 * Parse placement into side and align
 */
export function parsePlacement(placement: PopoverPlacement): {
  side: PopoverSide;
  align: PopoverAlign;
} {
  const [side, align = 'center'] = placement.split('-') as [
    PopoverSide,
    PopoverAlign | undefined
  ];
  return { side, align: align ?? 'center' };
}

/**
 * Combine side and align into placement
 */
export function combinePlacement(side: PopoverSide, align: PopoverAlign): PopoverPlacement {
  if (align === 'center') {
    return side;
  }
  return `${side}-${align}` as PopoverPlacement;
}
