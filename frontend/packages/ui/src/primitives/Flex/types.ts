/**
 * Flex Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Flexbox wrapper with simplified API
 */

import type { JSX } from 'react'

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse'
export type FlexAlign = 'start' | 'end' | 'center' | 'baseline' | 'stretch'
export type FlexJustify = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
export type FlexGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface FlexProps {
  /** Flex direction */
  direction?: FlexDirection
  /** Flex wrap */
  wrap?: FlexWrap
  /** Align items */
  align?: FlexAlign
  /** Justify content */
  justify?: FlexJustify
  /** Gap between items */
  gap?: FlexGap
  /** Custom gap value (overrides gap) */
  gapValue?: string | number
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements
  /** Inline flex */
  inline?: boolean
  /** Flex grow */
  grow?: boolean | number
  /** Flex shrink */
  shrink?: boolean | number
  /** Flex basis */
  basis?: string | number
  /** Flex shorthand (overrides grow, shrink, basis) */
  flex?: string
  /** Order */
  order?: number
  /** Width */
  width?: string | number
  /** Height */
  height?: string | number
  /** Min width */
  minWidth?: string | number
  /** Max width */
  maxWidth?: string | number
  /** Min height */
  minHeight?: string | number
  /** Max height */
  maxHeight?: string | number
  /** Background variant */
  background?: 'none' | 'glass' | 'elevated' | 'solid'
  /** Border variant */
  border?: 'none' | 'subtle' | 'default' | 'emphasis'
  /** Border radius */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Padding */
  p?: number | string
  /** Padding horizontal */
  px?: number | string
  /** Padding vertical */
  py?: number | string
  /** Margin */
  m?: number | string
  /** Center content (sets align and justify to center) */
  center?: boolean
  /** Fill available space (sets width/height to 100%) */
  fill?: boolean
  /** Additional inline styles */
  style?: React.CSSProperties
  /** Additional CSS class names */
  className?: string
  /** Children content */
  children?: React.ReactNode
  /** Test ID for testing */
  testId?: string
  /** Aria label for accessibility */
  ariaLabel?: string
  /** Role attribute */
  role?: string
  /** Tab index for keyboard navigation */
  tabIndex?: number
}

export type FlexStyleVars = {
  '--ot-flex-direction'?: string
  '--ot-flex-wrap'?: string
  '--ot-flex-align'?: string
  '--ot-flex-justify'?: string
  '--ot-flex-gap'?: string
}
