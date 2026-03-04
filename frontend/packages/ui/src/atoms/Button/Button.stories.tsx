/**
 * Button Component Stories
 * OmniTrade UI Library - Liquid Glass Design System
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './index';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'link'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width of the button',
    },
    leadingIcon: {
      control: 'object',
      description: 'Icon to show before the label',
    },
    trailingIcon: {
      control: 'object',
      description: 'Icon to show after the label',
    },
    children: {
      control: 'text',
      description: 'Button label',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Button component is an atomic element for triggering actions with the Liquid Glass design aesthetic.

## Features
- **Variants**: primary, secondary, ghost, danger, link
- **Sizes**: sm, md, lg
- **Loading state** with spinner animation
- **Icon support** with leading/trailing icons
- **Full width** option
- **AI-readable**: Built-in metadata support
        `,
      },
    },
  },
});

/**
 * Default button with primary styling
 */
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

/**
 * Primary variant for main actions
 */
export const Primary: Story = {
  args: {
    children: 'Primary Action',
    variant: 'primary',
  },
};

/**
 * Secondary variant for standard actions
 */
export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

/**
 * Ghost variant for subtle actions
 */
export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

/**
 * Danger variant for destructive actions
 */
export const Danger: Story = {
  args: {
    children: 'Delete',
    variant: 'danger',
  },
};

/**
 * Link variant for text links
 */
export const Link: Story = {
  args: {
    children: 'Learn More',
    variant: 'link',
  },
};

/**
 * All available sizes displayed together
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/**
 * Loading state with spinner
 */
export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

/**
 * Full width button
 */
export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  render: () => (
    <div style={{ width: '300px' }}>
      <Button fullWidth>Full Width</Button>
    </div>
  ),
};

/**
 * Button with leading icon
 */
export const WithLeadingIcon: Story = {
  args: {
    children: 'Continue',
    leadingIcon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M5 12l4 3 5v2l3.5 2L3 5 2L3 5 2L5 9l3 5 4.5.1 0 3 4 4c1 1-1.5.09 3 9 3" />
    ),
  },
};

/**
 * Button with trailing icon
 */
export const WithTrailingIcon: Story = {
  args: {
    children: 'Submit',
    trailingIcon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M5 12l4 3 5v2l3.5 2L3 5 2L3 5 2L5 9l3 5 4.5.1 0 3 4 4c1 1-1.5.09.3 9 3" />
    ),
  },
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    children: 'Custom Button',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false,
  },
};
