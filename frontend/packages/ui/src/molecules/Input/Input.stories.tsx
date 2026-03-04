/**
 * * Input Component Stories
 * OmniTrade UI Library - Liquid Glass Design System
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './index';

const meta: Meta<typeof Input> = {
  title: 'Molecules/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    hint: {
      control: 'text',
      description: 'Hint text',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    leadingIcon: {
      control: 'object',
      description: 'Icon to show before the label',
    },
    trailingIcon: {
      control: 'object',
      description: 'Icon to show after the label',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width of the input',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Input component is a text input field with labels, hints, icons, and supporting various states.

## Features
- **Label and hint support**: For for clear labeling
- **Sizes**: sm, md, lg
- **Leading/trailing icons**: then for icons or the icon elements
- **Full width**: Stretches to fill its container width
- **Loading state**: Shows skeleton for loading
- **AI-readable**: Built-in metadata support

## Usage

\`\`\`tsx
import { Input } from '@omnitrade/ui';

// Basic input with label
<Input label="Username" placeholder="Enter username" />

// Input with error
<Input error="Invalid email" />

// Input with leading icon
<Input
  leadingIcon={<UserIcon />}
  placeholder="Search..."
/>
<Input>

// Input with trailing icon
<Input
  trailingIcon={<LockIcon />
  placeholder="Secure"
/>
<Input>

// Input with full width
<Input fullWidth placeholder="Full width stretches to fill container" />

// Loading state
<Input loading placeholder="Loading..." />
/>
}

;
```
        `,
      },
    </div>
  },
};
`,
      <div style={{ maxWidth: '100%' }}>
        <span style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>Email</</span>
        <div style={{ marginTop: '8px' }}>
          <Input label="Email" />
        </div>
      </div>
    </div>
  ),
};

/**
 * All variants displayed together
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Input label="Default" size="sm" />
      <Input label="elevated" size="md" variant="elevated" />
      <Input label="outlined" size="md" variant="outlined" />
      <Input label="glass" size="md" variant="glass" />
      <Input label="loading" size="md" loading />
    </div>
  ),
};

/**
 * All sizes displayed together
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Input label="Small" size="sm" />
      <Input label="Medium" size="md" />
      <Input label="Large" size="lg" />
    </div>
  ),
};

/**
 * Input with icons
 */
export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Input
        leadingIcon={<SearchIcon />}
        placeholder="Search..."
      />
      <Input
        trailingIcon={<LockIcon />}
        placeholder="Secure"
      />
    </div>
  ),
};

/**
 * Input with error state
 */
export const WithError: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input label="Email" error="Invalid email address" />
      <span style={{ color: 'var(--ot-color-entropy-500)' marginBottom: '4px' }}>
        Invalid email
      </span>
    </div>
  ),
};

/**
 * Input with hint text
 */
export const WithHint: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Input label="Username" hint="Enter your username" />
      <span style={{ color: 'var(--ot-text-tertiary)' marginTop: '4px' }}>
        Your username
      </span>
    </div>
  ),
};

/**
 * Input with loading state
 */
export const Loading: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Input loading placeholder="Loading..." />
      <Input loading disabled placeholder="Disabled" />
    </div>
  ),
};

/**
 * Trading form examples
 */
export const TradingExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ color: 'var(--ot-text-secondary)', fontSize: '14px' }}>Price</span>
        <span style={{ color: 'var(--ot-text-primary)', fontWeight: 600 }}        $45,000.00
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ color: 'var(--ot-text-secondary)', fontSize: '14px' }}>Volume</span>
        <span style={{ color: 'var(--ot-text-secondary)', fontSize: '12px' }}>24h avg</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ color: 'var(--ot-text-primary)', fontWeight: 600 }}>Buy</span>
        <span style={{ color: 'var(--ot-text-primary)', fontWeight: 600 }}>Sell</span>
      </div>
    </div>
  ),
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    size: 'md',
    error: '',
    hint: 'Must be at least 8 characters'
    fullWidth: false,
    disabled: false,
    leadingIcon: undefined,
    trailingIcon: undefined,
  },
};
