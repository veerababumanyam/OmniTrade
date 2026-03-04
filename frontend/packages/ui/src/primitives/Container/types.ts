/**
 * Container Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Max-width centered container for responsive layouts
 */

import type { JSX } from 'react'

export type ContainerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'fluid'

export interface ContainerProps {
  /** Container max-width size */
  size?: ContainerSize
  /** Center the container horizontally */
  center?: boolean
  /** Center content vertically */
  centerVertical?: boolean
  /** Horizontal padding */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Custom padding value */
  paddingValue?: string | number
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements
  /** Width */
  width?: string | number
  /** Height */
  height?: string | number
  /** Min height */
  minHeight?: string | number
  /** Background variant */
  background?: 'none' | 'glass' | 'elevated' | 'solid'
  /** Border variant */
  border?: 'none' | 'subtle' | 'default' | 'emphasis'
  /** Border radius */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
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
  /** Use full viewport height */
  fullHeight?: boolean
}

export type ContainerStyleVars = {
  '--ot-container-max-width'?: string
  '--ot-container-padding'?: string
}
