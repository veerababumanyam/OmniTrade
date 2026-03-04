/**
 * Sidebar Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Macro-Volume for side navigation with Photon Physics and Spatial Volumes
 */

import type { ReactNode, ComponentType } from 'react';

// ============================================
// SIDEBAR ITEM TYPES
// ============================================

export interface SidebarItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Navigation href or route */
  href?: string;
  /** Icon component */
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** Whether this item is currently active */
  active?: boolean;
  /** Whether this item is disabled */
  disabled?: boolean;
  /** Badge count for notifications */
  badge?: number;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Nested sub-items */
  children?: SidebarItem[];
  /** Whether nested items are expanded */
  expanded?: boolean;
  /** Click handler override */
  onClick?: () => void;
  /** Item group/category */
  group?: string;
  /** Whether item is pinned */
  pinned?: boolean;
  /** Tooltip text (shown when collapsed) */
  tooltip?: string;
}

export interface SidebarItemGroup {
  /** Group identifier */
  id: string;
  /** Group label (shown when not collapsed) */
  label?: string;
  /** Items in this group */
  items: SidebarItem[];
  /** Whether group is collapsible */
  collapsible?: boolean;
  /** Whether group is collapsed */
  collapsed?: boolean;
}

// ============================================
// PINNED ITEM TYPES
// ============================================

export interface PinnedItem {
  /** Reference to sidebar item ID */
  itemId: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** Pinned timestamp */
  pinnedAt?: Date | string;
  /** Custom order index */
  order?: number;
}

// ============================================
// SIDEBAR PROPS
// ============================================

export interface SidebarProps {
  /** Sidebar items or groups */
  items: (SidebarItem | SidebarItemGroup)[];
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onToggle?: (collapsed: boolean) => void;
  /** Pinned items */
  pinned?: PinnedItem[];
  /** Callback when item is pinned/unpinned */
  onPin?: (item: SidebarItem, pinned: boolean) => void;
  /** Footer content */
  footer?: ReactNode;
  /** Show search/filter input */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Current active item ID */
  activeId?: string;
  /** Callback when item is clicked */
  onItemClick?: (item: SidebarItem) => void;
  /** Callback when item is expanded/collapsed */
  onItemExpand?: (item: SidebarItem, expanded: boolean) => void;
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Enable AI-readable data attributes */
  aiReadable?: boolean;
  /** Enable keyboard shortcuts */
  enableShortcuts?: boolean;
  /** Custom aria-label */
  ariaLabel?: string;
}

// ============================================
// SUB-COMPONENT PROPS
// ============================================

export interface SidebarHeaderProps {
  /** Header content */
  children?: ReactNode;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Search configuration */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Additional CSS class */
  className?: string;
}

export interface SidebarContentProps {
  /** Items to render */
  items: (SidebarItem | SidebarItemGroup)[];
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Current active item ID */
  activeId?: string;
  /** Search filter value */
  filter?: string;
  /** Item click handler */
  onItemClick?: (item: SidebarItem) => void;
  /** Item expand handler */
  onItemExpand?: (item: SidebarItem, expanded: boolean) => void;
  /** Pin handler */
  onPin?: (item: SidebarItem, pinned: boolean) => void;
  /** Pinned item IDs */
  pinnedIds?: Set<string>;
  /** Additional CSS class */
  className?: string;
}

export interface SidebarItemProps {
  /** Item data */
  item: SidebarItem;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Whether this item is active */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Expand/collapse handler for items with children */
  onExpand?: (expanded: boolean) => void;
  /** Pin handler */
  onPin?: (pinned: boolean) => void;
  /** Whether item is pinned */
  pinned?: boolean;
  /** Whether item matches search filter */
  filtered?: boolean;
  /** Nesting level */
  level?: number;
  /** Additional CSS class */
  className?: string;
}

export interface SidebarPinnedSectionProps {
  /** Pinned items */
  items: PinnedItem[];
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Click handler */
  onItemClick?: (item: PinnedItem) => void;
  /** Unpin handler */
  onUnpin?: (item: PinnedItem) => void;
  /** Additional CSS class */
  className?: string;
}

export interface SidebarFooterProps {
  /** Footer content */
  children?: ReactNode;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Additional CSS class */
  className?: string;
}

export interface SidebarToggleButtonProps {
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Toggle handler */
  onToggle?: () => void;
  /** Additional CSS class */
  className?: string;
}

// ============================================
// SIGNAL DATA TYPES
// ============================================

export interface SidebarToggleSignalData {
  /** Current collapsed state */
  collapsed: boolean;
  /** Previous collapsed state */
  previousState: boolean;
}

export interface SidebarItemSignalData {
  /** Item that was interacted with */
  item: SidebarItem;
  /** Action type */
  action: 'click' | 'expand' | 'collapse' | 'pin' | 'unpin';
}

export interface SidebarSearchSignalData {
  /** Search query */
  query: string;
  /** Results count */
  resultsCount?: number;
}

// ============================================
// CONSTANTS
// ============================================

export const SIDEBAR_Z_INDEX = 12;
export const SIDEBAR_WIDTH_EXPANDED = 280;
export const SIDEBAR_WIDTH_COLLAPSED = 72;
export const SIDEBAR_ITEM_HEIGHT = 44;
export const SIDEBAR_ITEM_NESTED_INDENT = 16;

export const KEYBOARD_SHORTCUTS = {
  toggle: 'Ctrl+B',
  search: 'Ctrl+K',
  navigateUp: 'ArrowUp',
  navigateDown: 'ArrowDown',
  select: 'Enter',
  expand: 'ArrowRight',
  collapse: 'ArrowLeft',
} as const;
