/**
 * Breadcrumb Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode, HTMLAttributes } from 'react';
import type { IconName } from '../../atoms/Icon/types';

/**
 * Breadcrumb item definition
 */
export interface BreadcrumbItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Navigation href */
  href?: string;
  /** Optional icon to display before the label */
  icon?: IconName;
  /** Whether this item is the current page */
  isCurrentPage?: boolean;
  /** Whether this item is disabled */
  disabled?: boolean;
}

/**
 * Collapse mode for breadcrumb items
 */
export type BreadcrumbCollapse = 'start' | 'middle' | 'end' | 'none';

/**
 * Props for the Breadcrumb component
 */
export interface BreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Maximum number of items to show before collapsing */
  maxItems?: number;
  /** How to collapse items */
  collapse?: BreadcrumbCollapse;
  /** Show home icon as first item */
  showHome?: boolean;
  /** Custom home icon */
  homeIcon?: IconName;
  /** Custom home href */
  homeHref?: string;
  /** Home label for accessibility */
  homeLabel?: string;
  /** Custom separator */
  separator?: ReactNode;
  /** Separator icon name (used if separator not provided) */
  separatorIcon?: IconName;
  /** Maximum width for label truncation (in characters) */
  truncateAt?: number;
  /** Callback when item is clicked */
  onItemClick?: (item: BreadcrumbItem, event: React.MouseEvent) => void;
  /** Callback when collapsed items are expanded */
  onExpand?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Additional CSS class for the list */
  listClassName?: string;
  /** Additional CSS class for items */
  itemClassName?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to use liquid glass styling */
  glass?: boolean;
}

/**
 * Props for BreadcrumbItem component
 */
export interface BreadcrumbItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'onClick'> {
  /** Item data */
  item: BreadcrumbItem;
  /** Whether this is the last item */
  isLast?: boolean;
  /** Truncation length */
  truncateAt?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: (item: BreadcrumbItem, event: React.MouseEvent<HTMLLIElement>) => void;
}

/**
 * Props for BreadcrumbSeparator component
 */
export interface BreadcrumbSeparatorProps extends HTMLAttributes<HTMLSpanElement> {
  /** Custom separator content */
  children?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for BreadcrumbEllipsis component
 */
export interface BreadcrumbEllipsisProps extends HTMLAttributes<HTMLSpanElement> {
  /** Number of hidden items */
  hiddenCount?: number;
  /** Click handler to expand */
  onExpand?: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Signal payload for breadcrumb navigation events
 */
export interface BreadcrumbNavigateSignalPayload {
  /** The clicked item */
  item: BreadcrumbItem;
  /** Index of the item in the breadcrumb trail */
  index: number;
  /** Total items in the breadcrumb trail */
  totalItems: number;
  /** Whether the navigation was prevented */
  prevented?: boolean;
  /** Source component name */
  source: 'Breadcrumb';
}

/**
 * CSS custom properties for breadcrumb
 */
export interface BreadcrumbStyleVars {
  '--breadcrumb-gap': string;
  '--breadcrumb-font-size': string;
}
