/**
 * useFocusTrap - Traps focus within a container element
 * Implements WCAG 2.1 AA focus management for modal dialogs and other overlays
 *
 * Features:
 * - Traps focus within container
 * - Returns focus to trigger on close
 * - Handles ESC key to exit
 * - Supports multiple focus traps with stacking
 * - Handles Tab and Shift+Tab navigation
 */
import { useEffect, useCallback, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UseFocusTrapOptions {
  /** Enable the focus trap (default: true) */
  enabled?: boolean;
  /** Callback when ESC key is pressed */
  onEscape?: () => void;
  /** Element to return focus to when trap is disabled */
  returnFocusTo?: HTMLElement | null;
  /** Initial focus element or selector (default: first focusable element) */
  initialFocus?: HTMLElement | string | null;
  /** Whether to autoFocus when enabled (default: true) */
  autoFocus?: boolean;
  /** Allow focus to escape with click outside (default: false) */
  allowClickOutside?: boolean;
  /** Callback when focus trap is activated */
  onActivate?: () => void;
  /** Callback when focus trap is deactivated */
  onDeactivate?: () => void;
}

export interface UseFocusTrapReturn {
  /** Ref to attach to the container element */
  ref: (node: HTMLElement | null) => void;
  /** Whether the focus trap is currently active */
  isActive: boolean;
  /** Manually activate the focus trap */
  activate: () => void;
  /** Manually deactivate the focus trap */
  deactivate: () => void;
  /** The container element */
  containerRef: React.MutableRefObject<HTMLElement | null>;
}

// ============================================================================
// Focusable Elements Selector
// ============================================================================

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Gets all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(elements).filter((el) => {
    // Filter out elements that are not visible
    const style = window.getComputedStyle(el);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           el.offsetParent !== null;
  });
}

/**
 * Gets the first and last focusable elements within a container
 */
function getFocusableEdges(container: HTMLElement): {
  first: HTMLElement | null;
  last: HTMLElement | null;
} {
  const focusable = getFocusableElements(container);
  return {
    first: focusable[0] ?? null,
    last: focusable[focusable.length - 1] ?? null,
  };
}

// ============================================================================
// Focus Trap Stack (for managing multiple traps)
// ============================================================================

interface FocusTrapEntry {
  id: number;
  container: HTMLElement;
  previousFocus: HTMLElement | null;
}

class FocusTrapStack {
  private stack: FocusTrapEntry[] = [];
  private nextId = 0;

  push(container: HTMLElement): number {
    const id = this.nextId++;
    const entry: FocusTrapEntry = {
      id,
      container,
      previousFocus: document.activeElement as HTMLElement | null,
    };
    this.stack.push(entry);
    return id;
  }

  remove(id: number): HTMLElement | null {
    const index = this.stack.findIndex((entry) => entry.id === id);
    if (index === -1) return null;

    const entry = this.stack[index];
    this.stack.splice(index, 1);
    return entry.previousFocus;
  }

  getTop(): FocusTrapEntry | null {
    return this.stack[this.stack.length - 1] ?? null;
  }

  isTop(id: number): boolean {
    const top = this.getTop();
    return top?.id === id;
  }
}

const focusTrapStack = new FocusTrapStack();

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for trapping focus within a container element.
 * Essential for modal dialogs, drawers, and other overlay components.
 *
 * @param options - Focus trap configuration options
 * @returns Object containing ref, state, and control methods
 *
 * @example
 * // Basic usage with modal
 * const { ref, isActive } = useFocusTrap({
 *   enabled: isOpen,
 *   onEscape: () => setIsOpen(false),
 *   returnFocusTo: triggerRef.current,
 * });
 *
 * return (
 *   <div ref={ref} role="dialog" aria-modal="true">
 *     <button>First focusable</button>
 *     <button>Second focusable</button>
 *   </div>
 * );
 *
 * @example
 * // With initial focus selector
 * const { ref } = useFocusTrap({
 *   enabled: true,
 *   initialFocus: '#confirm-button',
 * });
 *
 * @example
 * // Manual activation
 * const { ref, activate, deactivate } = useFocusTrap({
 *   onEscape: handleClose,
 * });
 */
export function useFocusTrap(options: UseFocusTrapOptions = {}): UseFocusTrapReturn {
  const {
    enabled = true,
    onEscape,
    returnFocusTo,
    initialFocus,
    autoFocus = true,
    allowClickOutside = false,
    onActivate,
    onDeactivate,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const trapIdRef = useRef<number | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle ref callback
  const setRef = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
  }, []);

  // Get the initial focus element
  const getInitialFocusElement = useCallback((): HTMLElement | null => {
    if (!containerRef.current) return null;

    if (initialFocus) {
      if (typeof initialFocus === 'string') {
        return containerRef.current.querySelector(initialFocus);
      }
      return initialFocus;
    }

    // Default to first focusable element
    const { first } = getFocusableEdges(containerRef.current);
    return first;
  }, [initialFocus]);

  // Activate the focus trap
  const activate = useCallback(() => {
    if (!containerRef.current) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Add to stack
    trapIdRef.current = focusTrapStack.push(containerRef.current);

    setIsActive(true);
    onActivate?.();

    // Set initial focus
    if (autoFocus) {
      const focusElement = getInitialFocusElement();
      if (focusElement) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          focusElement.focus();
        });
      }
    }
  }, [autoFocus, getInitialFocusElement, onActivate]);

  // Deactivate the focus trap
  const deactivate = useCallback(() => {
    if (trapIdRef.current !== null) {
      const previousFocus = focusTrapStack.remove(trapIdRef.current);
      trapIdRef.current = null;

      // Return focus
      const returnTarget = returnFocusTo ?? previousFocus;
      if (returnTarget && typeof returnTarget.focus === 'function') {
        requestAnimationFrame(() => {
          returnTarget.focus();
        });
      }
    }

    setIsActive(false);
    onDeactivate?.();
  }, [returnFocusTo, onDeactivate]);

  // Handle Tab key navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive || !containerRef.current) return;

      // Check if this trap is the top one
      if (trapIdRef.current !== null && !focusTrapStack.isTop(trapIdRef.current)) {
        return;
      }

      // Handle ESC key
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onEscape?.();
        return;
      }

      // Handle Tab key
      if (event.key === 'Tab') {
        const { first, last } = getFocusableEdges(containerRef.current);

        if (!first || !last) {
          event.preventDefault();
          return;
        }

        if (event.shiftKey) {
          // Shift+Tab: if on first element, go to last
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    },
    [isActive, onEscape]
  );

  // Handle click outside
  const handleFocusIn = useCallback(
    (event: FocusEvent) => {
      if (!isActive || !containerRef.current || allowClickOutside) return;

      // Check if this trap is the top one
      if (trapIdRef.current !== null && !focusTrapStack.isTop(trapIdRef.current)) {
        return;
      }

      // If focus moves outside the container, bring it back
      if (
        event.target instanceof HTMLElement &&
        !containerRef.current.contains(event.target)
      ) {
        const { first } = getFocusableEdges(containerRef.current);
        if (first) {
          first.focus();
        }
      }
    },
    [isActive, allowClickOutside]
  );

  // Set up event listeners and manage activation
  useEffect(() => {
    if (enabled && containerRef.current) {
      activate();

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('focusin', handleFocusIn);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('focusin', handleFocusIn);
        deactivate();
      };
    } else if (!enabled && isActive) {
      deactivate();
    }
  }, [enabled, activate, deactivate, handleKeyDown, handleFocusIn, isActive]);

  return {
    ref: setRef,
    isActive,
    activate,
    deactivate,
    containerRef,
  };
}

export default useFocusTrap;
