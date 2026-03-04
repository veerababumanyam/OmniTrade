/**
 * Spinner Component
 * Liquid Glass Design System - OmniTrade
 *
 * A loading indicator with three visual variants:
 * - default: Ring spinner with gradient glow
 * - dots: Bouncing dots animation
 * - pulse: Breathing circle effect
 */

import React from 'react';
import { clsx } from 'clsx';
import type { SpinnerProps, SpinnerSize } from './types';
import styles from './styles.module.css';

const sizeClasses: Record<SpinnerSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

/**
 * Spinner provides visual feedback during loading states.
 *
 * @example
 * // Default ring spinner
 * <Spinner />
 *
 * @example
 * // Dots spinner with custom color
 * <Spinner variant="dots" color="var(--color-secondary)" size="lg" />
 *
 * @example
 * // Pulse spinner with accessible label
 * <Spinner variant="pulse" label="Loading market data..." />
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color,
  label = 'Loading...',
  className,
}) => {
  const style: React.CSSProperties = color
    ? { '--spinner-color': color } as React.CSSProperties
    : {};

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return (
          <div
            className={clsx(
              styles.spinner,
              styles.spinnerDots,
              sizeClasses[size],
              className
            )}
            style={style}
            role="status"
            aria-label={label}
          >
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.label}>{label}</span>
          </div>
        );

      case 'pulse':
        return (
          <div
            className={clsx(
              styles.spinner,
              styles.spinnerPulse,
              sizeClasses[size],
              className
            )}
            style={style}
            role="status"
            aria-label={label}
          >
            <span className={styles.label}>{label}</span>
          </div>
        );

      case 'default':
      default:
        return (
          <div
            className={clsx(
              styles.spinner,
              styles.spinnerRing,
              sizeClasses[size],
              className
            )}
            style={style}
            role="status"
            aria-label={label}
          >
            <span className={styles.label}>{label}</span>
          </div>
        );
    }
  };

  return renderVariant();
};

Spinner.displayName = 'Spinner';

export default Spinner;
