/**
 * Stack Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Vertical/horizontal flex stack primitive
 */

import type { JSX } from 'react';

export type StackDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type StackAlign = 'start' | 'end' | 'center' | 'baseline' | 'stretch';
export type StackJustify = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
export type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface StackProps {
  /** Stack direction */
  direction?: StackDirection;
  /** Gap between items */
  gap?: StackGap;
  /** Custom gap value (overrides gap) */
  gapValue?: string | number;
  /** Align items on cross axis */
  align?: StackAlign;
  /** Justify content on main axis */
  justify?: StackJustify;
  /** Flex wrap */
  wrap?: boolean | 'wrap' | 'wrap-reverse' | 'nowrap';
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements;
  /** Inline flex */
  inline?: boolean;
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Flex grow */
  grow?: boolean | number;
  /** Flex shrink */
  shrink?: boolean | number;
  /** Flex basis */
  basis?: string | number;
  /** Divider to render between items */
  divider?: React.ReactNode;
  /** Background variant */
  background?: 'none' | 'glass' | 'elevated' | 'solid';
  /** Border variant */
  border?: 'none' | 'subtle' | 'default' | 'emphasis';
  /** Border radius */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Padding */
  p?: number | string;
  /** Padding horizontal */
  px?: number | string;
  /** Padding vertical */
  py?: number | string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Additional CSS class names */
  className?: string;
  /** Children content */
  children?: React.ReactNode;
  /** Test ID for testing */
  testId?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
  /** Role attribute */
  role?: string;
  /** Handle keyboard navigation */
  keyboardNav?: boolean;
}

export type StackStyleVars = {
  '--ot-stack-direction'?: string;
  '--ot-stack-gap'?: string;
  '--ot-stack-align'?: string;
  '--ot-stack-justify'?: string;
  '--ot-stack-wrap'?: string;
};
