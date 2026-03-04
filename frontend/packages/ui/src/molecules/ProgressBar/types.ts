/**
 * ProgressBar Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode } from 'react';

export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error';
export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ProgressBarProps {
  /** Current value (0 to max) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Label displayed above or beside the bar */
  label?: ReactNode;
  /** Show value display (percentage or fraction) */
  showValue?: boolean;
  /** Value display format */
  valueFormat?: 'percent' | 'fraction' | 'custom';
  /** Custom value formatter */
  formatValue?: (value: number, max: number) => string;
  /** Visual style variant */
  variant?: ProgressBarVariant;
  /** Size variant */
  size?: ProgressBarSize;
  /** Enable animated fill with spring physics */
  animated?: boolean;
  /** Enable striped pattern */
  striped?: boolean;
  /** Indeterminate loading state */
  indeterminate?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

export interface ProgressBarTrackProps {
  /** Size variant */
  size?: ProgressBarSize;
  /** Additional CSS class */
  className?: string;
}

export interface ProgressBarFillProps {
  /** Current value percentage (0-100) */
  percentage: number;
  /** Visual style variant */
  variant?: ProgressBarVariant;
  /** Enable striped pattern */
  striped?: boolean;
  /** Enable animation */
  animated?: boolean;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** Size variant */
  size?: ProgressBarSize;
}

export interface ProgressBarLabelProps {
  /** Label content */
  label?: ReactNode;
  /** Value display */
  value?: string;
  /** Size variant */
  size?: ProgressBarSize;
  /** Additional CSS class */
  className?: string;
}

export interface ProgressBarCompleteSignalData {
  /** Final value */
  value: number;
  /** Maximum value */
  max: number;
  /** Percentage at completion */
  percentage: number;
}

// Size mappings
export const PROGRESSBAR_SIZES: Record<ProgressBarSize, { height: string; fontSize: string }> = {
  xs: {
    height: '4px',
    fontSize: 'var(--ot-font-size-xs, 12px)',
  },
  sm: {
    height: '6px',
    fontSize: 'var(--ot-font-size-xs, 12px)',
  },
  md: {
    height: '8px',
    fontSize: 'var(--ot-font-size-sm, 14px)',
  },
  lg: {
    height: '12px',
    fontSize: 'var(--ot-font-size-sm, 14px)',
  },
} as const;

export const PROGRESSBAR_COLORS: Record<ProgressBarVariant, { start: string; end: string }> = {
  default: {
    start: 'var(--ot-color-photon-500, #0066ff)',
    end: 'var(--ot-color-neural-500, #7900ff)',
  },
  success: {
    start: 'var(--ot-color-quantum-400, #1aff8a)',
    end: 'var(--ot-color-quantum-600, #00cc5a)',
  },
  warning: {
    start: 'var(--ot-color-flux-400, #ffe31a)',
    end: 'var(--ot-color-flux-600, #ccb000)',
  },
  error: {
    start: 'var(--ot-color-entropy-400, #ff1a1a)',
    end: 'var(--ot-color-entropy-600, #cc0000)',
  },
};
