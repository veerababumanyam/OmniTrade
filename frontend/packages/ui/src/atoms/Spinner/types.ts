/**
 * Spinner Component Types
 * Liquid Glass Design System - OmniTrade
 */

export type SpinnerSize = 'sm' | 'md' | 'lg';

export type SpinnerVariant = 'default' | 'dots' | 'pulse';

export interface SpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Visual variant: ring (default), dots, or pulse */
  variant?: SpinnerVariant;
  /** Color override - uses brand colors by default */
  color?: string;
  /** Accessible label for screen readers */
  label?: string;
  /** Additional CSS class names */
  className?: string;
}

export interface SpinnerStyleVars {
  '--spinner-size': string;
  '--spinner-color': string;
  '--spinner-border-width': string;
}
