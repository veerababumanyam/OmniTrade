/**
 * DashboardLayout Component
 * Liquid Glass Design System - OmniTrade
 *
 * Main dashboard layout with header, collapsible sidebar, main content, and footer.
 * Responsive design with mobile sidebar overlay.
 */

import React, { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import type { DashboardLayoutProps, SidebarItem, User } from './types';
import styles from './styles.module.css';

/**
 * Renders a sidebar item with optional badge and children
 */
const renderSidebarItem = (
  item: SidebarItem,
  isCollapsed: boolean,
  onItemClick?: (item: SidebarItem) => void
): React.ReactNode => {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div key={item.id}>
      <a
        href={item.href}
        className={clsx(
          styles.sidebarItem,
          item.isActive && styles.sidebarItemActive,
          item.disabled && styles.sidebarItemDisabled
        )}
        onClick={(e) => {
          if (item.disabled) {
            e.preventDefault();
            return;
          }
          if (!item.href) {
            e.preventDefault();
          }
          onItemClick?.(item);
          item.onClick?.();
        }}
        aria-current={item.isActive ? 'page' : undefined}
        aria-disabled={item.disabled}
      >
        {item.icon && (
          <span className={styles.sidebarItemIcon} aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span
          className={clsx(styles.sidebarItemLabel, isCollapsed && styles.sidebarItemLabelHidden)}
        >
          {item.label}
        </span>
        {item.badge !== undefined && !isCollapsed && (
          <span className={styles.sidebarItemBadge}>{item.badge}</span>
        )}
      </a>
      {/* Render children if expanded and not collapsed */}
      {hasChildren && !isCollapsed && (
        <div style={{ paddingLeft: 'var(--ot-space-4)' }}>
          {item.children!.map((child) => renderSidebarItem(child, isCollapsed, onItemClick))}
        </div>
      )}
    </div>
  );
};

/**
 * Groups sidebar items by section
 */
const groupBySection = (items: SidebarItem[]): Record<string, SidebarItem[]> => {
  const groups: Record<string, SidebarItem[]> = {};

  items.forEach((item) => {
    const section = item.section || 'main';
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(item);
  });

  return groups;
};

/**
 * Renders notification icon with badge
 */
const NotificationIcon: React.FC<{
  count: number;
  onClick: () => void;
}> = ({ count, onClick }) => (
  <button
    className={styles.notificationButton}
    onClick={onClick}
    aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
    {count > 0 && (
      <span className={styles.notificationBadge} aria-hidden="true">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);

/**
 * Renders user menu
 */
const UserMenu: React.FC<{
  user: User;
  onClick?: () => void;
}> = ({ user, onClick }) => (
  <div
    className={styles.userMenu}
    onClick={onClick}
    role="button"
    tabIndex={0}
    aria-label={`User menu for ${user.name}`}
  >
    <div className={styles.userInfo}>
      <span className={styles.userName}>{user.name}</span>
      {user.role && <span className={styles.userRole}>{user.role}</span>}
    </div>
    {user.avatar && (
      typeof user.avatar === 'string' ? (
        <img
          src={user.avatar}
          alt={user.name}
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--ot-radius-full)',
            objectFit: 'cover',
          }}
        />
      ) : (
        user.avatar
      )
    )}
  </div>
);

/**
 * DashboardLayout provides a complete dashboard page structure.
 *
 * @example
 * // Basic dashboard
 * <DashboardLayout
 *   title="OmniTrade"
 *   logo={<Logo />}
 *   user={{ id: '1', name: 'John Doe', role: 'Trader' }}
 *   sidebarItems={navigationItems}
 *   notifications={notifications}
 * >
 *   <DashboardContent />
 * </DashboardLayout>
 *
 * @example
 * // With footer
 * <DashboardLayout
 *   title="OmniTrade"
 *   user={currentUser}
 *   sidebarItems={navItems}
 *   showFooter
 *   footer={<Footer />}
 * >
 *   <MainContent />
 * </DashboardLayout>
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  sidebarItems = [],
  navItems = [],
  user,
  notifications = [],
  notificationCount = 0,
  logo,
  title = 'OmniTrade',
  children,
  footer,
  showFooter = false,
  sidebarCollapsed: controlledCollapsed,
  onSidebarCollapse,
  onNotificationClick,
  headerContent,
  className,
  testId,
}) => {
  // Internal state for uncontrolled mode
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine if sidebar is controlled or uncontrolled
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = isControlled ? controlledCollapsed : internalCollapsed;

  // Toggle sidebar collapse
  const handleCollapse = useCallback(() => {
    if (isControlled) {
      onSidebarCollapse?.(!collapsed);
    } else {
      setInternalCollapsed(!collapsed);
      onSidebarCollapse?.(!collapsed);
    }
  }, [collapsed, isControlled, onSidebarCollapse]);

  // Toggle mobile sidebar
  const handleMobileToggle = useCallback(() => {
    setMobileOpen(!mobileOpen);
  }, [mobileOpen]);

  // Close mobile sidebar
  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // Group sidebar items by section
  const groupedItems = groupBySection(sidebarItems);

  return (
    <div
      className={clsx(
        styles.dashboard,
        collapsed && styles.dashboardCollapsed,
        className
      )}
      data-testid={testId}
    >
      {/* Mobile overlay */}
      <div
        className={clsx(styles.sidebarOverlay, mobileOpen && styles.sidebarOverlayVisible)}
        onClick={handleMobileClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={clsx(styles.sidebar, collapsed && styles.sidebarCollapsed, mobileOpen && styles.sidebarOpen)}
        aria-label="Main navigation"
      >
        {/* Sidebar header */}
        <div className={clsx(styles.sidebarHeader, collapsed && styles.sidebarLogoCollapsed)}>
          <div className={clsx(styles.sidebarLogo, collapsed && styles.sidebarLogoCollapsed)}>
            {logo}
            <span className={clsx(styles.sidebarTitle, collapsed && styles.sidebarTitleHidden)}>
              {title}
            </span>
          </div>

          {/* Collapse button - desktop only */}
          <button
            className={styles.sidebarCollapseButton}
            onClick={handleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Sidebar navigation */}
        <nav className={styles.sidebarNav}>
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} className={styles.sidebarSection}>
              {section !== 'main' && (
                <h3 className={clsx(styles.sidebarSectionTitle, collapsed && styles.sidebarSectionTitleHidden)}>
                  {section}
                </h3>
              )}
              {items.map((item) => renderSidebarItem(item, collapsed))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* Mobile menu button */}
          <button
            className={styles.mobileMenuButton}
            onClick={handleMobileToggle}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Header center nav items */}
          {navItems.length > 0 && (
            <div className={styles.headerCenter}>
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={clsx(
                    styles.sidebarItem,
                    item.isActive && styles.sidebarItemActive
                  )}
                  onClick={(e) => {
                    if (!item.href) e.preventDefault();
                    item.onClick?.();
                  }}
                >
                  {item.icon && <span className={styles.sidebarItemIcon}>{item.icon}</span>}
                  <span className={styles.sidebarItemLabel}>{item.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Header right */}
        <div className={styles.headerRight}>
          {headerContent}

          {/* Notifications */}
          {notifications.length > 0 && (
            <NotificationIcon
              count={notificationCount}
              onClick={() => onNotificationClick?.(notifications[0])}
            />
          )}

          {/* User menu */}
          {user && <UserMenu user={user} />}
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main} role="main">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className={clsx(styles.footer, !showFooter && styles.footerHidden)}>
          {footer}
        </footer>
      )}
    </div>
  );
};

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;
