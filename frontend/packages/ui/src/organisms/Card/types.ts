/**
 * * Card Component Types
 * OmniTrade UI Library - Liquid Glass Design System
 * Macro-Volume Organism - Z-axis: translateZ(48px) (extreme focus)
 */

import type { ReactNode, MouseEventHandler, from 'react';

// ============================================
// Card Variants
// ============================================

/** Visual style variants for the Card */
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

export type CardSize = 'sm' | 'md' | 'lg';

// ============================================
// Card Props
// ============================================
export interface CardProps {
  /** Card content */
  children?: ReactNode;
  /** Visual style variant */
  variant?: CardVariant;
  /** Size variant */
  size?: CardSize;
  /** Enable padding (adds default padding) */
  padding?: boolean;
  /** Enable hover state */
  hoverable?: boolean;
  /** Enable clickable state */
  clickable?: boolean;
  /** Click handler */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Custom CSS class */
  className?: string;
  /** HTML element to render as */
  as?: 'article' | 'section' | 'div' | 'li';
  /** Test ID */
  testId?: string;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
}

// ============================================
// Card Sub-components
// ============================================

export interface CardHeaderProps {
  /** Header content */
  children?: ReactNode;
  /** Optional avatar */
  avatar?: ReactNode;
  /** Title text */
  title?: ReactNode;
  /** Subtitle text */
  subtitle?: ReactNode;
  /** Actions slot */
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
  /** Footer alignment */
  align?: 'left' | 'center' | 'right' | 'between';
  /** Custom CSS class */
  className?: string;
}
// ============================================
// Signal Types
// ============================================
export interface CardClickSignalData {
  /** Card identifier */
  id?: string;
  /** Selected state */
  selected?: boolean;
  /** Click event */
  event: MouseEvent;
  /** Timestamp */
  timestamp?: number;
}
