/**
 * Card Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode, MouseEventHandler } from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined';
export type CardSize = 'sm' | 'md' | 'lg';

export interface CardProps {
  /** Card title displayed in header */
  title?: ReactNode;
  /** Subtitle displayed below title */
  subtitle?: ReactNode;
  /** Actions to render in header (e.g., buttons, icons) */
  actions?: ReactNode;
  /** Main content of the card */
  children?: ReactNode;
  /** Footer content (typically action buttons) */
  footer?: ReactNode;
  /** Visual style variant */
  variant?: CardVariant;
  /** Size variant */
  size?: CardSize;
  /** Enable hover elevation effect */
  hoverable?: boolean;
  /** Enable selection state */
  selectable?: boolean;
  /** Current selected state */
  selected?: boolean;
  /** Loading state shows skeleton */
  loading?: boolean;
  /** Click handler */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Additional CSS class */
  className?: string;
  /** HTML element to render as */
  as?: 'article' | 'section' | 'div' | 'li';
  /** Test ID for testing */
  testId?: string;
}

export interface CardHeaderProps {
  /** Title content */
  title?: ReactNode;
  /** Subtitle content */
  subtitle?: ReactNode;
  /** Actions slot */
  actions?: ReactNode;
  /** Checkbox for selectable cards */
  checkbox?: ReactNode;
  /** Size variant */
  size?: CardSize;
  /** Additional CSS class */
  className?: string;
}

export interface CardBodyProps {
  /** Body content */
  children?: ReactNode;
  /** Size variant */
  size?: CardSize;
  /** Additional CSS class */
  className?: string;
}

export interface CardFooterProps {
  /** Footer content */
  children?: ReactNode;
  /** Size variant */
  size?: CardSize;
  /** Align footer content */
  align?: 'left' | 'center' | 'right' | 'between';
  /** Additional CSS class */
  className?: string;
}

export interface CardSkeletonProps {
  /** Size variant */
  size?: CardSize;
  /** Show header skeleton */
  header?: boolean;
  /** Number of body lines */
  lines?: number;
  /** Show footer skeleton */
  footer?: boolean;
  /** Additional CSS class */
  className?: string;
}

export interface CardClickSignalData {
  /** Card identifier */
  id?: string;
  /** Selected state */
  selected?: boolean;
  /** Original event */
  event: MouseEvent;
}

// Size mappings
export const CARD_PADDING: Record<CardSize, string> = {
  sm: 'var(--ot-space-3)',
  md: 'var(--ot-space-4)',
  lg: 'var(--ot-space-6)',
} as const;

export const CARD_HEADER_GAP: Record<CardSize, string> = {
  sm: 'var(--ot-space-2)',
  md: 'var(--ot-space-3)',
  lg: 'var(--ot-space-4)',
} as const;
