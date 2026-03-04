/**
 * SettingsLayout Component
 * Liquid Glass Design System - OmniTrade
 *
 * Settings page layout with sidebar navigation and content area.
 * Includes breadcrumb navigation and back button support.
 */

import React, { useCallback } from 'react';
import { clsx } from 'clsx';
import type { SettingsLayoutProps, SettingsSection, BreadcrumbItem } from './types';
import styles from './styles.module.css';

/**
 * Renders a settings section item
 */
const renderSectionItem = (
  section: SettingsSection,
  activeSection: string | undefined,
  onSectionChange: (id: string) => void
): React.ReactNode => (
  <button
    key={section.id}
    className={clsx(
      styles.sidebarItem,
      activeSection === section.id && styles.sidebarItemActive,
      section.disabled && styles.sidebarItemDisabled
    )}
    onClick={() => !section.disabled && onSectionChange(section.id)}
    disabled={section.disabled}
    aria-current={activeSection === section.id ? 'page' : undefined}
  >
    {section.icon && (
      <span className={styles.sidebarItemIcon} aria-hidden="true">
        {section.icon}
      </span>
    )}
    <div className={styles.sidebarItemContent}>
      <span className={styles.sidebarItemLabel}>{section.label}</span>
      {section.description && (
        <span className={styles.sidebarItemDescription}>{section.description}</span>
      )}
    </div>
    {section.badge !== undefined && (
      <span className={styles.sidebarItemBadge}>{section.badge}</span>
    )}
  </button>
);

/**
 * Renders breadcrumb navigation
 */
const Breadcrumbs: React.FC<{
  items: BreadcrumbItem[];
}> = ({ items }) => (
  <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
    {items.map((item, index) => (
      <React.Fragment key={index}>
        {index > 0 && (
          <span className={styles.breadcrumbSeparator} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        )}
        {item.href || item.onClick ? (
          <a
            href={item.href}
            onClick={(e) => {
              if (item.onClick) {
                e.preventDefault();
                item.onClick();
              }
            }}
            className={clsx(
              styles.breadcrumbItem,
              index === items.length - 1 && styles.breadcrumbItemActive
            )}
            aria-current={index === items.length - 1 ? 'page' : undefined}
          >
            {item.label}
          </a>
        ) : (
          <span
            className={clsx(
              styles.breadcrumbItem,
              index === items.length - 1 && styles.breadcrumbItemActive
            )}
            aria-current={index === items.length - 1 ? 'page' : undefined}
          >
            {item.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

/**
 * SettingsLayout provides a settings page structure with sidebar navigation.
 *
 * @example
 * // Basic settings layout
 * <SettingsLayout
 *   sections={settingsSections}
 *   activeSection="general"
 *   onSectionChange={handleSectionChange}
 *   title="Settings"
 * >
 *   <SettingsContent />
 * </SettingsLayout>
 *
 * @example
 * // With breadcrumbs
 * <SettingsLayout
 *   sections={sections}
 *   activeSection={activeSection}
 *   onSectionChange={setActiveSection}
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Settings', href: '/settings' },
 *     { label: 'General' }
 *   ]}
 *   title="General Settings"
 *   description="Configure your account preferences"
 * >
 *   <GeneralSettings />
 * </SettingsLayout>
 */
export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  sections,
  activeSection,
  onSectionChange,
  children,
  breadcrumbs,
  showBackButton = false,
  onBackClick,
  backButtonLabel = 'Back',
  title,
  description,
  sidebarWidth = '280px',
  className,
  testId,
}) => {
  // Handle section change
  const handleSectionChange = useCallback(
    (sectionId: string) => {
      onSectionChange?.(sectionId);
    },
    [onSectionChange]
  );

  return (
    <div
      className={clsx(styles.settingsLayout, className)}
      style={{
        '--ot-settings-sidebar-width': sidebarWidth,
      } as React.CSSProperties}
      data-testid={testId}
    >
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar} aria-label="Settings navigation">
        <nav className={styles.sidebarNav}>
          <div className={styles.sidebarGroup}>
            {sections.map((section) =>
              renderSectionItem(section, activeSection, handleSectionChange)
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

          {/* Back button */}
          {showBackButton && (
            <button
              className={styles.backButton}
              onClick={onBackClick}
              aria-label={backButtonLabel}
            >
              <svg
                className={styles.backButtonIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {backButtonLabel}
            </button>
          )}

          {/* Title */}
          {title && <h1 className={styles.pageTitle}>{title}</h1>}

          {/* Description */}
          {description && <p className={styles.pageDescription}>{description}</p>}
        </header>

        {/* Content */}
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
};

SettingsLayout.displayName = 'SettingsLayout';

export default SettingsLayout;
