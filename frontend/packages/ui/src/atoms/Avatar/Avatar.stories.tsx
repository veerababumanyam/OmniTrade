/**
 * Avatar Component Stories
 * OmniTrade UI Library - Liquid Glass Design System
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarGroup, AvatarSkeleton } from './index';

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alt text for accessibility',
    },
    initials: {
      control: 'text',
      description: 'Initials to display as fallback',
    },
    name: {
      control: 'text',
      description: 'Full name for generating initials',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
      description: 'Size variant',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'busy', 'away'],
      description: 'Status indicator',
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
      description: 'Shape variant',
      table: {
        defaultValue: { summary: 'circle' },
      },
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Avatar component displays user avatars with images, initials, or icons.

## Features
- **Image with fallbacks**: Displays image or falls back to initials/icon
- **Status indicator**: Shows online, offline, busy, or away status
- **Size variants**: xs, sm, md, lg, xl, xxl
- **Shape variants**: circle or square
- **Avatar Group**: Stack multiple avatars with overflow indicator
- **AI-readable**: Built-in metadata support
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

/**
 * Default avatar with standard styling
 */
export const Default: Story = {
  args: {
    name: 'John Doe',
    size: 'md',
  },
};

/**
 * Avatar with image
 */
export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=3',
    alt: 'Jane Smith',
    name: 'Jane Smith',
    size: 'lg',
  },
};

/**
 * Avatar with initials fallback
 */
export const WithInitials: Story = {
  args: {
    initials: 'AB',
    name: 'Alice Brown',
    size: 'md',
  },
};

/**
 * All available sizes displayed together
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Avatar name="XS User" size="xs" />
      <Avatar name="SM User" size="sm" />
      <Avatar name="MD User" size="md" />
      <Avatar name="LG User" size="lg" />
      <Avatar name="XL User" size="xl" />
      <Avatar name="XXL User" size="xxl" />
    </div>
  ),
};

/**
 * Avatar with status indicators
 */
export const WithStatus: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <Avatar name="Online" size="lg" status="online" />
      <Avatar name="Offline" size="lg" status="offline" />
      <Avatar name="Busy" size="lg" status="busy" />
      <Avatar name="Away" size="lg" status="away" />
    </div>
  ),
};

/**
 * Avatar with square shape
 */
export const SquareShape: Story = {
  args: {
    name: 'Square Avatar',
    size: 'lg',
    shape: 'square',
  },
};

/**
 * Avatar group with stacking
 */
export const AvatarGroupStory: Story = {
  name: 'Avatar Group',
  render: () => (
    <AvatarGroup max={4}>
      <Avatar name="John Doe" />
      <Avatar name="Jane Smith" />
      <Avatar name="Bob Wilson" />
      <Avatar name="Alice Brown" />
      <Avatar name="Charlie Davis" />
      <Avatar name="Diana Evans" />
    </AvatarGroup>
  ),
};

/**
 * Loading skeleton state
 */
export const Loading: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <AvatarSkeleton size="sm" />
      <AvatarSkeleton size="md" />
      <AvatarSkeleton size="lg" />
    </div>
  ),
};

/**
 * Clickable avatar
 */
export const Clickable: Story = {
  args: {
    name: 'Click Me',
    size: 'lg',
    onClick: () => console.log('Avatar clicked'),
  },
};

/**
 * Trading interface example
 */
export const TradingInterface: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      minWidth: '280px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Avatar name="Alex Morgan" size="lg" status="online" />
        <div>
          <div style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>Alex Morgan</div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>Portfolio Manager</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Avatar name="Sarah Chen" size="md" status="busy" />
        <div>
          <div style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>Sarah Chen</div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>Risk Analyst</div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    name: 'Custom User',
    size: 'lg',
    shape: 'circle',
    status: undefined,
  },
};
