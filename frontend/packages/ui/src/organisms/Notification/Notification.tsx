/**
 * Notification Component
 * Liquid Glass Design System
 * Macro-Volume Organism - Z-axis: translateZ(48px)
 *
 * Enhanced toast notifications with:
 * - Multiple positions (top, bottom, left, right, center)
 * - Auto-dismiss with countdown
 * - Progress bar for auto-dismiss
 * - Action button support
 * - Rich HTML content support
 * - Signal bus integration
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
  NotificationData,
  NotificationProps,
  NotificationContainerProps,
  NotificationProviderProps,
  NotificationContextValue,
  NotificationType,
  NotificationDismissSignal,
  NotificationShowSignal,
} from './types';
import {
  DEFAULT_DURATION,
  DEFAULT_MAX_VISIBLE,
  DEFAULT_POSITION,
  DEFAULT_GAP,
  NOTIFICATION_ANIMATION,
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

const ClockIcon = () => (
  <svg className={styles.countdownIcon} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="6" cy="6" r="5" />
    <path d="M6 3.5V6L8 7" />
  </svg>
);

const NotificationIcons: Record<NotificationType, React.FC> = {
  success: CheckIcon,
  error: AlertCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

// ============================================================================
// Notification Context
// ============================================================================

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Legacy alias for backward compatibility
export const useToast = useNotification;

// ============================================================================
// Notification Component
// ============================================================================

export function Notification({
  id,
  type = 'info',
  title,
  description,
  duration = DEFAULT_DURATION,
  showProgress = true,
  showCountdown = false,
  dismissible = true,
  actions,
  icon,
  className,
  html,
  image,
  imageAlt,
  pauseOnHover = true,
  onDismiss,
  onAction,
  index = 0,
  totalVisible = 1,
  position = DEFAULT_POSITION,
  onDismissCallback,
}: NotificationProps): React.ReactElement {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const [remainingTime, setRemainingTime] = useState(duration);
  const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting'>('entering');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(duration);

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
      setRemainingTime(remaining);

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
    const dismissSignal: NotificationDismissSignal = {
      notificationId: id,
      type,
      reason,
      duration: duration - (remainingTimeRef.current || 0),
    };
    signalBus.publish('ui:notification:dismiss', dismissSignal, { source: 'Notification' });

    // Call dismiss callback
    setTimeout(() => {
      onDismiss?.(id);
      onDismissCallback?.(id);
    }, NOTIFICATION_ANIMATION.exitDuration);
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
  const IconComponent = icon ? null : NotificationIcons[type];

  // Format remaining time for display
  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <div
      className={cn(
        styles.notification,
        styles[`notification--${type}`],
        styles[`notification--position-${position}`],
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
      {/* Image */}
      {image && (
        <img src={image} alt={imageAlt || ''} className={styles.image} />
      )}

      {/* Icon */}
      {(icon || IconComponent) && (
        <div className={cn(styles.icon, styles[`icon--${type}`])}>
          {icon || (IconComponent && <IconComponent />)}
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}

        {/* Rich HTML content or regular description */}
        {html ? (
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          description && <div className={styles.description}>{description}</div>
        )}

        {/* Countdown timer */}
        {showCountdown && duration > 0 && !isPaused && (
          <div className={styles.countdown}>
            <ClockIcon />
            <span>{formatTime(remainingTime)}</span>
          </div>
        )}

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
                {action.icon}
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
            transition: isPaused ? 'none' : `width 50ms linear`,
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// NotificationContainer Component
// ============================================================================

export function NotificationContainer({
  notifications,
  position = DEFAULT_POSITION,
  maxVisible = DEFAULT_MAX_VISIBLE,
  onDismiss,
  className,
  style,
  renderNotification,
  newestOnTop = true,
  gap = DEFAULT_GAP,
  offset,
  'data-ai-readable': aiReadable = true,
  'data-testid': testId,
}: NotificationContainerProps): React.ReactElement | null {
  // Emit show signal when notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      const lastNotification = notifications[notifications.length - 1];
      const showSignal: NotificationShowSignal = {
        notificationId: lastNotification.id,
        type: lastNotification.type || 'info',
        title: typeof lastNotification.title === 'string' ? lastNotification.title : undefined,
        position,
      };
      signalBus.publish('ui:notification:show', showSignal, { source: 'NotificationContainer' });
    }
  }, [notifications, position]);

  // Sort and limit visible notifications
  const visibleNotifications = useMemo(() => {
    const sorted = newestOnTop ? [...notifications].reverse() : notifications;
    return sorted.slice(0, maxVisible);
  }, [notifications, newestOnTop, maxVisible]);

  const hiddenCount = notifications.length - maxVisible;

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

  if (notifications.length === 0) return null;

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
      {visibleNotifications.map((notification, idx) => (
        renderNotification ? (
          renderNotification(notification, idx)
        ) : (
          <Notification
            key={notification.id}
            {...notification}
            position={position}
            index={idx}
            totalVisible={visibleNotifications.length}
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
// NotificationProvider Component
// ============================================================================

export function NotificationProvider({
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
}: NotificationProviderProps): React.ReactElement {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Add notification
  const addNotification = useCallback(
    (notification: Omit<NotificationData, 'id' | 'createdAt'>): string => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newNotification: NotificationData = {
        ...notification,
        id,
        createdAt: Date.now(),
        duration: notification.duration ?? defaultDuration,
      };

      setNotifications((prev) => [...prev, newNotification]);
      return id;
    },
    [defaultDuration]
  );

  // Convenience methods
  const success = useCallback(
    (title: React.ReactNode, description?: React.ReactNode, options?: Partial<NotificationData>) =>
      addNotification({ type: 'success', title, description, ...options }),
    [addNotification]
  );

  const error = useCallback(
    (title: React.ReactNode, description?: React.ReactNode, options?: Partial<NotificationData>) =>
      addNotification({ type: 'error', title, description, ...options }),
    [addNotification]
  );

  const warning = useCallback(
    (title: React.ReactNode, description?: React.ReactNode, options?: Partial<NotificationData>) =>
      addNotification({ type: 'warning', title, description, ...options }),
    [addNotification]
  );

  const info = useCallback(
    (title: React.ReactNode, description?: React.ReactNode, options?: Partial<NotificationData>) =>
      addNotification({ type: 'info', title, description, ...options }),
    [addNotification]
  );

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    onDismiss?.(id);
  }, [onDismiss]);

  // Dismiss all notifications
  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update notification
  const updateNotification = useCallback((id: string, updates: Partial<NotificationData>) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  }, []);

  // Check if notification is active
  const isNotificationActive = useCallback((id: string) => {
    return notifications.some((n) => n.id === id);
  }, [notifications]);

  // Context value
  const contextValue = useMemo<NotificationContextValue>(
    () => ({
      notify: addNotification,
      success,
      error,
      warning,
      info,
      dismiss: dismissNotification,
      dismissAll,
      update: updateNotification,
      notifications,
      isActive: isNotificationActive,
    }),
    [addNotification, success, error, warning, info, dismissNotification, dismissAll, updateNotification, notifications, isNotificationActive]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={notifications}
        position={position}
        maxVisible={maxVisible}
        onDismiss={dismissNotification}
        className={className}
        style={style}
        newestOnTop={newestOnTop}
        gap={gap}
        offset={offset}
      />
    </NotificationContext.Provider>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

export function createNotificationHelpers() {
  return {
    success: (_title: NotificationData['title'], _description?: NotificationData['description']) =>
      `notification-${Date.now()}`,
    error: (_title: NotificationData['title'], _description?: NotificationData['description']) =>
      `notification-${Date.now()}`,
    warning: (_title: NotificationData['title'], _description?: NotificationData['description']) =>
      `notification-${Date.now()}`,
    info: (_title: NotificationData['title'], _description?: NotificationData['description']) =>
      `notification-${Date.now()}`,
  };
}

Notification.displayName = 'Notification';
NotificationContainer.displayName = 'NotificationContainer';
NotificationProvider.displayName = 'NotificationProvider';

export default Notification;
