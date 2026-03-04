/**
 * Breadcrumb Component
 * Liquid Glass Design System - OmniTrade
 *
 * Features:
 * - Collapsible with ellipsis
 * - Click to expand collapsed items
 * - Home icon option
 * - Icon support per item
 * - Separator customization
 * - Truncation for long paths
 * - Signal emission on navigation
 */

'use client';

import React, { useState, useCallback, useMemo, useId } from 'react';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type { IconName } from '../../atoms/Icon/types';
import type {
  BreadcrumbProps,
  BreadcrumbItem as BreadcrumbItemType,
  BreadcrumbNavigateSignalPayload,
} from './types';
import styles from './styles.module.css';

/**
 * Icon component for breadcrumb
 */
const Icon: React.FC<{ name: IconName; className?: string }> = ({
  name,
  className,
}) => {
  const iconPaths: Record<IconName, string> = {
    'chevron-right': 'M9 18l6-6-6-6',
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    'chevron-down': 'M6 9l6 6 6-6',
    'chevron-up': 'M18 15l-6-6-6 6',
    'chevron-left': 'M15 18l-6-6 6-6',
    close: 'M18 6L6 18M6 6l12 12',
    check: 'M20 6L9 17l-5-5',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    menu: 'M4 6h16M4 12h16M4 18h16',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    trade: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    wallet: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    moon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
    sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    loading: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
    'arrow-up': 'M5 10l7-7m0 0l7 7m-7-7v18',
    'arrow-down': 'M19 14l-7 7m0 0l-7-7m7 7V3',
    copy: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    filter: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    sort: 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    send: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
    attachment: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
    microphone: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
    volume: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z',
    fullscreen: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4',
    minimize: 'M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25',
    maximize: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
    'external-link': 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
    star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    bookmark: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
    share: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
    'more-horizontal': 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z',
    'more-vertical': 'M12 5h.01M12 12h.01M12 19h.01M13 6a1 1 0 11-2 0 1 1 0 012 0zm0 7a1 1 0 11-2 0 1 1 0 012 0zm0 7a1 1 0 11-2 0 1 1 0 012 0z',
  };

  const path = iconPaths[name];

  if (!path) return null;

  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
};

/**
 * Default separator component
 */
const DefaultSeparator: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size }) => (
  <span
    className={cn(
      styles.breadcrumbSeparator,
      size === 'sm' && styles.sizeSm,
      size === 'lg' && styles.sizeLg
    )}
    aria-hidden="true"
  >
    <Icon name="chevron-right" />
  </span>
);

/**
 * Ellipsis component for collapsed items
 */
const BreadcrumbEllipsis: React.FC<{
  hiddenCount: number;
  onExpand: () => void;
  size?: 'sm' | 'md' | 'lg';
}> = ({ hiddenCount, onExpand, size }) => (
  <li className={styles.breadcrumbItem}>
    <button
      type="button"
      className={cn(
        styles.breadcrumbEllipsis,
        size === 'sm' && styles.sizeSm,
        size === 'lg' && styles.sizeLg
      )}
      onClick={onExpand}
      aria-label={`Show ${hiddenCount} more navigation items`}
    >
      <span className={styles.ellipsisDots}>...</span>
      <span className={styles.hiddenCount}>{hiddenCount}</span>
    </button>
    <DefaultSeparator size={size} />
  </li>
);

/**
 * Breadcrumb Component
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  maxItems = 5,
  collapse = 'middle',
  showHome = false,
  homeIcon = 'home',
  homeHref = '/',
  homeLabel = 'Home',
  separator,
  separatorIcon = 'chevron-right',
  truncateAt = 20,
  onItemClick,
  onExpand,
  className,
  listClassName,
  itemClassName,
  size = 'md',
  glass = false,
  ...props
}) => {
  const [expanded, setExpanded] = useState(false);
  useId(); // for unique component ID

  // Handle item click
  const handleItemClick = useCallback(
    (item: BreadcrumbItemType, index: number, event: React.MouseEvent) => {
      // Emit signal
      const signalPayload: BreadcrumbNavigateSignalPayload = {
        item,
        index,
        totalItems: items.length,
        source: 'Breadcrumb',
      };

      signalBus.publish('ui:breadcrumb:navigate', signalPayload);

      // Call callback
      onItemClick?.(item, event);
    },
    [items.length, onItemClick]
  );

  // Handle expand
  const handleExpand = useCallback(() => {
    setExpanded(true);
    onExpand?.();
  }, [onExpand]);

  // Compute visible items based on collapse mode
  const { visibleItems, hiddenCount } = useMemo(() => {
    if (expanded || items.length <= maxItems || collapse === 'none') {
      return { visibleItems: items, hiddenCount: 0 };
    }

    const itemsToShow = maxItems - 1; // Reserve space for ellipsis

    let visible: BreadcrumbItemType[];
    let hidden: number;

    switch (collapse) {
      case 'start':
        // Show last N items
        visible = items.slice(-itemsToShow);
        hidden = items.length - itemsToShow;
        break;
      case 'end':
        // Show first N items
        visible = items.slice(0, itemsToShow);
        hidden = items.length - itemsToShow;
        break;
      case 'middle':
      default:
        // Show first and last items, collapse middle
        const firstCount = Math.ceil(itemsToShow / 2);
        const lastCount = Math.floor(itemsToShow / 2);
        visible = [
          ...items.slice(0, firstCount),
          ...items.slice(-lastCount),
        ];
        hidden = items.length - itemsToShow;
        break;
    }

    return { visibleItems: visible, hiddenCount: hidden };
  }, [items, maxItems, collapse, expanded]);

  // Truncate label
  const truncateLabel = useCallback(
    (label: string): string => {
      if (label.length <= truncateAt) return label;
      return `${label.slice(0, truncateAt / 2)}...${label.slice(-truncateAt / 2)}`;
    },
    [truncateAt]
  );

  // Render breadcrumb item
  const renderItem = (
    item: BreadcrumbItemType,
    index: number,
    isLast: boolean
  ) => {
    const isCurrent = item.isCurrentPage || isLast;

    return (
      <li
        key={item.id}
        className={cn(
          styles.breadcrumbItem,
          styles.breadcrumbItemAnimated,
          itemClassName
        )}
      >
        {item.href && !isCurrent && !item.disabled ? (
          <a
            href={item.href}
            className={cn(
              styles.breadcrumbLink,
              size === 'sm' && styles.sizeSm,
              size === 'lg' && styles.sizeLg
            )}
            onClick={(e) => handleItemClick(item, index, e)}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {item.icon && (
              <Icon name={item.icon} className={styles.breadcrumbIcon} />
            )}
            <span
              className={styles.breadcrumbLabel}
              title={item.label.length > truncateAt ? item.label : undefined}
            >
              {truncateLabel(item.label)}
            </span>
          </a>
        ) : (
          <span
            className={cn(
              styles.breadcrumbLink,
              isCurrent && styles.breadcrumbCurrent,
              item.disabled && styles.breadcrumbDisabled,
              size === 'sm' && styles.sizeSm,
              size === 'lg' && styles.sizeLg
            )}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {item.icon && (
              <Icon name={item.icon} className={styles.breadcrumbIcon} />
            )}
            <span
              className={styles.breadcrumbLabel}
              title={item.label.length > truncateAt ? item.label : undefined}
            >
              {truncateLabel(item.label)}
            </span>
          </span>
        )}
        {!isLast && (separator || <DefaultSeparator size={size} />)}
      </li>
    );
  };

  return (
    <nav
      className={cn(
        styles.breadcrumb,
        glass && styles.breadcrumbGlass,
        size === 'sm' && styles.sizeSm,
        size === 'lg' && styles.sizeLg,
        className
      )}
      aria-label="Breadcrumb"
      {...props}
    >
      <ol className={cn(styles.breadcrumbList, listClassName)}>
        {/* Home item */}
        {showHome && (
          <li className={cn(styles.breadcrumbItem, itemClassName)}>
            <a
              href={homeHref}
              className={cn(
                styles.breadcrumbHome,
                size === 'sm' && styles.sizeSm,
                size === 'lg' && styles.sizeLg
              )}
              aria-label={homeLabel}
              onClick={(e) =>
                handleItemClick(
                  { id: 'home', label: homeLabel, href: homeHref },
                  -1,
                  e
                )
              }
            >
              <Icon name={homeIcon} />
            </a>
            <DefaultSeparator size={size} />
          </li>
        )}

        {/* Collapsed ellipsis at start */}
        {collapse === 'start' && hiddenCount > 0 && !expanded && (
          <BreadcrumbEllipsis
            hiddenCount={hiddenCount}
            onExpand={handleExpand}
            size={size}
          />
        )}

        {/* Items */}
        {visibleItems.map((item, index) =>
          renderItem(item, index, index === visibleItems.length - 1)
        )}

        {/* Collapsed ellipsis in middle */}
        {collapse === 'middle' && hiddenCount > 0 && !expanded && (
          <>
            {/* Ellipsis is rendered in the middle, we need to split items */}
          </>
        )}
      </ol>
    </nav>
  );
};

/**
 * Breadcrumb with middle collapse logic
 */
export const BreadcrumbWithCollapse: React.FC<BreadcrumbProps> = ({
  items,
  maxItems = 5,
  collapse = 'middle',
  ...props
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(true);
  };

  // Calculate which items to show
  const { firstItems: _firstItems, lastItems: _lastItems, hiddenCount: _hiddenCount } = useMemo(() => {
    if (expanded || items.length <= maxItems || collapse === 'none') {
      return { firstItems: items, lastItems: [], hiddenCount: 0 };
    }

    if (collapse === 'start') {
      const itemsToShow = maxItems - 1;
      return {
        firstItems: [],
        lastItems: items.slice(-itemsToShow),
        hiddenCount: items.length - itemsToShow,
      };
    }

    if (collapse === 'end') {
      const itemsToShow = maxItems - 1;
      return {
        firstItems: items.slice(0, itemsToShow),
        lastItems: [],
        hiddenCount: items.length - itemsToShow,
      };
    }

    // Middle collapse
    const itemsToShow = maxItems - 1;
    const firstCount = Math.ceil(itemsToShow / 2);
    const lastCount = Math.floor(itemsToShow / 2);

    return {
      firstItems: items.slice(0, firstCount),
      lastItems: items.slice(-lastCount),
      hiddenCount: items.length - itemsToShow,
    };
  }, [items, maxItems, collapse, expanded]);

  return (
    <Breadcrumb
      items={items}
      maxItems={maxItems}
      collapse={collapse}
      onExpand={handleExpand}
      {...props}
    />
  );
};

Breadcrumb.displayName = 'Breadcrumb';

export default Breadcrumb;
