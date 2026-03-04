/**
 * Icon Component
 * Liquid Glass Design System - OmniTrade
 * Atomic Component
 *
 * Features:
 * - SVG sprite system
 * - Size variants
 * - Color inheritance
 * - Animations (spin, pulse, bounce)
 * - AI-readable metadata
 */

import React, { forwardRef, useMemo } from 'react';
import { cn } from '../../utils/cn';
import styles from './styles.module.css';

// ============================================================================
// Types
// ============================================================================

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type IconColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'muted';
export type IconAnimation = 'spin' | 'pulse' | 'bounce' | 'shake';

export interface IconProps extends Omit<React.SVGAttributes<SVGElement>, 'stroke'> {
  /** Icon name (maps to sprite ID) */
  name: string;
  /** Size variant */
  size?: IconSize;
  /** Color variant */
  color?: IconColor;
  /** Accessible label */
  label?: string;
  /** Animation type */
  animation?: IconAnimation;
  /** Use stroke-based icon */
  stroke?: boolean;
  /** Hoverable effect */
  hoverable?: boolean;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
}

// ============================================================================
// Icon Component
// ============================================================================

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  (
    {
      name,
      size = 'md',
      color,
      label,
      animation,
      stroke = false,
      hoverable = false,
      className,
      'data-ai-readable': aiReadable = true,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Build class names
    const iconClasses = useMemo(
      () =>
        cn(
          styles.icon,
          styles[`icon--${size}`],
          color && styles[`icon--${color}`],
          animation && styles[`icon--${animation}`],
          stroke && styles['icon--stroke'],
          hoverable && styles['icon--hoverable'],
          className
        ),
      [size, color, animation, stroke, hoverable, className]
    );

    return (
      <svg
        ref={ref}
        className={iconClasses}
        aria-hidden={!label}
        aria-label={label}
        role={label ? 'img' : undefined}
        data-ai-readable={aiReadable}
        data-testid={testId}
        data-icon={name}
        {...props}
      >
        <use href={`#icon-${name}`} />
      </svg>
    );
  }
);

Icon.displayName = 'Icon';

export default Icon;
