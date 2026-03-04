/**
 * Header Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Macro-Volume for app navigation with Photon Physics and Spatial Volumes
 */

import type { ReactNode, ComponentType } from 'react';

// ============================================
// NAVIGATION TYPES
// ============================================

export interface NavItem {
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
  /** Sub-items for dropdown */
  children?: NavItem[];
  /** Click handler override */
  onClick?: () => void;
}

export interface NavAction {
  /** Unique identifier */
  id: string;
  /** Icon component */
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Accessible label */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** Badge count */
  badge?: number;
  /** Whether action is disabled */
  disabled?: boolean;
}

// ============================================
// USER MENU TYPES
// ============================================

export interface UserMenuItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** Click handler */
  onClick?: () => void;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Divider before this item */
  dividerBefore?: boolean;
  /** Danger/destructive action styling */
  danger?: boolean;
}

export interface User {
  /** User unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Email address */
  email?: string;
  /** Avatar image URL */
  avatar?: string;
  /** User initials for avatar fallback */
  initials?: string;
  /** User role or title */
  role?: string;
  /** Online status */
  status?: 'online' | 'offline' | 'busy' | 'away';
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  /** Unique identifier */
  id: string;
  /** Notification title */
  title: string;
  /** Notification description */
  description?: string;
  /** Timestamp */
  timestamp?: Date | string;
  /** Whether notification is unread */
  unread?: boolean;
  /** Notification type */
  type?: 'info' | 'success' | 'warning' | 'error';
  /** Icon component override */
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** Click handler */
  onClick?: () => void;
}

// ============================================
// SEARCH TYPES
// ============================================

export interface SearchResult {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Optional description */
  description?: string;
  /** Result category */
  category?: string;
  /** Icon component */
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** Click handler */
  onClick?: () => void;
}

export interface SearchProps {
  /** Placeholder text */
  placeholder?: string;
  /** Search handler */
  onSearch: (query: string) => void | Promise<void>;
  /** Optional search results */
  results?: SearchResult[];
  /** Loading state */
  loading?: boolean;
  /** Keyboard shortcut to focus */
  shortcut?: string;
}

// ============================================
// HEADER PROPS
// ============================================

export interface HeaderProps {
  /** Logo element or component */
  logo?: ReactNode;
  /** Navigation items */
  navItems?: NavItem[];
  /** Current user info */
  user?: User;
  /** User menu items */
  userMenuItems?: UserMenuItem[];
  /** Notifications list */
  notifications?: Notification[];
  /** Search configuration */
  search?: SearchProps;
  /** Additional action buttons */
  actions?: NavAction[];
  /** Callback when nav item is clicked */
  onNavClick?: (item: NavItem) => void;
  /** Callback when search is triggered */
  onSearch?: (query: string) => void | Promise<void>;
  /** Callback when user logs out */
  onLogout?: () => void;
  /** Callback when notification is clicked */
  onNotificationClick?: (notification: Notification) => void;
  /** Callback to mark all notifications as read */
  onMarkAllRead?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Enable AI-readable data attributes */
  aiReadable?: boolean;
}

// ============================================
// SUB-COMPONENT PROPS
// ============================================

export interface HeaderLogoProps {
  /** Logo content */
  children?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS class */
  className?: string;
}

export interface HeaderNavProps {
  /** Navigation items */
  items: NavItem[];
  /** Active item ID */
  activeId?: string;
  /** Click handler */
  onItemClick?: (item: NavItem) => void;
  /** Additional CSS class */
  className?: string;
}

export interface HeaderSearchProps extends SearchProps {
  /** Whether search is expanded */
  expanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Additional CSS class */
  className?: string;
}

export interface HeaderUserMenuProps {
  /** User info */
  user: User;
  /** Menu items */
  items?: UserMenuItem[];
  /** Logout handler */
  onLogout?: () => void;
  /** Additional CSS class */
  className?: string;
}

export interface HeaderNotificationsProps {
  /** Notifications list */
  notifications?: Notification[];
  /** Click handler */
  onClick?: (notification: Notification) => void;
  /** Mark all as read handler */
  onMarkAllRead?: () => void;
  /** Additional CSS class */
  className?: string;
}

export interface HeaderMobileMenuProps {
  /** Whether menu is open */
  isOpen: boolean;
  /** Toggle handler */
  onToggle: () => void;
  /** Additional CSS class */
  className?: string;
}

// ============================================
// SIGNAL DATA TYPES
// ============================================

export interface HeaderNavSignalData {
  /** Navigation item that was clicked */
  item: NavItem;
  /** Navigation source */
  source: 'desktop' | 'mobile';
}

export interface HeaderSearchSignalData {
  /** Search query */
  query: string;
  /** Results count if available */
  resultsCount?: number;
}

export interface HeaderNotificationSignalData {
  /** Notification that was clicked */
  notification: Notification;
  /** Action type */
  action: 'click' | 'mark_read' | 'dismiss';
}

// ============================================
// CONSTANTS
// ============================================

export const HEADER_Z_INDEX = 24;
export const HEADER_HEIGHT = 64;
export const HEADER_HEIGHT_MOBILE = 56;

export const DEFAULT_USER_MENU_ITEMS: UserMenuItem[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'profile', label: 'Profile' },
  { id: 'logout', label: 'Log out', dividerBefore: true, danger: true },
];
