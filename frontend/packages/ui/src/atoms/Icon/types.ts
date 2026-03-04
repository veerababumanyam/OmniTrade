/**
 * Icon Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { SignalTopic } from '../../signal-bus';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type IconColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'muted'
  | 'danger'
  | 'link';

export type IconAnimation = 'spin' | 'pulse' | 'bounce' | 'shake';

export type IconName = string;

export interface IconProps extends Omit<React.SVGAttributes<SVGElement>, 'stroke' | 'color'> {
  /** Icon name (maps to sprite ID) */
  name: IconName;
  /** Size variant */
  size?: IconSize;
  /** Color variant */
  color?: IconColor;
  /** Accessible label */
  label?: string;
  /** Animation type */
  animation?: IconAnimation;
  /** Use stroke-based icon */
  stroke?: boolean;
  /** Hoverable effect */
  hoverable?: boolean;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Signal topic to emit on on 'ui:icon:click' with animation */
  signalTopic?: SignalTopic;
  /** Additional CSS class */
  className?: string;
}
