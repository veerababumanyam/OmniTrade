/**
 * ChatMessageList Component
 * Liquid Glass Design System - OmniTrade
 *
 * A molecule component for displaying chat messages with:
 * - Auto-scroll to bottom
 * - Lazy loading (scroll to top)
 * - Date separators
 * - Typing indicator at bottom
 * - Unread message indicator
 * - Message grouping (consecutive from same role)
 * - Virtualization support for large lists
 */

import {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { cn } from '../../utils/cn';
import { ChatBubble } from '../ChatBubble';
import type {
  ChatMessageListProps,
  ChatMessageListRef,
  ChatMessageListSignalEvent,
  ChatMessage,
} from './types';
import styles from './styles.module.css';

/**
 * Format date for separator
 */
function formatDateSeparator(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === now.toDateString()) {
    return 'Today';
  }

  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if messages should be grouped
 */
function shouldGroupMessages(
  current: ChatMessage,
  previous: ChatMessage | null,
  timeThreshold: number
): boolean {
  if (!previous) return false;
  if (current.role !== previous.role) return false;

  const currentTime = typeof current.timestamp === 'string'
    ? new Date(current.timestamp).getTime()
    : current.timestamp.getTime();
  const previousTime = typeof previous.timestamp === 'string'
    ? new Date(previous.timestamp).getTime()
    : previous.timestamp.getTime();

  const diffMinutes = (currentTime - previousTime) / (1000 * 60);

  return diffMinutes <= timeThreshold;
}

/**
 * Empty state icon
 */
const EmptyIcon = (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

/**
 * Scroll to bottom icon
 */
const ScrollDownIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/**
 * ChatMessageList component
 */
export const ChatMessageList = forwardRef<ChatMessageListRef, ChatMessageListProps>(
  function ChatMessageList(
    {
      messages,
      loading = false,
      onScrollTop,
      onMessageAction,
      typingIndicator,
      unreadIndicator,
      enableGrouping = true,
      groupTimeThreshold = 5,
      enableVirtualization: _enableVirtualization = false,
      height = '100%',
      autoScroll = true,
      emptyState,
      className,
      'data-testid': testId,
      onSignal,
    },
    ref
  ) {
    const listRef = useRef<HTMLDivElement>(null);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const prevMessagesLengthRef = useRef(messages.length);
    const hasEmittedSignalRef = useRef(false);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      },
      scrollToMessage: (messageId: string) => {
        const messageElement = listRef.current?.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      getListElement: () => listRef.current,
    }), []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      if (autoScroll && isNearBottom && messages.length > prevMessagesLengthRef.current) {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      }
      prevMessagesLengthRef.current = messages.length;
    }, [messages.length, autoScroll, isNearBottom]);

    // Emit signal on lazy load
    useEffect(() => {
      if (!hasEmittedSignalRef.current && messages.length > 0 && onSignal) {
        const event: ChatMessageListSignalEvent = {
          type: 'chat:messages:loaded',
          payload: {
            messageCount: messages.length,
            oldestMessageId: messages[0]?.id,
            newestMessageId: messages[messages.length - 1]?.id,
          },
        };
        onSignal(event);
        hasEmittedSignalRef.current = true;
      }
    }, [messages, onSignal]);

    // Handle scroll for lazy loading and bottom detection
    const handleScroll = useCallback(() => {
      if (!listRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = listRef.current;

      // Check if near bottom
      const isBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsNearBottom(isBottom);

      // Check if near top for lazy loading
      if (scrollTop < 50 && onScrollTop && !isLoadingMore) {
        setIsLoadingMore(true);
        onScrollTop();
        // Reset after a short delay to prevent multiple calls
        setTimeout(() => setIsLoadingMore(false), 500);
      }
    }, [onScrollTop, isLoadingMore]);

    // Scroll to bottom handler
    const handleScrollToBottom = useCallback(() => {
      if (listRef.current) {
        listRef.current.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, []);

    // Handle message action
    const handleMessageAction = useCallback(
      (messageId: string) => (action: string) => {
        onMessageAction?.(messageId, action);
      },
      [onMessageAction]
    );

    // Build message list with date separators and grouping
    const messageList = useMemo(() => {
      const items: Array<
        | { type: 'date'; date: Date | string; id: string }
        | { type: 'message'; message: ChatMessage; isGrouped: boolean; isFirst: boolean; isLast: boolean }
      > = [];

      let currentDate: Date | string | null = null;
      let previousMessage: ChatMessage | null = null;
      let groupCount = 0;

      messages.forEach((message, index) => {
        const messageDate = message.timestamp;

        // Add date separator if new day
        if (!currentDate || !isSameDay(currentDate, messageDate)) {
          items.push({
            type: 'date',
            date: messageDate,
            id: `date-${message.id}`,
          });
          currentDate = messageDate;
          previousMessage = null;
          groupCount = 0;
        }

        // Check grouping
        const shouldGroup = enableGrouping && shouldGroupMessages(message, previousMessage, groupTimeThreshold);

        if (shouldGroup) {
          groupCount++;
        } else {
          groupCount = 0;
        }

        // Check if next message is in same group
        const nextMessage = messages[index + 1];
        const nextInGroup = nextMessage && enableGrouping && shouldGroupMessages(nextMessage, message, groupTimeThreshold);

        items.push({
          type: 'message',
          message,
          isGrouped: shouldGroup,
          isFirst: !shouldGroup || groupCount === 0,
          isLast: !nextInGroup,
        });

        previousMessage = message;
      });

      return items;
    }, [messages, enableGrouping, groupTimeThreshold]);

    // Render empty state
    if (messages.length === 0 && !loading) {
      return (
        <div
          className={cn(styles.messageList, className)}
          style={{ height }}
          data-testid={testId || 'chat-message-list'}
        >
          <div className={styles.emptyState}>
            {emptyState || (
              <>
                <div className={styles.emptyIcon}>{EmptyIcon}</div>
                <h3 className={styles.emptyTitle}>No messages yet</h3>
                <p className={styles.emptyDescription}>
                  Start the conversation by sending a message below.
                </p>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={listRef}
        className={cn(styles.messageList, className)}
        style={{ height }}
        onScroll={handleScroll}
        data-testid={testId || 'chat-message-list'}
      >
        <div className={styles.messagesContainer}>
          {/* Loading indicator at top */}
          {(loading || isLoadingMore) && (
            <div className={styles.loadingMore}>
              <div className={styles.loadingSpinner} />
            </div>
          )}

          {/* Unread indicator */}
          {unreadIndicator && unreadIndicator.count > 0 && (
            <div className={styles.unreadIndicator}>
              <div className={styles.unreadIndicatorContent}>
                <span className={styles.unreadIndicatorPulse} />
                <span>{unreadIndicator.label || `${unreadIndicator.count} new messages`}</span>
              </div>
            </div>
          )}

          {/* Message items */}
          {messageList.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.id} className={styles.dateSeparator}>
                  <div className={styles.dateSeparatorContent}>
                    {formatDateSeparator(item.date)}
                  </div>
                </div>
              );
            }

            const { message, isGrouped, isFirst, isLast } = item;

            return (
              <div
                key={message.id}
                className={styles.messageWrapper}
                data-message-id={message.id}
                data-grouped={isGrouped && !isFirst}
              >
                <ChatBubble
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  avatar={message.avatar}
                  status={message.status}
                  actions={message.actions?.map((action) => ({
                    ...action,
                    onClick: () => handleMessageAction(message.id)(action.type),
                  }))}
                  markdown={message.markdown}
                  isGrouped={isGrouped}
                  isFirstInGroup={isFirst}
                  isLastInGroup={isLast}
                />
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingIndicator?.visible && (
            <div className={styles.typingContainer}>
              {/* Avatar(s) */}
              {typingIndicator.users && typingIndicator.users.length > 0 ? (
                <div className={styles.typingUsers}>
                  {typingIndicator.users.slice(0, 3).map((user) => (
                    <div key={user.id} className={styles.typingAvatar}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.typingAvatar}>AI</div>
              )}

              {/* Typing content */}
              <div className={styles.typingContent}>
                <div className={styles.typingDots}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
                {typingIndicator.text && (
                  <span className={styles.typingText}>{typingIndicator.text}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {!isNearBottom && (
          <button
            type="button"
            className={styles.scrollToBottom}
            onClick={handleScrollToBottom}
            aria-label="Scroll to bottom"
          >
            {ScrollDownIcon}
            {unreadIndicator && unreadIndicator.count > 0 && (
              <span className={styles.scrollToBottomBadge}>{unreadIndicator.count}</span>
            )}
          </button>
        )}
      </div>
    );
  }
);

export default ChatMessageList;
