/**
 * ChatInput Component Types
 * Liquid Glass Design System - OmniTrade
 */

export type ChatInputVariant = 'default' | 'compact' | 'expanded';

export type SuggestionType = 'mention' | 'emoji' | 'command' | 'autocomplete';

export interface Suggestion {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional icon or avatar */
  icon?: React.ReactNode;
  /** Type of suggestion */
  type: SuggestionType;
  /** Value to insert when selected */
  value: string;
}

export interface Attachment {
  /** Unique identifier */
  id: string;
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Preview URL (for images) */
  preview?: string;
  /** File or URL */
  url?: string;
}

export interface ChatInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Send message callback */
  onSend: (message: string, attachments?: Attachment[]) => void;
  /** Attachment button callback */
  onAttach?: () => void;
  /** Voice input callback */
  onVoice?: () => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Maximum character count */
  maxLength?: number;
  /** Suggestion items for autocomplete */
  suggestions?: Suggestion[];
  /** Initial value */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Change callback for controlled input */
  onChange?: (value: string) => void;
  /** Visual variant */
  variant?: ChatInputVariant;
  /** Show character count */
  showCharCount?: boolean;
  /** Enable file drag and drop */
  enableDragDrop?: boolean;
  /** Allowed file types for drag and drop */
  acceptedFileTypes?: string[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Maximum number of attachments */
  maxAttachments?: number;
  /** Current attachments */
  attachments?: Attachment[];
  /** Remove attachment callback */
  onRemoveAttachment?: (id: string) => void;
  /** Custom className */
  className?: string;
  /** Custom data attributes for testing */
  'data-testid'?: string;
  /** Signal emission callback */
  onSignal?: (event: ChatInputSignalEvent) => void;
  /** Focus the input */
  autoFocus?: boolean;
}

export interface ChatInputSignalEvent {
  type: 'chat:message:send';
  payload: {
    message: string;
    attachments?: Attachment[];
    timestamp: Date;
  };
}

export interface ChatInputStyleVars {
  '--chat-input-min-height': string;
  '--chat-input-max-height': string;
}

export interface ChatInputRef {
  /** Focus the input */
  focus: () => void;
  /** Blur the input */
  blur: () => void;
  /** Clear the input */
  clear: () => void;
  /** Get current value */
  getValue: () => string;
  /** Set value */
  setValue: (value: string) => void;
  /** Get textarea element */
  getTextArea: () => HTMLTextAreaElement | null;
}
