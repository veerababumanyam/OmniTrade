/**
 * Divider Component Types
 * Liquid Glass Design System - OmniTrade
 */

export type DividerOrientation = 'horizontal' | 'vertical';

export type DividerSpacing = 'sm' | 'md' | 'lg' | 'xl';

export interface DividerProps {
  /** Orientation of the divider */
  orientation?: DividerOrientation;
  /** Spacing around the divider */
  spacing?: DividerSpacing;
  /** Use dashed line style */
  dashed?: boolean;
  /** Optional label text displayed in the center */
  label?: string;
  /** Additional CSS class names */
  className?: string;
}

export interface DividerStyleVars {
  '--divider-spacing': string;
}
