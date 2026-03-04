/**
 * CSS Keyframe Animations
 * Liquid Glass Design System - OmniTrade
 *
 * Reusable keyframe animations for the UI library.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Animation direction options
 */
export type AnimationDirection = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

/**
 * Animation fill mode options
 */
export type AnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both';

/**
 * Animation iteration count
 */
export type AnimationIterationCount = number | 'infinite';

/**
 * Animation play state
 */
export type AnimationPlayState = 'running' | 'paused';

/**
 * Keyframe step definition
 */
export interface KeyframeStep {
  offset: number;
  properties: Record<string, string | number>;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Animation name */
  name: string;
  /** Duration in milliseconds */
  duration: number;
  /** Easing/timing function */
  timingFunction?: string;
  /** Delay before animation starts */
  delay?: number;
  /** Iteration count */
  iterationCount?: AnimationIterationCount;
  /** Direction */
  direction?: AnimationDirection;
  /** Fill mode */
  fillMode?: AnimationFillMode;
  /** Play state */
  playState?: AnimationPlayState;
}

/**
 * CSS keyframe definition
 */
export interface KeyframeDefinition {
  /** Animation name */
  name: string;
  /** CSS keyframe rules */
  css: string;
}

// ============================================================================
// Keyframe Animation Presets
// ============================================================================

/**
 * Fade in animation
 */
export const fadeIn: KeyframeDefinition = {
  name: 'omnitrade-fadeIn',
  css: `
    @keyframes omnitrade-fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
};

/**
 * Fade out animation
 */
export const fadeOut: KeyframeDefinition = {
  name: 'omnitrade-fadeOut',
  css: `
    @keyframes omnitrade-fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `,
};

/**
 * Slide in from top
 */
export const slideInTop: KeyframeDefinition = {
  name: 'omnitrade-slideInTop',
  css: `
    @keyframes omnitrade-slideInTop {
      from {
        opacity: 0;
        transform: translateY(-100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
};

/**
 * Slide in from bottom
 */
export const slideInBottom: KeyframeDefinition = {
  name: 'omnitrade-slideInBottom',
  css: `
    @keyframes omnitrade-slideInBottom {
      from {
        opacity: 0;
        transform: translateY(100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
};

/**
 * Slide in from left
 */
export const slideInLeft: KeyframeDefinition = {
  name: 'omnitrade-slideInLeft',
  css: `
    @keyframes omnitrade-slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
};

/**
 * Slide in from right
 */
export const slideInRight: KeyframeDefinition = {
  name: 'omnitrade-slideInRight',
  css: `
    @keyframes omnitrade-slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
};

/**
 * Slide out to top
 */
export const slideOutTop: KeyframeDefinition = {
  name: 'omnitrade-slideOutTop',
  css: `
    @keyframes omnitrade-slideOutTop {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-100%);
      }
    }
  `,
};

/**
 * Slide out to bottom
 */
export const slideOutBottom: KeyframeDefinition = {
  name: 'omnitrade-slideOutBottom',
  css: `
    @keyframes omnitrade-slideOutBottom {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(100%);
      }
    }
  `,
};

/**
 * Slide out to left
 */
export const slideOutLeft: KeyframeDefinition = {
  name: 'omnitrade-slideOutLeft',
  css: `
    @keyframes omnitrade-slideOutLeft {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-100%);
      }
    }
  `,
};

/**
 * Slide out to right
 */
export const slideOutRight: KeyframeDefinition = {
  name: 'omnitrade-slideOutRight',
  css: `
    @keyframes omnitrade-slideOutRight {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
  `,
};

/**
 * Scale in animation (grow from center)
 */
export const scaleIn: KeyframeDefinition = {
  name: 'omnitrade-scaleIn',
  css: `
    @keyframes omnitrade-scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
};

/**
 * Scale out animation (shrink to center)
 */
export const scaleOut: KeyframeDefinition = {
  name: 'omnitrade-scaleOut',
  css: `
    @keyframes omnitrade-scaleOut {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.9);
      }
    }
  `,
};

/**
 * Pulse animation (subtle scale pulse)
 */
export const pulse: KeyframeDefinition = {
  name: 'omnitrade-pulse',
  css: `
    @keyframes omnitrade-pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.05);
      }
    }
  `,
};

/**
 * Spin animation (continuous rotation)
 */
export const spin: KeyframeDefinition = {
  name: 'omnitrade-spin',
  css: `
    @keyframes omnitrade-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `,
};

/**
 * Bounce animation
 */
export const bounce: KeyframeDefinition = {
  name: 'omnitrade-bounce',
  css: `
    @keyframes omnitrade-bounce {
      0%, 100% {
        transform: translateY(0);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
      }
      50% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
      }
    }
  `,
};

/**
 * Shake animation (for errors/attention)
 */
export const shake: KeyframeDefinition = {
  name: 'omnitrade-shake',
  css: `
    @keyframes omnitrade-shake {
      0%, 100% {
        transform: translateX(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateX(-4px);
      }
      20%, 40%, 60%, 80% {
        transform: translateX(4px);
      }
    }
  `,
};

/**
 * Wiggle animation (subtle attention-grabber)
 */
export const wiggle: KeyframeDefinition = {
  name: 'omnitrade-wiggle',
  css: `
    @keyframes omnitrade-wiggle {
      0%, 100% {
        transform: rotate(0deg);
      }
      25% {
        transform: rotate(-3deg);
      }
      75% {
        transform: rotate(3deg);
      }
    }
  `,
};

/**
 * Ping animation (for notifications/presence)
 */
export const ping: KeyframeDefinition = {
  name: 'omnitrade-ping',
  css: `
    @keyframes omnitrade-ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }
  `,
};

/**
 * Skeleton loading shimmer animation
 */
export const shimmer: KeyframeDefinition = {
  name: 'omnitrade-shimmer',
  css: `
    @keyframes omnitrade-shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `,
};

// ============================================================================
// Animation Collections
// ============================================================================

/**
 * All slide in animations
 */
export const slideInAnimations = {
  top: slideInTop,
  bottom: slideInBottom,
  left: slideInLeft,
  right: slideInRight,
} as const;

/**
 * All slide out animations
 */
export const slideOutAnimations = {
  top: slideOutTop,
  bottom: slideOutBottom,
  left: slideOutLeft,
  right: slideOutRight,
} as const;

/**
 * Direction type for slide animations
 */
export type SlideDirection = keyof typeof slideInAnimations;

// ============================================================================
// Animation Utilities
// ============================================================================

/**
 * Build CSS animation shorthand from configuration
 */
export function buildAnimation(config: AnimationConfig): string {
  const {
    name,
    duration,
    timingFunction = 'ease',
    delay = 0,
    iterationCount = 1,
    direction = 'normal',
    fillMode = 'both',
    playState = 'running',
  } = config;

  return `${name} ${duration}ms ${timingFunction} ${delay}ms ${iterationCount} ${direction} ${fillMode} ${playState}`;
}

/**
 * Create animation CSS with keyframes
 */
export function createAnimatedStyle(
  keyframe: KeyframeDefinition,
  config: Omit<AnimationConfig, 'name'>
): { animation: string; keyframes: string } {
  return {
    animation: buildAnimation({ ...config, name: keyframe.name }),
    keyframes: keyframe.css,
  };
}

/**
 * All keyframe definitions as an array
 */
export const allKeyframes: KeyframeDefinition[] = [
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
];

/**
 * Get all keyframe CSS as a single string (for injection)
 */
export function getAllKeyframesCSS(): string {
  return allKeyframes.map(kf => kf.css).join('\n');
}

/**
 * Animation name constants for use in CSS-in-JS
 */
export const animationNames = {
  fadeIn: fadeIn.name,
  fadeOut: fadeOut.name,
  slideInTop: slideInTop.name,
  slideInBottom: slideInBottom.name,
  slideInLeft: slideInLeft.name,
  slideInRight: slideInRight.name,
  slideOutTop: slideOutTop.name,
  slideOutBottom: slideOutBottom.name,
  slideOutLeft: slideOutLeft.name,
  slideOutRight: slideOutRight.name,
  scaleIn: scaleIn.name,
  scaleOut: scaleOut.name,
  pulse: pulse.name,
  spin: spin.name,
  bounce: bounce.name,
  shake: shake.name,
  wiggle: wiggle.name,
  ping: ping.name,
  shimmer: shimmer.name,
} as const;

/**
 * Pre-built animation styles (ready to apply)
 */
export const animationStyles = {
  fadeIn: {
    animation: `${fadeIn.name} 250ms ease-out both`,
  },
  fadeOut: {
    animation: `${fadeOut.name} 150ms ease-in both`,
  },
  slideInTop: {
    animation: `${slideInTop.name} 300ms ease-out both`,
  },
  slideInBottom: {
    animation: `${slideInBottom.name} 300ms ease-out both`,
  },
  slideInLeft: {
    animation: `${slideInLeft.name} 300ms ease-out both`,
  },
  slideInRight: {
    animation: `${slideInRight.name} 300ms ease-out both`,
  },
  scaleIn: {
    animation: `${scaleIn.name} 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
  },
  scaleOut: {
    animation: `${scaleOut.name} 150ms ease-in both`,
  },
  pulse: {
    animation: `${pulse.name} 2s ease-in-out infinite`,
  },
  spin: {
    animation: `${spin.name} 1s linear infinite`,
  },
  bounce: {
    animation: `${bounce.name} 1s infinite`,
  },
  shimmer: {
    animation: `${shimmer.name} 2s linear infinite`,
    backgroundSize: '200% 100%',
  },
} as const;

/**
 * Create a custom keyframe animation
 */
export function createKeyframe(
  name: string,
  steps: KeyframeStep[]
): KeyframeDefinition {
  const keyframeRules = steps
    .map(step => {
      const offset =
        step.offset === 0
          ? 'from'
          : step.offset === 1
          ? 'to'
          : `${Math.round(step.offset * 100)}%`;
      const properties = Object.entries(step.properties)
        .map(([prop, value]) => `${prop}: ${value};`)
        .join('\n        ');
      return `${offset} {\n        ${properties}\n      }`;
    })
    .join('\n      ');

  return {
    name: `omnitrade-${name}`,
    css: `
      @keyframes omnitrade-${name} {
        ${keyframeRules}
      }
    `,
  };
}
