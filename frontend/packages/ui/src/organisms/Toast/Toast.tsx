/**
 * Toast Component
 * Liquid Glass Design System
 * Macro-Volume Organism - Z-axis: translateZ(48px)
 *
 * Features:
 * - Multiple positions (top-right, top-left, top-center, bottom-right, bottom-left, bottom-center)
 * - Auto-dismiss with progress bar
 * - Action buttons
 * - Pause on hover
 * - Stack management
 * - AI-readable: true
 * - Signal: emit 'ui:toast:show' on show, 'ui:toast:dismiss' on dismiss
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  ToastData,
  ToastProps,
  ToastContainerProps,
  ToastProviderProps,
  ToastContextValue,
  ToastType,
  ToastDismissSignal,
  ToastShowSignal,
} from './types';
import {
  DEFAULT_DURATION,
  DEFAULT_MAX_VISIBLE,
  DEFAULT_POSITION,
  DEFAULT_GAP,
  TOAST_ANIMATION,
} from './types';
import styles from './styles.module.css';

// ============================================================================
// Icons
// ============================================================================

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16,6 8.5,13.5 5,10" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="10" cy="10" r="8" />
    <line x1="10" y1="6" x2="10" y2="10" />
    <circle cx="10" cy="14" r="1" fill="currentColor" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10,2 L18,16 L2,16 Z" />
    <line x1="10" y1="8" x2="10" y2="11" />
    <circle cx="10" cy="14" r="1" fill="currentColor" />
  </svg>
);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="10" cy="10" r="8" />
    <line x1="10" y1="14" x2="10" y2="10" />
    <circle cx="10" cy="6" r="1" fill="currentColor" />
  </svg>
);

const ToastIcons: Record<ToastType, React.FC> = {
  success: CheckIcon,
  error: AlertCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

// ============================================================================
// Toast Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// Toast Component
// ============================================================================

export function Toast({
  id,
  type = 'info',
  title,
  description,
  duration = DEFAULT_DURATION,
  showProgress = true,
  dismissible = true,
  actions,
  icon,
  className,
  pauseOnHover = true,
  onDismiss,
  onAction,
  index = 0,
  totalVisible = 1,
  onDismissCallback,
}: ToastProps): React.ReactElement {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting'>('entering');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(duration);

  // Get position from context or default
  const position = DEFAULT_POSITION;

  // Handle enter animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationState('entered');
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss timer with progress
  useEffect(() => {
    if (duration === 0 || isPaused) return;

    const startTime = Date.now();
    startTimeRef.current = startTime;
    const tickInterval = 50;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;
      remainingTimeRef.current = remaining;

      if (remaining <= 0) {
        handleDismiss('auto');
      } else {
        setProgress((remaining / duration) * 100);
      }
    }, tickInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [duration, isPaused]);

  // Pause/resume on hover
  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  }, [pauseOnHover]);

  // Dismiss handler
  const handleDismiss = useCallback((reason: 'auto' | 'user' | 'programmatic') => {
    setAnimationState('exiting');

    // Emit dismiss signal
    const dismissSignal: ToastDismissSignal = {
      toastId: id,
      type,
      reason,
      duration: duration - (remainingTimeRef.current || 0),
    };
    signalBus.publish('ui:toast:dismiss', dismissSignal, { source: 'Toast' });

    // Call dismiss callback
    setTimeout(() => {
      onDismiss?.(id);
      onDismissCallback?.(id);
    }, TOAST_ANIMATION.exitDuration);
  }, [id, type, duration, onDismiss, onDismissCallback]);

  // Action click handler
  const handleActionClick = useCallback((actionIndex: number) => {
    onAction?.(id, actionIndex);
    if (actions?.[actionIndex]?.onClick) {
      actions[actionIndex].onClick();
    }
    handleDismiss('user');
  }, [id, actions, onAction, handleDismiss]);

  // Get icon component
  const IconComponent = icon ? null : ToastIcons[type];

  return (
    <div
      className={cn(
        styles.toast,
        styles[`toast--${type}`],
        styles[`toast--position-${position}`],
        className
      )}
      data-state={animationState}
      data-ai-readable={true}
      role="alert"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        zIndex: totalVisible - index,
      }}
    >
      {/* Icon */}
      {(icon || IconComponent) && (
        <div className={cn(styles.icon, styles[`icon--${type}`])}>
          {icon || (IconComponent && <IconComponent />)}
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        {description && <div className={styles.description}>{description}</div>}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className={styles.actions}>
            {actions.map((action, idx) => (
              <button
                key={idx}
                className={cn(
                  styles.actionButton,
                  action.variant && styles[`actionButton--${action.variant}`]
                )}
                onClick={() => handleActionClick(idx)}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close button */}
      {dismissible && (
        <button
          className={styles.closeButton}
          onClick={() => handleDismiss('user')}
          aria-label="Dismiss notification"
          type="button"
        >
          <XIcon />
        </button>
      )}

      {/* Progress bar */}
      {showProgress && duration > 0 && (
        <div
          className={cn(
            styles.progressBar,
            styles[`progressBar--${type}`],
            isPaused && styles['progressBar--paused']
          )}
          style={{
            width: `${progress}%`,
            transition: isPaused ? 'none' : `width ${50}ms linear`,
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// ToastContainer Component
// ============================================================================

export function ToastContainer({
  toasts,
  position = DEFAULT_POSITION,
  maxVisible = DEFAULT_MAX_VISIBLE,
  onDismiss,
  className,
  style,
  renderToast,
  newestOnTop = true,
  gap = DEFAULT_GAP,
  offset,
  'data-ai-readable': aiReadable = true,
  'data-testid': testId,
}: ToastContainerProps): React.ReactElement | null {
  // Emit show signal when toasts change
  useEffect(() => {
    if (toasts.length > 0) {
      const lastToast = toasts[toasts.length - 1];
      const showSignal: ToastShowSignal = {
        toastId: lastToast.id,
        type: lastToast.type || 'info',
        title: typeof lastToast.title === 'string' ? lastToast.title : undefined,
        position,
      };
      signalBus.publish('ui:toast:show', showSignal, { source: 'ToastContainer' });
    }
  }, [toasts, position]);

  // Sort and limit visible toasts
  const visibleToasts = useMemo(() => {
    const sorted = newestOnTop ? [...toasts].reverse() : toasts;
    return sorted.slice(0, maxVisible);
  }, [toasts, newestOnTop, maxVisible]);

  const hiddenCount = toasts.length - maxVisible;

  // Container position class
  const positionClass = styles[`container--${position}`];

  // Offset styles
  const containerStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = { ...style };
    if (typeof offset === 'number') {
      const offsetValue = `${offset}px`;
      if (position.includes('top')) {
        baseStyle.top = offsetValue;
      }
      if (position.includes('bottom')) {
        baseStyle.bottom = offsetValue;
      }
      if (position.includes('left')) {
        baseStyle.left = offsetValue;
      }
      if (position.includes('right')) {
        baseStyle.right = offsetValue;
      }
    } else if (typeof offset === 'string') {
      if (position.includes('top')) {
        baseStyle.top = offset;
      }
      if (position.includes('bottom')) {
        baseStyle.bottom = offset;
      }
    }
    return baseStyle;
  }, [position, offset, style]);

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className={cn(styles.container, positionClass, className)}
      style={{
        ...containerStyle,
        gap: `${gap}px`,
      }}
      data-ai-readable={aiReadable}
      data-testid={testId}
    >
      {visibleToasts.map((toast, idx) => (
        renderToast ? (
          renderToast(toast, idx)
        ) : (
          <Toast
            key={toast.id}
            {...toast}
            index={idx}
            totalVisible={visibleToasts.length}
            onDismissCallback={onDismiss}
          />
        )
      ))}

      {/* Queue indicator */}
      {hiddenCount > 0 && (
        <div className={styles.queueIndicator}>
          +{hiddenCount} more notification{hiddenCount > 1 ? 's' : ''}
        </div>
      )}
    </div>,
    document.body
  );
}

// ============================================================================
// ToastProvider Component
// ============================================================================

export function ToastProvider({
  children,
  position = DEFAULT_POSITION,
  maxVisible = DEFAULT_MAX_VISIBLE,
  defaultDuration = DEFAULT_DURATION,
  onDismiss,
  className,
  style,
  newestOnTop = true,
  gap = DEFAULT_GAP,
  offset,
}: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Add toast
  const addToast = useCallback(
    (toast: Omit<ToastData, 'id' | 'createdAt'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast: ToastData = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? defaultDuration,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  },
  [defaultDuration]
  );

  // Dismiss toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    onDismiss?.(id);
  }, [onDismiss]);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Update toast
  const updateToast = useCallback((id: string, updates: Partial<ToastData>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  // Check if toast is active
  const isToastActive = useCallback((id: string) => {
    return toasts.some((t) => t.id === id);
  }, [toasts]);

  // Context value
  const contextValue = useMemo<ToastContextValue>(
    () => ({
      addToast,
      dismissToast,
      dismissAll,
      updateToast,
      toasts,
      isToastActive,
    }),
    [addToast, dismissToast, dismissAll, updateToast, toasts, isToastActive]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        position={position}
        maxVisible={maxVisible}
        onDismiss={dismissToast}
        className={className}
        style={style}
        newestOnTop={newestOnTop}
        gap={gap}
        offset={offset}
      />
    </ToastContext.Provider>
  );
}

// ============================================================================
// Helper Hook
// ============================================================================

export function createToastHelpers() {
  return {
    success: (_title: ToastData['title'], _description?: ToastData['description']) =>
      `toast-${Date.now()}`,
    error: (_title: ToastData['title'], _description?: ToastData['description']) =>
      `toast-${Date.now()}`,
    warning: (_title: ToastData['title'], _description?: ToastData['description']) =>
      `toast-${Date.now()}`,
    info: (_title: ToastData['title'], _description?: ToastData['description']) =>
      `toast-${Date.now()}`,
  };
}

Toast.displayName = 'Toast';
ToastContainer.displayName = 'ToastContainer';
ToastProvider.displayName = 'ToastProvider';

export default Toast;
