/**
 * Avatar Component
 * Liquid Glass Design System - OmniTrade
 * Atomic Component - Z-axis: translateZ(2px)
 *
 * Features:
 * - Image, initials, icon fallbacks
 * - Status indicator
 * - Size variants
 * - Group support
 * - AI-readable metadata
 * - Signal: emit 'ui:avatar:click' on click
 */

import React, { forwardRef, useCallback, useState } from 'react';
import { cn } from '../../utils/cn';
import type { SignalTopic } from '../../signal-bus';
import { signalBus } from '../../signal-bus';
import styles from './styles.module.css';

// ============================================================================
// Types
// ============================================================================

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  /** Image source URL */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Initials to display (fallback) */
  initials?: string;
  /** Full name (used to generate initials) */
  name?: string;
  /** Size variant */
  size?: AvatarSize;
  /** Status indicator */
  status?: AvatarStatus;
  /** Shape variant */
  shape?: AvatarShape;
  /** Additional CSS class */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Signal topic to emit on click */
  signalTopic?: SignalTopic;
}

// ============================================================================
// Default User Icon
// ============================================================================

const DefaultIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

// ============================================================================
// Avatar Component
// ============================================================================

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      initials,
      name,
      size = 'md',
      status,
      shape = 'circle',
      className,
      onClick,
      'data-ai-readable': aiReadable = true,
      'data-testid': testId,
      signalTopic,
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    // Generate initials from name if not provided
    const computedInitials =
      initials ||
      name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Handle image error
    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    // Handle click with signal emission
    const handleClick = useCallback(() => {
      if (signalTopic) {
        signalBus.publish(
          signalTopic,
          {
            name,
            size,
            status,
          },
          { source: 'Avatar' }
        );
      }

      onClick?.();
    }, [signalTopic, name, size, status, onClick]);

    // Determine what to render
    const showImage = src && !imageError;
    const showInitials = !showImage && computedInitials;
    const showIcon = !showImage && !computedInitials;

    // Build class names
    const avatarClasses = cn(
      styles.avatar,
      styles[`avatar--${size}`],
      shape === 'square' && styles['avatar--square'],
      onClick && styles['avatar--clickable'],
      className
    );

    return (
      <div
        ref={ref}
        className={avatarClasses}
        onClick={handleClick}
        data-ai-readable={aiReadable}
        data-testid={testId}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={name || alt || 'Avatar'}
      >
        {showImage && (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className={styles.image}
            onError={handleImageError}
          />
        )}

        {showInitials && (
          <span className={styles.initials}>{computedInitials}</span>
        )}

        {showIcon && (
          <span className={styles.icon}>
            <DefaultIcon />
          </span>
        )}

        {status && (
          <span
            className={cn(styles.status, styles[`status--${status}`])}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
