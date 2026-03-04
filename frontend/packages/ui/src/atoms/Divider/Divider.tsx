/**
 * Divider Component
 * Liquid Glass Design System - OmniTrade
 *
 * A visual separator with horizontal/vertical orientations,
 * optional label, and dashed/solid line styles.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { DividerProps, DividerOrientation, DividerSpacing } from './types';
import styles from './styles.module.css';

const spacingClasses: Record<DividerSpacing, string> = {
  sm: styles.spacingSm,
  md: styles.spacingMd,
  lg: styles.spacingLg,
  xl: styles.spacingXl,
};

const orientationClasses: Record<DividerOrientation, string> = {
  horizontal: styles.horizontal,
  vertical: styles.vertical,
};

/**
 * Divider creates a visual separation between content sections.
 *
 * @example
 * // Basic horizontal divider
 * <Divider />
 *
 * @example
 * // Vertical divider with label
 * <Divider orientation="vertical" label="OR" />
 *
 * @example
 * // Dashed divider with large spacing
 * <Divider dashed spacing="lg" />
 *
 * @example
 * // Labeled divider
 * <Divider label="Market Hours" />
 */
export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  spacing = 'md',
  dashed = false,
  label,
  className,
}) => {
  const hasLabel = Boolean(label);

  return (
    <div
      className={clsx(
        styles.divider,
        orientationClasses[orientation],
        spacingClasses[spacing],
        dashed && styles.dashed,
        !hasLabel && styles.noLabel,
        className
      )}
      role="separator"
      aria-orientation={orientation}
    >
      {hasLabel && <span className={styles.label}>{label}</span>}
    </div>
  );
};

Divider.displayName = 'Divider';

export default Divider;
