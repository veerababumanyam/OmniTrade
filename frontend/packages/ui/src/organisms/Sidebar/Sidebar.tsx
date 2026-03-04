/**
 * Sidebar Component
 * Liquid Glass Design System - OmniTrade
 *
 * Macro-Volume for side navigation with Photon Physics and Spatial Volumes.
 * Z-axis: translateZ(12px)
 */

import {
  forwardRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type KeyboardEvent,
} from 'react';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  SidebarProps,
  SidebarItem,
  SidebarItemGroup,
  SidebarItemProps,
  SidebarToggleSignalData,
  SidebarItemSignalData,
  SidebarSearchSignalData,
} from './types';

// ============================================
// ICON COMPONENTS (inline for self-containment)
// ============================================

function SearchIcon({ size = 18, className }: { size?: number; className?: string }) {
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

function ChevronLeftIcon({ size = 18, className }: { size?: number; className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ size = 18, className }: { size?: number; className?: string }) {
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
      <path d="m9 18 6-6-6-6" />
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

function PinIcon({ size = 16, className }: { size?: number; className?: string }) {
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
      <line x1="12" x2="12" y1="17" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isGroup(item: SidebarItem | SidebarItemGroup): item is SidebarItemGroup {
  return 'items' in item;
}

function flattenItems(items: (SidebarItem | SidebarItemGroup)[]): SidebarItem[] {
  const result: SidebarItem[] = [];
  for (const item of items) {
    if (isGroup(item)) {
      result.push(...item.items);
    } else {
      result.push(item);
    }
  }
  return result;
}

function filterItems(items: (SidebarItem | SidebarItemGroup)[], query: string): Set<string> {
  const matchedIds = new Set<string>();
  const lowerQuery = query.toLowerCase();

  const checkItem = (item: SidebarItem): boolean => {
    const matches = item.label.toLowerCase().includes(lowerQuery);
    if (matches) {
      matchedIds.add(item.id);
    }
    if (item.children) {
      const childMatches = item.children.some((child) => checkItem(child));
      if (childMatches) {
        matchedIds.add(item.id);
      }
    }
    return matches;
  };

  for (const item of items) {
    if (isGroup(item)) {
      item.items.forEach(checkItem);
    } else {
      checkItem(item);
    }
  }

  return matchedIds;
}

// ============================================
// SIDEBAR ITEM COMPONENT
// ============================================

function SidebarItemComponent({
  item,
  collapsed,
  active,
  onClick,
  onExpand,
  pinned,
  filtered,
  level = 0,
  className,
}: SidebarItemProps & { filtered?: boolean }) {
  const [localExpanded, setLocalExpanded] = useState(item.expanded ?? false);
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = item.expanded ?? localExpanded;

  const handleClick = useCallback(() => {
    if (item.disabled) return;
    if (hasChildren) {
      const newState = !isExpanded;
      setLocalExpanded(newState);
      onExpand?.(newState);
    } else {
      onClick?.();
    }
  }, [item.disabled, hasChildren, isExpanded, onExpand, onClick]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  if (filtered === false) {
    return null;
  }

  return (
    <li className={cn(styles.item, level > 0 && styles.nestedItem)} data-ai-sidebar-item-id={item.id}>
      <button
        type="button"
        className={cn(
          styles.itemLink,
          collapsed && styles.itemLinkCollapsed,
          active && styles.itemLinkActive,
          active && collapsed && styles.itemLinkActiveCollapsed,
          item.disabled && styles.itemLinkDisabled,
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={item.disabled}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-current={active ? 'page' : undefined}
      >
        {/* Icon */}
        {item.icon && (
          <span className={cn(styles.itemIcon, collapsed && styles.itemIconCollapsed)}>
            <item.icon size={collapsed ? 22 : 18} />
          </span>
        )}

        {/* Label */}
        <span className={cn(styles.itemLabel, collapsed && styles.itemLabelHidden)}>
          {item.label}
        </span>

        {/* Badge */}
        {item.badge !== undefined && item.badge > 0 && (
          <span className={cn(styles.itemBadge, collapsed && styles.itemBadgeHidden)}>
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}

        {/* Shortcut */}
        {item.shortcut && !collapsed && (
          <span className={styles.itemShortcut}>{item.shortcut}</span>
        )}

        {/* Expand/Collapse Chevron */}
        {hasChildren && !collapsed && (
          <ChevronDownIcon
            size={16}
            className={cn(styles.itemChevron, isExpanded && styles.itemChevronExpanded)}
          />
        )}

        {/* Pin indicator */}
        {pinned && !collapsed && (
          <PinIcon size={14} className="opacity-50" />
        )}

        {/* Tooltip for collapsed state */}
        {collapsed && (
          <span className={styles.tooltip}>{item.tooltip || item.label}</span>
        )}
      </button>

      {/* Nested Items */}
      {hasChildren && (
        <ul
          className={cn(
            styles.nestedItems,
            isExpanded && styles.nestedItemsExpanded,
            level > 0 && (styles[`nestedLevel${level}` as keyof typeof styles] || '')
          )}
        >
          {item.children!.map((child) => (
            <SidebarItemComponent
              key={child.id}
              item={child}
              collapsed={collapsed}
              active={child.active}
              onClick={() => child.onClick?.()}
              level={level + 1}
              filtered={filtered}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ============================================
// SIDEBAR COMPONENT
// ============================================

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
    items,
    collapsed = false,
    onToggle,
    pinned = [],
    footer,
    searchable = false,
    searchPlaceholder = 'Search...',
    activeId,
    onItemClick,
    onItemExpand,
    className,
    testId,
    aiReadable = true,
    enableShortcuts = true,
    ariaLabel = 'Sidebar navigation',
  },
  ref
) {
  const [localCollapsed, setLocalCollapsed] = useState(collapsed);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Sync collapsed state
  useEffect(() => {
    setLocalCollapsed(collapsed);
  }, [collapsed]);

  // Filter items based on search
  const filteredIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return filterItems(items, searchQuery);
  }, [items, searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableShortcuts) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      // Toggle sidebar: Ctrl+B
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        handleToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcuts, localCollapsed]);

  // Handlers
  const handleToggle = useCallback(() => {
    const newState = !localCollapsed;
    setLocalCollapsed(newState);
    onToggle?.(newState);

    // Emit signal
    const signalData: SidebarToggleSignalData = {
      collapsed: newState,
      previousState: localCollapsed,
    };
    signalBus.publish('nav:sidebar:toggle', signalData, { source: 'Sidebar' });
  }, [localCollapsed, onToggle]);

  const handleItemClick = useCallback(
    (item: SidebarItem) => {
      if (item.disabled) return;
      onItemClick?.(item);
      item.onClick?.();

      // Emit signal
      const signalData: SidebarItemSignalData = {
        item,
        action: 'click',
      };
      signalBus.publish('nav:sidebar:item', signalData, { source: 'Sidebar' });
    },
    [onItemClick]
  );

  const handleItemExpand = useCallback(
    (item: SidebarItem, expanded: boolean) => {
      onItemExpand?.(item, expanded);

      // Emit signal
      const signalData: SidebarItemSignalData = {
        item,
        action: expanded ? 'expand' : 'collapse',
      };
      signalBus.publish('nav:sidebar:item', signalData, { source: 'Sidebar' });
    },
    [onItemExpand]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      // Emit signal
      const signalData: SidebarSearchSignalData = {
        query: value,
        resultsCount: filteredIds?.size,
      };
      signalBus.publish('nav:sidebar:search', signalData, { source: 'Sidebar' });
    },
    [filteredIds]
  );

  const handleGroupToggle = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // Pinned items lookup
  const pinnedIds = useMemo(() => new Set(pinned.map((p) => p.itemId)), [pinned]);

  // Render items
  const renderItems = () => {
    return items.map((itemOrGroup) => {
      if (isGroup(itemOrGroup)) {
        const group = itemOrGroup;
        const isGroupCollapsed = !expandedGroups.has(group.id);

        return (
          <div key={group.id} className={styles.itemGroup}>
            {group.label && (
              <button
                type="button"
                className={styles.itemGroupHeader}
                onClick={() => group.collapsible && handleGroupToggle(group.id)}
                disabled={!group.collapsible}
              >
                <span className={cn(styles.itemGroupLabel, localCollapsed && styles.itemGroupLabelHidden)}>
                  {group.label}
                </span>
                {group.collapsible && !localCollapsed && (
                  <ChevronDownIcon
                    size={14}
                    className={cn(styles.itemGroupChevron, isGroupCollapsed && styles.itemGroupChevronCollapsed)}
                  />
                )}
              </button>
            )}
            <ul
              className={cn(
                styles.itemGroupList,
                group.collapsible && isGroupCollapsed && styles.itemGroupListCollapsed
              )}
            >
              {group.items.map((item) => (
                <SidebarItemComponent
                  key={item.id}
                  item={item}
                  collapsed={localCollapsed}
                  active={item.id === activeId || item.active}
                  onClick={() => handleItemClick(item)}
                  onExpand={(expanded) => handleItemExpand(item, expanded)}
                  pinned={pinnedIds.has(item.id)}
                  filtered={filteredIds ? filteredIds.has(item.id) : true}
                />
              ))}
            </ul>
          </div>
        );
      }

      // Single item
      return (
        <ul key={itemOrGroup.id} className={styles.itemGroupList}>
          <SidebarItemComponent
            item={itemOrGroup}
            collapsed={localCollapsed}
            active={itemOrGroup.id === activeId || itemOrGroup.active}
            onClick={() => handleItemClick(itemOrGroup)}
            onExpand={(expanded) => handleItemExpand(itemOrGroup, expanded)}
            pinned={pinnedIds.has(itemOrGroup.id)}
            filtered={filteredIds ? filteredIds.has(itemOrGroup.id) : true}
          />
        </ul>
      );
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(styles.overlay, mobileOpen && styles.overlayVisible)}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        ref={ref as React.Ref<HTMLElement>}
        className={cn(
          styles.sidebar,
          localCollapsed && styles.sidebarCollapsed,
          mobileOpen && styles.sidebarOpen,
          className
        )}
        data-testid={testId}
        aria-label={ariaLabel}
        {...(aiReadable && {
          'data-ai-sidebar': 'true',
          'data-ai-sidebar-collapsed': localCollapsed,
        })}
      >
        {/* Header with Search and Toggle */}
        <div className={cn(styles.header, localCollapsed && styles.headerCollapsed)}>
          {searchable && (
            <div className={cn(styles.searchWrapper, localCollapsed && styles.searchHidden)}>
              <span className={styles.searchIcon}>
                <SearchIcon size={16} />
              </span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                {...(aiReadable && { 'data-ai-sidebar-search': 'true' })}
              />
            </div>
          )}
          <button
            type="button"
            className={cn(styles.toggleButton, localCollapsed && styles.toggleButtonCollapsed)}
            onClick={handleToggle}
            aria-label={localCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            {...(aiReadable && { 'data-ai-sidebar-toggle': 'true' })}
          >
            {localCollapsed ? (
              <ChevronRightIcon size={18} />
            ) : (
              <ChevronLeftIcon size={18} />
            )}
          </button>
        </div>

        {/* Content */}
        <nav className={styles.content}>
          {/* Pinned Section */}
          {pinned.length > 0 && (
            <div className={styles.pinnedSection}>
              <div className={styles.pinnedHeader}>
                <PinIcon size={14} className="opacity-50" />
                <span className={cn(styles.pinnedLabel, localCollapsed && styles.pinnedLabelHidden)}>
                  Pinned
                </span>
              </div>
              <ul className={styles.pinnedList}>
                {pinned.map((pinnedItem) => {
                  const originalItem = flattenItems(items).find((i) => i.id === pinnedItem.itemId);
                  if (!originalItem) return null;
                  return (
                    <SidebarItemComponent
                      key={pinnedItem.itemId}
                      item={{
                        ...originalItem,
                        label: pinnedItem.label,
                        icon: pinnedItem.icon || originalItem.icon,
                      }}
                      collapsed={localCollapsed}
                      active={pinnedItem.itemId === activeId}
                      onClick={() => handleItemClick(originalItem)}
                      pinned
                      filtered
                    />
                  );
                })}
              </ul>
            </div>
          )}

          {/* Main Items */}
          {renderItems()}
        </nav>

        {/* Footer */}
        {footer && (
          <div className={cn(styles.footer, localCollapsed && styles.footerCollapsed)}>
            <div className={styles.footerContent}>{footer}</div>
          </div>
        )}
      </aside>
    </>
  );
});

export default Sidebar;

// CSS module styles mapping
const styles = {
  sidebar: 'sidebar',
  sidebarCollapsed: 'sidebarCollapsed',
  sidebarOpen: 'sidebarOpen',
  overlay: 'overlay',
  overlayVisible: 'overlayVisible',
  header: 'header',
  headerCollapsed: 'headerCollapsed',
  searchWrapper: 'searchWrapper',
  searchIcon: 'searchIcon',
  searchInput: 'searchInput',
  searchHidden: 'searchHidden',
  toggleButton: 'toggleButton',
  toggleButtonCollapsed: 'toggleButtonCollapsed',
  content: 'content',
  itemGroup: 'itemGroup',
  itemGroupHeader: 'itemGroupHeader',
  itemGroupLabel: 'itemGroupLabel',
  itemGroupLabelHidden: 'itemGroupLabelHidden',
  itemGroupChevron: 'itemGroupChevron',
  itemGroupChevronCollapsed: 'itemGroupChevronCollapsed',
  itemGroupList: 'itemGroupList',
  itemGroupListCollapsed: 'itemGroupListCollapsed',
  item: 'item',
  itemLink: 'itemLink',
  itemLinkCollapsed: 'itemLinkCollapsed',
  itemLinkActive: 'itemLinkActive',
  itemLinkActiveCollapsed: 'itemLinkActiveCollapsed',
  itemLinkDisabled: 'itemLinkDisabled',
  itemFiltered: 'itemFiltered',
  itemIcon: 'itemIcon',
  itemIconCollapsed: 'itemIconCollapsed',
  itemLabel: 'itemLabel',
  itemLabelHidden: 'itemLabelHidden',
  itemBadge: 'itemBadge',
  itemBadgeHidden: 'itemBadgeHidden',
  itemShortcut: 'itemShortcut',
  itemShortcutHidden: 'itemShortcutHidden',
  itemChevron: 'itemChevron',
  itemChevronExpanded: 'itemChevronExpanded',
  nestedItems: 'nestedItems',
  nestedItemsExpanded: 'nestedItemsExpanded',
  nestedItem: 'nestedItem',
  nestedLevel1: 'nestedLevel1',
  nestedLevel2: 'nestedLevel2',
  pinnedSection: 'pinnedSection',
  pinnedHeader: 'pinnedHeader',
  pinnedLabel: 'pinnedLabel',
  pinnedLabelHidden: 'pinnedLabelHidden',
  pinnedList: 'pinnedList',
  footer: 'footer',
  footerCollapsed: 'footerCollapsed',
  footerContent: 'footerContent',
  tooltip: 'tooltip',
};
