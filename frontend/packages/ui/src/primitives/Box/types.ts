/**
 * Box Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * A generic container primitive with spacing props
 */

import type { JSX } from 'react'

export type SpacingValue = number | string

export interface SpacingProps {
  /** Padding - applies to all sides */
  p?: SpacingValue
  /** Padding top */
  pt?: SpacingValue
  /** Padding right */
  pr?: SpacingValue
  /** Padding bottom */
  pb?: SpacingValue
  /** Padding left */
  pl?: SpacingValue
  /** Padding horizontal (left + right) */
  px?: SpacingValue
  /** Padding vertical (top + bottom) */
  py?: SpacingValue
  /** Margin - applies to all sides */
  m?: SpacingValue
  /** Margin top */
  mt?: SpacingValue
  /** Margin right */
  mr?: SpacingValue
  /** Margin bottom */
  mb?: SpacingValue
  /** Margin left */
  ml?: SpacingValue
  /** Margin horizontal (left + right) */
  mx?: SpacingValue
  /** Margin vertical (top + bottom) */
  my?: SpacingValue
}

export interface BoxProps extends SpacingProps {
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements
  /** Width of the box */
  width?: string | number
  /** Height of the box */
  height?: string | number
  /** Min width */
  minWidth?: string | number
  /** Max width */
  maxWidth?: string | number
  /** Min height */
  minHeight?: string | number
  /** Max height */
  maxHeight?: string | number
  /** Display property */
  display?: string
  /** Position property */
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  /** Top position */
  top?: string | number
  /** Right position */
  right?: string | number
  /** Bottom position */
  bottom?: string | number
  /** Left position */
  left?: string | number
  /** Z-index */
  zIndex?: number
  /** Overflow behavior */
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  /** Overflow X behavior */
  overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto'
  /** Overflow Y behavior */
  overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto'
  /** Border radius */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Background variant */
  background?: 'none' | 'glass' | 'elevated' | 'solid'
  /** Border variant */
  border?: 'none' | 'subtle' | 'default' | 'emphasis'
  /** Box shadow */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'glow'
  /** Opacity */
  opacity?: number
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
  /** Aria described by */
  ariaDescribedBy?: string
  /** Role attribute */
  role?: string
}

export type BoxStyleVars = {
  '--ot-box-p'?: string
  '--ot-box-pt'?: string
  '--ot-box-pr'?: string
  '--ot-box-pb'?: string
  '--ot-box-pl'?: string
  '--ot-box-px'?: string
  '--ot-box-py'?: string
  '--ot-box-m'?: string
  '--ot-box-mt'?: string
  '--ot-box-mr'?: string
  '--ot-box-mb'?: string
  '--ot-box-ml'?: string
  '--ot-box-mx'?: string
  '--ot-box-my'?: string
  '--ot-box-width'?: string
  '--ot-box-height'?: string
  '--ot-box-radius'?: string
  '--ot-box-opacity'?: string
}
