/**
 * ChatInput Component
 * Liquid Glass Design System - OmniTrade
 *
 * A molecule component for chat message input with:
 * - Auto-growing textarea
 * - Attachment button
 * - Voice input button
 * - Send button with keyboard shortcut (Enter)
 * - Character count
 * - Mention/emoji suggestions
 * - File drag and drop
 */

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from 'react';
import { cn } from '../../utils/cn';
import type {
  ChatInputProps,
  ChatInputRef,
  ChatInputSignalEvent,
  Suggestion,
} from './types';
import styles from './styles.module.css';

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Icons used in the component
 */
const Icons = {
  attach: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  send: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  mic: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  close: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  file: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  ),
  upload: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
};

/**
 * ChatInput component with auto-growing textarea
 */
export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  function ChatInput(
    {
      placeholder = 'Type a message...',
      onSend,
      onAttach,
      onVoice,
      disabled = false,
      maxLength = 4000,
      suggestions = [],
      defaultValue = '',
      value: controlledValue,
      onChange,
      variant = 'default',
      showCharCount = true,
      enableDragDrop = true,
      acceptedFileTypes: _acceptedFileTypes,
      maxFileSize: _maxFileSize,
      maxAttachments = 5,
      attachments = [],
      onRemoveAttachment,
      className,
      'data-testid': testId,
      onSignal,
      autoFocus = false,
    },
    ref
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Internal state for uncontrolled mode
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [_isFocused, setIsFocused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);

    // Determine if component is controlled
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // Filter suggestions based on current input
    const filteredSuggestions = useMemo(() => {
      if (!showSuggestions || suggestions.length === 0) return [];

      // Look for trigger characters at cursor position
      const lastAtSymbol = currentValue.lastIndexOf('@');
      const lastColon = currentValue.lastIndexOf(':');
      const lastSlash = currentValue.lastIndexOf('/');

      const triggerIndex = Math.max(lastAtSymbol, lastColon, lastSlash);

      if (triggerIndex === -1) return [];

      const query = currentValue.slice(triggerIndex + 1).toLowerCase();
      return suggestions.filter(
        (s) => s.label.toLowerCase().includes(query) || s.value.toLowerCase().includes(query)
      );
    }, [currentValue, showSuggestions, suggestions]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      clear: () => {
        if (isControlled) {
          onChange?.('');
        } else {
          setInternalValue('');
        }
      },
      getValue: () => currentValue,
      setValue: (val: string) => {
        if (isControlled) {
          onChange?.(val);
        } else {
          setInternalValue(val);
        }
      },
      getTextArea: () => textareaRef.current,
    }), [currentValue, isControlled, onChange]);

    // Auto-resize textarea
    useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
      }
    }, [currentValue]);

    // Auto-focus
    useEffect(() => {
      if (autoFocus && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [autoFocus]);

    // Handle value change
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      if (maxLength && newValue.length > maxLength) {
        return;
      }

      if (isControlled) {
        onChange?.(newValue);
      } else {
        setInternalValue(newValue);
      }

      // Show suggestions when typing trigger characters
      const lastChar = newValue[newValue.length - 1];
      if (['@', ':', '/'].includes(lastChar)) {
        setShowSuggestions(true);
        setSelectedSuggestionIndex(0);
      }
    }, [isControlled, onChange, maxLength]);

    // Handle send
    const handleSend = useCallback(() => {
      const trimmedValue = currentValue.trim();
      if (!trimmedValue && attachments.length === 0) return;
      if (disabled) return;

      onSend(trimmedValue, attachments.length > 0 ? attachments : undefined);

      // Emit signal
      if (onSignal) {
        const event: ChatInputSignalEvent = {
          type: 'chat:message:send',
          payload: {
            message: trimmedValue,
            attachments: attachments.length > 0 ? attachments : undefined,
            timestamp: new Date(),
          },
        };
        onSignal(event);
      }

      // Clear input after send
      if (!isControlled) {
        setInternalValue('');
      } else {
        onChange?.('');
      }

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, [currentValue, attachments, disabled, onSend, onSignal, isControlled, onChange]);

    // Handle keyboard events
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
        return;
      }

      // Handle suggestion navigation
      if (showSuggestions && filteredSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          return;
        }

        if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          const selected = filteredSuggestions[selectedSuggestionIndex];
          if (selected) {
            insertSuggestion(selected);
          }
          return;
        }

        if (e.key === 'Escape') {
          setShowSuggestions(false);
          return;
        }
      }
    }, [handleSend, showSuggestions, filteredSuggestions, selectedSuggestionIndex]);

    // Insert suggestion into text
    const insertSuggestion = useCallback((suggestion: Suggestion) => {
      const lastAtSymbol = currentValue.lastIndexOf('@');
      const lastColon = currentValue.lastIndexOf(':');
      const lastSlash = currentValue.lastIndexOf('/');

      const triggerIndex = Math.max(lastAtSymbol, lastColon, lastSlash);
      const triggerChar = currentValue[triggerIndex];

      const newValue = currentValue.slice(0, triggerIndex) + triggerChar + suggestion.value + ' ';

      if (isControlled) {
        onChange?.(newValue);
      } else {
        setInternalValue(newValue);
      }

      setShowSuggestions(false);
      textareaRef.current?.focus();
    }, [currentValue, isControlled, onChange]);

    // Handle attachment button
    const handleAttachClick = useCallback(() => {
      if (attachments.length >= maxAttachments) {
        return;
      }
      onAttach?.();
    }, [attachments.length, maxAttachments, onAttach]);

    // Handle voice button
    const handleVoiceClick = useCallback(() => {
      setIsRecording((prev) => !prev);
      onVoice?.();
    }, [onVoice]);

    // Drag and drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      if (enableDragDrop && !disabled) {
        setIsDragging(true);
      }
    }, [enableDragDrop, disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      if (wrapperRef.current && !wrapperRef.current.contains(e.relatedTarget as Node)) {
        setIsDragging(false);
      }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (!enableDragDrop || disabled) return;

      // File handling would be done by parent component via onAttach
      onAttach?.();
    }, [enableDragDrop, disabled, onAttach]);

    // Character count
    const charCount = currentValue.length;
    const isNearLimit = maxLength && charCount > maxLength * 0.8;
    const isAtLimit = maxLength && charCount >= maxLength;

    // Can send check
    const canSend = (currentValue.trim().length > 0 || attachments.length > 0) && !disabled;

    return (
      <div
        ref={wrapperRef}
        className={cn(styles.chatInputWrapper, className)}
        data-testid={testId || 'chat-input'}
      >
        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className={styles.suggestionsDropdown}>
            <ul className={styles.suggestionList} role="listbox">
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  className={styles.suggestionItem}
                  role="option"
                  data-selected={index === selectedSuggestionIndex}
                  onClick={() => insertSuggestion(suggestion)}
                >
                  {suggestion.icon && (
                    <div className={styles.suggestionIcon}>{suggestion.icon}</div>
                  )}
                  <div className={styles.suggestionContent}>
                    <div className={styles.suggestionLabel}>{suggestion.label}</div>
                    {suggestion.description && (
                      <div className={styles.suggestionDescription}>
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main input container */}
        <div
          className={styles.chatInput}
          data-disabled={disabled}
          data-variant={variant}
          data-dragging={isDragging}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className={styles.attachmentsArea}>
              {attachments.map((attachment) => (
                <div key={attachment.id} className={styles.attachment}>
                  {attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className={styles.attachmentImage}
                    />
                  ) : (
                    Icons.file
                  )}
                  <div className={styles.attachmentInfo}>
                    <span className={styles.attachmentName}>{attachment.name}</span>
                    <span className={styles.attachmentSize}>
                      {formatFileSize(attachment.size)}
                    </span>
                  </div>
                  {onRemoveAttachment && (
                    <button
                      type="button"
                      className={styles.attachmentRemove}
                      onClick={() => onRemoveAttachment(attachment.id)}
                      aria-label={`Remove ${attachment.name}`}
                    >
                      {Icons.close}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className={styles.inputArea}>
            {/* Attachment button */}
            {onAttach && (
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleAttachClick}
                disabled={disabled || attachments.length >= maxAttachments}
                aria-label="Attach file"
                title="Attach file"
              >
                {Icons.attach}
              </button>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder={placeholder}
              value={currentValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                setShowSuggestions(false);
              }}
              disabled={disabled}
              rows={1}
              aria-label="Message input"
            />

            {/* Button group */}
            <div className={styles.buttonGroup}>
              {/* Voice button */}
              {onVoice && (
                <button
                  type="button"
                  className={cn(styles.iconButton, styles.voiceButton)}
                  onClick={handleVoiceClick}
                  disabled={disabled}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                  data-recording={isRecording}
                >
                  {Icons.mic}
                </button>
              )}

              {/* Send button */}
              <button
                type="button"
                className={styles.sendButton}
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
                title="Send message (Enter)"
              >
                {Icons.send}
              </button>
            </div>
          </div>

          {/* Footer - character count */}
          {showCharCount && maxLength && (
            <div className={styles.footerArea}>
              <span
                className={styles.charCount}
                data-warning={isNearLimit && !isAtLimit}
                data-error={isAtLimit}
              >
                {charCount}/{maxLength}
              </span>
            </div>
          )}
        </div>

        {/* Drag overlay */}
        {isDragging && (
          <div className={styles.dragOverlay}>
            {Icons.upload}
            <span>Drop files here to attach</span>
          </div>
        )}

        {/* Keyboard shortcut hint */}
        <div className={styles.shortcutHint}>
          <span>Press</span>
          <span className={styles.shortcutKey}>Enter</span>
          <span>to send</span>
        </div>
      </div>
    );
  }
);

export default ChatInput;
