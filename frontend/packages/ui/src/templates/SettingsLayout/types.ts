/**
 * SettingsLayout Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Settings page layout with sidebar navigation and content area
 */

export interface SettingsSection {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component or name */
  icon?: React.ReactNode;
  /** Description for the section */
  description?: string;
  /** Is section disabled */
  disabled?: boolean;
  /** Badge count or text */
  badge?: number | string;
  /** Sub-sections */
  children?: SettingsSection[];
}

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation href */
  href?: string;
  /** Click handler */
  onClick?: () => void;
}

export interface SettingsLayoutProps {
  /** Settings sections */
  sections: SettingsSection[];
  /** Currently active section ID */
  activeSection?: string;
  /** Callback when section changes */
  onSectionChange?: (sectionId: string) => void;
  /** Main content children */
  children: React.ReactNode;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Show back button */
  showBackButton?: boolean;
  /** Back button click handler */
  onBackClick?: () => void;
  /** Back button label */
  backButtonLabel?: string;
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Sidebar width */
  sidebarWidth?: string;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

export type SettingsLayoutStyleVars = {
  '--ot-settings-sidebar-width'?: string;
};
