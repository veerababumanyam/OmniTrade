/**
 * Storybook Custom Theme
 * OmniTrade UI Library - Liquid Glass Design System
 *
 * Custom theme configuration for Storybook UI
 */

import { create } from '@storybook/theming/create';

/**
 * OmniTrade Theme for Storybook
 *
 * Based on the Liquid Glass Design System with:
 * - Photon Physics color palette
 * - Liquid Glass surface effects
 * - APCA contrast compliance
 */
export const omnitradeTheme = create({
  base: 'dark',

  // Brand colors - Photon Physics palette
  colorPrimary: '#0066ff',
  colorSecondary: '#7900ff',

  // UI colors - Liquid Glass surfaces
  appBg: '#09090b',
  appContentBg: '#18181b',
  appBorderColor: 'rgba(255, 255, 255, 0.1)',
  appBorderRadius: 12,

  // Text colors
  textColor: 'rgba(255, 255, 255, 0.95)',
  textInverseColor: 'rgba(0, 0, 0, 0.9)',
  textMutedColor: 'rgba(255, 255, 255, 0.7)',

  // Toolbar colors
  barTextColor: 'rgba(255, 255, 255, 0.9)',
  barSelectedColor: '#0066ff',
  barBg: '#0f0f12',

  // Input colors
  inputBg: '#27272a',
  inputBorder: 'rgba(255, 255, 255, 0.15)',
  inputTextColor: 'rgba(255, 255, 255, 0.95)',

  // Button colors
  buttonBg: '#27272a',
  buttonBorder: 'rgba(255, 255, 255, 0.1)',

  // Brand
  brandTitle: 'OmniTrade UI',
  brandUrl: 'https://omnitrade.io',
  brandImage: undefined,
  brandTarget: '_self',

  // Typography
  fontBase: "'Inter var', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontCode: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
});

export default omnitradeTheme;
