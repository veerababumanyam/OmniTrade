/**
 * useKeyboardShortcut - Keyboard shortcut hook for OmniTrade
 * Handles keyboard combinations with modifier keys
 */
import { useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface KeyboardShortcutOptions {
  /** Require Ctrl/Cmd key (Cmd on Mac, Ctrl on Windows/Linux) */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt/Option key */
  alt?: boolean;
  /** Require Meta key (Windows key or Cmd) */
  meta?: boolean;
  /** Prevent default browser behavior (default: true) */
  preventDefault?: boolean;
  /** Stop event propagation (default: false) */
  stopPropagation?: boolean;
  /** Enable the shortcut (default: true) */
  enabled?: boolean;
  /** Target element to attach listener to (default: window) */
  target?: HTMLElement | null;
}

export type KeyMatcher = (event: KeyboardEvent) => boolean;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Normalizes a key string to handle different browser implementations
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    // Arrow keys
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',
    // Common aliases
    Up: 'ArrowUp',
    Down: 'ArrowDown',
    Left: 'ArrowLeft',
    Right: 'ArrowRight',
    // Special keys
    Escape: 'Escape',
    Esc: 'Escape',
    Enter: 'Enter',
    Return: 'Enter',
    Space: ' ',
    Spacebar: ' ',
    ' ': ' ',
    // Modifier keys (for standalone press)
    Control: 'Control',
    Shift: 'Shift',
    Alt: 'Alt',
    Meta: 'Meta',
  };

  return keyMap[key] ?? key;
}

/**
 * Checks if the key matches any of the provided keys (case-insensitive)
 */
function keyMatches(event: KeyboardEvent, keys: string[]): boolean {
  const pressedKey = normalizeKey(event.key);
  return keys.some((key) => {
    const normalizedKey = normalizeKey(key);
    // For single character keys, do case-insensitive comparison
    if (normalizedKey.length === 1) {
      return normalizedKey.toLowerCase() === pressedKey.toLowerCase();
    }
    return normalizedKey === pressedKey;
  });
}

/**
 * Checks if modifier keys match the required state
 */
function modifiersMatch(
  event: KeyboardEvent,
  options: KeyboardShortcutOptions
): boolean {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  // Handle ctrl option (Cmd on Mac, Ctrl on Windows/Linux)
  if (options.ctrl) {
    if (isMac) {
      // On Mac, ctrl means Cmd (metaKey)
      if (!event.metaKey) return false;
    } else {
      // On Windows/Linux, ctrl means Ctrl (ctrlKey)
      if (!event.ctrlKey) return false;
    }
  }

  // Handle explicit modifier requirements
  if (options.shift !== undefined && event.shiftKey !== options.shift) {
    return false;
  }

  if (options.alt !== undefined && event.altKey !== options.alt) {
    return false;
  }

  if (options.meta !== undefined && event.metaKey !== options.meta) {
    return false;
  }

  // If ctrl option is not set, ensure no unintended modifier
  // (unless it's explicitly required)
  if (!options.ctrl && !options.meta && !options.shift && !options.alt) {
    // For simple shortcuts like just 'Escape', we don't care about modifiers
    // But for letter keys, we want to avoid triggering with modifiers
    const isSimpleKey = ['Escape', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    if (!isSimpleKey) {
      // Don't trigger if unexpected modifiers are pressed
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return false;
      }
    }
  }

  return true;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for handling keyboard shortcuts.
 * Supports modifier keys and cross-platform key combinations.
 *
 * @param keys - Array of keys that trigger the callback (any of these keys)
 * @param callback - Function to call when shortcut is triggered
 * @param options - Shortcut options (modifiers, preventDefault, etc.)
 *
 * @example
 * // Simple shortcut: Press 'Escape' to close modal
 * useKeyboardShortcut(['Escape'], () => setIsOpen(false));
 *
 * @example
 * // With Ctrl/Cmd modifier: Ctrl+S to save
 * useKeyboardShortcut(['s'], handleSave, { ctrl: true });
 *
 * @example
 * // Multiple keys: Either 'Escape' or 'q' to close
 * useKeyboardShortcut(['Escape', 'q'], handleClose);
 *
 * @example
 * // Complex shortcut: Ctrl+Shift+P
 * useKeyboardShortcut(['p'], openCommandPalette, { ctrl: true, shift: true });
 *
 * @example
 * // Conditional shortcut
 * useKeyboardShortcut(['s'], handleSave, {
 *   ctrl: true,
 *   enabled: !isReadOnly
 * });
 */
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    ctrl = false,
    shift = false,
    alt = false,
    meta = false,
    preventDefault = true,
    stopPropagation = false,
    enabled = true,
    target = null,
  } = options;

  // Use refs to avoid stale closures
  const callbackRef = useRef(callback);
  const keysRef = useRef(keys);

  // Update refs when values change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    keysRef.current = keys;
  }, [keys]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      // Check if the pressed key matches any of our keys
      if (!keyMatches(event, keysRef.current)) {
        return;
      }

      // Check if modifiers match
      if (!modifiersMatch(event, { ctrl, shift, alt, meta })) {
        return;
      }

      // Prevent default browser behavior
      if (preventDefault) {
        event.preventDefault();
      }

      // Stop event propagation
      if (stopPropagation) {
        event.stopPropagation();
      }

      // Execute callback
      callbackRef.current();
    },
    [ctrl, shift, alt, meta, preventDefault, stopPropagation]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const targetElement = target ?? window;

    targetElement.addEventListener('keydown', handleKeyDown as EventListener);

    return (): void => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, enabled, target]);
}

/**
 * Hook for handling multiple keyboard shortcuts at once.
 *
 * @param shortcuts - Array of shortcut configurations
 *
 * @example
 * useKeyboardShortcuts([
 *   { keys: ['Escape'], callback: () => setIsOpen(false) },
 *   { keys: ['s'], callback: handleSave, options: { ctrl: true } },
 *   { keys: ['ArrowUp', 'ArrowDown'], callback: handleNavigation },
 * ]);
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{
    keys: string[];
    callback: () => void;
    options?: KeyboardShortcutOptions;
  }>
): void {
  shortcuts.forEach(({ keys, callback, options }) => {
    useKeyboardShortcut(keys, callback, options);
  });
}

export default useKeyboardShortcut;
