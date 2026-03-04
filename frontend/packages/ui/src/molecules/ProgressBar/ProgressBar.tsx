/**
 * ProgressBar Component
 * Liquid Glass Design System - OmniTrade
 *
 * A progress indicator with animated fill, striped pattern,
 * and indeterminate state support.
 */

import { forwardRef, useEffect, useRef, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  ProgressBarProps,
  ProgressBarCompleteSignalData,
  ProgressBarSize,
} from './types';
import styles from './styles.module.css';

// ============================================
// ProgressBar Component
// ============================================

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  function ProgressBar(
    {
      value,
      max = 100,
      label,
      showValue = false,
      valueFormat = 'percent',
      formatValue,
      variant = 'default',
      size,
      animated = true,
      striped = false,
      indeterminate = false,
      className,
      testId,
    }: ProgressBarProps,
    ref
  ) {
    // Provide default for size with explicit type
    const sizeValue: ProgressBarSize = size ?? 'md';
    // Track previous value for completion detection
    const prevValueRef = useRef<number>(value);

    // Calculate percentage
    const percentage = useMemo(() => {
      if (indeterminate) return 0;
      const clampedValue = Math.max(0, Math.min(value, max));
      return Math.round((clampedValue / max) * 100);
    }, [value, max, indeterminate]);

    // Check for completion and emit signal
    useEffect(() => {
      if (
        !indeterminate &&
        value >= max &&
        prevValueRef.current < max
      ) {
        // Emit completion signal
        const signalData: ProgressBarCompleteSignalData = {
          value,
          max,
          percentage,
        };
        signalBus.publish('ui:progress:complete', signalData, {
          source: 'ProgressBar',
        });
      }
      prevValueRef.current = value;
    }, [value, max, percentage, indeterminate]);

    // Format value display
    const formattedValue = useMemo(() => {
      if (formatValue) {
        return formatValue(value, max);
      }

      switch (valueFormat) {
        case 'fraction':
          return `${value}/${max}`;
        case 'percent':
        default:
          return `${percentage}%`;
      }
    }, [value, max, percentage, valueFormat, formatValue]);

    // Determine if we should show value inside bar (only for lg sizeValue)
    const showValueInside = showValue && sizeValue === 'lg' && !indeterminate;
    const showValueInLabel = showValue && sizeValue !== 'lg';

    return (
      <div
        ref={ref}
        className={cn(styles.container, className)}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={typeof label === 'string' ? label : undefined}
        aria-busy={indeterminate}
        data-testid={testId}
      >
        {/* Label Row */}
        {(label || showValueInLabel) && (
          <div className={styles.labelRow}>
            {label && (
              <span
                className={cn(
                  styles.label,
                  sizeValue === 'xs' && styles.labelSizeXs,
                  sizeValue === 'sm' && styles.labelSizeSm,
                  sizeValue === 'md' && styles.labelSizeMd,
                  sizeValue === 'lg' && styles.labelSizeLg
                )}
              >
                {label}
              </span>
            )}
            {showValueInLabel && (
              <span
                className={cn(
                  styles.value,
                  sizeValue === 'xs' && styles.valueSizeXs,
                  sizeValue === 'sm' && styles.valueSizeSm,
                  sizeValue === 'md' && styles.valueSizeMd
                )}
              >
                {formattedValue}
              </span>
            )}
          </div>
        )}

        {/* Track */}
        <div
          className={cn(
            styles.track,
            sizeValue === 'xs' && styles.trackSizeXs,
            sizeValue === 'sm' && styles.trackSizeSm,
            sizeValue === 'md' && styles.trackSizeMd,
            sizeValue === 'lg' && styles.trackSizeLg
          )}
        >
          {/* Fill */}
          <div
            className={cn(
              styles.fill,
              animated && styles.fillAnimated,
              variant === 'default' && styles.fillDefault,
              variant === 'success' && styles.fillSuccess,
              variant === 'warning' && styles.fillWarning,
              variant === 'error' && styles.fillError,
              striped && styles.fillStriped,
              striped && animated && styles.fillStripedAnimated,
              indeterminate && styles.indeterminate
            )}
            style={{
              width: indeterminate ? '100%' : `${percentage}%`,
            }}
          >
            {/* Value inside bar for lg sizeValue */}
            {showValueInside && percentage > 15 && (
              <span className={styles.valueInside}>{formattedValue}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default ProgressBar;
