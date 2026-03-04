/**
 * EmptyState Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Empty state display for dashboards and lists
 */

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateProps {
  /** Icon component or illustration */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: React.ReactNode;
  /** Primary action button label (if using default button) */
  actionLabel?: string;
  /** Primary action click handler */
  onActionClick?: () => void;
  /** Secondary link */
  secondaryLink?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Size variant */
  size?: EmptyStateSize;
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Background variant */
  background?: 'none' | 'glass' | 'subtle';
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

export type EmptyStateStyleVars = {
  '--ot-empty-state-size'?: string;
};
