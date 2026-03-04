/**
 * ChatBubble Component
 * Liquid Glass Design System - OmniTrade
 *
 * A molecule component for displaying chat messages with:
 * - Role-based styling (user, ai, system)
 * - Markdown rendering support
 * - Timestamp display
 * - AI thinking animation
 * - Action buttons (copy, regenerate, feedback)
 * - Status indicator for AI (typing, complete)
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { cn } from '../../utils/cn';
import type {
  ChatBubbleProps,
  ChatBubbleSignalEvent,
  ChatAction,
  ChatRole,
} from './types';
import styles from './styles.module.css';

/**
 * Simple markdown renderer for basic formatting
 * Supports: bold, italic, code, links, lists, blockquotes
 */
function renderMarkdown(content: string): React.ReactNode {
  // This is a simplified markdown renderer
  // In production, use a library like react-markdown
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeLang = '';
  let key = 0;

  const processInline = (text: string): React.ReactNode => {
    // Process inline elements: bold, italic, code, links
    let result: React.ReactNode = text;

    // Bold
    result = typeof result === 'string'
      ? result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      : result;

    // Italic
    result = typeof result === 'string'
      ? result.replace(/\*(.+?)\*/g, '<em>$1</em>')
      : result;

    // Inline code
    result = typeof result === 'string'
      ? result.replace(/`([^`]+)`/g, '<code>$1</code>')
      : result;

    // Links
    result = typeof result === 'string'
      ? result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      : result;

    if (typeof result === 'string' && result !== text) {
      return <span dangerouslySetInnerHTML={{ __html: result }} />;
    }

    return result;
  };

  lines.forEach((line, _index) => {
    // Code block handling
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.slice(3);
        codeContent = '';
      } else {
        inCodeBlock = false;
        elements.push(
          <pre key={key++}>
            <code className={codeLang ? `language-${codeLang}` : ''}>
              {codeContent.trim()}
            </code>
          </pre>
        );
      }
      return;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      return;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<br key={key++} />);
      return;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h4 key={key++}>{processInline(line.slice(4))}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={key++}>{processInline(line.slice(3))}</h3>);
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={key++}>{processInline(line.slice(2))}</h2>);
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={key++}>{processInline(line.slice(2))}</blockquote>
      );
      return;
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={key++}>{processInline(line.slice(2))}</li>);
      return;
    }

    // Ordered list
    const orderedMatch = line.match(/^(\d+)\.\s(.+)/);
    if (orderedMatch) {
      elements.push(<li key={key++}>{processInline(orderedMatch[2])}</li>);
      return;
    }

    // Paragraph
    elements.push(<p key={key++}>{processInline(line)}</p>);
  });

  return elements;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Default icons for action buttons
 */
const ActionIcons: Record<string, React.ReactNode> = {
  copy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  regenerate: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  ),
  feedback: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  delete: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

/**
 * Avatar component for chat bubble
 */
function ChatAvatar({
  avatar,
  role,
}: {
  avatar?: ChatBubbleProps['avatar'];
  role: ChatRole;
}) {
  const variant = avatar?.variant || (role === 'ai' ? 'accent' : 'default');

  if (avatar?.src) {
    return (
      <div className={styles.avatar} data-variant={variant}>
        <img
          src={avatar.src}
          alt={avatar.alt || `${role} avatar`}
          className={styles.avatarImage}
        />
      </div>
    );
  }

  if (role === 'system') {
    return (
      <div className={styles.systemIcon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
    );
  }

  const fallback = avatar?.fallback || (role === 'ai' ? 'AI' : 'U');

  return (
    <div className={styles.avatar} data-variant={variant}>
      {fallback}
    </div>
  );
}

/**
 * Typing indicator animation
 */
function TypingIndicator() {
  return (
    <div className={styles.typingIndicator}>
      <span className={styles.typingDot} />
      <span className={styles.typingDot} />
      <span className={styles.typingDot} />
    </div>
  );
}

/**
 * Thinking animation for AI
 */
function ThinkingAnimation() {
  return (
    <div className={styles.thinkingAnimation}>
      <span className={styles.thinkingPulse} />
      <span>Thinking...</span>
    </div>
  );
}

/**
 * ChatBubble component
 */
export function ChatBubble({
  role,
  content,
  timestamp,
  avatar,
  status = 'complete',
  actions,
  markdown = true,
  isGrouped = false,
  isFirstInGroup = true,
  isLastInGroup = true,
  className,
  'data-testid': testId,
  onSignal,
}: ChatBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const hasEmittedSignal = useRef(false);

  // Emit signal on render
  useEffect(() => {
    if (!hasEmittedSignal.current && onSignal) {
      const event: ChatBubbleSignalEvent = {
        type: 'chat:message:display',
        payload: {
          role,
          content,
          timestamp,
          status,
        },
      };
      onSignal(event);
      hasEmittedSignal.current = true;
    }
  }, [role, content, timestamp, status, onSignal]);

  // Handle action button click
  const handleActionClick = (action: ChatAction, e: React.MouseEvent) => {
    e.stopPropagation();
    action.onClick();
  };

  // Render content based on markdown setting
  const renderedContent = useMemo(() => {
    if (markdown) {
      return <div className={styles.content} data-markdown="true">{renderMarkdown(content)}</div>;
    }
    return (
      <div className={styles.content}>
        {content.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < content.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    );
  }, [content, markdown]);

  // Format timestamp
  const formattedTimestamp = timestamp ? formatTimestamp(timestamp) : null;

  // Determine if we should show typing indicator
  const showTyping = status === 'typing' && role === 'ai' && !content;
  const showThinking = status === 'pending' && role === 'ai';

  return (
    <div
      ref={bubbleRef}
      className={cn(styles.chatBubble, className)}
      data-role={role}
      data-status={status}
      data-grouped={isGrouped}
      data-first-in-group={isFirstInGroup}
      data-last-in-group={isLastInGroup}
      data-testid={testId || `chat-bubble-${role}`}
    >
      {/* Avatar */}
      <div className={styles.avatarContainer}>
        <ChatAvatar avatar={avatar} role={role} />
      </div>

      {/* Message wrapper */}
      <div className={styles.messageWrapper}>
        {/* Timestamp */}
        {formattedTimestamp && isLastInGroup && (
          <span className={styles.timestamp}>{formattedTimestamp}</span>
        )}

        {/* Bubble */}
        <div className={styles.bubble}>
          {/* Content */}
          {showTyping ? (
            <TypingIndicator />
          ) : showThinking ? (
            <ThinkingAnimation />
          ) : (
            renderedContent
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className={styles.errorText}>
              Failed to send message. Click to retry.
            </div>
          )}
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && isLastInGroup && (
          <div className={styles.actions}>
            {actions.map((action, index) => (
              <button
                key={`${action.type}-${index}`}
                type="button"
                className={styles.actionButton}
                onClick={(e) => handleActionClick(action, e)}
                disabled={action.disabled}
                aria-label={action.label}
                title={action.label}
              >
                {action.icon || ActionIcons[action.type] || ActionIcons.copy}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatBubble;
