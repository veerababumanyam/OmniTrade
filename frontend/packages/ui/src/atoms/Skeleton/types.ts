/**
 * Skeleton Component Types
 * Liquid Glass Design System - OmniTrade
 */

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

export interface SkeletonProps {
  /** Visual variant: text, circular, or rectangular */
  variant?: SkeletonVariant;
  /** Width of the skeleton (CSS value) */
  width?: string | number;
  /** Height of the skeleton (CSS value) */
  height?: string | number;
  /** Number of text lines (only for text variant) */
  count?: number;
  /** Animation style: pulse, wave, or none */
  animation?: SkeletonAnimation;
  /** Border radius override */
  borderRadius?: string | number;
  /** Additional CSS class names */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
}

export interface SkeletonStyleVars {
  '--skeleton-width': string;
  '--skeleton-height': string;
  '--skeleton-radius': string;
}
