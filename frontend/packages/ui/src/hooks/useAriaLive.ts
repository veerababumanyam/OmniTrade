/**
 * useAriaLive - Announces dynamic content to screen readers
 * Implements WCAG 2.1 AA live region requirements (4.1.3)
 *
 * Features:
 * - Polite and assertive announcement modes
 * - Queue multiple messages
 * - Deduplication of rapid announcements
 * - Configurable delays for optimal screen reader support
 */
import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export type AriaLiveMode = 'polite' | 'assertive' | 'off';

export interface AriaLiveMessage {
  /** Unique identifier for the message */
  id: string;
  /** The message content to announce */
  content: string;
  /** Announcement mode (default: 'polite') */
  mode: AriaLiveMode;
  /** Timestamp when the message was added */
  timestamp: number;
}

export interface UseAriaLiveOptions {
  /** Default announcement mode (default: 'polite') */
  defaultMode?: AriaLiveMode;
  /** Delay between clearing and setting content (ms, default: 100) */
  clearDelay?: number;
  /** Maximum messages to keep in history (default: 10) */
  maxHistory?: number;
  /** Whether to deduplicate identical messages (default: true) */
  deduplicate?: boolean;
  /** Debounce time for rapid announcements (ms, default: 150) */
  debounceTime?: number;
}

export interface UseAriaLiveReturn {
  /** Announce a message to screen readers */
  announce: (content: string, mode?: AriaLiveMode) => void;
  /** Clear all pending announcements */
  clear: () => void;
  /** Current message being announced */
  currentMessage: AriaLiveMessage | null;
  /** History of announced messages */
  messageHistory: AriaLiveMessage[];
  /** Props to spread onto the live region element */
  liveRegionProps: {
    'aria-live': AriaLiveMode;
    'aria-atomic': boolean;
    role: 'status' | 'alert';
    className: string;
    style: React.CSSProperties;
  };
  /** Ref to attach to the live region element */
  liveRegionRef: React.MutableRefObject<HTMLDivElement | null>;
}

// ============================================================================
// Utilities
// ============================================================================

let messageIdCounter = 0;

/**
 * Generates a unique message ID
 */
function generateMessageId(): string {
  return `aria-live-${++messageIdCounter}-${Date.now()}`;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for announcing dynamic content to screen readers via ARIA live regions.
 * Essential for WCAG 4.1.3 (Status Messages) requirement.
 *
 * @param options - Configuration options for the live region
 * @returns Object containing announce function and live region props
 *
 * @example
 * // Basic usage
 * const { announce, liveRegionProps, liveRegionRef } = useAriaLive();
 *
 * return (
 *   <>
 *     <button onClick={() => announce('Item added to cart')}>
 *       Add to Cart
 *     </button>
 *     <div ref={liveRegionRef} {...liveRegionProps} />
 *   </>
 * );
 *
 * @example
 * // With assertive announcement (interrupts screen reader)
 * const { announce } = useAriaLive();
 *
 * const handleError = (error: string) => {
 *   announce(`Error: ${error}`, 'assertive');
 * };
 *
 * @example
 * // With custom options
 * const { announce, currentMessage } = useAriaLive({
 *   defaultMode: 'polite',
 *   clearDelay: 150,
 *   deduplicate: true,
 * });
 *
 * // Announce loading state
 * announce('Loading results...');
 */
export function useAriaLive(options: UseAriaLiveOptions = {}): UseAriaLiveReturn {
  const {
    defaultMode = 'polite',
    clearDelay = 100,
    maxHistory = 10,
    deduplicate = true,
    debounceTime = 150,
  } = options;

  const [currentMessage, setCurrentMessage] = useState<AriaLiveMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<AriaLiveMessage[]>([]);
  const [currentMode, setCurrentMode] = useState<AriaLiveMode>(defaultMode);

  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnnouncedRef = useRef<string>('');

  // Clear any pending timers
  const clearTimers = useCallback(() => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  // Clear the current announcement
  const clear = useCallback(() => {
    clearTimers();
    setCurrentMessage(null);
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }
  }, [clearTimers]);

  // Announce a message
  const announce = useCallback(
    (content: string, mode: AriaLiveMode = defaultMode) => {
      // Skip empty content
      if (!content.trim()) {
        return;
      }

      // Deduplicate rapid identical announcements
      if (deduplicate && content === lastAnnouncedRef.current) {
        const now = Date.now();
        const lastMessage = messageHistory[messageHistory.length - 1];
        if (lastMessage && now - lastMessage.timestamp < debounceTime) {
          return;
        }
      }

      clearTimers();

      // Update the live region mode
      setCurrentMode(mode);

      // Create the message
      const message: AriaLiveMessage = {
        id: generateMessageId(),
        content,
        mode,
        timestamp: Date.now(),
      };

      // Update last announced for deduplication
      lastAnnouncedRef.current = content;

      // Clear the region first to ensure the announcement is made
      // (screen readers may not announce if content doesn't change)
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = '';
      }
      setCurrentMessage(null);

      // Set the new content after a delay
      clearTimeoutRef.current = setTimeout(() => {
        setCurrentMessage(message);
        setMessageHistory((prev) => {
          const newHistory = [...prev, message];
          // Keep only the last maxHistory messages
          if (newHistory.length > maxHistory) {
            return newHistory.slice(-maxHistory);
          }
          return newHistory;
        });

        // Update the live region
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = content;
        }
      }, clearDelay);
    },
    [defaultMode, deduplicate, debounceTime, clearTimers, clearDelay, maxHistory, messageHistory]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Determine role based on mode
  const getRole = (): 'status' | 'alert' => {
    return currentMode === 'assertive' ? 'alert' : 'status';
  };

  // Props for the live region element
  const liveRegionProps = {
    'aria-live': currentMode,
    'aria-atomic': true as const,
    role: getRole(),
    className: 'sr-only', // Screen reader only class
    style: {
      position: 'absolute' as const,
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap' as const,
      border: 0,
    },
  };

  return {
    announce,
    clear,
    currentMessage,
    messageHistory,
    liveRegionProps,
    liveRegionRef,
  };
}

// ============================================================================
// Additional Hook: useAnnouncer
// ============================================================================

export interface UseAnnouncerReturn {
  /** Announce a polite message */
  announcePolite: (message: string) => void;
  /** Announce an assertive message */
  announceAssertive: (message: string) => void;
  /** Props for the polite live region */
  politeProps: {
    'aria-live': 'polite';
    'aria-atomic': boolean;
    role: 'status';
    style: React.CSSProperties;
  };
  /** Props for the assertive live region */
  assertiveProps: {
    'aria-live': 'assertive';
    'aria-atomic': boolean;
    role: 'alert';
    style: React.CSSProperties;
  };
}

/**
 * Simpler hook for dual live region announcements.
 * Creates separate polite and assertive regions for better control.
 *
 * @returns Object with announcement functions and region props
 *
 * @example
 * const { announcePolite, announceAssertive, politeProps, assertiveProps } = useAnnouncer();
 *
 * return (
 *   <>
 *     <div {...politeProps} />
 *     <div {...assertiveProps} />
 *   </>
 * );
 */
export function useAnnouncer(): UseAnnouncerReturn {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announcePolite = useCallback((message: string) => {
    if (!politeRef.current) return;

    // Clear then set to ensure announcement
    politeRef.current.textContent = '';
    clearTimeoutRef.current = setTimeout(() => {
      if (politeRef.current) {
        politeRef.current.textContent = message;
      }
    }, 100);
  }, []);

  const announceAssertive = useCallback((message: string) => {
    if (!assertiveRef.current) return;

    // Clear then set to ensure announcement
    assertiveRef.current.textContent = '';
    clearTimeoutRef.current = setTimeout(() => {
      if (assertiveRef.current) {
        assertiveRef.current.textContent = message;
      }
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  };

  return {
    announcePolite,
    announceAssertive,
    politeProps: {
      'aria-live': 'polite' as const,
      'aria-atomic': true as const,
      role: 'status' as const,
      style: baseStyle,
    },
    assertiveProps: {
      'aria-live': 'assertive' as const,
      'aria-atomic': true as const,
      role: 'alert' as const,
      style: baseStyle,
    },
  };
}

export default useAriaLive;
