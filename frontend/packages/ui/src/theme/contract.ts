/**
 * Theme Contract
 * Liquid Glass Design System - OmniTrade
 *
 * Type-safe theme definitions with CSS variable mappings.
 * All design tokens are defined here for consistency.
 */

// ============================================================================
// Color Palette - Photon Physics Theme
// ============================================================================

/**
 * Named color scales (following the Photon/Neural/Quantum/Flux/Entropy naming)
 */
export const ColorScale = {
  // Photon - Electric Blues (primary actions, interactive elements)
  photon: {
    50: '#f0f7ff',
    100: '#e0efff',
    200: '#b9ddff',
    300: '#7cc4ff',
    400: '#36a7ff',
    500: '#0084ff', // Primary brand color
    600: '#0066cc',
    700: '#004d99',
    800: '#003366',
    900: '#001a33',
  },

  // Neural - Intelligent Purples (AI features, suggestions)
  neural: {
    50: '#f5f0ff',
    100: '#e9dbff',
    200: '#d4b3ff',
    300: '#b085ff',
    400: '#8c57ff',
    500: '#7900ff', // Secondary brand color
    600: '#5c00cc',
    700: '#440099',
    800: '#2d0066',
    900: '#160033',
  },

  // Quantum - Success Greens (positive states, growth)
  quantum: {
    50: '#f0fff4',
    100: '#dcfff0',
    200: '#a3ffc7',
    300: '#5affaa',
    400: '#00ff6e', // Success color
    500: '#00cc5a',
    600: '#009944',
    700: '#00662e',
    800: '#003317',
    900: '#001a0b',
  },

  // Flux - Warning Yellows/Oranges (caution states)
  flux: {
    50: '#fffce6',
    100: '#fff9c2',
    200: '#fff38a',
    300: '#ffec52',
    400: '#ffe519',
    500: '#ffcc00', // Warning color
    600: '#cca300',
    700: '#997700',
    800: '#664d00',
    900: '#332600',
  },

  // Entropy - Error Reds (negative states, errors)
  entropy: {
    50: '#fff0f0',
    100: '#ffd6d6',
    200: '#ffa8a8',
    300: '#ff7b7b',
    400: '#ff4d4d',
    500: '#ff1a1a', // Error color
    600: '#cc0000',
    700: '#990000',
    800: '#660000',
    900: '#330000',
  },

  // Mono - Neutral Grays (text, borders, backgrounds)
  mono: {
    50: '#fafafa',  // Background - lightest
    100: '#f5f5f5', // Subtle background
    200: '#e5e5e5', // Borders
    300: '#d4d4d4', // Disabled borders
    400: '#a8a9b4', // Placeholder text
    500: '#71717a', // Secondary text
    600: '#52525b', // Tertiary text
    700: '#3f3f46', // Primary text (dark mode: light)
    800: '#27272a', // Primary text
    900: '#18181b', // Background - darkest
  },
} as const;

// ============================================================================
// Semantic Color Mapping
// ============================================================================

export const semanticColors = {
  // Backgrounds
  background: {
    default: 'var(--ot-color-mono-50, #fafafa)',
    elevated: 'var(--ot-color-mono-0, #ffffff)',
    overlay: 'var(--ot-color-mono-900-80, rgba(24, 24, 27, 0.8))',
    glass: 'var(--ot-color-glass, rgba(255, 255, 255, 0.7))',
  },

  // Text
  text: {
    primary: 'var(--ot-color-mono-800, #27272a)',
    secondary: 'var(--ot-color-mono-600, #52525b)',
    tertiary: 'var(--ot-color-mono-400, #a8a9b4)',
    inverse: 'var(--ot-color-mono-50, #fafafa)',
    link: 'var(--ot-color-photon-500, #0084ff)',
    success: 'var(--ot-color-quantum-600, #009944)',
    warning: 'var(--ot-color-flux-600, #cca300)',
    error: 'var(--ot-color-entropy-500, #ff1a1a)',
  },

  // Borders
  border: {
    default: 'var(--ot-color-mono-200, #e5e5e5)',
    subtle: 'var(--ot-color-mono-100, #f5f5f5)',
    strong: 'var(--ot-color-mono-300, #d4d4d4)',
    focus: 'var(--ot-color-photon-400, #36a7ff)',
    error: 'var(--ot-color-entropy-400, #ff4d4d)',
    success: 'var(--ot-color-quantum-400, #5affaa)',
  },

  // Interactive
  interactive: {
    primary: 'var(--ot-color-photon-500, #0084ff)',
    primaryHover: 'var(--ot-color-photon-400, #36a7ff)',
    primaryActive: 'var(--ot-color-photon-600, #0066cc)',
    secondary: 'var(--ot-color-neural-500, #7900ff)',
    secondaryHover: 'var(--ot-color-neural-400, #8c57ff)',
    secondaryActive: 'var(--ot-color-neural-600, #5c00cc)',
    danger: 'var(--ot-color-entropy-500, #ff1a1a)',
    dangerHover: 'var(--ot-color-entropy-400, #ff4d4d)',
  },
} as const;

// ============================================================================
// Spacing Scale
// ============================================================================

export const spacing = {
  0: '0',
  0.5: '2px',
  1: '4px',    // Base unit = 4px
  1.5: '6px',
  2: '8px',    // 2x base
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',   // 4x base
  5: '20px',
  6: '24px',   // 6x base
  7: '28px',
  8: '32px',   // 8x base
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  48: '192px',
  56: '224px',
  64: '256px',
} as const;

// ============================================================================
// Typography Scale
// ============================================================================

export const typography = {
  fontFamily: {
    sans: 'var(--ot-font-family-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    mono: 'var(--ot-font-family-mono, "SF Mono", Monaco, "Cascadia Code", monospace)',
    display: 'var(--ot-font-family-display, "Inter", system-ui, sans-serif)',
  },

  fontSize: {
    xs: ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
    sm: ['14px', { lineHeight: '20px', letterSpacing: '0' }],
    base: ['16px', { lineHeight: '24px', letterSpacing: '0' }],
    lg: ['18px', { lineHeight: '28px', letterSpacing: '0' }],
    xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
    '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
    '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
    '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
    '5xl': ['48px', { lineHeight: '48px', letterSpacing: '-0.03em' }],
    '6xl': ['60px', { lineHeight: '60px', letterSpacing: '-0.03em' }],
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ============================================================================
// Border Radius
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const;

// ============================================================================
// Shadows (Z-Axis Depth)
// ============================================================================

export const shadows = {
  none: 'none',

  // Elevation shadows
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.15), 0 12px 24px rgba(0, 0, 0, 0.1)',

  // Inner shadows (inset states)
  'inner-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
  'inner-md': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',

  // Glow effects (photon/neural themed)
  'glow-photon': '0 0 20px rgba(0, 132, 255, 0.3)',
  'glow-neural': '0 0 20px rgba(121, 0, 255, 0.3)',
  'glow-quantum': '0 0 20px rgba(0, 255, 110, 0.3)',
  'glow-entropy': '0 0 20px rgba(255, 26, 26, 0.3)',
} as const;

// ============================================================================
// Z-Index Scale
// ============================================================================

export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// ============================================================================
// Animation Settings
// ============================================================================

export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    slower: '600ms',
  },

  easing: {
    ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
    easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

// ============================================================================
// Breakpoints
// ============================================================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Container Sizes
// ============================================================================

export const container = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
} as const;

// ============================================================================
// Glass Morphism Settings
// ============================================================================

export const glass = {
  // Sub-surface scattering simulation
  blur: {
    sm: 'blur(4px)',
    md: 'blur(8px)',
    lg: 'blur(16px)',
    xl: 'blur(24px)',
  },

  // Refractive index simulation (opacity levels)
  opacity: {
    subtle: '0.6',
    default: '0.7',
    strong: '0.8',
    heavy: '0.9',
  },

  // Border tint for glass effect
  border: '1px solid rgba(255, 255, 255, 0.18)',

  // Shadow for depth
  shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
} as const;

// ============================================================================
// Type Guards
// ============================================================================

export type ColorName = keyof typeof ColorScale;
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type SemanticColorName = keyof typeof semanticColors;

/**
 * Get a CSS variable for a color
 */
export function getColorVar(name: ColorName, shade: ColorShade): string {
  return `var(--ot-color-${name}-${shade}, ${ColorScale[name][shade]})`;
}

/**
 * Get a semantic color variable
 */
export function getSemanticColorVar(
  category: keyof typeof semanticColors,
  name: keyof typeof semanticColors[keyof typeof semanticColors]
): string {
  return semanticColors[category][name];
}

// ============================================================================
// Theme Contract Export
// ============================================================================

export const themeContract = {
  colors: ColorScale,
  semantic: semanticColors,
  spacing,
  typography,
  borderRadius,
  shadows,
  zIndex,
  animation,
  breakpoints,
  container,
  glass,
} as const;

/**
 * CSS Variable name generator
 */
export function cssVar(name: string, fallback: string): string {
  return `var(--ot-${name}, ${fallback})`;
}
