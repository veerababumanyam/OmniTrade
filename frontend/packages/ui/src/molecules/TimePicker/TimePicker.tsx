/**
 * TimePicker Component
 * Liquid Glass Design System - OmniTrade
 *
 * Composition: Input + Popover (Radix UI Popover)
 * Features: 12h/24h format, AM/PM toggle, step intervals
 */

'use client';

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import * as Popover from '@radix-ui/react-popover';
import { SignalBus } from '../../signal-bus';
import type {
  TimePickerProps,
  TimePickerValue,
} from './types';
import { TIMEPICKER_SIZES } from './types';
import styles from './styles.module.css';

// Icons as inline SVG components
const ClockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// Helper functions
function formatTimePart(value: number, maxLength: number = 2): string {
  return value.toString().padStart(maxLength, '0');
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function convertTo24Hour(hours: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') {
    return hours === 12 ? 0 : hours;
  }
  return hours === 12 ? 12 : hours + 12;
}

function convertTo12Hour(hours: number): { hours: number; period: 'AM' | 'PM' } {
  if (hours === 0) return { hours: 12, period: 'AM' };
  if (hours < 12) return { hours, period: 'AM' };
  if (hours === 12) return { hours: 12, period: 'PM' };
  return { hours: hours - 12, period: 'PM' };
}

function parseTimeInput(value: string, max: number): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 0;
  return clamp(parsed, 0, max);
}

export function TimePicker({
  hours: controlledHours,
  minutes: controlledMinutes,
  period: controlledPeriod,
  onChange,
  format = '24h',
  minuteStep = 1,
  hourStep = 1,
  minTime,
  maxTime,
  placeholder = 'Select time',
  size = 'md',
  variant = 'dropdown',
  disabled = false,
  ariaLabel = 'Time picker',
  className = '',
  id,
  name,
  showSeconds = false,
  seconds: controlledSeconds,
  formatDisplay,
  closeOnSelect = true,
  onOpenChange,
  renderTrigger,
  hoursLabel = 'HH',
  minutesLabel = 'MM',
  secondsLabel = 'SS',
  periodLabel = 'Period',
}: TimePickerProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<'hours' | 'minutes' | 'seconds' | null>(null);

  // Internal state for uncontrolled mode
  const [internalHours, setInternalHours] = useState(controlledHours ?? (format === '12h' ? 12 : 0));
  const [internalMinutes, setInternalMinutes] = useState(controlledMinutes ?? 0);
  const [internalSeconds, setInternalSeconds] = useState(controlledSeconds ?? 0);
  const [internalPeriod, setInternalPeriod] = useState<'AM' | 'PM'>(controlledPeriod ?? 'AM');

  // Determine controlled vs uncontrolled
  const hours = controlledHours ?? internalHours;
  const minutes = controlledMinutes ?? internalMinutes;
  const seconds = controlledSeconds ?? internalSeconds;
  const period = controlledPeriod ?? internalPeriod;

  // Refs for input elements
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const secondsInputRef = useRef<HTMLInputElement>(null);

  // Calculate actual hours in 24h format for display
  const displayHours = useMemo(() => {
    if (format === '12h') {
      return hours;
    }
    return hours;
  }, [hours, format]);

  // Get current time value
  const currentValue = useMemo((): TimePickerValue => {
    const actualHours = format === '12h' ? convertTo24Hour(hours, period) : hours;
    return {
      hours: actualHours,
      minutes,
      seconds: showSeconds ? seconds : undefined,
      period: format === '12h' ? period : undefined,
    };
  }, [hours, minutes, seconds, period, format, showSeconds]);

  // Emit signal
  const emitSignal = useCallback(
    (value: TimePickerValue) => {
      SignalBus.publish(
        'ui:timepicker:change' as const,
        { value, timestamp: Date.now() },
        { source: 'TimePicker' }
      );
    },
    []
  );

  // Handle time change
  const handleTimeChange = useCallback(
    (newHours: number, newMinutes: number, newSeconds: number, newPeriod: 'AM' | 'PM') => {
      // Apply constraints
      let constrainedHours = newHours;
      let constrainedMinutes = newMinutes;
      let constrainedSeconds = newSeconds;

      if (format === '12h') {
        constrainedHours = clamp(newHours, 1, 12);
      } else {
        constrainedHours = clamp(newHours, 0, 23);
      }

      // Apply minute step
      if (minuteStep > 1) {
        constrainedMinutes = Math.round(newMinutes / minuteStep) * minuteStep;
        constrainedMinutes = clamp(constrainedMinutes, 0, 59);
      }

      // Apply hour step
      if (hourStep > 1 && format === '24h') {
        constrainedHours = Math.round(constrainedHours / hourStep) * hourStep;
        constrainedHours = clamp(constrainedHours, 0, 23);
      }

      // Update internal state
      setInternalHours(constrainedHours);
      setInternalMinutes(constrainedMinutes);
      setInternalSeconds(constrainedSeconds);
      setInternalPeriod(newPeriod);

      // Calculate actual hours in 24h format
      const actualHours = format === '12h' ? convertTo24Hour(constrainedHours, newPeriod) : constrainedHours;

      // Check min/max constraints
      if (minTime || maxTime) {
        const totalMinutes = actualHours * 60 + constrainedMinutes;
        if (minTime) {
          const minTotal = minTime.hours * 60 + minTime.minutes;
          if (totalMinutes < minTotal) return;
        }
        if (maxTime) {
          const maxTotal = maxTime.hours * 60 + maxTime.minutes;
          if (totalMinutes > maxTotal) return;
        }
      }

      // Call onChange callback
      const value: TimePickerValue = {
        hours: actualHours,
        minutes: constrainedMinutes,
        seconds: showSeconds ? constrainedSeconds : undefined,
        period: format === '12h' ? newPeriod : undefined,
      };

      onChange?.(value);
      emitSignal(value);
    },
    [format, minuteStep, hourStep, minTime, maxTime, onChange, emitSignal, showSeconds]
  );

  // Handle hours change
  const handleHoursChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const maxHours = format === '12h' ? 12 : 23;
      const newHours = parseTimeInput(e.target.value, maxHours);
      handleTimeChange(newHours, minutes, seconds, period);
    },
    [format, minutes, seconds, period, handleTimeChange]
  );

  // Handle minutes change
  const handleMinutesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMinutes = parseTimeInput(e.target.value, 59);
      handleTimeChange(hours, newMinutes, seconds, period);
    },
    [hours, seconds, period, handleTimeChange]
  );

  // Handle seconds change
  const handleSecondsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSeconds = parseTimeInput(e.target.value, 59);
      handleTimeChange(hours, minutes, newSeconds, period);
    },
    [hours, minutes, period, handleTimeChange]
  );

  // Handle period change
  const handlePeriodChange = useCallback(
    (newPeriod: 'AM' | 'PM') => {
      handleTimeChange(hours, minutes, seconds, newPeriod);

      if (closeOnSelect && variant === 'dropdown') {
        setIsOpen(false);
      }
    },
    [hours, minutes, seconds, closeOnSelect, variant, handleTimeChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, field: 'hours' | 'minutes' | 'seconds') => {
      const maxHours = format === '12h' ? 12 : 23;
      const max = field === 'hours' ? maxHours : 59;
      const step = field === 'hours' ? hourStep : minuteStep;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentValue = field === 'hours' ? hours : field === 'minutes' ? minutes : seconds;
        const newValue = currentValue + step > max ? 0 : currentValue + step;
        if (field === 'hours') {
          handleTimeChange(newValue, minutes, seconds, period);
        } else if (field === 'minutes') {
          handleTimeChange(hours, newValue, seconds, period);
        } else {
          handleTimeChange(hours, minutes, newValue, period);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentValue = field === 'hours' ? hours : field === 'minutes' ? minutes : seconds;
        const newValue = currentValue - step < 0 ? max : currentValue - step;
        if (field === 'hours') {
          handleTimeChange(newValue, minutes, seconds, period);
        } else if (field === 'minutes') {
          handleTimeChange(hours, newValue, seconds, period);
        } else {
          handleTimeChange(hours, minutes, newValue, period);
        }
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        // Move to next field
        if (field === 'hours') {
          minutesInputRef.current?.focus();
        } else if (field === 'minutes' && showSeconds) {
          secondsInputRef.current?.focus();
        }
      }
    },
    [format, hours, minutes, seconds, period, hourStep, minuteStep, showSeconds, handleTimeChange]
  );

  // Handle open change
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange]
  );

  // Format display value
  const displayValue = useMemo(() => {
    if (formatDisplay) {
      return formatDisplay(currentValue);
    }

    const h = format === '12h' ? displayHours : hours;
    const timeStr = showSeconds
      ? `${formatTimePart(h)}:${formatTimePart(minutes)}:${formatTimePart(seconds)}`
      : `${formatTimePart(h)}:${formatTimePart(minutes)}`;

    if (format === '12h') {
      return `${timeStr} ${period}`;
    }
    return timeStr;
  }, [formatDisplay, currentValue, format, displayHours, hours, minutes, seconds, period, showSeconds]);

  // Quick time buttons
  const quickTimes = useMemo(() => [
    { label: 'Now', hours: new Date().getHours(), minutes: new Date().getMinutes() },
    { label: '09:00', hours: 9, minutes: 0 },
    { label: '12:00', hours: 12, minutes: 0 },
    { label: '17:00', hours: 17, minutes: 0 },
  ], []);

  // Handle quick time click
  const handleQuickTimeClick = useCallback(
    (quickHours: number, quickMinutes: number) => {
      if (format === '12h') {
        const { hours: h12, period: p } = convertTo12Hour(quickHours);
        handleTimeChange(h12, quickMinutes, 0, p);
      } else {
        handleTimeChange(quickHours, quickMinutes, 0, period);
      }

      if (closeOnSelect && variant === 'dropdown') {
        setIsOpen(false);
      }
    },
    [format, period, closeOnSelect, variant, handleTimeChange]
  );

  // Build class names
  const containerClasses = [
    styles.container,
    styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}` as keyof typeof styles],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Render inline variant
  if (variant === 'compact') {
    return (
      <div
        className={`${styles.compactContainer} ${disabled ? styles.disabled : ''}`}
        aria-label={ariaLabel}
        id={id}
      >
        <input
          ref={hoursInputRef}
          type="text"
          inputMode="numeric"
          className={styles.compactInput}
          value={formatTimePart(displayHours)}
          onChange={handleHoursChange}
          onKeyDown={(e) => handleKeyDown(e, 'hours')}
          onFocus={() => setFocusedField('hours')}
          onBlur={() => setFocusedField(null)}
          disabled={disabled}
          aria-label={hoursLabel}
          maxLength={2}
        />
        <span className={styles.compactSeparator}>:</span>
        <input
          ref={minutesInputRef}
          type="text"
          inputMode="numeric"
          className={styles.compactInput}
          value={formatTimePart(minutes)}
          onChange={handleMinutesChange}
          onKeyDown={(e) => handleKeyDown(e, 'minutes')}
          onFocus={() => setFocusedField('minutes')}
          onBlur={() => setFocusedField(null)}
          disabled={disabled}
          aria-label={minutesLabel}
          maxLength={2}
        />
        {showSeconds && (
          <>
            <span className={styles.compactSeparator}>:</span>
            <input
              ref={secondsInputRef}
              type="text"
              inputMode="numeric"
              className={styles.compactInput}
              value={formatTimePart(seconds)}
              onChange={handleSecondsChange}
              onKeyDown={(e) => handleKeyDown(e, 'seconds')}
              onFocus={() => setFocusedField('seconds')}
              onBlur={() => setFocusedField(null)}
              disabled={disabled}
              aria-label={secondsLabel}
              maxLength={2}
            />
          </>
        )}
        {format === '12h' && (
          <div className={styles.periodToggle}>
            <button
              type="button"
              className={`${styles.periodButton} ${period === 'AM' ? styles.active : ''}`}
              onClick={() => handlePeriodChange('AM')}
              disabled={disabled}
              aria-pressed={period === 'AM'}
            >
              AM
            </button>
            <button
              type="button"
              className={`${styles.periodButton} ${period === 'PM' ? styles.active : ''}`}
              onClick={() => handlePeriodChange('PM')}
              disabled={disabled}
              aria-pressed={period === 'PM'}
            >
              PM
            </button>
          </div>
        )}
        {name && <input type="hidden" name={name} value={JSON.stringify(currentValue)} />}
      </div>
    );
  }

  // Render dropdown trigger
  const defaultTrigger = (
    <button
      type="button"
      className={`${styles.trigger} ${styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}` as keyof typeof styles]}`}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <span className={styles.triggerIcon}>
        <ClockIcon />
      </span>
      <span className={styles.triggerText}>{displayValue || placeholder}</span>
    </button>
  );

  // Render dropdown content
  const dropdownContent = (
    <>
      {/* Time Inputs */}
      <div className={styles.timeInputs}>
        {/* Hours */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>{hoursLabel}</label>
          <input
            ref={hoursInputRef}
            type="text"
            inputMode="numeric"
            className={styles.timeInput}
            value={formatTimePart(displayHours)}
            onChange={handleHoursChange}
            onKeyDown={(e) => handleKeyDown(e, 'hours')}
            onFocus={() => setFocusedField('hours')}
            onBlur={() => setFocusedField(null)}
            disabled={disabled}
            aria-label={hoursLabel}
            maxLength={2}
          />
        </div>

        <span className={styles.separator}>:</span>

        {/* Minutes */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>{minutesLabel}</label>
          <input
            ref={minutesInputRef}
            type="text"
            inputMode="numeric"
            className={styles.timeInput}
            value={formatTimePart(minutes)}
            onChange={handleMinutesChange}
            onKeyDown={(e) => handleKeyDown(e, 'minutes')}
            onFocus={() => setFocusedField('minutes')}
            onBlur={() => setFocusedField(null)}
            disabled={disabled}
            aria-label={minutesLabel}
            maxLength={2}
          />
        </div>

        {/* Seconds */}
        {showSeconds && (
          <>
            <span className={styles.separator}>:</span>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>{secondsLabel}</label>
              <input
                ref={secondsInputRef}
                type="text"
                inputMode="numeric"
                className={styles.timeInput}
                value={formatTimePart(seconds)}
                onChange={handleSecondsChange}
                onKeyDown={(e) => handleKeyDown(e, 'seconds')}
                onFocus={() => setFocusedField('seconds')}
                onBlur={() => setFocusedField(null)}
                disabled={disabled}
                aria-label={secondsLabel}
                maxLength={2}
              />
            </div>
          </>
        )}

        {/* AM/PM Toggle */}
        {format === '12h' && (
          <div className={styles.periodToggle}>
            <label className={styles.periodLabel}>{periodLabel}</label>
            <div className={styles.periodButtons}>
              <button
                type="button"
                className={`${styles.periodButton} ${period === 'AM' ? styles.active : ''}`}
                onClick={() => handlePeriodChange('AM')}
                disabled={disabled}
                aria-pressed={period === 'AM'}
              >
                AM
              </button>
              <button
                type="button"
                className={`${styles.periodButton} ${period === 'PM' ? styles.active : ''}`}
                onClick={() => handlePeriodChange('PM')}
                disabled={disabled}
                aria-pressed={period === 'PM'}
              >
                PM
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Time Buttons */}
      <div className={styles.quickTimeButtons}>
        {quickTimes.map((qt) => {
          const qt12 = convertTo12Hour(qt.hours);
          const label = format === '12h'
            ? `${qt12.hours}:${formatTimePart(qt.minutes)} ${qt12.period}`
            : `${formatTimePart(qt.hours)}:${formatTimePart(qt.minutes)}`;
          return (
            <button
              key={qt.label}
              type="button"
              className={styles.quickTimeButton}
              onClick={() => handleQuickTimeClick(qt.hours, qt.minutes)}
              disabled={disabled}
            >
              {qt.label === 'Now' ? 'Now' : label}
            </button>
          );
        })}
      </div>
    </>
  );

  // Render dropdown variant
  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild disabled={disabled}>
        {renderTrigger ? (
          renderTrigger({
            value: displayValue,
            onClick: () => handleOpenChange(!isOpen),
            disabled: disabled ?? false,
          })
        ) : (
          defaultTrigger
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={styles.content}
          sideOffset={4}
          align="start"
          avoidCollisions
          collisionPadding={8}
        >
          {dropdownContent}
        </Popover.Content>
      </Popover.Portal>

      {name && <input type="hidden" name={name} value={JSON.stringify(currentValue)} />}
    </Popover.Root>
  );
}

export default TimePicker;
