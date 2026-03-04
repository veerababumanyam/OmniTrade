/**
 * Slider Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode } from 'react';

export type SliderSize = 'sm' | 'md' | 'lg';

export type SliderVariant = 'default' | 'gradient' | 'stepped';

export interface SliderValue {
  min: number;
  max: number;
}

export interface SliderProps {
  /** Current value (single thumb) */
  value?: number;
  /** Current range values (double thumb) */
  valueRange?: SliderValue;
  /** Callback when value changes */
  onChange?: (value: number) => void;
  /** Callback when range changes */
  onChangeRange?: (value: SliderValue) => void;
  /** Enable range/double thumb mode */
  range?: boolean;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Step increment (default: 1) */
  step?: number;
  /** Show value labels on thumbs */
  showLabels?: boolean;
  /** Show min/max labels */
  showMinMaxLabels?: boolean;
  /** Custom format function for labels */
  formatLabel?: (value: number) => string;
  /** Size variant */
  size?: SliderSize;
  /** Visual variant */
  variant?: SliderVariant;
  /** Disabled state */
  disabled?: boolean;
  /** Custom aria-label */
  ariaLabel?: string;
  /** aria-label for min thumb (range mode) */
  ariaLabelMin?: string;
  /** aria-label for max thumb (range mode) */
  ariaLabelMax?: string;
  /** Custom class name */
  className?: string;
  /** Custom ID */
  id?: string;
  /** Name attribute */
  name?: string;
  /** Show tick marks */
  showTicks?: boolean;
  /** Custom tick marks */
  ticks?: Array<{ value: number; label?: string }>;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Invert direction */
  inverted?: boolean;
  /** Show tooltip on hover/drag */
  showTooltip?: boolean;
  /** Custom tooltip content */
  renderTooltip?: (value: number) => ReactNode;
}

export interface SliderState {
  isDragging: boolean;
  activeThumb: 'min' | 'max' | null;
  hoverThumb: 'min' | 'max' | null;
  value: number;
  valueRange: SliderValue;
}

export interface SliderStyleVars {
  '--slider-track-height': string;
  '--slider-thumb-size': string;
  '--slider-font-size': string;
}

export const SLIDER_SIZES: Record<SliderSize, SliderStyleVars> = {
  sm: {
    '--slider-track-height': '4px',
    '--slider-thumb-size': '14px',
    '--slider-font-size': 'var(--ot-font-size-xs)',
  },
  md: {
    '--slider-track-height': '6px',
    '--slider-thumb-size': '18px',
    '--slider-font-size': 'var(--ot-font-size-sm)',
  },
  lg: {
    '--slider-track-height': '8px',
    '--slider-thumb-size': '22px',
    '--slider-font-size': 'var(--ot-font-size-md)',
  },
} as const;

export interface SliderChangeEvent {
  value: number | SliderValue;
  isRange: boolean;
  timestamp: number;
}

export interface SliderSignalData {
  value: number | SliderValue;
  isRange: boolean;
  source: string;
  timestamp: number;
}
