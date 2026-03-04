/**
 * Flex Component
 * Liquid Glass Design System - OmniTrade
 *
 * A flexbox wrapper with a simplified API for common layouts.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { FlexProps, FlexDirection, FlexWrap, FlexAlign, FlexJustify, FlexGap } from './types';
import styles from './styles.module.css';

const directionMap: Record<FlexDirection, string> = {
  row: styles.directionRow,
  column: styles.directionColumn,
  'row-reverse': styles.directionRowReverse,
  'column-reverse': styles.directionColumnReverse,
};

const wrapMap: Record<FlexWrap, string> = {
  nowrap: styles.wrapNowrap,
  wrap: styles.wrapWrap,
  'wrap-reverse': styles.wrapWrapReverse,
};

const alignMap: Record<FlexAlign, string> = {
  start: styles.alignStart,
  end: styles.alignEnd,
  center: styles.alignCenter,
  baseline: styles.alignBaseline,
  stretch: styles.alignStretch,
};

const justifyMap: Record<FlexJustify, string> = {
  start: styles.justifyStart,
  end: styles.justifyEnd,
  center: styles.justifyCenter,
  between: styles.justifyBetween,
  around: styles.justifyAround,
  evenly: styles.justifyEvenly,
};

const gapMap: Record<FlexGap, string> = {
  none: styles.gapNone,
  xs: styles.gapXs,
  sm: styles.gapSm,
  md: styles.gapMd,
  lg: styles.gapLg,
  xl: styles.gapXl,
  '2xl': styles.gap2xl,
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
 * Flex is a flexbox wrapper for creating flexible layouts.
 *
 * @example
 * // Horizontal layout with gap
 * <Flex direction="row" gap="md">
 *   <Button>Cancel</Button>
 *   <Button variant="primary">Save</Button>
 * </Flex>
 *
 * @example
 * // Centered content
 * <Flex center direction="column" gap="lg">
 *   <Logo />
 *   <LoginForm />
 * </Flex>
 *
 * @example
 * // Space between items
 * <Flex justify="between" align="center">
 *   <Brand />
 *   <Navigation />
 * </Flex>
 *
 * @example
 * // Fill container
 * <Flex fill direction="column">
 *   <Header />
 *   <Main />
 *   <Footer />
 * </Flex>
 */
export const Flex: React.FC<FlexProps> = ({
  direction = 'row',
  wrap = 'nowrap',
  align = 'stretch',
  justify = 'start',
  gap = 'none',
  gapValue,
  as: Component = 'div',
  inline = false,
  grow,
  shrink,
  basis,
  flex,
  order,
  width,
  height,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  background = 'none',
  border = 'none',
  radius = 'none',
  p,
  px,
  py,
  m,
  center = false,
  fill = false,
  style,
  className,
  children,
  testId,
  ariaLabel,
  role,
  tabIndex,
}) => {
  // Handle center shorthand
  const effectiveAlign = center ? 'center' : align;
  const effectiveJustify = center ? 'center' : justify;

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
  } else if (shrink === false) {
    flexShrink = 0;
  } else if (typeof shrink === 'number') {
    flexShrink = shrink;
  }

  // Build inline styles
  const inlineStyles: React.CSSProperties & { '--ot-flex-gap'?: string } = {
    '--ot-flex-gap': gapValue
      ? typeof gapValue === 'number'
        ? `${gapValue}px`
        : gapValue
      : undefined,
    flex: flex,
    flexGrow: flex ? undefined : flexGrow,
    flexShrink: flex ? undefined : flexShrink,
    flexBasis: flex ? undefined : (typeof basis === 'number' ? `${basis}px` : basis),
    order,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
    maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
    padding: toSpacingValue(p),
    paddingLeft: toSpacingValue(px ?? p),
    paddingRight: toSpacingValue(px ?? p),
    paddingTop: toSpacingValue(py ?? p),
    paddingBottom: toSpacingValue(py ?? p),
    margin: toSpacingValue(m),
    ...style,
  };

  // Filter out undefined values
  const filteredStyles = Object.fromEntries(
    Object.entries(inlineStyles).filter(([, v]) => v !== undefined)
  );

  return (
    <Component
      className={clsx(
        styles.flex,
        inline && styles.flexInline,
        fill && styles.fill,
        directionMap[direction],
        wrapMap[wrap],
        alignMap[effectiveAlign],
        justifyMap[effectiveJustify],
        gapMap[gap],
        grow && styles.grow,
        shrink === false && styles.noShrink,
        shrink === true && styles.shrink,
        typeof shrink === 'number' && styles.shrink,
        backgroundMap[background],
        borderMap[border],
        radiusMap[radius],
        className
      )}
      style={filteredStyles}
      data-testid={testId}
      aria-label={ariaLabel}
      role={role}
      tabIndex={tabIndex}
    >
      {children}
    </Component>
  );
};

Flex.displayName = 'Flex';

export default Flex;
