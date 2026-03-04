/**
 * Popover Component
 * Liquid Glass Design System - OmniTrade
 *
 * Features:
 * - Multiple placement variants
 * - Focus trap support
 * - Click outside to close
 * - Arrow pointer
 * - Signal emission for visibility changes
 * - Built on Radix UI Popover
 */

'use client';

import React, { useCallback, useId } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  PopoverProps,
  PopoverVisibilitySignalPayload,
  PopoverCloseSignalPayload,
  PopoverSide,
  PopoverAlign,
} from './types';
import {
  DEFAULT_POPOVER_OFFSET,
  DEFAULT_POPOVER_MIN_WIDTH,
  DEFAULT_POPOVER_MAX_WIDTH,
  parsePlacement,
} from './types';
import styles from './styles.module.css';

/**
 * Close Icon Component
 */
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

/**
 * Popover Component
 *
 * Displays floating content relative to a trigger element.
 *
 * @example
 * ```tsx
 * <Popover
 *   trigger={<Button>Open Popover</Button>}
 *   content={<div>Popover content here</div>}
 *   placement="bottom-start"
 * >
 * ```
 */
export const Popover: React.FC<PopoverProps> = ({
  trigger,
  content,
  placement = 'bottom',
  open: controlledOpen,
  onOpenChange,
  offset = DEFAULT_POPOVER_OFFSET,
  closeOnClickOutside = true,
  trapFocus = true,
  arrow = true,
  ariaLabel,
  className,
  arrowClassName,
  zIndex,
  minWidth = DEFAULT_POPOVER_MIN_WIDTH,
  maxWidth = DEFAULT_POPOVER_MAX_WIDTH,
  modal = false,
  autoFocus = true,
  onClose,
  container,
  ...props
}) => {
  const id = useId();
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Determine controlled vs uncontrolled
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  // Parse placement into side and align
  const { side, align } = parsePlacement(placement);

  // Emit signal on visibility change
  const emitVisibilitySignal = useCallback(
    (visible: boolean) => {
      const payload: PopoverVisibilitySignalPayload = {
        visible,
        placement,
        sourceId: id,
        timestamp: Date.now(),
      };
      signalBus.publish('ui:popover:visibility', payload, {
        source: 'Popover',
      });
    },
    [placement, id]
  );

  // Emit signal on close
  const emitCloseSignal = useCallback(
    (reason: PopoverCloseSignalPayload['reason']) => {
      const payload: PopoverCloseSignalPayload = {
        reason,
        sourceId: id,
        timestamp: Date.now(),
      };
      signalBus.publish('ui:popover:close', payload, {
        source: 'Popover',
      });
    },
    [id]
  );

  // Handle open change
  const handleOpenChange = useCallback(
    (newOpen: boolean, reason?: PopoverCloseSignalPayload['reason']) => {
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
      emitVisibilitySignal(newOpen);

      if (!newOpen) {
        emitCloseSignal(reason ?? 'programmatic');
        onClose?.();
      }
    },
    [isControlled, onOpenChange, emitVisibilitySignal, emitCloseSignal, onClose]
  );

  // Handle escape key
  const handleEscapeKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleOpenChange(false, 'escape');
      }
    },
    [handleOpenChange]
  );

  // Handle pointer down outside
  const handlePointerDownOutside = useCallback(
    (e: Event) => {
      if (!closeOnClickOutside) {
        e.preventDefault();
        return;
      }
      handleOpenChange(false, 'click-outside');
    },
    [closeOnClickOutside, handleOpenChange]
  );

  // Convert side to Radix side
  const sideMap: Record<PopoverSide, 'top' | 'bottom' | 'left' | 'right'> = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
  };

  // Convert align to Radix align
  const alignMap: Record<PopoverAlign, 'start' | 'center' | 'end'> = {
    start: 'start',
    center: 'center',
    end: 'end',
  };

  return (
    <RadixPopover.Root
      open={isOpen}
      onOpenChange={(newOpen) => handleOpenChange(newOpen, newOpen ? undefined : 'trigger')}
    >
      <RadixPopover.Trigger asChild>
        <span className={styles.popoverTrigger} aria-label={ariaLabel}>
          {trigger}
        </span>
      </RadixPopover.Trigger>

      <RadixPopover.Portal container={container}>
        <RadixPopover.Content
          className={cn(styles.popoverContent, className)}
          side={sideMap[side]}
          sideOffset={offset}
          align={alignMap[align]}
          alignOffset={0}
          avoidCollisions
          collisionPadding={8}
          onEscapeKeyDown={handleEscapeKeyDown}
          onPointerDownOutside={handlePointerDownOutside}
          onFocusOutside={(e) => {
            if (trapFocus) {
              e.preventDefault();
            }
          }}
          onCloseAutoFocus={(e) => {
            // Prevent focus from returning to trigger if autoFocus is off
            if (!autoFocus) {
              e.preventDefault();
            }
          }}
          data-side={side}
          data-align={align}
          data-state={isOpen ? 'open' : 'closed'}
          role="dialog"
          aria-modal={modal}
          aria-label={ariaLabel}
          style={{
            '--popover-offset': `${offset}px`,
            '--popover-min-width': `${minWidth}px`,
            '--popover-max-width': `${maxWidth}px`,
            '--popover-z-index': zIndex ?? 'var(--ot-z-popover, 60)',
          } as React.CSSProperties}
          {...props}
        >
          {content}
          {arrow && (
            <RadixPopover.Arrow
              className={cn(styles.popoverArrow, arrowClassName)}
              width={12}
              height={12}
            />
          )}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
};

/**
 * PopoverHeader - Header component for popover
 */
export const PopoverHeader: React.FC<{
  children?: React.ReactNode;
  title?: string;
  showClose?: boolean;
  onClose?: () => void;
  className?: string;
}> = ({ children, title, showClose = true, onClose, className }) => (
  <div className={cn(styles.popoverHeader, className)}>
    {title && <h4 className={styles.popoverTitle}>{title}</h4>}
    {children}
    {showClose && (
      <button
        type="button"
        className={styles.popoverClose}
        onClick={onClose}
        aria-label="Close popover"
      >
        <CloseIcon />
      </button>
    )}
  </div>
);

/**
 * PopoverBody - Body component for popover content
 */
export const PopoverBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn(styles.popoverBody, className)}>{children}</div>
);

/**
 * PopoverFooter - Footer component for popover actions
 */
export const PopoverFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn(styles.popoverFooter, className)}>{children}</div>
);

Popover.displayName = 'Popover';
PopoverHeader.displayName = 'PopoverHeader';
PopoverBody.displayName = 'PopoverBody';
PopoverFooter.displayName = 'PopoverFooter';

export default Popover;
