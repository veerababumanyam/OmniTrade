/**
 * Tooltip Component
 * Liquid Glass Design System - OmniTrade
 * Atomic Component - Z-axis: translateZ(64px)
 *
 * Features:
 * - Positions: top, right, bottom, left
 * - Triggers: hover, focus, click
 * - Delay configuration
 * - Rich content support
 * - Keyboard shortcut display
 * - AI-readable metadata
 * - Signal: emit 'ui:tooltip:show' on show, 'ui:tooltip:hide' on hide
 */

import React, {
  forwardRef,
  useState,
  useCallback,
  useEffect,
  useRef,
  useId,
} from 'react';
import { cn } from '../../utils/cn';
import type { SignalTopic } from '../../signal-bus';
import { signalBus } from '../../signal-bus';
import styles from './styles.module.css';

// ============================================================================
// Types
// ============================================================================

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';
export type TooltipTrigger = 'hover' | 'focus' | 'click';

export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Trigger element */
  children: React.ReactElement;
  /** Position of tooltip */
  position?: TooltipPosition;
  /** Show delay in ms */
  showDelay?: number;
  /** Hide delay in ms */
  hideDelay?: number;
  /** Trigger type */
  trigger?: TooltipTrigger;
  /** Disabled state */
  disabled?: boolean;
  /** Dark theme */
  dark?: boolean;
  /** Rich content mode */
  rich?: boolean;
  /** Title for rich content */
  title?: string;
  /** Description for rich content */
  description?: string;
  /** Keyboard shortcut to display */
  shortcut?: string;
  /** Additional CSS class */
  className?: string;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Signal topic to emit on visibility change */
  signalTopic?: SignalTopic;
}

// Type for child element props
type ChildProps = {
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
};

// ============================================================================
// Tooltip Component
// ============================================================================

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      children,
      position = 'top',
      showDelay = 200,
      hideDelay = 0,
      trigger = 'hover',
      disabled = false,
      dark = false,
      rich = false,
      title,
      description,
      shortcut,
      className,
      'data-ai-readable': aiReadable = true,
      'data-testid': testId,
      signalTopic,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const generatedId = useId();

    // Clear timeouts on unmount
    useEffect(() => {
      return () => {
        if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      };
    }, []);

    // Calculate tooltip position
    const updatePosition = useCallback(() => {
      if (!triggerRef.current || !tooltipRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const gap = 8;

      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.top - tooltipRect.height - gap;
          break;
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.bottom + gap;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - gap;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'right':
          x = triggerRect.right + gap;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // Keep tooltip in viewport
      const padding = 8;
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

      setCoords({ x, y });
    }, [position]);

    // Show tooltip
    const show = useCallback(() => {
      if (disabled) return;

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

      showTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        updatePosition();

        // Emit signal
        if (signalTopic) {
          signalBus.publish(
            signalTopic,
            { action: 'show', position },
            { source: 'Tooltip' }
          );
        }
      }, showDelay);
    }, [disabled, showDelay, updatePosition, signalTopic, position]);

    // Hide tooltip
    const hide = useCallback(() => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);

        // Emit signal
        if (signalTopic) {
          signalBus.publish(
            signalTopic,
            { action: 'hide', position },
            { source: 'Tooltip' }
          );
        }
      }, hideDelay);
    }, [hideDelay, signalTopic, position]);

    // Toggle for click trigger
    const toggle = useCallback(() => {
      if (isVisible) {
        hide();
      } else {
        show();
      }
    }, [isVisible, show, hide]);

    // Update position when visible
    useEffect(() => {
      if (isVisible) {
        updatePosition();
      }
    }, [isVisible, updatePosition]);

    // Build class names
    const tooltipClasses = cn(
      styles.tooltip,
      styles[`tooltip--${position}`],
      dark && styles['tooltip--dark'],
      rich && styles['tooltip--rich'],
      isVisible ? styles['tooltip--visible'] : styles['tooltip--hidden'],
      className
    );

    // Return just the child if disabled
    if (disabled) {
      return children;
    }

    // Clone child with event handlers
    const child = React.Children.only(children) as React.ReactElement<ChildProps>;
    const triggerProps: Record<string, unknown> = {};

    if (trigger === 'hover' || trigger === 'focus') {
      triggerProps.onMouseEnter = (e: React.MouseEvent) => {
        show();
        child.props.onMouseEnter?.(e);
      };
      triggerProps.onMouseLeave = (e: React.MouseEvent) => {
        hide();
        child.props.onMouseLeave?.(e);
      };
    }

    if (trigger === 'focus') {
      triggerProps.onFocus = (e: React.FocusEvent) => {
        show();
        child.props.onFocus?.(e);
      };
      triggerProps.onBlur = (e: React.FocusEvent) => {
        hide();
        child.props.onBlur?.(e);
      };
    }

    if (trigger === 'click') {
      triggerProps.onClick = (e: React.MouseEvent) => {
        toggle();
        child.props.onClick?.(e);
      };
    }

    return (
      <>
        {React.cloneElement(child, triggerProps)}

        {isVisible && (
          <div
            ref={(node) => {
              tooltipRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            className={tooltipClasses}
            style={{
              left: coords.x,
              top: coords.y,
            }}
            role="tooltip"
            id={generatedId}
            data-ai-readable={aiReadable}
            data-testid={testId}
            onMouseEnter={trigger === 'hover' ? show : undefined}
            onMouseLeave={trigger === 'hover' ? hide : undefined}
          >
            {/* Arrow */}
            <div className={styles.arrow} />

            {/* Rich content */}
            {rich && title && (
              <div className={styles.title}>{title}</div>
            )}

            {/* Content */}
            {rich && description ? (
              <div className={styles.description}>{description}</div>
            ) : (
              content
            )}

            {/* Shortcut */}
            {shortcut && <span className={styles.shortcut}>{shortcut}</span>}
          </div>
        )}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
