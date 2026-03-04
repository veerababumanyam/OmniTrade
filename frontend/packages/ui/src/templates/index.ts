/**
 * Layout Templates
 * Liquid Glass Design System - OmniTrade
 *
 * Export all template components
 */

export { DashboardLayout } from './DashboardLayout';
export type {
  DashboardLayoutProps,
  NavItem as DashboardNavItem,
  SidebarItem as DashboardSidebarItem,
  Notification as DashboardNotification,
  User as DashboardUser,
} from './DashboardLayout';

export { TradeLayout } from './TradeLayout';
export type { TradeLayoutProps, SplitDirection } from './TradeLayout';

export { SettingsLayout } from './SettingsLayout';
export type {
  SettingsLayoutProps,
  SettingsSection,
  BreadcrumbItem as SettingsBreadcrumbItem,
} from './SettingsLayout';

export { AuthLayout } from './AuthLayout';
export type { AuthLayoutProps } from './AuthLayout';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps, EmptyStateSize } from './EmptyState';
