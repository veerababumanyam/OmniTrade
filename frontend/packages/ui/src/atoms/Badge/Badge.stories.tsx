/**
 * Badge Component Stories
 * OmniTrade UI Library - Liquid Glass Design System
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './index';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Size of the badge',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    dot: {
      control: 'boolean',
      description: 'Show as dot indicator',
    },
    pill: {
      control: 'boolean',
      description: 'Pill shape (rounded ends)',
    },
    solid: {
      control: 'boolean',
      description: 'Solid background variant',
    },
    removable: {
      control: 'boolean',
      description: 'Show remove button',
    },
    onRemove: {
      action: 'removed',
      description: 'Remove handler',
    },
    children: {
      control: 'text',
      description: 'Badge content',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Badge component displays status indicators, counts, or labels with the Liquid Glass design aesthetic.

## Features
- **Variants**: default, primary, success, warning, error
- **Sizes**: xs, sm, md, lg
- **Dot indicator** for status visualization
- **Pill shape** for rounded badges
- **Solid variant** for emphasis
- **Removable** badges with close button
- **AI-readable** metadata support
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

/**
 * Default badge with standard styling
 */
export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
    size: 'md',
  },
};

/**
 * Primary variant for main actions or highlights
 */
export const Primary: Story = {
  args: {
    children: 'Primary',
    variant: 'primary',
  },
};

/**
 * Success variant for positive states
 */
export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

/**
 * Warning variant for caution states
 */
export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

/**
 * Error variant for negative states
 */
export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'error',
  },
};

/**
 * All available sizes displayed together
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Badge size="xs">XS</Badge>
      <Badge size="sm">SM</Badge>
      <Badge size="md">MD</Badge>
      <Badge size="lg">LG</Badge>
    </div>
  ),
};

/**
 * Dot indicator badges for status visualization
 */
export const DotIndicators: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Badge dot variant="default" />
      <Badge dot variant="primary" />
      <Badge dot variant="success" />
      <Badge dot variant="warning" />
      <Badge dot variant="error" />
    </div>
  ),
};

/**
 * Pill-shaped badges with rounded ends
 */
export const PillShape: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Badge pill variant="primary">New</Badge>
      <Badge pill variant="success">Active</Badge>
      <Badge pill variant="warning">Pending</Badge>
      <Badge pill variant="error">Critical</Badge>
    </div>
  ),
};

/**
 * Solid background variant for emphasis
 */
export const SolidVariant: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Badge solid variant="primary">Primary</Badge>
      <Badge solid variant="success">Success</Badge>
      <Badge solid variant="warning">Warning</Badge>
      <Badge solid variant="error">Error</Badge>
    </div>
  ),
};

/**
 * Removable badges with close button
 */
export const Removable: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Badge removable variant="primary" onRemove={() => console.log('Removed primary')}>
        Tag 1
      </Badge>
      <Badge removable variant="success" onRemove={() => console.log('Removed success')}>
        Tag 2
      </Badge>
      <Badge removable variant="default" onRemove={() => console.log('Removed default')}>
        Tag 3
      </Badge>
    </div>
  ),
};

/**
 * Trading-specific badge examples
 */
export const TradingExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Badge variant="success" solid>+2.5%</Badge>
        <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Profit</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Badge variant="error" solid>-1.8%</Badge>
        <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loss</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Badge variant="primary">BTC</Badge>
        <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Symbol</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Badge variant="warning" dot />
        <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Market Open</span>
      </div>
    </div>
  ),
};

/**
 * Notification count badges
 */
export const NotificationCounts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ fontSize: '24px' }}>🔔</span>
        <Badge size="xs" variant="error" style={{ position: 'absolute', top: -4, right: -4 }}>
          3
        </Badge>
      </div>
      <div style={{ position: 'relative' }}>
        <span style={{ fontSize: '24px' }}>📬</span>
        <Badge size="sm" variant="primary" style={{ position: 'absolute', top: -4, right: -4 }}>
          12
        </Badge>
      </div>
      <div style={{ position: 'relative' }}>
        <span style={{ fontSize: '24px' }}>⚡</span>
        <Badge size="xs" variant="warning" style={{ position: 'absolute', top: -4, right: -4 }}>
          99+
        </Badge>
      </div>
    </div>
  ),
};
