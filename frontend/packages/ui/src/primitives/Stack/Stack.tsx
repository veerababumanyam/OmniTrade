/**
 * Stack Component
 * Liquid Glass Design System - OmniTrade
 *
 * A flexbox-based stack for arranging children with consistent gaps.
 * Supports both vertical and horizontal layouts.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { StackProps, StackDirection, StackAlign, StackJustify, StackGap } from './types';
import styles from './styles.module.css';

const directionMap: Record<StackDirection, string> = {
  row: styles.directionRow,
  column: styles.directionColumn,
  'row-reverse': styles.directionRowReverse,
  'column-reverse': styles.directionColumnReverse,
};

const gapMap: Record<StackGap, string> = {
  none: styles.gapNone,
  xs: styles.gapXs,
  sm: styles.gapSm,
  md: styles.gapMd,
  lg: styles.gapLg,
  xl: styles.gapXl,
  '2xl': styles.gap2xl,
};

const alignMap: Record<StackAlign, string> = {
  start: styles.alignStart,
  end: styles.alignEnd,
  center: styles.alignCenter,
  baseline: styles.alignBaseline,
  stretch: styles.alignStretch,
};

const justifyMap: Record<StackJustify, string> = {
  start: styles.justifyStart,
  end: styles.justifyEnd,
  center: styles.justifyCenter,
  between: styles.justifyBetween,
  around: styles.justifyAround,
  evenly: styles.justifyEvenly,
};

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

const radiusMap = {
  none: styles.radiusNone,
  sm: styles.radiusSm,
  md: styles.radiusMd,
  lg: styles.radiusLg,
  xl: styles.radiusXl,
  '2xl': styles.radius2xl,
  full: styles.radiusFull,
} as const;

/**
 * Converts a spacing value to a CSS value
 */
const toSpacingValue = (value: number | string | undefined): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') {
    return `calc(var(--ot-space-1) * ${value})`;
  }
  return value;
};

/**
 * Stack arranges children in a column or row with consistent gaps.
 *
 * @example
 * // Vertical stack with medium gap
 * <Stack direction="column" gap="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Stack>
 *
 * @example
 * // Horizontal stack with center alignment
 * <Stack direction="row" gap="lg" align="center" justify="between">
 *   <Logo />
 *   <Navigation />
 *   <UserMenu />
 * </Stack>
 *
 * @example
 * // Stack with dividers between items
 * <Stack direction="column" gap="sm" divider={<Divider />}>
 *   <MenuItem>Home</MenuItem>
 *   <MenuItem>About</MenuItem>
 *   <MenuItem>Contact</MenuItem>
 * </Stack>
 */
export const Stack: React.FC<StackProps> = ({
  direction = 'column',
  gap = 'none',
  gapValue,
  align = 'stretch',
  justify = 'start',
  wrap,
  as: Component = 'div',
  inline = false,
  width,
  height,
  grow,
  shrink,
  basis,
  divider,
  background = 'none',
  border = 'none',
  radius = 'none',
  p,
  px,
  py,
  style,
  className,
  children,
  testId,
  ariaLabel,
  role,
}) => {
  // Handle wrap prop
  let wrapClass: string | null = null;
  if (wrap === true || wrap === 'wrap') {
    wrapClass = styles.wrap;
  } else if (wrap === 'wrap-reverse') {
    wrapClass = styles.wrapReverse;
  } else if (wrap === 'nowrap') {
    wrapClass = styles.nowrap;
  }

  // Handle grow/shrink
  let flexGrow: number | undefined;
  let flexShrink: number | undefined;

  if (grow === true) {
    flexGrow = 1;
  } else if (typeof grow === 'number') {
    flexGrow = grow;
  }

  if (shrink === true) {
    flexShrink = 1;
  } else if (typeof shrink === 'number') {
    flexShrink = shrink;
  }

  // Build styles
  const inlineStyles: React.CSSProperties & { '--ot-stack-gap'?: string } = {
    '--ot-stack-gap': gapValue
      ? typeof gapValue === 'number'
        ? `${gapValue}px`
        : gapValue
      : undefined,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    flexGrow,
    flexShrink,
    flexBasis: typeof basis === 'number' ? `${basis}px` : basis,
    padding: toSpacingValue(p),
    paddingLeft: toSpacingValue(px ?? p),
    paddingRight: toSpacingValue(px ?? p),
    paddingTop: toSpacingValue(py ?? p),
    paddingBottom: toSpacingValue(py ?? p),
    ...style,
  };

  // Filter out undefined values
  const filteredStyles = Object.fromEntries(
    Object.entries(inlineStyles).filter(([, v]) => v !== undefined)
  );

  // Render children with optional dividers
  const renderChildren = () => {
    if (!divider) {
      return children;
    }

    const childArray = React.Children.toArray(children).filter(Boolean);
    return childArray.map((child, index) => (
      <React.Fragment key={index}>
        {child}
        {index < childArray.length - 1 && (
          <div className={styles.divider} aria-hidden="true">
            {divider}
          </div>
        )}
      </React.Fragment>
    ));
  };

  return (
    <Component
      className={clsx(
        styles.stack,
        inline && styles.stackInline,
        directionMap[direction],
        gapMap[gap],
        alignMap[align],
        justifyMap[justify],
        wrapClass,
        grow && styles.grow,
        shrink && styles.shrink,
        backgroundMap[background],
        borderMap[border],
        radiusMap[radius],
        className
      )}
      style={filteredStyles}
      data-testid={testId}
      aria-label={ariaLabel}
      role={role}
    >
      {renderChildren()}
    </Component>
  );
};

Stack.displayName = 'Stack';

export default Stack;
