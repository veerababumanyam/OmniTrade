/**
 * Modal Component Types
 * Liquid Glass Design System
 * Macro-Volume Organism
 */

import type { ReactNode, CSSProperties, RefObject } from 'react';

// ============================================================================
// Modal Sizes
// ============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

export interface ModalSizeConfig {
  width: string;
  maxWidth: string;
  maxHeight?: string;
  padding: string;
}

export const MODAL_SIZES: Record<ModalSize, ModalSizeConfig> = {
  sm: {
    width: '400px',
    maxWidth: '90vw',
    padding: 'var(--ot-space-4)',
  },
  md: {
    width: '560px',
    maxWidth: '90vw',
    padding: 'var(--ot-space-6)',
  },
  lg: {
    width: '720px',
    maxWidth: '90vw',
    padding: 'var(--ot-space-6)',
  },
  xl: {
    width: '960px',
    maxWidth: '95vw',
    padding: 'var(--ot-space-8)',
  },
  fullscreen: {
    width: '100vw',
    maxWidth: '100vw',
    maxHeight: '100vh',
    padding: 'var(--ot-space-6)',
  },
} as const;

// ============================================================================
// Modal Animation
// ============================================================================

export interface ModalAnimationConfig {
  /** Spring damping ratio (0-1) */
  damping: number;
  /** Spring stiffness */
  stiffness: number;
  /** Animation duration in ms */
  duration: number;
  /** Initial scale */
  initialScale: number;
  /** Final scale */
  finalScale: number;
  /** Initial opacity */
  initialOpacity: number;
  /** Final opacity */
  finalOpacity: number;
}

export const MODAL_ANIMATION: ModalAnimationConfig = {
  damping: 0.7,
  stiffness: 300,
  duration: 300,
  initialScale: 0.95,
  finalScale: 1,
  initialOpacity: 0,
  finalOpacity: 1,
} as const;

export const OVERLAY_ANIMATION = {
  duration: 200,
  initialOpacity: 0,
  finalOpacity: 1,
} as const;

// ============================================================================
// Modal Action
// ============================================================================

export type ModalActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ModalAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: ModalActionVariant;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Icon component */
  icon?: ReactNode;
  /** Custom CSS class */
  className?: string;
  /** Test ID */
  testId?: string;
}

// ============================================================================
// Modal Props
// ============================================================================

export interface ModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: ReactNode;
  /** Modal description/subtitle */
  description?: ReactNode;
  /** Modal content */
  children: ReactNode;
  /** Footer action buttons */
  actions?: ModalAction[];
  /** Modal size */
  size?: ModalSize;
  /** Close when clicking overlay */
  closeOnOverlay?: boolean;
  /** Close when pressing Escape */
  closeOnEsc?: boolean;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Custom header content (replaces title/description) */
  headerContent?: ReactNode;
  /** Custom footer content (replaces actions) */
  footerContent?: ReactNode;
  /** Hide header entirely */
  hideHeader?: boolean;
  /** Hide footer entirely */
  hideFooter?: boolean;
  /** Custom CSS class for modal container */
  className?: string;
  /** Custom CSS class for overlay */
  overlayClassName?: string;
  /** Custom CSS class for content area */
  contentClassName?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Portal container element */
  container?: HTMLElement | RefObject<HTMLElement | null>;
  /** ID for the modal */
  id?: string;
  /** ARIA label (used if no title) */
  'aria-label'?: string;
  /** ARIA described by */
  'aria-describedby'?: string;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Prevent focus trap (for nested modals) */
  disableFocusTrap?: boolean;
  /** Custom z-index */
  zIndex?: number;
  /** Animation configuration */
  animation?: Partial<ModalAnimationConfig>;
  /** Called when modal opens (after animation) */
  onOpenComplete?: () => void;
  /** Called when modal closes (after animation) */
  onCloseComplete?: () => void;
}

// ============================================================================
// Modal Header Props
// ============================================================================

export interface ModalHeaderProps {
  /** Modal title */
  title?: ReactNode;
  /** Modal description */
  description?: ReactNode;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Custom CSS class */
  className?: string;
  /** Children to render instead of title/description */
  children?: ReactNode;
}

// ============================================================================
// Modal Footer Props
// ============================================================================

export interface ModalFooterProps {
  /** Action buttons */
  actions?: ModalAction[];
  /** Custom CSS class */
  className?: string;
  /** Children to render instead of actions */
  children?: ReactNode;
  /** Alignment */
  align?: 'left' | 'center' | 'right' | 'stretch';
}

// ============================================================================
// Modal Content Props
// ============================================================================

export interface ModalContentProps {
  /** Content */
  children: ReactNode;
  /** Custom CSS class */
  className?: string;
  /** Scrollable content */
  scrollable?: boolean;
  /** Maximum height */
  maxHeight?: string | number;
}

// ============================================================================
// Signal Types
// ============================================================================

export interface ModalOpenSignal {
  modalId: string;
  title?: string;
  size: ModalSize;
  timestamp: number;
}

export interface ModalCloseSignal {
  modalId: string;
  reason: 'overlay' | 'esc' | 'closeButton' | 'action' | 'programmatic';
  timestamp: number;
}

// ============================================================================
// Confirmation Modal Props
// ============================================================================

export interface ConfirmationModalProps extends Omit<ModalProps, 'children' | 'actions'> {
  /** Confirmation message */
  message: ReactNode;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Confirm button variant */
  confirmVariant?: ModalActionVariant;
  /** Danger confirmation (destructive action) */
  danger?: boolean;
  /** Called when confirmed */
  onConfirm: () => void | Promise<void>;
  /** Called when cancelled */
  onCancel?: () => void;
  /** Loading state for confirm action */
  loading?: boolean;
}
