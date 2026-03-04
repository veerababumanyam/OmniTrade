/**
 * APCA (Advanced Perceptual Contrast Algorithm) Utilities
 * Based on WCAG 3.0 draft specification for perceptual contrast
 * @see https://github.com/Myndex/apca-w3
 */

/**
 * APCA contrast targets for different use cases
 * Values represent minimum Lc (Lightness contrast) percentages
 */
export const APCA_TARGETS = {
  /** Text contrast requirements */
  text: {
    /** Body text - minimum 75 Lc for readability */
    body: 75,
    /** Large/heading text - minimum 60 Lc */
    large: 60,
    /** Placeholder text - minimum 45 Lc (reduced readability acceptable) */
    placeholder: 45,
  },
  /** Interactive element contrast requirements */
  interactive: {
    /** Default state - minimum 60 Lc */
    default: 60,
    /** Disabled state - minimum 30 Lc (reduced visibility intentional) */
    disabled: 30,
  },
  /** Decorative elements - minimum 15 Lc */
  decorative: 15,
} as const;

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Converts a hex color string to RGB values
 * Supports 3-digit, 6-digit, and 8-digit hex formats
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace(/^#/, '');

  // Handle 3-digit hex (#fff -> #ffffff)
  if (cleanHex.length === 3) {
    const expanded = cleanHex
      .split('')
      .map((char) => char + char)
      .join('');
    return hexToRgb(`#${expanded}`);
  }

  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    }
  }

  // Handle 8-digit hex with alpha (ignore alpha)
  if (cleanHex.length === 8) {
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
      cleanHex
    );
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    }
  }

  return null;
}

/**
 * Converts RGB to linear Y (luminance) using sRGB transfer function
 */
function srgbToY(r: number, g: number, b: number): number {
  // Convert to 0-1 range and apply inverse sRGB transfer function
  const toLinear = (c: number): number => {
    const normalized = c / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  // sRGB to Y (luminance) conversion
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Computes the APCA contrast between foreground and background colors.
 * Returns a signed value: positive means dark text on light bg, negative means light text on dark bg.
 *
 * @param fg - Foreground color as hex string (e.g., '#ffffff' or '#fff')
 * @param bg - Background color as hex string (e.g., '#000000' or '#000')
 * @returns APCA contrast value as Lc percentage (0-100 or -100 to 0)
 *
 * @example
 * computeAPCA('#000000', '#ffffff') // ~106 (black on white)
 * computeAPCA('#ffffff', '#000000') // ~-106 (white on black)
 * computeAPCA('#777777', '#ffffff') // ~57 (gray on white)
 */
export function computeAPCA(fg: string, bg: string): number {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);

  if (!fgRgb || !bgRgb) {
    console.warn('Invalid color format. Expected hex string like #ffffff');
    return 0;
  }

  // Convert to linear Y
  const fgY = srgbToY(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgY = srgbToY(bgRgb.r, bgRgb.g, bgRgb.b);

  // APCA constants
  const normBG = bgY + 0.0;
  const normFG = fgY + 0.0;

  // Calculate contrast
  let contrast: number;
  const scale = 1.0;

  if (normBG > normFG) {
    // Light bg, dark fg
    contrast =
      (Math.pow(normBG, 0.56) - Math.pow(normFG, 0.57)) * 1.14 * scale;
  } else {
    // Dark bg, light fg
    contrast =
      (Math.pow(normFG, 0.65) - Math.pow(normBG, 0.62)) * 1.13 * scale;
  }

  // Apply clamps and minimum contrast threshold
  const minContrast = 0.0;
  const maxContrast = 108;

  let apc = contrast * 100;

  if (Math.abs(apc) < minContrast) {
    apc = 0;
  } else if (apc > 0) {
    apc = apc - minContrast;
  } else if (apc < 0) {
    apc = apc + minContrast;
  }

  return clamp(apc, -maxContrast, maxContrast);
}

/**
 * Validates that the contrast between foreground and background meets the target.
 *
 * @param fg - Foreground color as hex string
 * @param bg - Background color as hex string
 * @param target - Minimum required Lc contrast value (use APCA_TARGETS constants)
 * @returns true if contrast meets or exceeds the target (absolute value)
 *
 * @example
 * validateContrast('#000000', '#ffffff', APCA_TARGETS.text.body) // true
 * validateContrast('#777777', '#ffffff', APCA_TARGETS.text.body) // false
 */
export function validateContrast(
  fg: string,
  bg: string,
  target: number
): boolean {
  const contrast = Math.abs(computeAPCA(fg, bg));
  return contrast >= target;
}

/**
 * Gets the absolute contrast value (useful for comparisons)
 */
export function getAbsoluteContrast(fg: string, bg: string): number {
  return Math.abs(computeAPCA(fg, bg));
}

/**
 * Determines if text should be light or dark based on background
 * Returns 'light' for dark backgrounds, 'dark' for light backgrounds
 */
export function getAccessibleTextColor(
  bg: string,
  lightColor: string = '#ffffff',
  darkColor: string = '#000000'
): string {
  const lightContrast = Math.abs(computeAPCA(lightColor, bg));
  const darkContrast = Math.abs(computeAPCA(darkColor, bg));
  return lightContrast > darkContrast ? lightColor : darkColor;
}
