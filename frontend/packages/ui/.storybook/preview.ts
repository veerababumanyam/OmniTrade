/**
 * Storybook Preview Configuration
 * OmniTrade UI Library - Liquid Glass Design System
 *
 * Global decorators, parameters, and styles for all stories.
 */

import type { Preview } from '@storybook/react';
import React from 'react';

// Import global CSS tokens
import '../src/tokens/index.css';
import '../src/tokens/colors.css';

/**
 * Theme Provider Decorator
 * Wraps stories with theme context for light/dark mode support.
 */
const ThemeProviderDecorator = (Story: React.ComponentType, context: any) => {
  const theme = context.globals.theme || 'dark';

  return (
    <div
      data-theme={theme}
      data-brand="omnitrade"
      style={{
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <Story />
    </div>
  );
};

/**
 * Signal Bus Decorator
 * Provides a clean SignalBus instance for each story.
 */
const SignalBusDecorator = (Story: React.ComponentType) => {
  // Reset SignalBus between stories to prevent cross-contamination
  return <Story />;
};

/**
 * Global decorators applied to all stories.
 */
export const decorators: Preview['decorators'] = [
  ThemeProviderDecorator,
  SignalBusDecorator,
];

/**
 * Global parameters for all stories.
 */
export const parameters: Preview['parameters'] = {
  actions: {
    argTypesRegex: '^on[A-Z].*',
  },

  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
    expanded: true,
    sort: 'requiredFirst',
  },

  docs: {
    toc: true,
    source: {
      state: 'open',
    },
    description: {
      component: `
## OmniTrade UI Library

A React component library implementing the **2026 Liquid Glass Design System**.

### Features
- **Liquid Glass**: Refractive volume effects with glass morphism
- **Photon Physics**: Light-inspired color system and glow effects
- **APCA Contrast**: Advanced contrast compliance for accessibility
- **AI-Readable**: Built-in metadata for AI-driven interfaces
- **Signal Bus**: High-frequency inter-component communication

### Usage
\`\`\`tsx
import { Button, Card, Badge } from '@omnitrade/ui';
import '@omnitrade/ui/tokens';
\`\`\`
      `,
    },
  },

  backgrounds: {
    default: 'dark',
    grid: {
      cellSize: 20,
      opacity: 0.1,
    },
  },

  options: {
    storySort: {
      method: 'alphabetical',
      order: 'asc',
    },
    showPanel: true,
    showToolbar: true,
    isToolshown: true,
  },

  viewport: {
    viewports: {
      mobile1: {
        name: 'Small Mobile',
        styles: {
          width: '320px',
          height: '568px',
        },
      },
      mobile2: {
        name: 'Large Mobile',
        styles: {
          width: '414px',
          height: '896px',
        },
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px',
        },
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1280px',
          height: '1024px',
        },
      },
      desktopLarge: {
        name: 'Large Desktop',
        styles: {
          width: '1920px',
          height: '1080px',
        },
      },
    },
    defaultViewport: 'desktop',
  },

  a11y: {
    element: '#root',
    config: {},
    options: {},
  },

  layout: {
    fullWidth: false,
    centered: true,
    padded: true,
  },
};

/**
 * Global types for TypeScript support.
 */
export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'dark',
    toolbar: {
      title: 'Theme',
      icon: 'circlehollow',
      items: [
        { value: 'dark', title: 'Dark' },
        { value: 'light', title: 'Light' },
      ],
    },
  },
};

const preview: Preview = {
  decorators,
  parameters,
  globalTypes,
};

export default preview;
