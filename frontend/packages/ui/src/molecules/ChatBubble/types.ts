/**
 * ChatBubble Component Types
 * Liquid Glass Design System - OmniTrade
 */

export type ChatRole = 'user' | 'ai' | 'system';

export type ChatStatus = 'typing' | 'complete' | 'error' | 'pending';

export type ChatActionType = 'copy' | 'regenerate' | 'feedback' | 'edit' | 'delete';

export interface ChatAction {
  /** Type of action */
  type: ChatActionType;
  /** Label for accessibility */
  label: string;
  /** Icon name or React node */
  icon?: React.ReactNode;
  /** Handler for the action */
  onClick: () => void;
  /** Whether the action is disabled */
  disabled?: boolean;
}

export interface ChatAvatar {
  /** Image source URL */
  src?: string;
  /** Alt text for the avatar */
  alt?: string;
  /** Fallback initials when no image */
  fallback?: string;
  /** Color variant for AI/system avatars */
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
}

export interface ChatBubbleProps {
  /** Role of the message sender */
  role: ChatRole;
  /** Message content - supports markdown when enabled */
  content: string;
  /** Timestamp of the message */
  timestamp?: Date | string;
  /** Avatar configuration */
  avatar?: ChatAvatar;
  /** Current status of the message */
  status?: ChatStatus;
  /** Available actions for this message */
  actions?: ChatAction[];
  /** Enable markdown rendering */
  markdown?: boolean;
  /** Whether this is part of a consecutive group from same sender */
  isGrouped?: boolean;
  /** Whether this is the first in a group */
  isFirstInGroup?: boolean;
  /** Whether this is the last in a group */
  isLastInGroup?: boolean;
  /** Custom className */
  className?: string;
  /** Custom data attributes for testing */
  'data-testid'?: string;
  /** Signal emission callback */
  onSignal?: (event: ChatBubbleSignalEvent) => void;
}

export interface ChatBubbleSignalEvent {
  type: 'chat:message:display';
  payload: {
    role: ChatRole;
    content: string;
    timestamp?: Date | string;
    status?: ChatStatus;
  };
}

export interface ChatBubbleStyleVars {
  '--chat-bubble-align': 'flex-start' | 'flex-end';
  '--chat-bubble-bg': string;
  '--chat-bubble-color': string;
  '--chat-bubble-border-radius': string;
}
