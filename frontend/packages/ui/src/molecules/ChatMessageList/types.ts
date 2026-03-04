/**
 * ChatMessageList Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ChatRole, ChatStatus, ChatAction } from '../ChatBubble/types';

export interface ChatMessage {
  /** Unique identifier */
  id: string;
  /** Role of the message sender */
  role: ChatRole;
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: Date | string;
  /** Message status */
  status?: ChatStatus;
  /** Avatar configuration */
  avatar?: {
    src?: string;
    alt?: string;
    fallback?: string;
    variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
  };
  /** Available actions */
  actions?: ChatAction[];
  /** Enable markdown rendering */
  markdown?: boolean;
  /** Group ID for grouping consecutive messages */
  groupId?: string;
}

export interface DateSeparator {
  type: 'date-separator';
  date: Date | string;
  id: string;
}

export type MessageListItem = ChatMessage | DateSeparator;

export interface UnreadIndicator {
  /** Count of unread messages */
  count: number;
  /** Custom label */
  label?: string;
}

export interface TypingIndicatorConfig {
  /** Whether typing indicator is visible */
  visible: boolean;
  /** User(s) who are typing */
  users?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  /** Custom text to show */
  text?: string;
}

export interface ChatMessageListProps {
  /** Array of messages to display */
  messages: ChatMessage[];
  /** Loading state */
  loading?: boolean;
  /** Callback when scrolling to top (for lazy loading) */
  onScrollTop?: () => void;
  /** Callback when a message action is triggered */
  onMessageAction?: (messageId: string, action: string) => void;
  /** Show typing indicator */
  typingIndicator?: TypingIndicatorConfig;
  /** Unread message indicator */
  unreadIndicator?: UnreadIndicator;
  /** Enable message grouping */
  enableGrouping?: boolean;
  /** Time threshold for grouping in minutes */
  groupTimeThreshold?: number;
  /** Enable virtualization for large lists */
  enableVirtualization?: boolean;
  /** Height of the list container */
  height?: string | number;
  /** Auto-scroll to bottom on new messages */
  autoScroll?: boolean;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Custom data attributes for testing */
  'data-testid'?: string;
  /** Signal emission callback */
  onSignal?: (event: ChatMessageListSignalEvent) => void;
}

export interface ChatMessageListSignalEvent {
  type: 'chat:messages:loaded';
  payload: {
    messageCount: number;
    oldestMessageId?: string;
    newestMessageId?: string;
  };
}

export interface ChatMessageListRef {
  /** Scroll to bottom of list */
  scrollToBottom: () => void;
  /** Scroll to specific message */
  scrollToMessage: (messageId: string) => void;
  /** Get list container element */
  getListElement: () => HTMLDivElement | null;
}

export interface ChatMessageListStyleVars {
  '--chat-list-height': string;
}
