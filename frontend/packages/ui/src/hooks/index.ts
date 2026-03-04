/**
 * Hooks - Export all custom React hooks
 */

// Signal hooks
export {
  useSignal,
  useSignalOnce,
  useSignalEmitter,
  useSignals,
  useSignalStats,
  useBoundSignalEmitter,
  useSignalWhen,
  type UseSignalOnceOptions,
} from './useSignal';

// Re-export signal types for convenience
export type {
  SignalTopic,
  SignalPayload,
  SignalHandler,
  SignalMetadata,
} from './useSignal';

// Utility hooks
export { useDebounce, useDebouncedCallback } from './useDebounce';
export type { UseThemeReturn, Theme, AccessibilityMode } from './useTheme';
export { useTheme } from './useTheme';
export {
  useKeyboardShortcut,
  useKeyboardShortcuts,
} from './useKeyboardShortcut';
export type { KeyboardShortcutOptions } from './useKeyboardShortcut';

// Accessibility hooks
export { useFocusTrap } from './useFocusTrap';
export type {
  UseFocusTrapOptions,
  UseFocusTrapReturn,
} from './useFocusTrap';

export { useSkipToContent, DEFAULT_SKIP_TARGETS } from './useSkipToContent';
export type {
  SkipTarget,
  UseSkipToContentOptions,
  UseSkipToContentReturn,
  SkipLink,
} from './useSkipToContent';

export { useAriaLive, useAnnouncer } from './useAriaLive';
export type {
  AriaLiveMode,
  AriaLiveMessage,
  UseAriaLiveOptions,
  UseAriaLiveReturn,
  UseAnnouncerReturn,
} from './useAriaLive';
