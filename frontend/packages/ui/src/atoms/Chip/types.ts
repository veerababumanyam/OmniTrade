/**
 * Chip Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode, ReactElement } from 'react';
import type { SignalTopic } from '../../signal-bus';

// ============================================================================
// Types
// ============================================================================

export type ChipSize = 'sm' | 'md' | 'lg';
export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

export interface ChipProps {
  /** Label text */
  label: ReactNode;
  /** Avatar element to display before label */
  avatar?: ReactElement;
  /** Icon to display before label */
  icon?: ReactElement;
  /** Show dismiss button and handle dismissal */
  onDismiss?: () => void;
  /** Selected/active state */
  selected?: boolean;
  /** Click handler for selectable chips */
  onClick?: () => void;
  /** Visual style variant */
  variant?: ChipVariant;
  /** Size variant */
  size?: ChipSize;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Signal topic to emit on interactions */
  signalTopic?: SignalTopic;
}

export interface ChipDismissSignalData {
  /** Label of the chip */
  label: ReactNode;
  /** Variant of the chip */
  variant: ChipVariant;
  /** Action type */
  action: 'dismiss';
}

export interface ChipClickSignalData {
  /** Label of the chip */
  label: ReactNode;
  /** Variant of the chip */
  variant: ChipVariant;
  /** Selected state */
  selected: boolean;
  /** Action type */
  action: 'click';
}

// ============================================================================
// Constants
// ============================================================================

export const CHIP_SIZES: Record<ChipSize, { height: string; fontSize: string; padding: string }> = {
  sm: {
    height: '24px',
    fontSize: 'var(--ot-font-size-xs, 12px)',
    padding: 'var(--ot-space-1, 4px) var(--ot-space-2, 8px)',
  },
  md: {
    height: '32px',
    fontSize: 'var(--ot-font-size-sm, 14px)',
    padding: 'var(--ot-space-1, 4px) var(--ot-space-3, 12px)',
  },
  lg: {
    height: '40px',
    fontSize: 'var(--ot-font-size-base, 16px)',
    padding: 'var(--ot-space-2, 8px) var(--ot-space-4, 16px)',
  },
};

export const CHIP_VARIANT_COLORS: Record<ChipVariant, { border: string; bg: string; color: string; selectedBg: string }> = {
  default: {
    border: 'var(--ot-glass-edge-dark, rgba(255, 255, 255, 0.12))',
    bg: 'var(--ot-glass-surface-2, rgba(255, 255, 255, 0.08))',
    color: 'var(--ot-text-primary, rgba(255, 255, 255, 0.95))',
    selectedBg: 'rgba(0, 102, 255, 0.15)',
  },
  primary: {
    border: 'var(--ot-color-photon-500, #0066ff)',
    bg: 'rgba(0, 102, 255, 0.1)',
    color: 'var(--ot-color-photon-400, #3385ff)',
    selectedBg: 'rgba(0, 102, 255, 0.25)',
  },
  success: {
    border: 'var(--ot-color-quantum-500, #00ff6e)',
    bg: 'rgba(0, 255, 110, 0.1)',
    color: 'var(--ot-color-quantum-400, #4dff94)',
    selectedBg: 'rgba(0, 255, 110, 0.25)',
  },
  warning: {
    border: 'var(--ot-color-flux-500, #ffcc00)',
    bg: 'rgba(255, 204, 0, 0.1)',
    color: 'var(--ot-color-flux-500, #ffcc00)',
    selectedBg: 'rgba(255, 204, 0, 0.25)',
  },
  error: {
    border: 'var(--ot-color-entropy-500, #ff3333)',
    bg: 'rgba(255, 51, 51, 0.1)',
    color: 'var(--ot-color-entropy-400, #ff6666)',
    selectedBg: 'rgba(255, 51, 51, 0.25)',
  },
};
