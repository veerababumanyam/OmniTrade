/**
 * Skeleton Component
 * Liquid Glass Design System - OmniTrade
 *
 * A loading placeholder with pulse/wave animation for
 * text, circular (avatar), and rectangular shapes.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { SkeletonProps, SkeletonVariant, SkeletonAnimation } from './types';
import styles from './styles.module.css';

const variantClasses: Record<SkeletonVariant, string> = {
  text: styles.text,
  circular: styles.circle,
  rectangular: styles.rect,
};

const animationClasses: Record<SkeletonAnimation, string | undefined> = {
  pulse: styles.animatedPulse,
  wave: styles.animatedWave,
  none: undefined,
};

/**
 * Normalizes dimension values to valid CSS strings.
 */
const normalizeDimension = (value: string | number | undefined): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
};

/**
 * Renders multiple skeleton text lines.
 */
const renderTextLines = (
  count: number,
  width: string | undefined,
  height: string | undefined,
  borderRadius: string | undefined,
  animation: SkeletonAnimation,
  className: string
) => {
  const lines = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={clsx(
        styles.skeleton,
        styles.text,
        animationClasses[animation],
        className
      )}
      style={{
        '--skeleton-width': index === count - 1 && count > 1 ? '75%' : width,
        '--skeleton-height': height,
        '--skeleton-radius': borderRadius,
      } as React.CSSProperties}
      aria-hidden="true"
    />
  ));

  if (count === 1) {
    return lines[0];
  }

  return (
    <div className={styles.textGroup} aria-hidden="true">
      {lines}
    </div>
  );
};

/**
 * Skeleton displays a placeholder while content is loading.
 *
 * @example
 * // Single text line skeleton with wave animation
 * <Skeleton variant="text" />
 *
 * @example
 * // Multiple text lines with pulse animation
 * <Skeleton variant="text" count={3} animation="pulse" />
 *
 * @example
 * // Avatar placeholder (circular)
 * <Skeleton variant="circular" width={40} height={40} />
 *
 * @example
 * // Card placeholder (rectangular)
 * <Skeleton variant="rectangular" width={300} height={200} />
 *
 * @example
 * // Static skeleton (no animation)
 * <Skeleton variant="text" animation="none" />
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  animation = 'wave',
  borderRadius,
  className,
  style,
}) => {
  const normalizedWidth = normalizeDimension(width);
  const normalizedHeight = normalizeDimension(height);
  const normalizedRadius = normalizeDimension(borderRadius);

  // Handle text variant with multiple lines
  if (variant === 'text' && count > 0) {
    return renderTextLines(
      count,
      normalizedWidth || '100%',
      normalizedHeight || '16px',
      normalizedRadius || '4px',
      animation,
      className || ''
    );
  }

  // Handle circular and rectangular variants
  const computedStyle: React.CSSProperties = {
    '--skeleton-width': normalizedWidth || (variant === 'circular' ? '40px' : '100%'),
    '--skeleton-height': normalizedHeight || (variant === 'circular' ? '40px' : '120px'),
    '--skeleton-radius': normalizedRadius || (variant === 'circular' ? '9999px' : '12px'),
    ...style,
  } as React.CSSProperties;

  return (
    <div
      className={clsx(
        styles.skeleton,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={computedStyle}
      aria-hidden="true"
    />
  );
};

Skeleton.displayName = 'Skeleton';

export default Skeleton;
