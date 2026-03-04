/**
 * DashboardLayout Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Main dashboard layout with header, sidebar, main content, and footer
 */

export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Navigation href */
  href?: string;
  /** Icon component or name */
  icon?: React.ReactNode;
  /** Is item active */
  isActive?: boolean;
  /** Is item disabled */
  disabled?: boolean;
  /** Badge count or text */
  badge?: number | string;
  /** Click handler */
  onClick?: () => void;
  /** Sub-items for nested navigation */
  children?: NavItem[];
}

export interface SidebarItem extends NavItem {
  /** Section header for grouping */
  section?: string;
}

export interface Notification {
  /** Unique identifier */
  id: string;
  /** Notification title */
  title: string;
  /** Notification message */
  message?: string;
  /** Notification type */
  type?: 'info' | 'success' | 'warning' | 'error';
  /** Timestamp */
  timestamp?: Date | string;
  /** Is unread */
  isUnread?: boolean;
  /** Avatar or icon */
  avatar?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
}

export interface User {
  /** User ID */
  id: string;
  /** Display name */
  name: string;
  /** Email address */
  email?: string;
  /** Avatar URL or component */
  avatar?: string | React.ReactNode;
  /** User role */
  role?: string;
}

export interface DashboardLayoutProps {
  /** Sidebar navigation items */
  sidebarItems?: SidebarItem[];
  /** Header navigation items */
  navItems?: NavItem[];
  /** Current user */
  user?: User;
  /** Notifications */
  notifications?: Notification[];
  /** Unread notification count */
  notificationCount?: number;
  /** Logo component or image */
  logo?: React.ReactNode;
  /** App title */
  title?: string;
  /** Main content children */
  children: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Show footer */
  showFooter?: boolean;
  /** Sidebar is collapsed */
  sidebarCollapsed?: boolean;
  /** Sidebar collapse callback */
  onSidebarCollapse?: (collapsed: boolean) => void;
  /** Notification click callback */
  onNotificationClick?: (notification: Notification) => void;
  /** User menu items */
  userMenuItems?: NavItem[];
  /** Additional header content */
  headerContent?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

export type DashboardLayoutStyleVars = {
  '--ot-dashboard-sidebar-width'?: string;
  '--ot-dashboard-header-height'?: string;
};
