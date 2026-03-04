/**
 * Dropdown Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode, ReactElement } from 'react';

export type DropdownSize = 'sm' | 'md' | 'lg';

export interface DropdownItem {
  /** Unique identifier */
  key: string;
  /** Display label */
  label: ReactNode;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional description */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Danger/destructive action styling */
  danger?: boolean;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface DropdownGroup {
  /** Group label */
  label: string;
  /** Group items */
  items: DropdownItem[];
  /** Optional group icon */
  icon?: ReactNode;
}

export interface DropdownProps {
  /** Trigger element (button, input, etc.) */
  trigger: ReactElement;
  /** Flat list of items (alternative to groups) */
  items?: DropdownItem[];
  /** Grouped items */
  groups?: DropdownGroup[];
  /** Enable search/filter within items */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Enable multi-select mode */
  multiSelect?: boolean;
  /** Currently selected keys (controlled) */
  selectedKeys?: Set<string> | string[];
  /** Callback when selection changes */
  onChange?: (selectedKeys: Set<string>) => void;
  /** Size variant */
  size?: DropdownSize;
  /** Disabled state */
  disabled?: boolean;
  /** Align dropdown to start/end of trigger */
  align?: 'start' | 'center' | 'end';
  /** Side to open dropdown */
  side?: 'top' | 'bottom';
  /** Offset from trigger in pixels */
  sideOffset?: number;
  /** Custom class name for dropdown content */
  className?: string;
  /** Custom aria-label */
  ariaLabel?: string;
  /** Placeholder when no items match search */
  emptyMessage?: string;
  /** Enable virtual scrolling for large lists */
  virtual?: boolean;
  /** Estimated item height for virtualization (default: 40) */
  itemHeight?: number;
  /** Max visible items before scrolling (default: 8) */
  maxVisibleItems?: number;
  /** Close dropdown after selection (single-select only) */
  closeOnSelect?: boolean;
  /** Custom render function for items */
  renderItem?: (item: DropdownItem, selected: boolean) => ReactNode;
  /** Callback when dropdown opens */
  onOpenChange?: (open: boolean) => void;
}

export interface DropdownContextValue {
  isOpen: boolean;
  selectedKeys: Set<string>;
  multiSelect: boolean;
  highlightedKey: string | null;
  toggleItem: (key: string) => void;
  selectItem: (key: string) => void;
  setHighlightedKey: (key: string | null) => void;
}

export interface DropdownState {
  isOpen: boolean;
  searchQuery: string;
  highlightedKey: string | null;
}

export interface DropdownStyleVars {
  '--dropdown-width': string;
  '--dropdown-font-size': string;
  '--dropdown-item-height': string;
}

export const DROPDOWN_SIZES: Record<DropdownSize, DropdownStyleVars> = {
  sm: {
    '--dropdown-width': '160px',
    '--dropdown-font-size': 'var(--ot-font-size-sm)',
    '--dropdown-item-height': '32px',
  },
  md: {
    '--dropdown-width': '200px',
    '--dropdown-font-size': 'var(--ot-font-size-md)',
    '--dropdown-item-height': '40px',
  },
  lg: {
    '--dropdown-width': '280px',
    '--dropdown-font-size': 'var(--ot-font-size-lg)',
    '--dropdown-item-height': '48px',
  },
} as const;

export const DEFAULT_MAX_VISIBLE_ITEMS = 8;
export const DEFAULT_ITEM_HEIGHT = 40;
export const DEFAULT_SIDE_OFFSET = 4;
