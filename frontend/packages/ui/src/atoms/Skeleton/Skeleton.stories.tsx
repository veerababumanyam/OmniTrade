/**
 * Skeleton Component Stories
 * OmniTrade UI Library - Liquid Glass Design System
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './index';

const meta: Meta<typeof Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
      description: 'Visual variant',
      table: {
        defaultValue: { summary: 'text' },
      },
    },
    animation: {
      control: 'select',
      options: ['pulse', 'wave', 'none'],
      description: 'Animation style',
      table: {
        defaultValue: { summary: 'wave' },
      },
    },
    width: {
      control: 'text',
      description: 'Width of the skeleton (CSS value)',
    },
    height: {
      control: 'text',
      description: 'Height of the skeleton (CSS value)',
    },
    count: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of text lines (only for text variant)',
      table: {
        defaultValue: { summary: '1' },
      },
    },
    borderRadius: {
      control: 'text',
      description: 'Border radius override',
    },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The Skeleton component displays a loading placeholder with animations while content is loading.

## Features
- **Variants**: text, circular (avatar), rectangular
- **Animations**: pulse, wave, none
- **Multiple lines**: For text variant
- **Custom dimensions**: Configurable width and height
- **Reduced motion**: Respects user preferences
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

/**
 * Default text skeleton
 */
export const Default: Story = {
  args: {
    variant: 'text',
    animation: 'wave',
  },
};

/**
 * Text skeleton with multiple lines
 */
export const TextLines: Story = {
  args: {
    variant: 'text',
    count: 3,
    animation: 'wave',
  },
};

/**
 * Pulse animation style
 */
export const PulseAnimation: Story = {
  args: {
    variant: 'text',
    count: 2,
    animation: 'pulse',
  },
};

/**
 * Wave animation style
 */
export const WaveAnimation: Story = {
  args: {
    variant: 'text',
    count: 2,
    animation: 'wave',
  },
};

/**
 * Static skeleton (no animation)
 */
export const NoAnimation: Story = {
  args: {
    variant: 'text',
    count: 2,
    animation: 'none',
  },
};

/**
 * Circular skeleton for avatars
 */
export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 40,
    height: 40,
  },
};

/**
 * Circular skeleton in various sizes
 */
export const CircularSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton variant="circular" width={40} height={40} />
      <Skeleton variant="circular" width={56} height={56} />
      <Skeleton variant="circular" width={80} height={80} />
    </div>
  ),
};

/**
 * Rectangular skeleton for cards/images
 */
export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 300,
    height: 200,
  },
};

/**
 * Rectangular skeleton with custom border radius
 */
export const RectangularRounded: Story = {
  args: {
    variant: 'rectangular',
    width: 300,
    height: 120,
    borderRadius: 16,
  },
};

/**
 * Card loading placeholder
 */
export const CardSkeleton: Story = {
  render: () => (
    <div style={{
      width: '320px',
      padding: '16px',
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <Skeleton variant="circular" width={48} height={48} />
        <div style={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} style={{ marginBottom: '8px' }} />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={150} borderRadius={8} style={{ marginBottom: '16px' }} />
      <Skeleton variant="text" count={2} />
    </div>
  ),
};

/**
 * List item skeleton
 */
export const ListItemSkeleton: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
        }}>
          <Skeleton variant="circular" width={40} height={40} />
          <div style={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={16} style={{ marginBottom: '6px' }} />
            <Skeleton variant="text" width="50%" height={12} />
          </div>
          <Skeleton variant="rectangular" width={60} height={24} borderRadius={4} />
        </div>
      ))}
    </div>
  ),
};

/**
 * Profile card skeleton
 */
export const ProfileCardSkeleton: Story = {
  render: () => (
    <div style={{
      width: '280px',
      padding: '24px',
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: '16px' }}>
        <Skeleton variant="circular" width={80} height={80} style={{ margin: '0 auto' }} />
      </div>
      <Skeleton variant="text" width="60%" height={20} style={{ margin: '0 auto 8px' }} />
      <Skeleton variant="text" width="80%" height={14} style={{ margin: '0 auto 16px' }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
        <div>
          <Skeleton variant="text" width={40} height={20} style={{ margin: '0 auto 4px' }} />
          <Skeleton variant="text" width={50} height={12} />
        </div>
        <div>
          <Skeleton variant="text" width={40} height={20} style={{ margin: '0 auto 4px' }} />
          <Skeleton variant="text" width={50} height={12} />
        </div>
        <div>
          <Skeleton variant="text" width={40} height={20} style={{ margin: '0 auto 4px' }} />
          <Skeleton variant="text" width={50} height={12} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={36} borderRadius={8} />
    </div>
  ),
};

/**
 * Trading dashboard skeleton
 */
export const TradingDashboardSkeleton: Story = {
  render: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      maxWidth: '600px',
    }}>
      {/* Price Card */}
      <div style={{
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <Skeleton variant="text" width="30%" height={12} style={{ marginBottom: '8px' }} />
        <Skeleton variant="text" width="60%" height={24} style={{ marginBottom: '4px' }} />
        <Skeleton variant="text" width="40%" height={14} />
      </div>

      {/* Portfolio Value */}
      <div style={{
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <Skeleton variant="text" width="40%" height={12} style={{ marginBottom: '8px' }} />
        <Skeleton variant="text" width="70%" height={24} style={{ marginBottom: '4px' }} />
        <Skeleton variant="text" width="30%" height={14} />
      </div>

      {/* Chart Placeholder */}
      <div style={{
        gridColumn: 'span 2',
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <Skeleton variant="text" width="20%" height={14} style={{ marginBottom: '12px' }} />
        <Skeleton variant="rectangular" height={200} borderRadius={8} />
      </div>

      {/* Recent Trades */}
      <div style={{
        gridColumn: 'span 2',
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <Skeleton variant="text" width="25%" height={14} style={{ marginBottom: '12px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton variant="text" width="30%" height={16} />
              <Skeleton variant="text" width="20%" height={16} />
              <Skeleton variant="text" width="15%" height={16} />
            </div>
          ))}
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
    variant: 'text',
    animation: 'wave',
    count: 1,
    width: '100%',
    height: undefined,
    borderRadius: undefined,
  },
};
