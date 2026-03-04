/**
 * Header Component
 * Liquid Glass Design System - OmniTrade
 *
 * Macro-Volume for app navigation with Photon Physics and Spatial Volumes.
 * Z-axis: translateZ(24px)
 */

import {
  forwardRef,
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from 'react';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  HeaderProps,
  NavItem,
  Notification,
  User,
  HeaderNavSignalData,
  HeaderSearchSignalData,
  HeaderNotificationSignalData,
} from './types';

// ============================================
// ICON COMPONENTS (inline for self-containment)
// ============================================

function SearchIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function BellIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function ChevronDownIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function MenuIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function UserIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ============================================
// AVATAR COMPONENT
// ============================================

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: number;
  status?: User['status'];
  className?: string;
}

function Avatar({ src, alt, initials, size = 32, status, className }: AvatarProps) {
  const statusColors: Record<string, string> = {
    online: 'var(--ot-trading-bullish, #22c55e)',
    offline: 'var(--ot-text-muted, #71717a)',
    busy: 'var(--ot-brand-accent-500, #8b5cf6)',
    away: 'var(--ot-color-warning-icon, #eab308)',
  };

  return (
    <div
      className={cn('relative inline-flex', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-sm font-medium"
          style={{
            background: 'var(--ot-surface-glass-hover, rgba(255, 255, 255, 0.06))',
            color: 'var(--ot-text-secondary, rgba(255, 255, 255, 0.7))',
            fontSize: size * 0.4,
          }}
        >
          {initials || <UserIcon size={size * 0.5} />}
        </div>
      )}
      {status && (
        <div
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            backgroundColor: statusColors[status] || statusColors.offline,
            borderColor: 'var(--ot-surface-elevated, rgba(39, 39, 42, 0.9))',
          }}
        />
      )}
    </div>
  );
}

// ============================================
// HEADER COMPONENT
// ============================================

export const Header = forwardRef<HTMLElement, HeaderProps>(function Header(
  {
    logo,
    navItems = [],
    user,
    userMenuItems = [],
    notifications = [],
    search,
    actions = [],
    onNavClick,
    onSearch,
    onLogout,
    onNotificationClick,
    onMarkAllRead,
    className,
    testId,
    aiReadable = true,
  },
  ref
) {
  // State
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchExpanded(true);
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setSearchExpanded(false);
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.disabled) return;
      onNavClick?.(item);
      item.onClick?.();

      // Emit signal
      const signalData: HeaderNavSignalData = {
        item,
        source: 'desktop',
      };
      signalBus.publish('nav:navigate', signalData, { source: 'Header' });
    },
    [onNavClick]
  );

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    onSearch?.(searchQuery);
    search?.onSearch?.(searchQuery);

    // Emit signal
    const signalData: HeaderSearchSignalData = {
      query: searchQuery,
    };
    signalBus.publish('ui:search:submit', signalData, { source: 'Header' });
  }, [searchQuery, onSearch, search]);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      onNotificationClick?.(notification);
      notification.onClick?.();

      // Emit signal
      const signalData: HeaderNotificationSignalData = {
        notification,
        action: 'click',
      };
      signalBus.publish('ui:notification:click', signalData, { source: 'Header' });
    },
    [onNotificationClick]
  );

  const handleLogout = useCallback(() => {
    setUserMenuOpen(false);
    onLogout?.();
  }, [onLogout]);

  // Computed values
  const unreadCount = notifications.filter((n) => n.unread).length;
  const defaultLogo = (
    <div className={styles.logoLink}>
      <div className={styles.logoIcon}>
        <svg viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--ot-brand-primary-500, #0070f3)" />
              <stop offset="100%" stopColor="var(--ot-brand-accent-500, #8b5cf6)" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="14" stroke="url(#logo-gradient)" strokeWidth="2" fill="none" />
          <path
            d="M10 16l4 4 8-8"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <span className={styles.logoText}>OmniTrade</span>
    </div>
  );

  return (
    <header
      ref={ref}
      className={cn(
        styles.header,
        scrolled && styles.headerScrolled,
        className
      )}
      data-testid={testId}
      {...(aiReadable && {
        'data-ai-header': 'true',
        'data-ai-scrolled': scrolled,
      })}
    >
      <div className={styles.headerInner}>
        {/* Logo */}
        <div className={styles.logo}>
          {logo || defaultLogo}
        </div>

        {/* Navigation */}
        {navItems.length > 0 && (
          <nav className={styles.nav} aria-label="Main navigation">
            <ul className={styles.navList}>
              {navItems.map((item) => (
                <li key={item.id} className={styles.navItem}>
                  <a
                    href={item.href}
                    className={cn(
                      styles.navLink,
                      item.active && styles.navLinkActive,
                      item.disabled && styles.navLinkDisabled
                    )}
                    onClick={(e) => {
                      if (!item.href || item.href === '#') {
                        e.preventDefault();
                      }
                      handleNavClick(item);
                    }}
                    aria-current={item.active ? 'page' : undefined}
                    {...(aiReadable && {
                      'data-ai-nav-id': item.id,
                      'data-ai-nav-active': item.active,
                    })}
                  >
                    {item.icon && <item.icon size={18} />}
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={styles.navBadge}>{item.badge > 99 ? '99+' : item.badge}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Right Section: Search, Actions, User */}
        <div className={styles.actions}>
          {/* Search */}
          {search || onSearch ? (
            <div className={styles.searchContainer}>
              <div className={cn(styles.search, searchExpanded && styles.searchExpanded)}>
                <span className={styles.searchIcon}>
                  <SearchIcon size={18} />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder={search?.placeholder || 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => setSearchExpanded(true)}
                  onBlur={() => {
                    if (!searchQuery) setSearchExpanded(false);
                  }}
                  {...(aiReadable && { 'data-ai-search-input': 'true' })}
                />
                {search?.shortcut && (
                  <span className={styles.searchShortcut}>{search.shortcut}</span>
                )}
              </div>
            </div>
          ) : null}

          {/* Custom Actions */}
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={cn(
                styles.actionButton,
                action.disabled && styles.actionButtonDisabled
              )}
              onClick={action.onClick}
              disabled={action.disabled}
              aria-label={action.label}
              {...(aiReadable && { 'data-ai-action-id': action.id })}
            >
              <action.icon size={20} />
              {action.badge !== undefined && action.badge > 0 && (
                <span className={styles.actionBadge}>
                  {action.badge > 99 ? '99+' : action.badge}
                </span>
              )}
            </button>
          ))}

          {/* Notifications */}
          {notifications.length > 0 && (
            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                {...(aiReadable && { 'data-ai-notifications-toggle': 'true' })}
              >
                <BellIcon size={20} />
                {unreadCount > 0 && (
                  <span className={cn(styles.actionBadge, styles.actionBadgeBullish)}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <div
                className={cn(
                  styles.notificationsDropdown,
                  notificationsOpen && styles.notificationsDropdownOpen
                )}
              >
                <div className={styles.notificationsHeader}>
                  <span className={styles.notificationsTitle}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className={styles.notificationsMarkAll}
                      onClick={() => onMarkAllRead?.()}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className={styles.notificationsList}>
                  {notifications.length === 0 ? (
                    <div className={styles.notificationsEmpty}>
                      <BellIcon size={32} className="opacity-50 mb-2" />
                      <span>No notifications</span>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          styles.notificationItem,
                          notification.unread && styles.notificationItemUnread
                        )}
                        onClick={() => handleNotificationClick(notification)}
                        {...(aiReadable && { 'data-ai-notification-id': notification.id })}
                      >
                        <div className={styles.notificationIcon}>
                          {notification.icon ? (
                            <notification.icon size={18} />
                          ) : (
                            <BellIcon size={18} />
                          )}
                        </div>
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationTitle}>{notification.title}</div>
                          {notification.description && (
                            <div className={styles.notificationDescription}>
                              {notification.description}
                            </div>
                          )}
                          {notification.timestamp && (
                            <div className={styles.notificationTime}>
                              {typeof notification.timestamp === 'string'
                                ? notification.timestamp
                                : notification.timestamp.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* User Menu */}
          {user && (
            <div ref={userMenuRef} className={styles.userMenuContainer}>
              <button
                type="button"
                className={cn(
                  styles.userMenuTrigger,
                  userMenuOpen && styles.userMenuTriggerOpen
                )}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                {...(aiReadable && { 'data-ai-user-menu-toggle': 'true' })}
              >
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  initials={user.initials || user.name.slice(0, 2).toUpperCase()}
                  status={user.status}
                  size={36}
                />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  {user.role && <span className={styles.userRole}>{user.role}</span>}
                </div>
                <ChevronDownIcon
                  size={16}
                  className={cn(styles.userChevron, userMenuOpen && styles.userChevronOpen)}
                />
              </button>

              {/* User Menu Dropdown */}
              <div
                className={cn(
                  styles.userMenuDropdown,
                  userMenuOpen && styles.userMenuDropdownOpen
                )}
              >
                <div className={styles.userMenuHeader}>
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    initials={user.initials || user.name.slice(0, 2).toUpperCase()}
                    size={40}
                  />
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name}</span>
                    {user.email && <span className={styles.userRole}>{user.email}</span>}
                  </div>
                </div>
                <div className={styles.userMenuBody}>
                  {userMenuItems.map((item) => (
                    <div key={item.id}>
                      {item.dividerBefore && <div className={styles.userMenuDivider} />}
                      <button
                        type="button"
                        className={cn(
                          styles.userMenuItem,
                          item.danger && styles.userMenuItemDanger,
                          item.disabled && styles.userMenuItemDisabled
                        )}
                        onClick={() => {
                          if (item.id === 'logout') {
                            handleLogout();
                          } else {
                            item.onClick?.();
                            setUserMenuOpen(false);
                          }
                        }}
                        disabled={item.disabled}
                        {...(aiReadable && { 'data-ai-menu-item-id': item.id })}
                      >
                        {item.icon && <item.icon size={18} />}
                        <span>{item.label}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
});

export default Header;

// CSS module styles mapping
const styles = {
  header: 'header',
  headerScrolled: 'headerScrolled',
  headerInner: 'headerInner',
  logo: 'logo',
  logoLink: 'logoLink',
  logoIcon: 'logoIcon',
  logoText: 'logoText',
  nav: 'nav',
  navList: 'navList',
  navItem: 'navItem',
  navLink: 'navLink',
  navLinkActive: 'navLinkActive',
  navLinkDisabled: 'navLinkDisabled',
  navBadge: 'navBadge',
  searchContainer: 'searchContainer',
  search: 'search',
  searchExpanded: 'searchExpanded',
  searchIcon: 'searchIcon',
  searchInput: 'searchInput',
  searchShortcut: 'searchShortcut',
  actions: 'actions',
  actionButton: 'actionButton',
  actionButtonDisabled: 'actionButtonDisabled',
  actionBadge: 'actionBadge',
  actionBadgeBullish: 'actionBadgeBullish',
  userMenuContainer: 'userMenuContainer',
  userMenuTrigger: 'userMenuTrigger',
  userMenuTriggerOpen: 'userMenuTriggerOpen',
  userInfo: 'userInfo',
  userName: 'userName',
  userRole: 'userRole',
  userChevron: 'userChevron',
  userChevronOpen: 'userChevronOpen',
  userMenuDropdown: 'userMenuDropdown',
  userMenuDropdownOpen: 'userMenuDropdownOpen',
  userMenuHeader: 'userMenuHeader',
  userMenuBody: 'userMenuBody',
  userMenuItem: 'userMenuItem',
  userMenuItemDanger: 'userMenuItemDanger',
  userMenuItemDisabled: 'userMenuItemDisabled',
  userMenuDivider: 'userMenuDivider',
  notificationsDropdown: 'notificationsDropdown',
  notificationsDropdownOpen: 'notificationsDropdownOpen',
  notificationsHeader: 'notificationsHeader',
  notificationsTitle: 'notificationsTitle',
  notificationsMarkAll: 'notificationsMarkAll',
  notificationsList: 'notificationsList',
  notificationsEmpty: 'notificationsEmpty',
  notificationItem: 'notificationItem',
  notificationItemUnread: 'notificationItemUnread',
  notificationIcon: 'notificationIcon',
  notificationContent: 'notificationContent',
  notificationTitle: 'notificationTitle',
  notificationDescription: 'notificationDescription',
  notificationTime: 'notificationTime',
  mobileMenuToggle: 'mobileMenuToggle',
};
