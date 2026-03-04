/**
 * Variant Types and Utilities
 * Liquid Glass Design System - OmniTrade
 *
 * Type-safe utilities for component variants and sizes.
 */

// ============================================================================
// Base Variant Types
// ============================================================================

/**
 * Standard size variants across all components
 */
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Common spacing values
 */
export type SpacingVariant = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

/**
 * Color variant types
 */
export type ColorVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

/**
 * Border radius variants
 */
export type RadiusVariant = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

/**
 * Shadow depth variants (following Z-axis spatial logic)
 */
export type ShadowVariant = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Visual density variants (for interaction velocity adaptation)
 */
export type DensityVariant = 'compact' | 'default' | 'spacious';

/**
 * Animation velocity variants
 */
export type AnimationVelocity = 'instant' | 'fast' | 'normal' | 'slow';

// ============================================================================
// Variant Props Extractors
// ============================================================================

/**
 * Extract variant values from a variant object
 */
export type VariantValues<T extends Record<string, unknown>> = T[keyof T];

/**
 * Create a props type with optional variants
 */
export type WithVariants<T extends Record<string, unknown>> = Partial<{
  [K in keyof T]: T[K];
}>;

/**
 * Create polymorphic component props
 */
export type PolymorphicComponentProps<
  T extends React.ElementType,
  Props = {}
> = React.PropsWithChildren<Props> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof Props> & {
    as?: T;
  };

// ============================================================================
// Variant Mappings
// ============================================================================

/**
 * Size to pixel mappings for consistent scaling
 */
export const SIZE_TO_PIXELS: Record<SizeVariant, number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  '2xl': 64,
} as const;

/**
 * Spacing scale (8px base unit)
 */
export const SPACING_SCALE: Record<SpacingVariant, string> = {
  none: '0',
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
} as const;

/**
 * Border radius scale
 */
export const RADIUS_SCALE: Record<RadiusVariant, string> = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

/**
 * Shadow depth scale (Z-axis spatial logic)
 */
export const SHADOW_SCALE: Record<ShadowVariant, { css: string; zDepth: number }> = {
  none: { css: 'none', zDepth: 0 },
  sm: { css: '0 1px 2px rgba(0,0,0,0.05)', zDepth: 2 },
  md: { css: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)', zDepth: 4 },
  lg: { css: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)', zDepth: 8 },
  xl: { css: '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)', zDepth: 12 },
  '2xl': { css: '0 25px 50px rgba(0,0,0,0.15), 0 12px 24px rgba(0,0,0,0.1)', zDepth: 16 },
} as const;

/**
 * Font size scale with line height ratios
 */
export const FONT_SCALE: Record<SizeVariant, { size: string; lineHeight: string }> = {
  xs: { size: '12px', lineHeight: '1.5' },
  sm: { size: '14px', lineHeight: '1.5' },
  md: { size: '16px', lineHeight: '1.5' },
  lg: { size: '18px', lineHeight: '1.4' },
  xl: { size: '20px', lineHeight: '1.4' },
  '2xl': { size: '24px', lineHeight: '1.3' },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a variant object with type safety
 */
export function createVariant<T extends Record<string, string>>(
  variants: T
): Readonly<T> {
  return Object.freeze(variants);
}

/**
 * Get CSS class for a variant
 */
export function getVariantClass<T extends string>(
  variant: T | undefined,
  prefix: string,
  defaultValue: T
): string {
  const value = variant ?? defaultValue;
  return `${prefix}--${value}`;
}

/**
 * Get responsive size class
 */
export function getSizeClass(size: SizeVariant | undefined, prefix: string): string {
  return getVariantClass(size || 'md', prefix, 'md');
}

/**
 * Calculate spacing in rems (base: 1rem = 16px)
 */
export function toRem(pixels: number): string {
  return `${pixels / 16}rem`;
}

/**
 * Create a responsive spacing value
 */
export function responsiveSpacing(
  mobile: SpacingVariant,
  tablet?: SpacingVariant,
  desktop?: SpacingVariant
): string {
  const mobileValue = SPACING_SCALE[mobile];
  if (!tablet && !desktop) return mobileValue;

  const values = [mobileValue];
  if (tablet) values.push(SPACING_SCALE[tablet]);
  if (desktop) values.push(SPACING_SCALE[desktop]);

  return values.join(' ');
}

// ============================================================================
// Component Variant Builders
// ============================================================================

/**
 * Create variant props for a component
 */
export function createVariantProps<T extends Record<string, unknown>>(config: {
  variants: T;
  default: keyof T;
}): {
  props: Partial<Record<keyof T, T[keyof T]>>;
  classes: (variant?: keyof T) => string;
} {
  const { variants, default: defaultVariant } = config;

  return {
    props: {},
    classes: (variant?: keyof T) => {
      const key = (variant || defaultVariant) as keyof T;
      return String(variants[key]);
    },
  };
}

/**
 * Build className from variants
 */
export function buildVariantClassNames<T extends string>(
  prefix: string,
  variants: Partial<Record<T, string>>,
  defaultValue: T
): string {
  return Object.entries(variants)
    .filter(([_, value]) => value !== undefined)
    .map(([key, _]) => `${prefix}--${key}`)
    .join(' ') || `${prefix}--${defaultValue}`;
}

// ============================================================================
// Animation Timing Utilities
// ============================================================================

/**
 * Animation duration variants (ms)
 */
export const ANIMATION_DURATION: Record<AnimationVelocity, number> = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/**
 * Get animation duration in CSS format
 */
export function getAnimationDuration(velocity: AnimationVelocity): string {
  return `${ANIMATION_DURATION[velocity]}ms`;
}

/**
 * Spring animation presets (for react-spring or framer-motion)
 */
export const SPRING_PRESETS = {
  gentle: { mass: 1, tension: 170, friction: 26 },
  bouncy: { mass: 1, tension: 200, friction: 10 },
  snappy: { mass: 0.5, tension: 300, friction: 20 },
  smooth: { mass: 1, tension: 120, friction: 14 },
} as const;

/**
 * Cubic bezier easing functions
 */
export const EASING = {
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  custom: (x1: number, y1: number, x2: number, y2: number) =>
    `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,
} as const;
