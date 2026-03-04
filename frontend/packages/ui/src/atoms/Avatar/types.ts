/**
 * Avatar Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { SignalTopic } from '../../signal-bus';

// ============================================================================
// Types
// ============================================================================

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  /** Image source URL */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Initials to display (fallback) */
  initials?: string;
  /** Full name (used to generate initials) */
  name?: string;
  /** Icon component to use as fallback */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  /** Fallback element when image fails */
  fallback?: React.ReactNode;
  /** Size variant */
  size?: AvatarSize;
  /** Status indicator */
  status?: AvatarStatus;
  /** Shape variant */
  shape?: AvatarShape;
  /** Additional CSS class */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Loading state */
  loading?: boolean;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Signal topic to emit on on 'ui:avatar:click' on click */
  signalTopic?: SignalTopic;
}

export interface AvatarGroupProps {
  /** Avatar components */
  children: React.ReactNode;
  /** Maximum avatars to show before stacking */
  maxVisible?: number;
  /** Maximum avatars to show (alias for maxVisible) */
  max?: number;
  /** Size for stacked avatars */
  size?: AvatarSize;
  /** Additional CSS class */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const AVATAR_SIZES: Record<AvatarSize, number> = {
  xs: 24,
  sm: 28,
  md: 32,
  lg: 40,
  xl: 48,
  xxl: 56,
};

export const AVATAR_STATUS_COLORS: Record<AvatarStatus, string> = {
  online: 'var(--ot-color-quantum-500, #00ff6e)',
  offline: 'var(--ot-color-mono-400, #a8a9b4)',
  busy: 'var(--ot-color-flux-500, #ffcc00)',
  away: 'var(--ot-color-mono-500, #a8a9b4)',
};
