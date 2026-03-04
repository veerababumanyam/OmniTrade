/**
 * Unified Animation System
 * Liquid Glass Design System - OmniTrade
 *
 * Central export point for all animation utilities, presets, and types.
 */

// ============================================================================
// Spring Physics
// ============================================================================

export {
  // Types
  type SpringConfig,
  type SpringPreset,
  type SpringState,
  type SpringSolverOptions,

  // Presets
  springPresets,
  springs,

  // Utilities
  getSpringPreset,
  createSpringConfig,
  springToCSSEasing,
  estimateSpringDuration,
  toFramerMotion,
  toReactSpring,
  solveSpringStep,
  generateSpringKeyframes,
} from './spring';

// ============================================================================
// Transitions
// ============================================================================

export {
  // Types
  type DurationVariant,
  type EasingType,
  type TransitionProperty,
  type TransitionConfig,
  type EnterExitConfig,

  // Duration
  durations,
  getDurationValue,

  // Easing
  easings,
  customEasing,
  getEasingValue,

  // Transition Builders
  buildTransition,
  buildTransitions,
  transitions,

  // Enter/Exit
  enterTransitions,
  exitTransitions,

  // Reduced Motion
  prefersReducedMotion,
  getAccessibleTransition,
  getAccessibleDuration,
  reducedMotionMediaQuery,
  reducedMotionStyles,

  // Utilities
  staggerDelay,
  createStaggeredDelays,
  mergeTransitions,
  hoverTransition,
} from './transitions';

// ============================================================================
// Keyframes
// ============================================================================

export {
  // Types
  type AnimationDirection,
  type AnimationFillMode,
  type AnimationIterationCount,
  type AnimationPlayState,
  type KeyframeStep,
  type AnimationConfig,
  type KeyframeDefinition,

  // Individual Animations
  fadeIn,
  fadeOut,
  slideInTop,
  slideInBottom,
  slideInLeft,
  slideInRight,
  slideOutTop,
  slideOutBottom,
  slideOutLeft,
  slideOutRight,
  scaleIn,
  scaleOut,
  pulse,
  spin,
  bounce,
  shake,
  wiggle,
  ping,
  shimmer,

  // Collections
  slideInAnimations,
  slideOutAnimations,
  type SlideDirection,
  allKeyframes,
  animationNames,
  animationStyles,

  // Utilities
  buildAnimation,
  createAnimatedStyle,
  getAllKeyframesCSS,
  createKeyframe,
} from './keyframes';

// ============================================================================
// Re-export from Variants (for convenience)
// ============================================================================

export {
  type AnimationVelocity,
  ANIMATION_DURATION,
  getAnimationDuration,
  SPRING_PRESETS,
  EASING,
} from '../types/variants';
