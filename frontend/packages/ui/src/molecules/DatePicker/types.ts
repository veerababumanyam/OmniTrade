/**
 * DatePicker Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode } from 'react';

export type DatePickerSize = 'sm' | 'md' | 'lg';

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'tomorrow'
  | 'thisWeek'
  | 'lastWeek'
  | 'nextWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'nextMonth'
  | 'last7Days'
  | 'last30Days'
  | 'last90Days'
  | 'thisYear'
  | 'lastYear';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DatePickerProps {
  /** Selected date (single mode) */
  value?: Date | null;
  /** Selected date range (range mode) */
  valueRange?: DateRange;
  /** Callback when date changes */
  onChange?: (date: Date | null) => void;
  /** Callback when date range changes */
  onChangeRange?: (range: DateRange) => void;
  /** Enable range selection mode */
  range?: boolean;
  /** Enable time picker */
  time?: boolean;
  /** Selected time (hours) */
  hours?: number;
  /** Selected time (minutes) */
  minutes?: number;
  /** Callback when time changes */
  onTimeChange?: (hours: number, minutes: number) => void;
  /** Minimum selectable date */
  min?: Date;
  /** Maximum selectable date */
  max?: Date;
  /** Preset buttons */
  presets?: DatePreset[];
  /** Custom presets */
  customPresets?: Array<{
    label: string;
    getValue: () => Date | DateRange;
  }>;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: DatePickerSize;
  /** Disabled state */
  disabled?: boolean;
  /** Custom format function for display */
  formatDisplay?: (date: Date | DateRange | null) => string;
  /** Custom aria-label */
  ariaLabel?: string;
  /** Custom class name */
  className?: string;
  /** Custom ID */
  id?: string;
  /** Name attribute */
  name?: string;
  /** Show week numbers */
  showWeekNumbers?: boolean;
  /** First day of week (0 = Sunday, 1 = Monday) */
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Close popover on selection */
  closeOnSelect?: boolean;
  /** Callback when popover opens/closes */
  onOpenChange?: (open: boolean) => void;
  /** Locale for formatting */
  locale?: string;
  /** Render custom trigger */
  renderTrigger?: (props: {
    value: string;
    onClick: () => void;
    disabled: boolean;
  }) => ReactNode;
}

export interface DatePickerState {
  isOpen: boolean;
  viewDate: Date;
  hoveredDate: Date | null;
  selectingEnd: boolean;
}

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
  isWeekend: boolean;
}

export interface CalendarWeek {
  weekNumber?: number;
  days: CalendarDay[];
}

export interface DatePickerStyleVars {
  '--datepicker-height': string;
  '--datepicker-font-size': string;
  '--datepicker-padding-x': string;
}

export const DATEPICKER_SIZES: Record<DatePickerSize, DatePickerStyleVars> = {
  sm: {
    '--datepicker-height': 'var(--ot-input-height-sm)',
    '--datepicker-font-size': 'var(--ot-font-size-sm)',
    '--datepicker-padding-x': 'var(--ot-input-padding-x-sm)',
  },
  md: {
    '--datepicker-height': 'var(--ot-input-height-md)',
    '--datepicker-font-size': 'var(--ot-font-size-md)',
    '--datepicker-padding-x': 'var(--ot-input-padding-x-md)',
  },
  lg: {
    '--datepicker-height': 'var(--ot-input-height-lg)',
    '--datepicker-font-size': 'var(--ot-font-size-lg)',
    '--datepicker-padding-x': 'var(--ot-input-padding-x-lg)',
  },
} as const;

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
  nextWeek: 'Next Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  nextMonth: 'Next Month',
  last7Days: 'Last 7 Days',
  last30Days: 'Last 30 Days',
  last90Days: 'Last 90 Days',
  thisYear: 'This Year',
  lastYear: 'Last Year',
};

export const DEFAULT_PRESETS: DatePreset[] = ['today', 'thisWeek', 'thisMonth', 'last7Days', 'last30Days'];
