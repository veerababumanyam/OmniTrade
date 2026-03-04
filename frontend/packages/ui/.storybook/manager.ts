/**
 * Storybook Manager Configuration
 * OmniTrade UI Library - Liquid Glass Design System
 *
 * Configures the Storybook UI manager and addons.
 */

import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

/**
 * Custom OmniTrade theme for Storybook UI
 */
const omnitradeTheme = create({
  base: 'dark',

  // Brand colors - Photon Physics palette
  colorPrimary: '#0066ff',
  colorSecondary: '#7900ff',

  // UI colors
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
  textColor: 'rgba(255, 255, 255, 0.95)',

  // Brand
  brandTitle: 'OmniTrade UI',
  brandUrl: 'https://omnitrade.io',
  brandImage: undefined, // Can add logo image path here
  brandTarget: '_self',

  // Typography
  fontBase: "'Inter var', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontCode: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
});

// Apply the theme
addons.setConfig({
  theme: omnitradeTheme,

  // Panel configuration
  panelPosition: 'right',
  enableShortcuts: true,

  // Show roots in sidebar
  showRoots: true,

  // Show panel by default
  isFullscreen: false,
  showNav: true,
  showPanel: true,
  showToolbar: true,

  // Sidebar configuration
  sidebar: {
    showRoots: true,
    collapsedRoots: ['atoms', 'molecules', 'organisms'],
  },

  // Toolbar configuration
  toolbar: {
    copy: true,
    eject: false,
    fullscreen: true,
    zoom: true,
  },
});
