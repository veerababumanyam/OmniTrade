/**
 * TradeLayout Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Split panel layout for trading interface
 */

export type SplitDirection = 'horizontal' | 'vertical';

export interface TradeLayoutProps {
  /** Content for the left/top panel (typically chart) */
  leftContent: React.ReactNode;
  /** Content for the right/bottom panel (typically order form) */
  rightContent: React.ReactNode;
  /** Initial split ratio (0-1, default 0.6) */
  splitRatio?: number;
  /** Minimum split ratio */
  minSplitRatio?: number;
  /** Maximum split ratio */
  maxSplitRatio?: number;
  /** Split direction */
  direction?: SplitDirection;
  /** Callback when split ratio changes */
  onSplitChange?: (ratio: number) => void;
  /** Left panel collapsed */
  leftCollapsed?: boolean;
  /** Right panel collapsed */
  rightCollapsed?: boolean;
  /** Left panel collapse callback */
  onLeftCollapse?: (collapsed: boolean) => void;
  /** Right panel collapse callback */
  onRightCollapse?: (collapsed: boolean) => void;
  /** Show fullscreen toggle */
  showFullscreenToggle?: boolean;
  /** Left panel fullscreen */
  leftFullscreen?: boolean;
  /** Right panel fullscreen */
  rightFullscreen?: boolean;
  /** Left fullscreen toggle callback */
  onLeftFullscreen?: (fullscreen: boolean) => void;
  /** Right fullscreen toggle callback */
  onRightFullscreen?: (fullscreen: boolean) => void;
  /** Resizer thickness in pixels */
  resizerSize?: number;
  /** Left panel label */
  leftLabel?: string;
  /** Right panel label */
  rightLabel?: string;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

export type TradeLayoutStyleVars = {
  '--ot-trade-split-ratio'?: string;
  '--ot-trade-resizer-size'?: string;
};
