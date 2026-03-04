/**
 * FloatingTooltip Component
 * Liquid Glass Design System - OmniTrade
 *
 * A feature-rich tooltip built on Radix UI with:
 * - Position variants (top, bottom, left, right)
 * - Configurable show/hide delays
 * - Optional arrow pointer
 * - Signal emission for visibility changes
 */

'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useId,
} from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  FloatingTooltipProps,
  FloatingTooltipPosition,
  FloatingTooltipVisibilitySignalPayload,
} from './types';
import {
  DEFAULT_FLOATING_TOOLTIP_DELAY,
  DEFAULT_FLOATING_TOOLTIP_OFFSET,
  DEFAULT_FLOATING_TOOLTIP_MAX_WIDTH,
} from './types';
import styles from './styles.module.css';

/**
 * FloatingTooltip Component
 *
 * Displays informative content when hovering over an element.
 * Built on Radix UI Tooltip for accessibility and positioning.
 *
 * @example
 * ```tsx
 * <FloatingTooltip content="Helpful information" position="top">
 *   <Button>Hover me</Button>
 * </FloatingTooltip>
 * ```
 */
export const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = {},
  disabled = false,
  arrow = true,
  ariaLabel,
  className,
  arrowClassName,
  offset = DEFAULT_FLOATING_TOOLTIP_OFFSET,
  sticky = false,
  zIndex,
  maxWidth = DEFAULT_FLOATING_TOOLTIP_MAX_WIDTH,
  open: controlledOpen,
  onOpenChange,
  ...props
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const id = useId();
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine controlled vs uncontrolled
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  // Delay configuration
  const showDelay = delay.show ?? DEFAULT_FLOATING_TOOLTIP_DELAY.show;
  const hideDelay = delay.hide ?? DEFAULT_FLOATING_TOOLTIP_DELAY.hide;

  // Emit signal on visibility change
  const emitSignal = useCallback(
    (visible: boolean) => {
      const payload: FloatingTooltipVisibilitySignalPayload = {
        visible,
        position,
        sourceId: id,
        timestamp: Date.now(),
      };
      signalBus.publish('ui:floating-tooltip:visibility', payload, {
        source: 'FloatingTooltip',
      });
    },
    [position, id]
  );

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Handle open change with delays
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (disabled) return;

      // Clear existing timeouts
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (newOpen) {
        // Show with delay
        if (showDelay > 0) {
          showTimeoutRef.current = setTimeout(() => {
            if (!isControlled) {
              setInternalOpen(true);
            }
            onOpenChange?.(true);
            emitSignal(true);
          }, showDelay);
        } else {
          if (!isControlled) {
            setInternalOpen(true);
          }
          onOpenChange?.(true);
          emitSignal(true);
        }
      } else {
        // Hide with delay
        if (hideDelay > 0) {
          hideTimeoutRef.current = setTimeout(() => {
            if (!isControlled) {
              setInternalOpen(false);
            }
            onOpenChange?.(false);
            emitSignal(false);
          }, hideDelay);
        } else {
          if (!isControlled) {
            setInternalOpen(false);
          }
          onOpenChange?.(false);
          emitSignal(false);
        }
      }
    },
    [disabled, showDelay, hideDelay, isControlled, onOpenChange, emitSignal]
  );

  // Convert position to Radix side
  const sideMap: Record<FloatingTooltipPosition, 'top' | 'bottom' | 'left' | 'right'> = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
  };

  // If disabled or no content, just render children
  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <RadixTooltip.Provider delayDuration={0}>
      <RadixTooltip.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        delayDuration={0}
      >
        <RadixTooltip.Trigger asChild>
          <span
            className={styles.tooltipTrigger}
            aria-describedby={isOpen ? `floating-tooltip-${id}` : undefined}
            tabIndex={0}
          >
            {children}
          </span>
        </RadixTooltip.Trigger>

        <RadixTooltip.Portal>
          <RadixTooltip.Content
            id={`floating-tooltip-${id}`}
            className={cn(
              styles.tooltipContent,
              sticky && styles.tooltipSticky,
              className
            )}
            side={sideMap[position]}
            sideOffset={offset}
            data-position={position}
            data-state={isOpen ? 'visible' : 'hidden'}
            role="tooltip"
            aria-label={ariaLabel}
            style={{
              '--floating-tooltip-offset': `${offset}px`,
              '--floating-tooltip-max-width': `${maxWidth}px`,
              '--floating-tooltip-z-index': zIndex ?? 'var(--ot-z-tooltip, 50)',
            } as React.CSSProperties}
            {...props}
          >
            {content}
            {arrow && (
              <RadixTooltip.Arrow
                className={cn(styles.tooltipArrow, arrowClassName)}
                width={10}
                height={10}
              />
            )}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

/**
 * FloatingTooltipSimple - A simplified tooltip with delay presets
 */
export const FloatingTooltipSimple: React.FC<
  Omit<FloatingTooltipProps, 'delay' | 'open' | 'onOpenChange'> & {
    /** Quick delay preset */
    delayPreset?: 'instant' | 'fast' | 'normal' | 'slow';
  }
> = ({ delayPreset = 'normal', ...props }) => {
  const presetDelays = {
    instant: { show: 0, hide: 0 },
    fast: { show: 100, hide: 0 },
    normal: { show: 200, hide: 0 },
    slow: { show: 400, hide: 100 },
  };

  return <FloatingTooltip delay={presetDelays[delayPreset]} {...props} />;
};

FloatingTooltip.displayName = 'FloatingTooltip';
FloatingTooltipSimple.displayName = 'FloatingTooltipSimple';

export default FloatingTooltip;
