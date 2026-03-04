/**
 * DatePicker Component
 * Liquid Glass Design System - OmniTrade
 *
 * Composition: Input + Calendar + Popover (Radix UI Popover)
 * Features: Single/range selection, time picker, presets, min/max constraints
 */

'use client';

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import * as Popover from '@radix-ui/react-popover';
import { SignalBus } from '../../signal-bus';
import type {
  DatePickerProps,
  DateRange,
  DatePreset,
  CalendarDay,
} from './types';
import {
  WEEKDAY_NAMES,
  MONTH_NAMES,
  PRESET_LABELS,
  DEFAULT_PRESETS,
} from './types';
import styles from './styles.module.css';

// Icons as inline SVG components
const CalendarIcon = () => (
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ClearIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

// Helper functions
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function startOfWeek(date: Date, firstDayOfWeek: number = 0): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < firstDayOfWeek ? 7 : 0) + day - firstDayOfWeek;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatTime(value: number): string {
  return value.toString().padStart(2, '0');
}

export function DatePicker({
  value,
  valueRange,
  onChange,
  onChangeRange,
  range = false,
  time = false,
  hours: controlledHours,
  minutes: controlledMinutes,
  onTimeChange,
  min,
  max,
  presets,
  customPresets = [],
  placeholder = 'Select date',
  size = 'md',
  disabled = false,
  formatDisplay,
  ariaLabel = 'Date picker',
  className = '',
  id,
  name,
  showWeekNumbers = false,
  firstDayOfWeek = 0,
  closeOnSelect = true,
  onOpenChange,
  locale = 'en-US',
  renderTrigger,
}: DatePickerProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ?? new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [internalHours, setInternalHours] = useState(controlledHours ?? 12);
  const [internalMinutes, setInternalMinutes] = useState(controlledMinutes ?? 0);

  // Determine controlled vs uncontrolled time
  const currentHours = controlledHours ?? internalHours;
  const currentMinutes = controlledMinutes ?? internalMinutes;

  // Update view date when value changes
  useEffect(() => {
    if (value) {
      setViewDate(value);
    } else if (valueRange?.start) {
      setViewDate(valueRange.start);
    }
  }, [value, valueRange?.start]);

  // Active presets
  const activePresets = presets ?? (range ? DEFAULT_PRESETS.slice(0, 4) : DEFAULT_PRESETS.slice(0, 3));

  // Get preset value
  const getPresetValue = useCallback((preset: DatePreset): Date | DateRange => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'today':
        return today;
      case 'yesterday': {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        return d;
      }
      case 'tomorrow': {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        return d;
      }
      case 'thisWeek': {
        const start = startOfWeek(today, firstDayOfWeek);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { start, end };
      }
      case 'lastWeek': {
        const start = startOfWeek(new Date(today.setDate(today.getDate() - 7)), firstDayOfWeek);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { start, end };
      }
      case 'nextWeek': {
        const start = startOfWeek(new Date(today.setDate(today.getDate() + 7)), firstDayOfWeek);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { start, end };
      }
      case 'thisMonth': {
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        return { start, end };
      }
      case 'lastMonth': {
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const start = startOfMonth(lastMonth);
        const end = endOfMonth(lastMonth);
        return { start, end };
      }
      case 'nextMonth': {
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const start = startOfMonth(nextMonth);
        const end = endOfMonth(nextMonth);
        return { start, end };
      }
      case 'last7Days': {
        const end = new Date(today);
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        return { start, end };
      }
      case 'last30Days': {
        const end = new Date(today);
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        return { start, end };
      }
      case 'last90Days': {
        const end = new Date(today);
        const start = new Date(today);
        start.setDate(start.getDate() - 89);
        return { start, end };
      }
      case 'thisYear': {
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear(), 11, 31);
        return { start, end };
      }
      case 'lastYear': {
        const start = new Date(today.getFullYear() - 1, 0, 1);
        const end = new Date(today.getFullYear() - 1, 11, 31);
        return { start, end };
      }
      default:
        return today;
    }
  }, [firstDayOfWeek]);

  // Emit signal
  const emitSignal = useCallback(
    (date: Date | DateRange | null) => {
      SignalBus.publish(
        'ui:datepicker:change' as const,
        { date, range, timestamp: Date.now() },
        { source: 'DatePicker' }
      );
    },
    [range]
  );

  // Format display value
  const displayValue = useMemo(() => {
    if (formatDisplay) {
      return formatDisplay(range ? valueRange ?? null : value ?? null);
    }

    const formatDate = (d: Date) => {
      if (time) {
        return d.toLocaleString(locale, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return d.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    if (range && valueRange) {
      if (valueRange.start && valueRange.end) {
        return `${formatDate(valueRange.start)} - ${formatDate(valueRange.end)}`;
      }
      if (valueRange.start) {
        return `${formatDate(valueRange.start)} - Select end`;
      }
      return placeholder;
    }

    if (value) {
      return formatDate(value);
    }

    return placeholder;
  }, [value, valueRange, range, time, locale, formatDisplay, placeholder]);

  // Check if has value
  const hasValue = range
    ? valueRange?.start !== null && valueRange?.start !== undefined
    : value !== null && value !== undefined;

  // Generate calendar weeks
  const generateCalendarWeeks = useCallback(
    (monthDate: Date) => {
      const weeks: { weekNumber?: number; days: CalendarDay[] }[] = [];
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const startDate = startOfWeek(monthStart, firstDayOfWeek);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentDate = new Date(startDate);

      while (currentDate <= monthEnd || weeks.length < 6) {
        const week: CalendarDay[] = [];
        const weekNum = showWeekNumbers ? getWeekNumber(currentDate) : undefined;

        for (let i = 0; i < 7; i++) {
          const date = new Date(currentDate);
          const isCurrentMonth = date.getMonth() === monthDate.getMonth();
          const isToday = isSameDay(date, today);
          const isSelected = range
            ? (valueRange?.start && isSameDay(date, valueRange.start)) ||
              (valueRange?.end && isSameDay(date, valueRange.end))
            : value !== null && value !== undefined && isSameDay(date, value);

          const inRange = range && valueRange?.start && valueRange?.end
            ? isDateInRange(date, valueRange.start, valueRange.end)
            : range && valueRange?.start && hoveredDate && selectingEnd
            ? isDateInRange(date, valueRange.start, hoveredDate) ||
              isSameDay(date, hoveredDate)
            : false;

          const isRangeStart = range && valueRange?.start
            ? isSameDay(date, valueRange.start)
            : false;

          const isRangeEnd = range && valueRange?.end
            ? isSameDay(date, valueRange.end)
            : false;

          const isDisabled =
            (min !== undefined && date < min) ||
            (max !== undefined && date > max);

          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          week.push({
            date,
            day: date.getDate(),
            isCurrentMonth,
            isToday,
            isSelected: isSelected ?? false,
            isInRange: inRange,
            isRangeStart,
            isRangeEnd,
            isDisabled,
            isWeekend,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        weeks.push({ weekNumber: weekNum, days: week });

        if (currentDate > monthEnd && weeks.length >= 6) break;
      }

      return weeks;
    },
    [firstDayOfWeek, showWeekNumbers, range, value, valueRange, min, max, hoveredDate, selectingEnd]
  );

  // Calendar weeks for current view
  const calendarWeeks = useMemo(
    () => generateCalendarWeeks(viewDate),
    [viewDate, generateCalendarWeeks]
  );

  // Handle day click
  const handleDayClick = useCallback(
    (day: CalendarDay) => {
      if (day.isDisabled) return;

      const selectedDate = new Date(day.date);
      if (time) {
        selectedDate.setHours(currentHours, currentMinutes, 0, 0);
      }

      if (range) {
        if (!valueRange?.start || selectingEnd) {
          // Selecting start or end
          if (!valueRange?.start) {
            // First click - select start
            onChangeRange?.({ start: selectedDate, end: null });
            setSelectingEnd(true);
          } else {
            // Second click - select end
            let start = valueRange.start;
            let end = selectedDate;

            // Swap if end is before start
            if (end < start) {
              [start, end] = [end, start];
            }

            onChangeRange?.({ start, end });
            emitSignal({ start, end });
            setSelectingEnd(false);

            if (closeOnSelect) {
              setIsOpen(false);
            }
          }
        } else {
          // Reset selection
          onChangeRange?.({ start: selectedDate, end: null });
          setSelectingEnd(true);
        }
      } else {
        onChange?.(selectedDate);
        emitSignal(selectedDate);

        if (closeOnSelect) {
          setIsOpen(false);
        }
      }
    },
    [range, valueRange, selectingEnd, time, currentHours, currentMinutes, onChange, onChangeRange, emitSignal, closeOnSelect]
  );

  // Handle month navigation
  const handlePrevMonth = useCallback(() => {
    setViewDate((prev) => addMonths(prev, range ? -1 : -1));
  }, [range]);

  const handleNextMonth = useCallback(() => {
    setViewDate((prev) => addMonths(prev, range ? 1 : 1));
  }, [range]);

  // Handle time change
  const handleHoursChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
      setInternalHours(val);
      onTimeChange?.(val, currentMinutes);
    },
    [currentMinutes, onTimeChange]
  );

  const handleMinutesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
      setInternalMinutes(val);
      onTimeChange?.(currentHours, val);
    },
    [currentHours, onTimeChange]
  );

  // Handle preset click
  const handlePresetClick = useCallback(
    (preset: DatePreset) => {
      const result = getPresetValue(preset);

      if (range && 'start' in result && 'end' in result) {
        onChangeRange?.(result);
        emitSignal(result);
      } else if (!range && result instanceof Date) {
        onChange?.(result);
        emitSignal(result);
      }

      if (closeOnSelect) {
        setIsOpen(false);
      }
    },
    [range, getPresetValue, onChange, onChangeRange, emitSignal, closeOnSelect]
  );

  // Handle custom preset click
  const handleCustomPresetClick = useCallback(
    (preset: { label: string; getValue: () => Date | DateRange }) => {
      const result = preset.getValue();

      if (range && 'start' in result && 'end' in result) {
        onChangeRange?.(result);
        emitSignal(result);
      } else if (!range && result instanceof Date) {
        onChange?.(result);
        emitSignal(result);
      }

      if (closeOnSelect) {
        setIsOpen(false);
      }
    },
    [range, onChange, onChangeRange, emitSignal, closeOnSelect]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    if (range) {
      onChangeRange?.({ start: null, end: null });
    } else {
      onChange?.(null);
    }
    setSelectingEnd(false);
  }, [range, onChange, onChangeRange]);

  // Handle open change
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
      if (!open) {
        setSelectingEnd(false);
        setHoveredDate(null);
      }
    },
    [onOpenChange]
  );

  // Build class names
  const triggerClasses = [
    styles.trigger,
    hasValue ? styles.hasValue : styles.noValue,
    styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}` as keyof typeof styles],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const contentClasses = [styles.content].filter(Boolean).join(' ');

  // Get weekday names based on first day of week
  const weekdayNames = useMemo(() => {
    const names = [...WEEKDAY_NAMES];
    return [...names.slice(firstDayOfWeek), ...names.slice(0, firstDayOfWeek)];
  }, [firstDayOfWeek]);

  // Render trigger
  const defaultTrigger = (
    <button
      type="button"
      className={triggerClasses}
      disabled={disabled}
      aria-label={ariaLabel}
      id={id}
      name={name}
    >
      <span className={styles.triggerIcon}>
        <CalendarIcon />
      </span>
      <span className={styles.triggerText}>{displayValue}</span>
      {hasValue && !disabled && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
          aria-label="Clear date"
        >
          <ClearIcon />
        </button>
      )}
    </button>
  );

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
          className={contentClasses}
          sideOffset={4}
          align="start"
          avoidCollisions
          collisionPadding={8}
        >
          {/* Calendar */}
          <div className={styles.calendar}>
            {/* Header */}
            <div className={styles.calendarHeader}>
              <button
                type="button"
                className={styles.navButton}
                onClick={handlePrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeftIcon />
              </button>

              <div className={styles.monthYearSelector}>
                <span className={styles.monthYearLabel}>
                  {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
              </div>

              <button
                type="button"
                className={styles.navButton}
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                <ChevronRightIcon />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className={styles.weekdayHeaders}>
              {showWeekNumbers && <div className={styles.weekdayHeader}>W</div>}
              {weekdayNames.map((name) => (
                <div key={name} className={styles.weekdayHeader}>
                  {name}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className={styles.daysGrid}>
              {calendarWeeks.map((week, weekIndex) => (
                <>
                  {showWeekNumbers && (
                    <div key={`week-${weekIndex}`} className={styles.day}>
                      <span style={{ fontSize: '0.625rem', color: 'var(--ot-text-tertiary)' }}>
                        {week.weekNumber}
                      </span>
                    </div>
                  )}
                  {week.days.map((day: CalendarDay, dayIndex: number) => {
                    const dayClasses = [
                      styles.day,
                      !day.isCurrentMonth && styles.otherMonth,
                      day.isToday && styles.today,
                      day.isSelected && styles.selected,
                      day.isInRange && styles.inRange,
                      day.isRangeStart && styles.rangeStart,
                      day.isRangeEnd && styles.rangeEnd,
                      day.isDisabled && styles.disabled,
                      day.isWeekend && styles.weekend,
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <button
                        key={`${weekIndex}-${dayIndex}`}
                        type="button"
                        className={dayClasses}
                        onClick={() => handleDayClick(day)}
                        onMouseEnter={() => setHoveredDate(day.date)}
                        onMouseLeave={() => setHoveredDate(null)}
                        disabled={day.isDisabled}
                        aria-label={`${MONTH_NAMES[day.date.getMonth()]} ${day.day}, ${day.date.getFullYear()}`}
                        aria-selected={day.isSelected}
                      >
                        {day.day}
                      </button>
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          {/* Time Picker */}
          {time && (
            <div className={styles.timePicker}>
              <span className={styles.timeLabel}>Time:</span>
              <input
                type="number"
                min="0"
                max="23"
                value={formatTime(currentHours)}
                onChange={handleHoursChange}
                className={styles.timeInput}
                aria-label="Hours"
              />
              <span className={styles.timeSeparator}>:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={formatTime(currentMinutes)}
                onChange={handleMinutesChange}
                className={styles.timeInput}
                aria-label="Minutes"
              />
            </div>
          )}

          {/* Presets */}
          {(activePresets.length > 0 || customPresets.length > 0) && (
            <div className={styles.presets}>
              {activePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={styles.presetButton}
                  onClick={() => handlePresetClick(preset)}
                >
                  {PRESET_LABELS[preset]}
                </button>
              ))}
              {customPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={styles.presetButton}
                  onClick={() => handleCustomPresetClick(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default DatePicker;
