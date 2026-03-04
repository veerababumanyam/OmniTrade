/**
 * Grid Component
 * Liquid Glass Design System - OmniTrade
 *
 * A CSS Grid wrapper for creating responsive grid layouts.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { GridProps, GridItemProps, GridGap, GridAlignment, GridJustification } from './types';
import styles from './styles.module.css';

const gapMap: Record<GridGap, string> = {
  none: styles.gapNone,
  xs: styles.gapXs,
  sm: styles.gapSm,
  md: styles.gapMd,
  lg: styles.gapLg,
  xl: styles.gapXl,
  '2xl': styles.gap2xl,
};

const alignMap: Record<GridAlignment, string> = {
  start: styles.alignStart,
  end: styles.alignEnd,
  center: styles.alignCenter,
  stretch: styles.alignStretch,
};

const justifyMap: Record<GridJustification, string> = {
  start: styles.justifyStart,
  end: styles.justifyEnd,
  center: styles.justifyCenter,
  between: styles.justifyBetween,
  around: styles.justifyAround,
  evenly: styles.justifyEvenly,
};

const autoFlowMap = {
  row: styles.autoFlowRow,
  column: styles.autoFlowColumn,
  dense: styles.autoFlowDense,
  'row dense': styles.autoFlowRowDense,
  'column dense': styles.autoFlowColumnDense,
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
 * Generates grid-template-columns from column count
 */
const getColumnsTemplate = (columns: number | string | GridProps['columns']): string => {
  if (typeof columns === 'string') {
    return columns;
  }
  if (typeof columns === 'number') {
    return `repeat(${columns}, 1fr)`;
  }
  // Responsive object - handled via CSS
  return '';
};

/**
 * Grid provides a CSS Grid-based layout system.
 *
 * @example
 * // Basic 3-column grid
 * <Grid columns={3} gap="md">
 *   <div>1</div>
 *   <div>2</div>
 *   <div>3</div>
 * </Grid>
 *
 * @example
 * // Responsive grid with custom template
 * <Grid
 *   templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
 *   gap="lg"
 * >
 *   {items.map(item => <Card key={item.id} {...item} />)}
 * </Grid>
 *
 * @example
 * // Grid with named areas
 * <Grid
 *   areas={[
 *     'header header header',
 *     'sidebar main main',
 *     'footer footer footer'
 *   ]}
 *   gap="sm"
 * >
 *   <GridItem area="header">Header</GridItem>
 *   <GridItem area="sidebar">Sidebar</GridItem>
 *   <GridItem area="main">Main</GridItem>
 *   <GridItem area="footer">Footer</GridItem>
 * </Grid>
 */
export const Grid: React.FC<GridProps> & { Item: React.FC<GridItemProps> } = ({
  columns,
  rows,
  gap = 'none',
  gapX,
  gapY,
  gapValue,
  areas,
  templateColumns,
  templateRows,
  autoColumns,
  autoRows,
  autoFlow,
  align = 'stretch',
  justify = 'start',
  alignContent,
  as: Component = 'div',
  inline = false,
  width,
  height,
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
  // Determine if we need responsive handling
  const isResponsive = typeof columns === 'object' && columns !== null;

  // Build inline styles
  const inlineStyles: React.CSSProperties & { '--ot-grid-columns'?: string; '--ot-grid-rows'?: string; '--ot-grid-gap'?: string } = {
    '--ot-grid-columns': templateColumns ?? getColumnsTemplate(columns),
    '--ot-grid-rows': templateRows ?? (typeof rows === 'number' ? `repeat(${rows}, auto)` : rows),
    '--ot-grid-gap': gapValue
      ? typeof gapValue === 'number'
        ? `${gapValue}px`
        : gapValue
      : undefined,
    gridTemplateAreas: areas?.map((area) => `"${area}"`).join(' '),
    gridAutoColumns: autoColumns,
    gridAutoRows: autoRows,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    padding: toSpacingValue(p),
    paddingLeft: toSpacingValue(px ?? p),
    paddingRight: toSpacingValue(px ?? p),
    paddingTop: toSpacingValue(py ?? p),
    paddingBottom: toSpacingValue(py ?? p),
    ...style,
  };

  // Handle align content
  let alignContentClass: string | null = null;
  if (alignContent === 'start') alignContentClass = styles.alignContentStart;
  else if (alignContent === 'end') alignContentClass = styles.alignContentEnd;
  else if (alignContent === 'center') alignContentClass = styles.alignContentCenter;
  else if (alignContent === 'between') alignContentClass = styles.alignContentBetween;
  else if (alignContent === 'around') alignContentClass = styles.alignContentAround;
  else if (alignContent === 'evenly') alignContentClass = styles.alignContentEvenly;

  // Filter out undefined values
  const filteredStyles = Object.fromEntries(
    Object.entries(inlineStyles).filter(([, v]) => v !== undefined)
  );

  return (
    <Component
      className={clsx(
        styles.grid,
        inline && styles.gridInline,
        isResponsive && styles.responsive,
        gapMap[gap],
        gapX && gapMap[gapX],
        gapY && gapMap[gapY],
        alignMap[align],
        justifyMap[justify],
        alignContentClass,
        autoFlow && autoFlowMap[autoFlow as keyof typeof autoFlowMap],
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

/**
 * GridItem for positioning items within a Grid.
 *
 * @example
 * // Span 2 columns
 * <Grid.Item colSpan={2}>Wide content</Grid.Item>
 *
 * @example
 * // Named area
 * <Grid.Item area="header">Header content</Grid.Item>
 */
const GridItem: React.FC<GridItemProps> = ({
  colStart,
  colEnd,
  colSpan,
  rowStart,
  rowEnd,
  rowSpan,
  area,
  as: Component = 'div',
  style,
  className,
  children,
  testId,
}) => {
  const inlineStyles: React.CSSProperties = {
    gridColumnStart: colStart,
    gridColumnEnd: colEnd ?? (colSpan ? `span ${colSpan}` : undefined),
    gridRowStart: rowStart,
    gridRowEnd: rowEnd ?? (rowSpan ? `span ${rowSpan}` : undefined),
    gridArea: area,
    ...style,
  };

  // Filter out undefined values
  const filteredStyles = Object.fromEntries(
    Object.entries(inlineStyles).filter(([, v]) => v !== undefined)
  );

  return (
    <Component
      className={clsx(styles.gridItem, className)}
      style={filteredStyles}
      data-testid={testId}
    >
      {children}
    </Component>
  );
};

GridItem.displayName = 'Grid.Item';
Grid.Item = GridItem;
Grid.displayName = 'Grid';

export default Grid;
