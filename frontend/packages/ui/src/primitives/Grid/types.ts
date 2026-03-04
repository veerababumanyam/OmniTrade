/**
 * Grid Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * CSS Grid wrapper with responsive support
 */

import type { JSX } from 'react'

export type GridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type GridAlignment = 'start' | 'end' | 'center' | 'stretch'
export type GridJustification = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'

export interface GridProps {
  /** Number of columns (can be responsive) */
  columns?: number | string | { base?: number; sm?: number; md?: number; lg?: number; xl?: number }
  /** Number of rows */
  rows?: number | string
  /** Gap between items */
  gap?: GridGap
  /** Column gap */
  gapX?: GridGap
  /** Row gap */
  gapY?: GridGap
  /** Custom gap value */
  gapValue?: string | number
  /** Grid areas template */
  areas?: string[]
  /** Column template (CSS grid-template-columns) */
  templateColumns?: string
  /** Row template (CSS grid-template-rows) */
  templateRows?: string
  /** Auto columns */
  autoColumns?: string
  /** Auto rows */
  autoRows?: string
  /** Auto flow */
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense'
  /** Align items */
  align?: GridAlignment
  /** Justify items */
  justify?: GridJustification
  /** Align content */
  alignContent?: GridJustification
  /** Justify content */
  justifyContent?: GridJustification
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements
  /** Inline grid */
  inline?: boolean
  /** Width */
  width?: string | number
  /** Height */
  height?: string | number
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
}

export interface GridItemProps {
  /** Column start */
  colStart?: number | string
  /** Column end */
  colEnd?: number | string
  /** Column span */
  colSpan?: number | string
  /** Row start */
  rowStart?: number | string
  /** Row end */
  rowEnd?: number | string
  /** Row span */
  rowSpan?: number | string
  /** Grid area name */
  area?: string
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements
  /** Additional inline styles */
  style?: React.CSSProperties
  /** Additional CSS class names */
  className?: string
  /** Children content */
  children?: React.ReactNode
  /** Test ID for testing */
  testId?: string
}

export type GridStyleVars = {
  '--ot-grid-columns'?: string
  '--ot-grid-rows'?: string
  '--ot-grid-gap'?: string
  '--ot-grid-gap-x'?: string
  '--ot-grid-gap-y'?: string
}
