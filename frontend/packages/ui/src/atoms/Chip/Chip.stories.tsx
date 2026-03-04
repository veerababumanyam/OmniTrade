/**
 * Chip Component Stories
 * OmniTrade UI Library - Liquid Glass Design System
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Chip } from './index';
import { Avatar } from '../Avatar';

const meta: Meta<typeof Chip> = {
  title: 'Atoms/Chip',
  component: Chip,
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
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    selected: {
      control: 'boolean',
      description: 'Selected/active state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    onDismiss: {
      action: 'dismissed',
      description: 'Dismiss handler',
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
The Chip component represents compact elements that allow users to filter, select, or trigger actions.

## Features
- **Filter tags/selections**: Clickable chips for filtering
- **Avatar support**: Display avatars within chips
- **Dismissible**: Close button for removal
- **Size variants**: sm, md, lg
- **Selectable state**: Toggle selection
- **AI-readable**: Built-in metadata support
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

/**
 * Default chip with standard styling
 */
export const Default: Story = {
  args: {
    label: 'Chip',
    variant: 'default',
    size: 'md',
  },
};

/**
 * Primary variant for main selections
 */
export const Primary: Story = {
  args: {
    label: 'Primary',
    variant: 'primary',
  },
};

/**
 * Success variant for positive selections
 */
export const Success: Story = {
  args: {
    label: 'Success',
    variant: 'success',
  },
};

/**
 * Warning variant for caution selections
 */
export const Warning: Story = {
  args: {
    label: 'Warning',
    variant: 'warning',
  },
};

/**
 * Error variant for negative selections
 */
export const Error: Story = {
  args: {
    label: 'Error',
    variant: 'error',
  },
};

/**
 * All available sizes displayed together
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Chip label="Small" size="sm" />
      <Chip label="Medium" size="md" />
      <Chip label="Large" size="lg" />
    </div>
  ),
};

/**
 * Chip in selected state
 */
export const Selected: Story = {
  args: {
    label: 'Selected Chip',
    selected: true,
    variant: 'primary',
  },
};

/**
 * Chip with dismiss button
 */
export const Dismissible: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Chip label="Bitcoin" onDismiss={() => console.log('Dismissed Bitcoin')} />
      <Chip label="Ethereum" variant="primary" onDismiss={() => console.log('Dismissed Ethereum')} />
      <Chip label="Solana" variant="success" onDismiss={() => console.log('Dismissed Solana')} />
    </div>
  ),
};

/**
 * Clickable chips for filtering
 */
export const Clickable: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Chip label="All" onClick={() => console.log('All clicked')} selected />
      <Chip label="Crypto" onClick={() => console.log('Crypto clicked')} variant="primary" />
      <Chip label="Stocks" onClick={() => console.log('Stocks clicked')} variant="default" />
      <Chip label="Forex" onClick={() => console.log('Forex clicked')} variant="default" />
    </div>
  ),
};

/**
 * Chip with avatar
 */
export const WithAvatar: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Chip
        label="John Doe"
        avatar={<Avatar name="John Doe" size="sm" />}
        onDismiss={() => console.log('Dismissed John')}
      />
      <Chip
        label="Jane Smith"
        avatar={<Avatar name="Jane Smith" size="sm" />}
        variant="primary"
        onDismiss={() => console.log('Dismissed Jane')}
      />
    </div>
  ),
};

/**
 * Chip with icon
 */
export const WithIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Chip
        label="Bitcoin"
        icon={<span>₿</span>}
        variant="primary"
      />
      <Chip
        label="Ethereum"
        icon={<span>Ξ</span>}
        variant="success"
      />
      <Chip
        label="Starred"
        icon={<span>★</span>}
      />
    </div>
  ),
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Chip label="Disabled" disabled />
      <Chip label="Disabled Primary" variant="primary" disabled />
      <Chip label="Disabled Selected" selected disabled />
    </div>
  ),
};

/**
 * Filter chip group example
 */
export const FilterGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '8px', display: 'block' }}>
          ASSET TYPE
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Chip label="Crypto" onClick={() => {}} selected size="sm" />
          <Chip label="Stocks" onClick={() => {}} size="sm" />
          <Chip label="Forex" onClick={() => {}} size="sm" />
          <Chip label="Commodities" onClick={() => {}} size="sm" />
        </div>
      </div>
      <div>
        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '8px', display: 'block' }}>
          TIMEFRAME
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Chip label="1H" onClick={() => {}} size="sm" />
          <Chip label="4H" onClick={() => {}} selected size="sm" />
          <Chip label="1D" onClick={() => {}} size="sm" />
          <Chip label="1W" onClick={() => {}} size="sm" />
        </div>
      </div>
    </div>
  ),
};

/**
 * Trading chip examples
 */
export const TradingExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '8px', display: 'block' }}>
          WATCHLIST
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Chip
            label="BTC-USD"
            icon={<span>₿</span>}
            variant="primary"
            onDismiss={() => {}}
          />
          <Chip
            label="ETH-USD"
            icon={<span>Ξ</span>}
            variant="success"
            onDismiss={() => {}}
          />
          <Chip
            label="SOL-USD"
            onDismiss={() => {}}
          />
        </div>
      </div>
      <div>
        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '8px', display: 'block' }}>
          SELECTED STRATEGIES
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Chip label="MACD Crossover" selected onClick={() => {}} />
          <Chip label="RSI Overbought" selected onClick={() => {}} />
          <Chip label="Bollinger Bands" onClick={() => {}} />
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
    label: 'Custom Chip',
    variant: 'primary',
    size: 'md',
    selected: false,
    disabled: false,
  },
};
