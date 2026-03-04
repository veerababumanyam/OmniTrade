/**
 * Slider Component
 * Liquid Glass Design System - OmniTrade
 *
 * Composition: Input range + Tooltip
 * Features: Single/double thumb, value labels, tick marks
 */

'use client';

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { SignalBus } from '../../signal-bus';
import type {
  SliderProps,
  SliderValue,
} from './types';
import { SLIDER_SIZES } from './types';
import styles from './styles.module.css';

// Helper functions
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function snapToStep(value: number, step: number, min: number): number {
  const steps = Math.round((value - min) / step);
  return min + steps * step;
}

export function Slider({
  value: controlledValue,
  valueRange: controlledValueRange,
  onChange,
  onChangeRange,
  range = false,
  min = 0,
  max = 100,
  step = 1,
  showLabels = false,
  showMinMaxLabels = false,
  formatLabel,
  size = 'md',
  variant = 'default',
  disabled = false,
  ariaLabel = 'Slider',
  ariaLabelMin = 'Minimum value',
  ariaLabelMax = 'Maximum value',
  className = '',
  id,
  name,
  showTicks = false,
  ticks,
  orientation = 'horizontal',
  inverted = false,
  showTooltip = false,
  renderTooltip,
}: SliderProps) {
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);
  const [hoverThumb, setHoverThumb] = useState<'min' | 'max' | null>(null);
  const [internalValue, setInternalValue] = useState(controlledValue ?? min);
  const [internalValueRange, setInternalValueRange] = useState<SliderValue>(
    controlledValueRange ?? { min, max }
  );

  // Refs
  const trackRef = useRef<HTMLDivElement>(null);

  // Determine controlled vs uncontrolled
  const currentValue = controlledValue ?? internalValue;
  const currentValueRange = controlledValueRange ?? internalValueRange;

  // Calculate percentage
  const getPercentage = useCallback(
    (value: number) => {
      const percentage = ((value - min) / (max - min)) * 100;
      return clamp(percentage, 0, 100);
    },
    [min, max]
  );

  // Get value from position
  const getValueFromPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!trackRef.current) return 0;

      const rect = trackRef.current.getBoundingClientRect();
      let percentage: number;

      if (orientation === 'horizontal') {
        percentage = inverted
          ? 1 - (clientX - rect.left) / rect.width
          : (clientX - rect.left) / rect.width;
      } else {
        percentage = inverted
          ? (clientY - rect.top) / rect.height
          : 1 - (clientY - rect.top) / rect.height;
      }

      percentage = clamp(percentage, 0, 1);
      const rawValue = min + percentage * (max - min);
      return snapToStep(rawValue, step, min);
    },
    [min, max, step, orientation, inverted]
  );

  // Emit signal
  const emitSignal = useCallback(
    (value: number | SliderValue) => {
      SignalBus.publish(
        'ui:slider:change' as const,
        { value, isRange: range, timestamp: Date.now() },
        { source: 'Slider' }
      );
    },
    [range]
  );

  // Handle value change
  const handleValueChange = useCallback(
    (newValue: number, thumb: 'min' | 'max' = 'max') => {
      const snappedValue = snapToStep(newValue, step, min);
      const constrainedValue = clamp(snappedValue, min, max);

      if (range) {
        let newRange: SliderValue;
        if (thumb === 'min') {
          newRange = {
            min: Math.min(constrainedValue, currentValueRange.max),
            max: currentValueRange.max,
          };
        } else {
          newRange = {
            min: currentValueRange.min,
            max: Math.max(constrainedValue, currentValueRange.min),
          };
        }

        setInternalValueRange(newRange);
        onChangeRange?.(newRange);
        emitSignal(newRange);
      } else {
        setInternalValue(constrainedValue);
        onChange?.(constrainedValue);
        emitSignal(constrainedValue);
      }
    },
    [range, step, min, max, currentValueRange, onChange, onChangeRange, emitSignal]
  );

  // Handle mouse/touch events
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, thumb: 'min' | 'max') => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      setActiveThumb(thumb);
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [disabled]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !activeThumb) return;

      const value = getValueFromPosition(e.clientX, e.clientY);
      handleValueChange(value, activeThumb);
    },
    [isDragging, activeThumb, getValueFromPosition, handleValueChange]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (isDragging) {
        setIsDragging(false);
        setActiveThumb(null);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }
    },
    [isDragging]
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, thumb: 'min' | 'max' = 'max') => {
      if (disabled) return;

      const currentValue = range
        ? thumb === 'min'
          ? currentValueRange.min
          : currentValueRange.max
        : controlledValue ?? internalValue;

      let delta = 0;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          delta = step;
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          delta = -step;
          break;
        case 'PageUp':
          delta = step * 10;
          break;
        case 'PageDown':
          delta = -step * 10;
          break;
        case 'Home':
          handleValueChange(min, thumb);
          return;
        case 'End':
          handleValueChange(max, thumb);
          return;
        default:
          return;
      }

      e.preventDefault();
      handleValueChange(currentValue + delta, thumb);
    },
    [disabled, range, currentValueRange, controlledValue, internalValue, step, min, max, handleValueChange]
  );

  // Track click handler
  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      const value = getValueFromPosition(e.clientX, e.clientY);

      if (range) {
        // Determine which thumb to move based on proximity
        const distToMin = Math.abs(value - currentValueRange.min);
        const distToMax = Math.abs(value - currentValueRange.max);
        const thumb = distToMin < distToMax ? 'min' : 'max';
        handleValueChange(value, thumb);
      } else {
        handleValueChange(value);
      }
    },
    [disabled, getValueFromPosition, range, currentValueRange, handleValueChange]
  );

  // Add global pointer event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Format label
  const getLabel = useCallback(
    (value: number) => {
      if (formatLabel) return formatLabel(value);
      return value.toString();
    },
    [formatLabel]
  );

  // Generate tick marks
  const tickMarks = useMemo(() => {
    if (ticks) return ticks;
    if (!showTicks) return [];

    const tickCount = 5;
    const tickStep = (max - min) / (tickCount - 1);
    const marks: Array<{ value: number; label?: string }> = [];

    for (let i = 0; i < tickCount; i++) {
      marks.push({
        value: min + tickStep * i,
        label: showLabels ? getLabel(min + tickStep * i) : undefined,
      });
    }

    return marks;
  }, [ticks, showTicks, min, max, showLabels, getLabel]);

  // Build class names
  const containerClasses = [
    styles.container,
    styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}` as keyof typeof styles],
    orientation === 'vertical' && styles.vertical,
    inverted && styles.inverted,
    variant === 'gradient' && styles.gradient,
    variant === 'stepped' && styles.stepped,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Calculate positions
  const minPercent = range ? getPercentage(currentValueRange.min) : 0;
  const maxPercent = range ? getPercentage(currentValueRange.max) : getPercentage(currentValue);

  return (
    <div
      className={containerClasses}
      id={id}
      role="group"
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {/* Min/Max Labels */}
      {showMinMaxLabels && (
        <div className={styles.labelsRow}>
          <span className={styles.minMaxLabel}>{getLabel(min)}</span>
          <span className={styles.minMaxLabel}>{getLabel(max)}</span>
        </div>
      )}

      {/* Slider Wrapper */}
      <div className={styles.sliderWrapper}>
        {/* Track */}
        <div
          ref={trackRef}
          className={styles.track}
          onClick={handleTrackClick}
        >
          {/* Fill */}
          <div
            className={`${styles.fill} ${variant === 'gradient' ? styles.gradient : ''}`}
            style={
              orientation === 'horizontal'
                ? { left: `${range ? minPercent : 0}%`, width: `${range ? maxPercent - minPercent : maxPercent}%` }
                : { bottom: `${range ? minPercent : 0}%`, height: `${range ? maxPercent - minPercent : maxPercent}%` }
            }
          />

          {/* Tick Marks */}
          {showTicks && tickMarks.length > 0 && (
            <div className={styles.ticks}>
              {tickMarks.map((tick) => (
                <div
                  key={tick.value}
                  className={styles.tick}
                  style={
                    orientation === 'horizontal'
                      ? { left: `${getPercentage(tick.value)}%` }
                      : { bottom: `${getPercentage(tick.value)}%` }
                  }
                />
              ))}
            </div>
          )}

          {/* Min Thumb (Range Mode) */}
          {range && (
            <div
              className={`${styles.thumb} ${activeThumb === 'min' ? styles.dragging : ''}`}
              style={
                orientation === 'horizontal'
                  ? { left: `${minPercent}%` }
                  : { bottom: `${minPercent}%` }
              }
              onPointerDown={(e) => handlePointerDown(e, 'min')}
              onKeyDown={(e) => handleKeyDown(e, 'min')}
              onMouseEnter={() => setHoverThumb('min')}
              onMouseLeave={() => setHoverThumb(null)}
              role="slider"
              aria-label={ariaLabelMin}
              aria-valuemin={min}
              aria-valuemax={currentValueRange.max}
              aria-valuenow={currentValueRange.min}
              tabIndex={disabled ? -1 : 0}
            >
              {showLabels && (
                <span className={styles.thumbLabel}>{getLabel(currentValueRange.min)}</span>
              )}
              {showTooltip && (hoverThumb === 'min' || activeThumb === 'min') && (
                <div className={styles.tooltip}>
                  {renderTooltip ? renderTooltip(currentValueRange.min) : getLabel(currentValueRange.min)}
                </div>
              )}
            </div>
          )}

          {/* Max Thumb */}
          <div
            className={`${styles.thumb} ${activeThumb === 'max' ? styles.dragging : ''}`}
            style={
              orientation === 'horizontal'
                ? { left: `${maxPercent}%` }
                : { bottom: `${maxPercent}%` }
            }
            onPointerDown={(e) => handlePointerDown(e, 'max')}
            onKeyDown={(e) => handleKeyDown(e, 'max')}
            onMouseEnter={() => setHoverThumb('max')}
            onMouseLeave={() => setHoverThumb(null)}
            role="slider"
            aria-label={range ? ariaLabelMax : ariaLabel}
            aria-valuemin={range ? currentValueRange.min : min}
            aria-valuemax={max}
            aria-valuenow={range ? currentValueRange.max : currentValue}
            tabIndex={disabled ? -1 : 0}
          >
            {showLabels && (
              <span className={styles.thumbLabel}>
                {getLabel(range ? currentValueRange.max : currentValue)}
              </span>
            )}
            {showTooltip && (hoverThumb === 'max' || activeThumb === 'max') && (
              <div className={styles.tooltip}>
                {renderTooltip
                  ? renderTooltip(range ? currentValueRange.max : currentValue)
                  : getLabel(range ? currentValueRange.max : currentValue)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tick Labels */}
      {showTicks && showLabels && tickMarks.length > 0 && (
        <div className={styles.tickLabels}>
          {tickMarks.map((tick) => (
            <span key={tick.value} className={styles.tickLabel}>
              {tick.label}
            </span>
          ))}
        </div>
      )}

      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={range ? JSON.stringify(currentValueRange) : currentValue}
        />
      )}
    </div>
  );
}

export default Slider;
