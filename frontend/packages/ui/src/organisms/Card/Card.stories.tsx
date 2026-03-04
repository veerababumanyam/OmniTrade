/**
 * Card Component Stories
 * OmniTrade UI Library - Liquid Glass Design System
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardFooter } from './index';

const meta: Meta<typeof Card> = {
  title: 'Organisms/Card',
  component: Card,
  tags: ['autodocs'],
  subcomponents: {
    CardHeader,
    CardBody,
    CardFooter,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'glass'],
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
    padding: {
      control: 'boolean',
      description: 'Enable padding',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    hoverable: {
      control: 'boolean',
      description: 'Enable hover effect',
    },
    clickable: {
      control: 'boolean',
      description: 'Enable clickable state',
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
The Card component is a versatile container using the compound component pattern for flexible composition.

## Features
- **Compound Pattern**: Card.Header, Card.Body, Card.Footer
- **Variants**: default, elevated, outlined, glass
- **Sizes**: sm, md, lg
- **States**: hoverable, clickable
- **Liquid Glass styling**: Refractive volume effects

## Usage
\`\`\`tsx
// Basic Card with header and body
<Card>
  <Card.Header title="Card Title" subtitle="Optional subtitle" />
  <Card.Body>Content goes here</Card.Body>
  <Card.Footer>Footer content</Card.Footer>
</Card>

// Compound pattern with sub-components
\`\`\`

\`\`\`tsx
<Card variant="elevated" size="md">
  <Card.Header title="Elevated Card" />
  <Card.Body>This card has elevated styling with shadow effects.</Card.Body>
  <Card.Footer>
    <button>Action 1</button>
    <button>Action 2</button>
  </Card.Footer>
</Card>
\`\`\`
        `,
      },
    },
  },
};

/**
 * Default variant with subtle glass surface
 */
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    padding: true,
    hoverable: false,
    clickable: false,
  },
};

/**
 * Elevated variant with shadow depth
 */
export const Elevated: Story = {
  args: {
    variant: 'elevated',
  },
};

/**
 * Outlined variant with emphasized border
 */
export const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
};

/**
 * Glass variant with full glassmorphism
 */
export const Glass: Story = {
  args: {
    variant: 'glass',
  },
};

/**
 * All available sizes displayed together
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      <Card size="sm">
        <Card.Header title="Small Card" />
        <Card.Body>Small card content</Card.Body>
      </Card>
      <Card size="md">
        <Card.Header title="Medium Card" />
        <Card.Body>Medium card content</Card.Body>
      </Card>
      <Card size="lg">
        <Card.Header title="Large Card" />
        <Card.Body>Large card content</Card.Body>
      </Card>
    </div>
  ),
};

/**
 * Card with hover effect
 */
export const Hoverable: Story = {
  args: {
    hoverable: true,
  },
  render: () => (
    <Card hoverable>
      <Card.Header title="Hover Me" />
      <Card.Body>This card responds to hover with elevation effects.</Card.Body>
    </Card>
  ),
};

/**
 * Clickable card
 */
export const Clickable: Story = {
  args: {
    clickable: true,
    onClick: () => console.log('Card clicked'),
  },
  render: () => (
    <Card clickable onClick={() => console.log('Card clicked')}>
      <Card.Header title="Click Me" />
      <Card.Body>Click anywhere on this card to trigger an action.</Card.Body>
    </Card>
  ),
};

/**
 * Card without padding
 */
export const NoPadding: Story = {
  args: {
    padding: false,
  },
  render: () => (
    <Card padding={false}>
      <Card.Header title="No Padding" />
      <Card.Body>This card has no internal padding.</Card.Body>
    </Card>
  ),
};

/**
 * Complete card with all sections
 */
export const CompleteCard: Story = {
  render: () => (
    <Card variant="elevated" style={{ maxWidth: '400px' }}>
      <Card.Header
        title="Trading Dashboard"
        subtitle="Real-time market overview"
      actions={
        <button style={{ padding: '4px 8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <path d="M12 8v4l-4 4h8m8-8z4.5v2L8-8 1.5V-4-4H8-1.5V4-4h-4 4 2.5 0v-4 4v8-8-4 8-2.5-0 2.5-2 0-2.5-4 0-2.5 2.5 0-2.5 4 2 0 3 0v4 3-4v8 8-4 2 0 1.5.5.5 3 0v1.5.5-1.5-1.5 2 0-3 0 3.5-2.5v2h2c02" />
          </button>
        </button>
      }
      <Card.Body>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>BTC/USD</div>
            <div style={{ color: '#00ff6e', fontSize: '20px', fontWeight: 600 }}>42,150.25</div>
            <div style={{ color: '#00ff6e', fontSize: '14px' }}>+2.5%</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>ETH/USD</div>
            <div style={{ color: '#ff6b6b', fontSize: '20px', fontWeight: 600 }}>2,890.50</div>
            <div style={{ color: '#ff6b6b', fontSize: '14px' }}-1.2%</div>
          </div>
        </div>
      </Card.Body>
      <Card.Footer align="between">
        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Last updated: 2 min ago</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '6px',
            color: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
          }}>
            Refresh
          </button>
          <button style={{
            padding: '8px 16px',
            background: '#0066ff',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
          }}>
            View All
          </button>
        </div>
      </Card.Footer>
    </Card>
  ),
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    variant: 'default',
    size: 'md',
    padding: true,
    hoverable: false,
    clickable: false,
  },
};
