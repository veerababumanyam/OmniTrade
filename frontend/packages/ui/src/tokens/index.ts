/**
 * Design Tokens
 * Liquid Glass Design System - OmniTrade
 *
 * CSS custom properties and TypeScript constants
 */

// ============================================================================
// Color Tokens
// ============================================================================

export const colors = {
  // Brand Colors (Photon - Primary Blue)
  photon: {
    50: '#e6f0ff',
    100: '#b3d4ff',
    200: '#80b8ff',
    300: '#4d9cff',
    400: '#1a80ff',
    500: '#0066ff', // Primary
    600: '#0052cc',
    700: '#003d99',
    800: '#002966',
    900: '#001433',
  },

  // Quantum (Success Green)
  quantum: {
    50: '#e6fff0',
    100: '#b3ffd6',
    200: '#80ffbc',
    300: '#4dffa2',
    400: '#1aff88',
    500: '#00ff6e', // Primary Success
    600: '#00cc58',
    700: '#009942',
    800: '#00662c',
    900: '#003316',
  },

  // Entropy (Error Red)
  entropy: {
    50: '#ffe6e6',
    100: '#ffb3b3',
    200: '#ff8080',
    300: '#ff4d4d',
    400: '#ff1a1a',
    500: '#ff0000', // Primary Error
    600: '#cc0000',
    700: '#990000',
    800: '#660000',
    900: '#330000',
  },

  // Flux (Warning Yellow)
  flux: {
    50: '#fffbe6',
    100: '#fff2b3',
    200: '#ffe980',
    300: '#ffe04d',
    400: '#ffd71a',
    500: '#ffcc00', // Primary Warning
    600: '#cca300',
    700: '#997a00',
    800: '#665200',
    900: '#332900',
  },

  // Surface Colors (Glass)
  surface: {
    base: 'rgba(15, 20, 30, 0.8)',
    elevated: 'rgba(20, 25, 40, 0.85)',
    overlay: 'rgba(10, 15, 25, 0.9)',
    glass: 'rgba(255, 255, 255, 0.05)',
  },

  // Text Colors
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    inverse: '#0f141e',
    disabled: 'rgba(255, 255, 255, 0.3)',
  },

  // Glass Edge Colors
  glassEdge: {
    light: 'rgba(255, 255, 255, 0.15)',
    dark: 'rgba(0, 0, 0, 0.2)',
  },
} as const;

// ============================================================================
// Spacing Tokens
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
} as const;

// ============================================================================
// Typography Tokens
// ============================================================================

export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    display: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ============================================================================
// Border Radius Tokens
// ============================================================================

export const radius = {
  none: '0',
  sm: '0.125rem', // 2px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// ============================================================================
// Shadow Tokens (Photon Physics)
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Glass shadows (layered)
  glass: `
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.05)
  `,
  elevated: `
    0 10px 40px -10px rgba(0, 0, 0, 0.3),
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08)
  `,
} as const;

// ============================================================================
// Animation Tokens
// ============================================================================

export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
    slowest: '700ms',
  },

  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Spring easings (damping ratio 0.7)
    springDefault: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    springBouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    springGentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
} as const;

// ============================================================================
// Z-Index Tokens (Spatial Volumes)
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
  top: 9999,
} as const;

// ============================================================================
// Blur Tokens
// ============================================================================

export const blur = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
  '3xl': '64px',
} as const;

// ============================================================================
// Breakpoint Tokens
// ============================================================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

// ============================================================================
// Export CSS Token Reference
// ============================================================================

// Re-export the CSS file for direct imports
import './index.css';
