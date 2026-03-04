/**
 * Toggle Component Stories
 * OmniTrade UI Library - Liquid Glass Design System
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from './index';

const meta: Meta<typeof Toggle> = {
  title: 'Atoms/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Controlled checked state',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Default checked state',
      table: {
        defaultValue: { summary: 'false' },
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
    label: {
      control: 'text',
      description: 'Label text',
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position of the label',
      table: {
        defaultValue: { summary: 'right' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    required: {
      control: 'boolean',
      description: 'Required for form validation',
    },
    onChange: {
      action: 'changed',
      description: 'Change handler',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Toggle component is a switch that allows users to turn settings on or off.

## Features
- **Labels for on/off states**: Customizable label text
- **Size variants**: sm, md, lg
- **Label positioning**: Left or right placement
- **AI-readable**: Built-in metadata support
- **Form integration**: Supports required validation
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

/**
 * Default toggle with standard styling
 */
export const Default: Story = {
  args: {
    label: 'Toggle',
    size: 'md',
    labelPosition: 'right',
  },
};

/**
 * Toggle in checked state
 */
export const Checked: Story = {
  args: {
    label: 'Enabled',
    defaultChecked: true,
  },
};

/**
 * Toggle in unchecked state
 */
export const Unchecked: Story = {
  args: {
    label: 'Disabled',
    defaultChecked: false,
  },
};

/**
 * All available sizes displayed together
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
      <Toggle label="Small" size="sm" />
      <Toggle label="Medium" size="md" defaultChecked />
      <Toggle label="Large" size="lg" />
    </div>
  ),
};

/**
 * Label positioned on the left
 */
export const LabelLeft: Story = {
  args: {
    label: 'Label on Left',
    labelPosition: 'left',
    defaultChecked: true,
  },
};

/**
 * Label positioned on the right
 */
export const LabelRight: Story = {
  args: {
    label: 'Label on Right',
    labelPosition: 'right',
    defaultChecked: true,
  },
};

/**
 * Disabled toggle state
 */
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
      <Toggle label="Disabled (Off)" disabled />
      <Toggle label="Disabled (On)" disabled defaultChecked />
    </div>
  ),
};

/**
 * Required field indicator
 */
export const Required: Story = {
  args: {
    label: 'Required Setting',
    required: true,
  },
};

/**
 * Toggle without a label
 */
export const NoLabel: Story = {
  args: {
    defaultChecked: true,
  },
};

/**
 * Settings panel example
 */
export const SettingsPanel: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      minWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 8px 0', color: 'rgba(255, 255, 255, 0.95)' }}>
        Trading Settings
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Toggle
          label="Enable Auto-Trading"
          defaultChecked
        />
        <Toggle
          label="Show Notifications"
          defaultChecked
        />
        <Toggle
          label="Dark Mode"
          defaultChecked
        />
        <Toggle
          label="Sound Alerts"
        />
        <Toggle
          label="Paper Trading Mode"
          size="lg"
        />
      </div>
    </div>
  ),
};

/**
 * Trading preferences example
 */
export const TradingPreferences: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '20px',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      minWidth: '300px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>
          AI Trading Assistant
        </span>
        <Toggle defaultChecked size="sm" />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>
          Risk Management
        </span>
        <Toggle defaultChecked size="sm" />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>
          Stop Loss
        </span>
        <Toggle size="sm" />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>
          Real-time Signals
        </span>
        <Toggle defaultChecked size="sm" />
      </div>
    </div>
  ),
};

/**
 * Notification settings example
 */
export const NotificationSettings: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '20px',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      minWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: 'rgba(255, 255, 255, 0.95)' }}>
        Notification Preferences
      </h4>
      <Toggle label="Email Alerts" defaultChecked size="sm" />
      <Toggle label="Push Notifications" defaultChecked size="sm" />
      <Toggle label="SMS Alerts" size="sm" />
      <Toggle label="Trade Executions" defaultChecked size="sm" />
      <Toggle label="Price Alerts" defaultChecked size="sm" />
      <Toggle label="Market News" size="sm" />
    </div>
  ),
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    label: 'Toggle Setting',
    size: 'md',
    labelPosition: 'right',
    disabled: false,
    required: false,
    defaultChecked: false,
  },
};
