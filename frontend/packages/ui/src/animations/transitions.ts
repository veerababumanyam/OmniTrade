/**
 * CSS Transition Utilities
 * Liquid Glass Design System - OmniTrade
 *
 * Transition utilities for enter/exit animations and state changes.
 */

// ============================================================================
// Types
// ============================================================================

import { AnimationVelocity } from '../types/variants';

/**
 * Duration variants in milliseconds
 */
export type DurationVariant = AnimationVelocity;

/**
 * Easing function types
 */
export type EasingType =
  | 'linear'
  | 'ease'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring'
  | 'springBouncy'
  | 'springGentle';

/**
 * Transition property specification
 */
export interface TransitionProperty {
  /** CSS property to animate */
  property: string;
  /** Duration variant */
  duration: DurationVariant;
  /** Easing function */
  easing: EasingType;
  /** Delay in milliseconds */
  delay?: number;
}

/**
 * Transition configuration
 */
export interface TransitionConfig {
  /** Properties to animate */
  properties: string | string[];
  /** Duration variant or explicit value */
  duration?: DurationVariant | number;
  /** Easing function */
  easing?: EasingType | string;
  /** Delay in milliseconds */
  delay?: number;
}

/**
 * Enter/Exit transition configuration
 */
export interface EnterExitConfig {
  /** Enter transition */
  enter: TransitionConfig;
  /** Exit transition */
  exit: TransitionConfig;
  /** Initial state for enter */
  initial?: Partial<CSSStyleDeclaration>;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
}

// ============================================================================
// Duration Presets
// ============================================================================

/**
 * Duration values in milliseconds
 */
export const durations: Record<DurationVariant, number> = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/**
 * Get duration value in CSS format
 */
export function getDurationValue(variant: DurationVariant | number): string {
  if (typeof variant === 'number') {
    return `${variant}ms`;
  }
  return `${durations[variant]}ms`;
}

// ============================================================================
// Easing Functions
// ============================================================================

/**
 * Pre-defined easing functions
 */
export const easings: Record<EasingType, string> = {
  linear: 'linear',
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  springBouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  springGentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
} as const;

/**
 * Create a custom cubic-bezier easing function
 */
export function customEasing(x1: number, y1: number, x2: number, y2: number): string {
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
}

/**
 * Get easing value by type or return custom value
 */
export function getEasingValue(easing: EasingType | string): string {
  if (easing in easings) {
    return easings[easing as EasingType];
  }
  return easing;
}

// ============================================================================
// Transition Builders
// ============================================================================

/**
 * Build a CSS transition string from configuration
 */
export function buildTransition(config: TransitionConfig): string {
  const {
    properties,
    duration = 'normal',
    easing = 'easeOut',
    delay = 0,
  } = config;

  const propertiesArray = Array.isArray(properties) ? properties : [properties];
  const durationValue = getDurationValue(duration);
  const easingValue = getEasingValue(easing);
  const delayValue = delay > 0 ? ` ${delay}ms` : '';

  return propertiesArray
    .map(prop => `${prop} ${durationValue} ${easingValue}${delayValue}`)
    .join(', ');
}

/**
 * Build multiple transitions from an array of configurations
 */
export function buildTransitions(configs: TransitionConfig[]): string {
  return configs.map(buildTransition).join(', ');
}

/**
 * Common transition presets
 */
export const transitions = {
  /** All properties transition */
  all: (duration: DurationVariant = 'normal', easing: EasingType = 'easeOut'): string =>
    buildTransition({ properties: 'all', duration, easing }),

  /** Opacity transition */
  opacity: (duration: DurationVariant = 'fast', easing: EasingType = 'easeOut'): string =>
    buildTransition({ properties: 'opacity', duration, easing }),

  /** Transform transition */
  transform: (duration: DurationVariant = 'normal', easing: EasingType = 'easeOut'): string =>
    buildTransition({ properties: 'transform', duration, easing }),

  /** Color transition */
  color: (duration: DurationVariant = 'fast', easing: EasingType = 'easeOut'): string =>
    buildTransition({ properties: ['color', 'background-color', 'border-color'], duration, easing }),

  /** Box shadow transition */
  shadow: (duration: DurationVariant = 'normal', easing: EasingType = 'easeOut'): string =>
    buildTransition({ properties: 'box-shadow', duration, easing }),

  /** Combined opacity and transform */
  opacityTransform: (duration: DurationVariant = 'normal', easing: EasingType = 'easeOut'): string =>
    buildTransition({ properties: ['opacity', 'transform'], duration, easing }),

  /** Combined all common properties */
  common: (duration: DurationVariant = 'normal', easing: EasingType = 'easeOut'): string =>
    buildTransition({
      properties: ['opacity', 'transform', 'color', 'background-color', 'border-color', 'box-shadow'],
      duration,
      easing,
    }),
} as const;

// ============================================================================
// Enter/Exit Transitions
// ============================================================================

/**
 * Enter transition presets
 */
export const enterTransitions = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    transition: transitions.opacity('normal'),
  },

  slideInUp: {
    from: { opacity: 0, transform: 'translateY(1rem)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    transition: transitions.opacityTransform('normal'),
  },

  slideInDown: {
    from: { opacity: 0, transform: 'translateY(-1rem)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    transition: transitions.opacityTransform('normal'),
  },

  slideInLeft: {
    from: { opacity: 0, transform: 'translateX(-1rem)' },
    to: { opacity: 1, transform: 'translateX(0)' },
    transition: transitions.opacityTransform('normal'),
  },

  slideInRight: {
    from: { opacity: 0, transform: 'translateX(1rem)' },
    to: { opacity: 1, transform: 'translateX(0)' },
    transition: transitions.opacityTransform('normal'),
  },

  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    transition: transitions.opacityTransform('normal', 'spring'),
  },

  scaleInBounce: {
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    transition: transitions.opacityTransform('normal', 'springBouncy'),
  },
} as const;

/**
 * Exit transition presets
 */
export const exitTransitions = {
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    transition: transitions.opacity('fast'),
  },

  slideOutUp: {
    from: { opacity: 1, transform: 'translateY(0)' },
    to: { opacity: 0, transform: 'translateY(-1rem)' },
    transition: transitions.opacityTransform('fast'),
  },

  slideOutDown: {
    from: { opacity: 1, transform: 'translateY(0)' },
    to: { opacity: 0, transform: 'translateY(1rem)' },
    transition: transitions.opacityTransform('fast'),
  },

  slideOutLeft: {
    from: { opacity: 1, transform: 'translateX(0)' },
    to: { opacity: 0, transform: 'translateX(-1rem)' },
    transition: transitions.opacityTransform('fast'),
  },

  slideOutRight: {
    from: { opacity: 1, transform: 'translateX(0)' },
    to: { opacity: 0, transform: 'translateX(1rem)' },
    transition: transitions.opacityTransform('fast'),
  },

  scaleOut: {
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.95)' },
    transition: transitions.opacityTransform('fast'),
  },

  scaleOutShrink: {
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.9)' },
    transition: transitions.opacityTransform('fast'),
  },
} as const;

// ============================================================================
// Reduced Motion Support
// ============================================================================

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get transition respecting reduced motion preference
 * Returns 'none' if reduced motion is preferred
 */
export function getAccessibleTransition(
  config: TransitionConfig
): string {
  if (prefersReducedMotion()) {
    return 'none';
  }
  return buildTransition(config);
}

/**
 * Get duration respecting reduced motion preference
 * Returns instant duration if reduced motion is preferred
 */
export function getAccessibleDuration(
  duration: DurationVariant | number
): string {
  if (prefersReducedMotion()) {
    return '0ms';
  }
  return getDurationValue(duration);
}

/**
 * CSS media query for reduced motion
 */
export const reducedMotionMediaQuery = '@media (prefers-reduced-motion: reduce)';

/**
 * CSS for disabling animations with reduced motion
 */
export const reducedMotionStyles = {
  [reducedMotionMediaQuery]: {
    transition: 'none !important',
    animation: 'none !important',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a staggered delay for list animations
 */
export function staggerDelay(index: number, baseDelay: number = 50): number {
  return index * baseDelay;
}

/**
 * Create staggered transition delays for multiple items
 */
export function createStaggeredDelays(
  count: number,
  baseDelay: number = 50
): number[] {
  return Array.from({ length: count }, (_, i) => staggerDelay(i, baseDelay));
}

/**
 * Merge transition configurations
 */
export function mergeTransitions(
  ...configs: TransitionConfig[]
): TransitionConfig {
  const allProperties: string[] = [];
  let maxDuration: DurationVariant | number = 'normal';
  let mergedEasing: EasingType | string = 'easeOut';
  let totalDelay = 0;

  for (const config of configs) {
    const props = Array.isArray(config.properties)
      ? config.properties
      : [config.properties];
    allProperties.push(...props);

    if (config.delay) {
      totalDelay = Math.max(totalDelay, config.delay);
    }

    if (typeof config.duration === 'number') {
      maxDuration = Math.max(
        typeof maxDuration === 'number' ? maxDuration : 0,
        config.duration
      );
    }
  }

  return {
    properties: [...new Set(allProperties)],
    duration: maxDuration,
    easing: mergedEasing,
    delay: totalDelay,
  };
}

/**
 * Create a transition that only applies on hover
 */
export function hoverTransition(config: TransitionConfig): {
  transition: string;
  '&:hover': Record<string, string>;
} {
  return {
    transition: buildTransition(config),
    '&:hover': {},
  };
}
