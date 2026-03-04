/**
 * Modal Component
 * Liquid Glass Design System
 * Macro-Volume Organism - Z-axis: translateZ(48px) (extreme focus)
 *
 * Features:
 * - Use Radix UI Dialog
 * - Focus trap
 * - Portal rendering
 * - Overlay with blur
 * - Spring physics animation
 * - Multiple sizes (sm, md, lg, xl, fullscreen)
 * - Close button
 * - Footer with action buttons
 * - AI-readable metadata
 * - Signal: emit 'ui:modal:open'/'ui:modal:close'
 */

'use client';

import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  ModalProps,
  ModalAction,
  ModalOpenSignal,
  ModalCloseSignal,
} from './types';
import styles from './styles.module.css';

// ============================================================================
// Icons (inline SVG components)
// ============================================================================

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ============================================================================
// ModalHeader Component
// ============================================================================

interface ModalHeaderProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

function ModalHeader({
  title,
  description,
  showCloseButton = true,
  onClose,
  className,
  children,
}: ModalHeaderProps) {
  return (
    <div className={cn(styles.header, className)}>
      {children ? (
        children
      ) : (
        <div className={styles.headerContent}>
          {title && (
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          )}
          {description && (
            <Dialog.Description className={styles.description}>
              {description}
            </Dialog.Description>
          )}
        </div>
      )}
      {showCloseButton && onClose && (
        <Dialog.Close asChild>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </Dialog.Close>
      )}
    </div>
  );
}

// ============================================================================
// ModalContent Component
// ============================================================================

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
  maxHeight?: string | number;
}

function ModalContent({
  children,
  className,
  scrollable = true,
  maxHeight,
}: ModalContentProps) {
  return (
    <div
      className={cn(styles.content, scrollable && styles.contentScrollable, className)}
      style={maxHeight ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } : undefined}
    >
      {children}
    </div>
  );
}

// ============================================================================
// ModalFooter Component
// ============================================================================

interface ModalFooterProps {
  actions?: ModalAction[];
  className?: string;
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'stretch';
}

function ModalFooter({
  actions,
  className,
  children,
  align = 'right',
}: ModalFooterProps) {
  const alignClass = {
    left: styles.footerAlignLeft,
    center: styles.footerAlignCenter,
    right: styles.footerAlignRight,
    stretch: styles.footerAlignStretch,
  }[align];

  return (
    <div className={cn(styles.footer, alignClass, className)}>
      {children ? (
        children
      ) : (
        actions?.map((action, index) => (
          <ActionButton key={index} {...action} />
        ))
      )}
    </div>
  );
}

// ============================================================================
// ActionButton Component
// ============================================================================

interface ActionButtonProps extends ModalAction {
  onClick: () => void;
}

function ActionButton({
  label,
  onClick,
  variant = 'secondary',
  disabled = false,
  loading = false,
  icon,
  className,
  testId,
}: ActionButtonProps) {
  const variantClass = {
    primary: styles.actionButtonPrimary,
    secondary: styles.actionButtonSecondary,
    danger: styles.actionButtonDanger,
    ghost: styles.actionButtonGhost,
  }[variant];

  return (
    <button
      className={cn(
        styles.actionButton,
        variantClass,
        loading && styles.actionButtonLoading,
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testId}
    >
      {loading && <span className={styles.actionButtonSpinner} />}
      {!loading && icon}
      {label}
    </button>
  );
}

// ============================================================================
// Modal Component
// ============================================================================

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = 'md',
  closeOnOverlay = true,
  closeOnEsc = true,
  showCloseButton = true,
  headerContent,
  footerContent,
  hideHeader = false,
  hideFooter = false,
  className,
  overlayClassName,
  contentClassName,
  style,
  container,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'data-ai-readable': aiReadable = true,
  'data-testid': testId,
  disableFocusTrap = false,
  zIndex,
  animation,
  onOpenComplete,
  onCloseComplete,
}: ModalProps) {
  const closeReasonRef = useRef<ModalCloseSignal['reason']>('programmatic');
  const [isAnimating, setIsAnimating] = useState(false);

  // Emit signals on open/close
  useEffect(() => {
    if (open) {
      const signal: ModalOpenSignal = {
        modalId: id ?? 'modal',
        title: typeof title === 'string' ? title : undefined,
        size,
        timestamp: Date.now(),
      };
      signalBus.publish('ui:modal:open', signal, { source: 'Modal' });
      setIsAnimating(true);

      // Call onOpenComplete after animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onOpenComplete?.();
      }, animation?.duration ?? 300);

      return () => clearTimeout(timer);
    } else if (!open && !isAnimating) {
      const signal: ModalCloseSignal = {
        modalId: id ?? 'modal',
        reason: closeReasonRef.current,
        timestamp: Date.now(),
      };
      signalBus.publish('ui:modal:close', signal, { source: 'Modal' });
      onCloseComplete?.();
    }
  }, [open, id, size, title, animation?.duration, onOpenComplete, onCloseComplete, isAnimating]);

  // Handle close with reason tracking
  const handleClose = useCallback(
    (reason: ModalCloseSignal['reason']) => {
      closeReasonRef.current = reason;
      onClose();
    },
    [onClose]
  );

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlay && e.target === e.currentTarget) {
        handleClose('overlay');
      }
    },
    [closeOnOverlay, handleClose]
  );

  // Handle escape key
  const handleEscapeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!closeOnEsc) {
        e.preventDefault();
      } else {
        handleClose('esc');
      }
    },
    [closeOnEsc, handleClose]
  );

  // Handle action click
  const handleActionClick = useCallback(
    (action: ModalAction) => {
      closeReasonRef.current = 'action';
      action.onClick();
    },
    []
  );

  const sizeClass = {
    sm: styles.modalSm,
    md: styles.modalMd,
    lg: styles.modalLg,
    xl: styles.modalXl,
    fullscreen: styles.modalFullscreen,
  }[size];

  // Convert container prop to Element | null
  const portalContainer = container
    ? 'current' in container
      ? container.current
      : container
    : null;

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && handleClose('programmatic')}>
      <Dialog.Portal container={portalContainer}>
        <Dialog.Overlay
          className={cn(
            styles.overlay,
            size === 'fullscreen' && styles.overlayFullscreen,
            overlayClassName
          )}
          onClick={handleOverlayClick}
          style={zIndex ? { zIndex } : undefined}
        >
          <Dialog.Content
            id={id}
            className={cn(styles.modal, sizeClass, className)}
            style={style}
            onEscapeKeyDown={handleEscapeKeyDown as unknown as (event: KeyboardEvent) => void}
            onPointerDownOutside={(e) => {
              if (!closeOnOverlay) {
                e.preventDefault();
              }
            }}
            onOpenAutoFocus={(e) => {
              if (disableFocusTrap) {
                e.preventDefault();
              }
            }}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            data-ai-readable={aiReadable}
            data-testid={testId}
            data-size={size}
          >
            {/* Header */}
            {!hideHeader && (
              <ModalHeader
                title={title}
                description={description}
                showCloseButton={showCloseButton}
                onClose={() => handleClose('closeButton')}
              >
                {headerContent}
              </ModalHeader>
            )}

            {/* Content */}
            <ModalContent className={contentClassName}>
              {children}
            </ModalContent>

            {/* Footer */}
            {!hideFooter && (
              <ModalFooter actions={actions?.map((a) => ({ ...a, onClick: () => handleActionClick(a) }))}>
                {footerContent}
              </ModalFooter>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { ModalHeader, ModalContent, ModalFooter, ActionButton };
export default Modal;
