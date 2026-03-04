/**
 * TimePicker Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode } from 'react';

export type TimePickerSize = 'sm' | 'md' | 'lg';

export type TimePickerVariant = 'default' | 'compact' | 'dropdown';

export type TimePickerFormat = '12h' | '24h';

export interface TimePickerValue {
  hours: number;
  minutes: number;
  period?: 'AM' | 'PM';
}

export interface TimePickerProps {
  /** Selected hours (0-23 for 24h, 1-12 for 12h) */
  hours?: number;
  /** Selected minutes (0-59) */
  minutes?: number;
  /** Time period for 12h format */
  period?: 'AM' | 'PM';
  /** Callback when time changes */
  onChange?: (value: TimePickerValue) => void;
  /** Time format (12h or 24h) */
  format?: TimePickerFormat;
  /** Step interval for minutes (default: 1) */
  minuteStep?: 1 | 5 | 10 | 15 | 30;
  /** Hour step interval (default: 1) */
  hourStep?: 1 | 2 | 3;
  /** Minimum time (inclusive) */
  minTime?: TimePickerValue;
  /** Maximum time (inclusive) */
  maxTime?: TimePickerValue;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: TimePickerSize;
  /** Visual variant */
  variant?: TimePickerVariant;
  /** Disabled state */
  disabled?: boolean;
  /** Custom aria-label */
  ariaLabel?: string;
  /** Custom class name */
  className?: string;
  /** Custom ID */
  id?: string;
  /** Name attribute */
  name?: string;
  /** Show seconds picker */
  showSeconds?: boolean;
  /** Selected seconds */
  seconds?: number;
  /** Custom format function for display */
  formatDisplay?: (value: TimePickerValue) => string;
  /** Close popover on selection (dropdown variant) */
  closeOnSelect?: boolean;
  /** Callback when popover opens/closes */
  onOpenChange?: (open: boolean) => void;
  /** Render custom trigger (dropdown variant) */
  renderTrigger?: (props: {
    value: string;
    onClick: () => void;
    disabled: boolean;
  }) => ReactNode;
  /** Label for hours input */
  hoursLabel?: string;
  /** Label for minutes input */
  minutesLabel?: string;
  /** Label for seconds input */
  secondsLabel?: string;
  /** Label for AM/PM toggle */
  periodLabel?: string;
}

export interface TimePickerState {
  isOpen: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  period: 'AM' | 'PM';
  focusedField: 'hours' | 'minutes' | 'seconds' | null;
}

export interface TimePickerStyleVars {
  '--timepicker-height': string;
  '--timepicker-font-size': string;
  '--timepicker-padding-x': string;
}

export const TIMEPICKER_SIZES: Record<TimePickerSize, TimePickerStyleVars> = {
  sm: {
    '--timepicker-height': 'var(--ot-input-height-sm)',
    '--timepicker-font-size': 'var(--ot-font-size-sm)',
    '--timepicker-padding-x': 'var(--ot-input-padding-x-sm)',
  },
  md: {
    '--timepicker-height': 'var(--ot-input-height-md)',
    '--timepicker-font-size': 'var(--ot-font-size-md)',
    '--timepicker-padding-x': 'var(--ot-input-padding-x-md)',
  },
  lg: {
    '--timepicker-height': 'var(--ot-input-height-lg)',
    '--timepicker-font-size': 'var(--ot-font-size-lg)',
    '--timepicker-padding-x': 'var(--ot-input-padding-x-lg)',
  },
} as const;

export interface TimePickerChangeEvent {
  value: TimePickerValue;
  previousValue: TimePickerValue | null;
  timestamp: number;
}

export interface TimePickerSignalData {
  value: TimePickerValue;
  source: string;
  timestamp: number;
}
