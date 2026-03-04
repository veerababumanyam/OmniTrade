/**
 * Avatar Component
 * Liquid Glass Design System
 *
 * A versatile avatar component supporting images, initials, and icons
 * with status indicators and group support.
 */

import {
  useState,
  useCallback,
  useMemo,
  Children,
  isValidElement,
  forwardRef,
  type ForwardedRef,
} from 'react';
import styles from './styles.module.css';
import {
  type AvatarProps,
  type AvatarGroupProps,
  type AvatarSize,
  type AvatarStatus,
  AVATAR_SIZES,
} from './types';

// Default user icon component
const DefaultUserIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * Avatar component for displaying user avatars with images, initials, or icons.
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      initials,
      icon: Icon,
      size = 'md',
      status,
      fallback,
      className = '',
      onClick,
      loading = false,
    },
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(!!src);

    const handleImageError = useCallback(() => {
      setImageError(true);
      setImageLoading(false);
    }, []);

    const handleImageLoad = useCallback(() => {
      setImageLoading(false);
    }, []);

    const showImage = src && !imageError && !loading;
    const showFallback = (!src || imageError || loading) && !imageLoading;
    const showSkeleton = loading || (imageLoading && !imageError);

    // Determine what to show in the fallback
    const renderFallback = useMemo(() => {
      if (fallback) return fallback;
      if (initials) return <span className={styles.avatar__initials}>{initials}</span>;
      if (Icon) return <Icon size={AVATAR_SIZES[size] * 0.5} className={styles.avatar__icon} />;
      return <DefaultUserIcon size={AVATAR_SIZES[size] * 0.5} className={styles.avatar__icon} />;
    }, [fallback, initials, Icon, size]);

    const rootClasses = [
      styles.avatar,
      styles[`avatar--${size}`],
      onClick ? styles['avatar--interactive'] : '',
      showSkeleton ? styles['avatar--loading'] : '',
      showSkeleton ? styles.avatar__skeleton : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={rootClasses}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={alt || (initials ? `Avatar for ${initials}` : 'User avatar')}
      >
        {showImage && (
          <img
            src={src}
            alt={alt}
            className={styles.avatar__image}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}
        {showFallback && <div className={styles.avatar__fallback}>{renderFallback}</div>}
        {status && <StatusIndicator status={status} size={size} />}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * Status indicator dot for avatars.
 */
const StatusIndicator = ({ status, size = 'md' }: { status: AvatarStatus; size?: AvatarSize }) => (
  <span
    className={`${styles.avatar__status} ${styles[`avatar__status--${status}`]} ${styles[`avatar__status--${size}`]}`}
    aria-label={`Status: ${status}`}
  />
);

/**
 * Avatar Group component for displaying multiple overlapping avatars.
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      children,
      max = 4,
      size = 'md',
      className = '',
    },
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const childArray = Children.toArray(children).filter(isValidElement);
    const visibleChildren = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    return (
      <div ref={ref} className={`${styles.avatarGroup} ${className}`}>
        {visibleChildren.map((child, index) => (
          <div key={index} className={styles.avatarGroup__item} style={{ zIndex: max - index }}>
            {child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={`${styles.avatarGroup__overflow} ${styles[`avatarGroup__overflow--${size}`]}`}
            aria-label={`${remainingCount} more`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

/**
 * Avatar Skeleton component for loading states.
 */
export const AvatarSkeleton = forwardRef<HTMLDivElement, { size?: AvatarSize; className?: string }>(
  ({ size = 'md', className = '' }, ref: ForwardedRef<HTMLDivElement>) => (
    <div
      ref={ref}
      className={`${styles.avatar} ${styles[`avatar--${size}`]} ${styles.avatar__skeleton} ${className}`}
      aria-busy="true"
      aria-label="Loading avatar"
    />
  )
);

AvatarSkeleton.displayName = 'AvatarSkeleton';

export default Avatar;
