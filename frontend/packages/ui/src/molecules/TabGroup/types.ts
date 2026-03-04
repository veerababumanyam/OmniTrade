/**
 * TabGroup Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode, HTMLAttributes } from 'react';
import type { IconName } from '../../atoms/Icon/types';

/**
 * Tab variant styles
 */
export type TabVariant = 'underline' | 'pills' | 'enclosed';

/**
 * Tab orientation
 */
export type TabOrientation = 'horizontal' | 'vertical';

/**
 * Individual tab item definition
 */
export interface TabItem {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Optional icon to display before the label */
  icon?: IconName;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Badge count or text to display */
  badge?: number | string;
}

/**
 * Tab panel content definition
 */
export interface TabPanelContent {
  /** Tab ID this panel corresponds to */
  tabId: string;
  /** Panel content */
  content: ReactNode;
  /** Additional CSS class for the panel */
  className?: string;
}

/**
 * Props for the TabGroup component
 */
export interface TabGroupProps {
  /** Array of tab items to render */
  tabs: TabItem[];
  /** Default active tab ID (uncontrolled mode) */
  defaultTab?: string;
  /** Currently active tab ID (controlled mode) */
  activeTab?: string;
  /** Callback when tab changes */
  onChange?: (tabId: string) => void;
  /** Visual variant of the tabs */
  variant?: TabVariant;
  /** Orientation of the tab list */
  orientation?: TabOrientation;
  /** Array of tab panel content */
  panels?: TabPanelContent[];
  /** Whether to animate the active indicator with spring physics */
  animated?: boolean;
  /** Stiffness for spring animation (higher = stiffer) */
  springStiffness?: number;
  /** Damping for spring animation (higher = less oscillation) */
  springDamping?: number;
  /** Additional CSS class for the root element */
  className?: string;
  /** Additional CSS class for the tab list */
  tabListClassName?: string;
  /** Additional CSS class for tab panels */
  panelClassName?: string;
  /** Whether tabs should take equal width */
  equalWidth?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** ID for the tab group (used for accessibility) */
  id?: string;
  /** ARIA label for the tab list */
  ariaLabel?: string;
}

/**
 * Props for individual Tab trigger component
 */
export interface TabTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  /** Whether this tab is currently selected */
  selected?: boolean;
  /** Whether this tab is disabled */
  disabled?: boolean;
  /** Tab value/ID */
  value: string;
  /** Visual variant */
  variant?: TabVariant;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for TabPanel component
 */
export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Tab value/ID this panel corresponds to */
  value: string;
  /** Whether to keep panel mounted when hidden */
  keepMounted?: boolean;
}

/**
 * Props for TabList component
 */
export interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  /** Orientation of the tab list */
  orientation?: TabOrientation;
  /** Visual variant */
  variant?: TabVariant;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether tabs should take equal width */
  equalWidth?: boolean;
}

/**
 * Signal payload for tab change events
 */
export interface TabChangeSignalPayload {
  /** Previous tab ID */
  previousTabId: string | null;
  /** New tab ID */
  newTabId: string;
  /** Tab group identifier */
  groupId: string;
  /** Source component name */
  source: 'TabGroup';
}

/**
 * CSS custom properties for animated indicator
 */
export interface TabIndicatorStyleVars {
  '--tab-indicator-width': string;
  '--tab-indicator-left': string;
  '--tab-indicator-top'?: string;
  '--tab-indicator-height'?: string;
}
