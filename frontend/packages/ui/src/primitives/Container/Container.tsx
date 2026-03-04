/**
 * Container Component
 * Liquid Glass Design System - OmniTrade
 *
 * A max-width centered container for responsive layouts.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { ContainerProps, ContainerSize } from './types';
import styles from './styles.module.css';

const sizeMap: Record<ContainerSize, string> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  '2xl': styles.size2xl,
  full: styles.sizeFull,
  fluid: styles.sizeFluid,
};

const paddingMap = {
  none: styles.paddingNone,
  xs: styles.paddingXs,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
  xl: styles.paddingXl,
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
 * Container is a max-width centered wrapper for responsive layouts.
 *
 * @example
 * // Basic centered container
 * <Container size="lg" center>
 *   <PageContent />
 * </Container>
 *
 * @example
 * // Full-width container with padding
 * <Container size="full" padding="md">
 *   <Hero />
 * </Container>
 *
 * @example
 * // Centered vertically and horizontally with full height
 * <Container size="sm" center centerVertical fullHeight>
 *   <LoginForm />
 * </Container>
 *
 * @example
 * // Fluid container (no max-width)
 * <Container size="fluid" padding="lg">
 *   <Dashboard />
 * </Container>
 */
export const Container: React.FC<ContainerProps> = ({
  size = 'lg',
  center = true,
  centerVertical = false,
  padding = 'none',
  paddingValue,
  as: Component = 'div',
  width,
  height,
  minHeight,
  background = 'none',
  border = 'none',
  radius = 'none',
  style,
  className,
  children,
  testId,
  ariaLabel,
  role,
  fullHeight = false,
}) => {
  // Determine centering class
  let centerClass: string | null = null;
  if (center && centerVertical) {
    centerClass = styles.centerBoth;
  } else if (centerVertical) {
    centerClass = styles.centerVertical;
  } else if (center) {
    centerClass = styles.center;
  }

  // Build inline styles
  const inlineStyles: React.CSSProperties & { '--ot-container-padding'?: string } = {
    '--ot-container-padding': paddingValue
      ? typeof paddingValue === 'number'
        ? `${paddingValue}px`
        : paddingValue
      : undefined,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
    ...style,
  };

  // Filter out undefined values
  const filteredStyles = Object.fromEntries(
    Object.entries(inlineStyles).filter(([, v]) => v !== undefined)
  );

  return (
    <Component
      className={clsx(
        styles.container,
        sizeMap[size],
        paddingMap[padding],
        centerClass,
        fullHeight && styles.fullHeight,
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
      {children}
    </Component>
  );
};

Container.displayName = 'Container';

export default Container;
