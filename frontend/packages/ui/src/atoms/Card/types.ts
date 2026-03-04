/**
 * Card Component Types
 * Liquid Glass Design System - OmniTrade
 * Atomic-level component with compound pattern
 */

import type { ReactNode, MouseEventHandler, CSSProperties } from 'react';

// ============================================================================
// Card Variants
// ============================================================================

/** Visual style variants for the Card */
export type CardVariant = 'elevated' | 'outlined' | 'flat' | 'glass';

/** Size variants for the Card */
export type CardSize = 'sm' | 'md' | 'lg';

// ============================================================================
// Card Props
// ============================================================================

export interface CardProps {
  /** Card content */
  children?: ReactNode;
  /** Visual style variant */
  variant?: CardVariant;
  /** Size variant */
  size?: CardSize;
  /** Enable interactive hover state */
  interactive?: boolean;
  /** Enable clickable appearance */
  clickable?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** HTML element to render as */
  as?: 'article' | 'section' | 'div' | 'li';
  /** Click handler */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Test ID for testing */
  testId?: string;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
}

export interface CardHeaderProps {
  /** Header content */
  children?: ReactNode;
  /** Optional avatar/icon */
  avatar?: ReactNode;
  /** Title text */
  title?: ReactNode;
  /** Subtitle text */
  subtitle?: ReactNode;
  /** Actions slot (e.g., buttons, icons) */
  actions?: ReactNode;
  /** Size variant */
  size?: CardSize;
  /** Custom CSS class */
  className?: string;
}

export interface CardBodyProps {
  /** Body content */
  children?: ReactNode;
  /** Size variant */
  size?: CardSize;
  /** Custom CSS class */
  className?: string;
}

export interface CardFooterProps {
  /** Footer content */
  children?: ReactNode;
  /** Size variant */
  size?: CardSize;
  /** Align footer content */
  align?: 'left' | 'center' | 'right' | 'between';
  /** Custom CSS class */
  className?: string;
}

export interface CardCoverProps {
  /** Cover image source */
  src?: string;
  /** Alt text for cover image */
  alt?: string;
  /** Cover content (alternative to src) */
  children?: ReactNode;
  /** Aspect ratio for cover */
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/4' | 'auto';
  /** Object fit for image */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  /** Size variant */
  size?: CardSize;
  /** Custom CSS class */
  className?: string;
}

// ============================================================================
// Signal Types
// ============================================================================

export interface CardClickSignalData {
  /** Card identifier */
  id?: string;
  /** Original event */
  event: MouseEvent;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Size Mappings
// ============================================================================

export const CARD_PADDING: Record<CardSize, string> = {
  sm: 'var(--ot-space-3)',
  md: 'var(--ot-space-4)',
  lg: 'var(--ot-space-6)',
} as const;

export const CARD_BORDER_RADIUS: Record<CardSize, string> = {
  sm: 'var(--ot-radius-lg)',
  md: 'var(--ot-radius-xl)',
  lg: 'var(--ot-radius-2xl)',
} as const;
