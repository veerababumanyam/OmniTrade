/**
 * Box Component
 * Liquid Glass Design System - OmniTrade
 *
 * A generic container primitive with spacing props.
 * Provides consistent spacing, backgrounds, and borders following
 * the Liquid Glass design system.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { BoxProps } from './types';
import styles from './styles.module.css';

const radiusMap = {
  none: styles.radiusNone,
  sm: styles.radiusSm,
  md: styles.radiusMd,
  lg: styles.radiusLg,
  xl: styles.radiusXl,
  '2xl': styles.radius2xl,
  full: styles.radiusFull,
} as const;

const backgroundMap = {
  none: null,
  glass: styles.backgroundGlass,
  elevated: styles.backgroundElevated,
  solid: styles.backgroundSolid,
} as const;

const borderMap = {
  none: null,
  subtle: styles.borderSubtle,
  default: styles.borderDefault,
  emphasis: styles.borderEmphasis,
} as const;

const shadowMap = {
  none: null,
  sm: styles.shadowSm,
  md: styles.shadowMd,
  lg: styles.shadowLg,
  xl: styles.shadowXl,
  '2xl': styles.shadowXl,
  glow: styles.shadowGlow,
} as const;

const overflowMap = {
  visible: styles.overflowVisible,
  hidden: styles.overflowHidden,
  scroll: styles.overflowScroll,
  auto: styles.overflowAuto,
} as const;

/**
 * Converts a spacing value to a CSS value
 * Numbers are treated as multiples of the base spacing unit (4px)
 */
const toSpacingValue = (value: number | string | undefined): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') {
    return `calc(var(--ot-space-1) * ${value})`;
  }
  return value;
};

/**
 * Box is the foundational layout primitive.
 * It provides consistent spacing, backgrounds, and visual styling.
 *
 * @example
 * // Basic box with padding
 * <Box p={4}>Content</Box>
 *
 * @example
 * // Glass card with border and shadow
 * <Box p={6} background="glass" border="default" radius="lg" shadow="md">
 *   Card content
 * </Box>
 *
 * @example
 * // Positioned box
 * <Box position="absolute" top={0} right={0} p={2}>
 *   Badge
 * </Box>
 */
export const Box: React.FC<BoxProps> = ({
  as: Component = 'div',
  p,
  pt,
  pr,
  pb,
  pl,
  px,
  py,
  m,
  mt,
  mr,
  mb,
  ml,
  mx,
  my,
  width,
  height,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  display,
  position,
  top,
  right,
  bottom,
  left,
  zIndex,
  overflow,
  overflowX,
  overflowY,
  radius = 'none',
  background = 'none',
  border = 'none',
  shadow = 'none',
  opacity,
  style,
  className,
  children,
  testId,
  ariaLabel,
  ariaDescribedBy,
  role,
}) => {
  // Handle shorthand props
  const paddingTop = pt ?? py ?? p;
  const paddingRight = pr ?? px ?? p;
  const paddingBottom = pb ?? py ?? p;
  const paddingLeft = pl ?? px ?? p;
  const marginTop = mt ?? my ?? m;
  const marginRight = mr ?? mx ?? m;
  const marginBottom = mb ?? my ?? m;
  const marginLeft = ml ?? mx ?? m;

  // Build CSS custom properties
  const cssVars: Record<string, string | undefined> = {
    '--ot-box-p': toSpacingValue(p),
    '--ot-box-pt': toSpacingValue(paddingTop),
    '--ot-box-pr': toSpacingValue(paddingRight),
    '--ot-box-pb': toSpacingValue(paddingBottom),
    '--ot-box-pl': toSpacingValue(paddingLeft),
    '--ot-box-m': toSpacingValue(m),
    '--ot-box-mt': toSpacingValue(marginTop),
    '--ot-box-mr': toSpacingValue(marginRight),
    '--ot-box-mb': toSpacingValue(marginBottom),
    '--ot-box-ml': toSpacingValue(marginLeft),
    '--ot-box-width': typeof width === 'number' ? `${width}px` : width,
    '--ot-box-height': typeof height === 'number' ? `${height}px` : height,
    '--ot-box-opacity': opacity?.toString(),
  };

  // Filter out undefined values
  const filteredVars = Object.fromEntries(
    Object.entries(cssVars).filter(([, v]) => v !== undefined)
  );

  const inlineStyles: React.CSSProperties = {
    ...filteredVars,
    minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
    maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
    display,
    position,
    top: typeof top === 'number' ? `${top}px` : top,
    right: typeof right === 'number' ? `${right}px` : right,
    bottom: typeof bottom === 'number' ? `${bottom}px` : bottom,
    left: typeof left === 'number' ? `${left}px` : left,
    zIndex,
    overflowX: overflowX,
    overflowY: overflowY,
    ...style,
  };

  // Override overflow if specified
  if (overflow) {
    inlineStyles.overflow = overflow;
  }

  return (
    <Component
      className={clsx(
        styles.box,
        radiusMap[radius],
        backgroundMap[background],
        borderMap[border],
        shadowMap[shadow],
        overflow ? overflowMap[overflow] : null,
        className
      )}
      style={inlineStyles}
      data-testid={testId}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      role={role}
    >
      {children}
    </Component>
  );
};

Box.displayName = 'Box';

export default Box;
