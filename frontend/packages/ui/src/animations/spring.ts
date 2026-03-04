/**
 * Spring Physics Presets and Utilities
 * Liquid Glass Design System - OmniTrade
 *
 * Spring animation configuration for physics-based animations.
 * Compatible with react-spring, framer-motion, and other animation libraries.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Spring physics configuration
 */
export interface SpringConfig {
  /** Mass of the spring (affects momentum) */
  mass: number;
  /** Spring tension (stiffness) */
  tension: number;
  /** Spring friction (damping) */
  friction: number;
  /** Velocity at start of animation */
  velocity?: number;
  /** Clamp values at animation boundaries */
  clamp?: boolean;
  /** Precision for settling detection */
  precision?: number;
}

/**
 * Spring preset names
 */
export type SpringPreset = 'gentle' | 'bouncy' | 'snappy' | 'smooth';

/**
 * Spring animation state
 */
export interface SpringState {
  /** Current value */
  value: number;
  /** Current velocity */
  velocity: number;
  /** Whether animation has settled */
  isAnimating: boolean;
}

/**
 * Spring solver options
 */
export interface SpringSolverOptions {
  /** Target value to animate to */
  to: number;
  /** Starting value */
  from?: number;
  /** Initial velocity */
  velocity?: number;
  /** Spring configuration */
  config: SpringConfig;
}

// ============================================================================
// Spring Presets
// ============================================================================

/**
 * Pre-configured spring physics presets for common use cases
 *
 * - gentle: Soft, subtle motion for hover states and micro-interactions
 * - bouncy: Playful, energetic motion for notifications and alerts
 * - snappy: Quick, responsive motion for UI feedback
 * - smooth: Fluid, natural motion for transitions
 */
export const springPresets: Record<SpringPreset, SpringConfig> = {
  /**
   * Gentle spring - soft, subtle motion
   * Best for: hover states, micro-interactions, subtle feedback
   */
  gentle: {
    mass: 1,
    tension: 170,
    friction: 26,
    velocity: 0,
    precision: 0.01,
  },

  /**
   * Bouncy spring - playful, energetic motion
   * Best for: notifications, alerts, celebratory animations
   */
  bouncy: {
    mass: 1,
    tension: 200,
    friction: 10,
    velocity: 0,
    precision: 0.01,
  },

  /**
   * Snappy spring - quick, responsive motion
   * Best for: UI feedback, state changes, toggles
   */
  snappy: {
    mass: 0.5,
    tension: 300,
    friction: 20,
    velocity: 0,
    precision: 0.01,
  },

  /**
   * Smooth spring - fluid, natural motion
   * Best for: page transitions, modals, panels
   */
  smooth: {
    mass: 1,
    tension: 120,
    friction: 14,
    velocity: 0,
    precision: 0.01,
  },
} as const;

// ============================================================================
// Spring Utilities
// ============================================================================

/**
 * Get a spring preset by name
 */
export function getSpringPreset(preset: SpringPreset): SpringConfig {
  return { ...springPresets[preset] };
}

/**
 * Create a custom spring configuration
 */
export function createSpringConfig(
  options: Partial<SpringConfig> & { preset?: SpringPreset }
): SpringConfig {
  const base = options.preset ? { ...springPresets[options.preset] } : { ...springPresets.gentle };
  return {
    ...base,
    ...options,
  };
}

/**
 * Convert spring config to CSS-compatible easing function approximation
 * Note: This is an approximation since CSS cannot do true spring physics
 */
export function springToCSSEasing(config: SpringConfig): string {
  const { tension, friction } = config;

  // Calculate approximate cubic-bezier values based on spring physics
  // Higher tension = faster initial movement
  // Higher friction = less overshoot
  const overshoot = Math.max(0, 1 - friction / 30);
  const speed = Math.min(1, tension / 300);

  // Calculate bezier control points
  const x1 = 0.25 + speed * 0.25;
  const y1 = overshoot * 1.5;
  const x2 = 0.5 + speed * 0.25;
  const y2 = 1 - overshoot * 0.5;

  return `cubic-bezier(${x1.toFixed(3)}, ${y1.toFixed(3)}, ${x2.toFixed(3)}, ${y2.toFixed(3)})`;
}

/**
 * Estimate spring animation duration in milliseconds
 * Based on settling time calculation
 */
export function estimateSpringDuration(config: SpringConfig): number {
  const { tension, friction, mass } = config;

  // Damped harmonic oscillator settling time approximation
  // T_settle ≈ (4 * mass * damping) / spring_constant
  const dampingRatio = friction / (2 * Math.sqrt(tension * mass));
  const naturalFrequency = Math.sqrt(tension / mass);

  // For underdamped systems
  if (dampingRatio < 1) {
    // dampedFrequency used for reference but not needed for duration calculation
    return Math.round((4 / (dampingRatio * naturalFrequency)) * 1000);
  }

  // For critically damped and overdamped systems
  return Math.round((4 * mass / friction) * 1000);
}

/**
 * Convert spring config to framer-motion format
 */
export function toFramerMotion(config: SpringConfig): { type: 'spring'; stiffness: number; damping: number; mass: number } {
  return {
    type: 'spring',
    stiffness: config.tension,
    damping: config.friction,
    mass: config.mass,
  };
}

/**
 * Convert spring config to react-spring format
 */
export function toReactSpring(config: SpringConfig): { tension: number; friction: number; mass: number; clamp?: boolean } {
  return {
    tension: config.tension,
    friction: config.friction,
    mass: config.mass,
    ...(config.clamp !== undefined && { clamp: config.clamp }),
  };
}

/**
 * Simple spring physics solver for one step
 * Returns new value and velocity after delta time
 */
export function solveSpringStep(
  currentValue: number,
  targetValue: number,
  velocity: number,
  config: SpringConfig,
  deltaTime: number
): { value: number; velocity: number; isSettled: boolean } {
  const { tension, friction, mass, precision = 0.01 } = config;

  // Spring force: F = -k * x (where k is tension, x is displacement)
  const displacement = currentValue - targetValue;
  const springForce = -tension * displacement;

  // Damping force: F = -c * v (where c is friction, v is velocity)
  const dampingForce = -friction * velocity;

  // Total force
  const force = springForce + dampingForce;

  // Acceleration: a = F / m
  const acceleration = force / mass;

  // Update velocity: v = v + a * dt
  const newVelocity = velocity + acceleration * deltaTime;

  // Update position: x = x + v * dt
  const newValue = currentValue + newVelocity * deltaTime;

  // Check if settled
  const isSettled =
    Math.abs(newValue - targetValue) < precision &&
    Math.abs(newVelocity) < precision;

  return {
    value: newValue,
    velocity: newVelocity,
    isSettled,
  };
}

/**
 * Generate spring animation keyframes
 * Useful for CSS animations that approximate spring physics
 */
export function generateSpringKeyframes(
  from: number,
  to: number,
  config: SpringConfig,
  steps: number = 60
): number[] {
  const keyframes: number[] = [from];
  let currentValue = from;
  let velocity = config.velocity || 0;
  const deltaTime = 1 / 60; // Assuming 60fps

  for (let i = 1; i < steps; i++) {
    const result = solveSpringStep(currentValue, to, velocity, config, deltaTime);
    keyframes.push(result.value);
    currentValue = result.value;
    velocity = result.velocity;

    if (result.isSettled) {
      // Fill remaining keyframes with target value
      for (let j = i + 1; j < steps; j++) {
        keyframes.push(to);
      }
      break;
    }
  }

  return keyframes;
}

// ============================================================================
// Re-export for Convenience
// ============================================================================

export { springPresets as springs };
