/**
 * Storybook Main Configuration
 * OmniTrade UI Library - Liquid Glass Design System
 *
 * @see https://storybook.js.org/docs/react-framework-api/default-export-configuration
 */

import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
  ],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-actions',
    '@storybook/addon-backgrounds',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-toolbar',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
  ],

  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop: any) => {
        if (prop.description) {
          return true;
        }
        return false;
      },
    },
  },

  docs: {
    autodocs: true,
    defaultName: 'OmniTrade UI',
    docsMode: 'full',
  },

  backgrounds: {
    default: 'dark',
    values: [
      {
        name: 'dark',
        value: '#09090b',
      },
      {
        name: 'light',
        value: '#ffffff',
      },
      {
        name: 'glass-dark',
        value: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      },
      {
        name: 'glass-light',
        value: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      },
    ],
  },

  features: {
    builder: {
      name: 'OmniTrade UI',
      title: 'OmniTrade UI Library',
      describes: [
        'A comprehensive React component library implementing the 2026 Liquid Glass Design System.',
        'Features include photon physics-inspired visuals, APCA contrast compliance, and AI-readable metadata.',
      ],
    },
  },

  core: {
    builder: '@storybook/builder-vite',
    renderer: '@storybook/react',
  },

  async viteFinal(config: any) {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@omnitrade/ui': path.resolve(__dirname, '../src'),
          '@omnitrade/ui/tokens': path.resolve(__dirname, '../src/tokens'),
          '@omnitrade/ui/atoms': path.resolve(__dirname, '../src/atoms'),
          '@omnitrade/ui/molecules': path.resolve(__dirname, '../src/molecules'),
          '@omnitrade/ui/organisms': path.resolve(__dirname, '../src/organisms'),
          '@omnitrade/ui/templates': path.resolve(__dirname, '../src/templates'),
          '@omnitrade/ui/primitives': path.resolve(__dirname, '../src/primitives'),
          '@omnitrade/ui/hooks': path.resolve(__dirname, '../src/hooks'),
          '@omnitrade/ui/utils': path.resolve(__dirname, '../src/utils'),
          '@omnitrade/ui/signal-bus': path.resolve(__dirname, '../src/signal-bus'),
          '@omnitrade/ui/registry': path.resolve(__dirname, '../src/registry'),
        },
      },
      css: {
        ...config.css,
        modules: {
          ...config.css?.modules,
          '.module.css': 'local-ident',
        },
      },
    };
  },
};

export default config;
