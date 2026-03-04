/**
 * TabGroup Component
 * Liquid Glass Design System - OmniTrade
 *
 * Features:
 * - Radix UI Tabs foundation
 * - Animated indicator with spring physics
 * - Multiple variants (underline, pills, enclosed)
 * - Vertical orientation support
 * - Keyboard navigation (left/right/home/end)
 * - Signal emission on tab change
 */

'use client';

import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useId,
} from 'react';
import { Root, List, Trigger, Content } from '@radix-ui/react-tabs';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type { IconName } from '../../atoms/Icon/types';
import type {
  TabGroupProps,
  TabVariant,
  TabChangeSignalPayload,
} from './types';
import styles from './styles.module.css';

/**
 * Get icon component by name (lazy loaded)
 */
const IconComponent: React.FC<{ name: IconName; className?: string }> = ({
  name,
  className,
}) => {
  // Map icon names to SVG paths
  const iconPaths: Record<IconName, string> = {
    'chevron-down': 'M6 9l6 6 6-6',
    'chevron-up': 'M18 15l-6-6-6 6',
    'chevron-left': 'M15 18l-6-6 6-6',
    'chevron-right': 'M9 18l6-6-6-6',
    close: 'M18 6L6 18M6 6l12 12',
    check: 'M20 6L9 17l-5-5',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    menu: 'M4 6h16M4 12h16M4 18h16',
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
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
 * TabGroup Component
 *
 * A fully accessible tabs component with animated indicator and multiple variants.
 */
export const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  defaultTab,
  activeTab,
  onChange,
  variant = 'underline',
  orientation = 'horizontal',
  panels,
  animated = true,
  springStiffness = 300,
  springDamping = 30,
  className,
  tabListClassName,
  panelClassName,
  equalWidth = false,
  size = 'md',
  id,
  ariaLabel,
}) => {
  const generatedId = useId();
  const groupId = id || generatedId;
  const tabListRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const previousTabRef = useRef<string | null>(null);

  // Determine controlled vs uncontrolled mode
  const isControlled = activeTab !== undefined;
  const currentValue = isControlled ? activeTab : defaultTab || tabs[0]?.id;

  // Get variant classes
  const getVariantClasses = useCallback(
    (type: 'list' | 'tab' | 'indicator'): string => {
      const variantMap: Record<TabVariant, Record<string, string>> = {
        underline: {
          list: cn(
            styles.tabListUnderline,
            orientation === 'vertical' && styles.tabListUnderlineVertical
          ),
          tab: cn(
            styles.tabUnderline,
            styles[`tabSize${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles]
          ),
          indicator: cn(
            styles.tabIndicatorUnderline,
            orientation === 'vertical' && styles.tabIndicatorUnderlineVertical,
            animated && styles.tabIndicatorSpring
          ),
        },
        pills: {
          list: styles.tabListPills,
          tab: cn(
            styles.tabPills,
            styles[`tabSize${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles]
          ),
          indicator: cn(
            styles.tabIndicatorPills,
            orientation === 'vertical' && styles.tabIndicatorPillsVertical,
            animated && styles.tabIndicatorSpring
          ),
        },
        enclosed: {
          list: styles.tabListEnclosed,
          tab: cn(
            styles.tabEnclosed,
            orientation === 'vertical' && styles.tabEnclosedVertical,
            styles[`tabSize${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles]
          ),
          indicator: '', // Enclosed variant doesn't use indicator
        },
      };
      return variantMap[variant][type];
    },
    [variant, orientation, size, animated]
  );

  // Update indicator position
  const updateIndicator = useCallback(
    (_tabId: string) => {
      if (!animated || !tabListRef.current || variant === 'enclosed') return;

      const tabElement = tabListRef.current.querySelector(
        `[data-state="active"]`
      ) as HTMLElement;

      if (!tabElement) return;

      const listRect = tabListRef.current.getBoundingClientRect();
      const tabRect = tabElement.getBoundingClientRect();

      if (indicatorRef.current) {
        if (orientation === 'horizontal') {
          indicatorRef.current.style.setProperty(
            '--tab-indicator-left',
            `${tabRect.left - listRect.left}px`
          );
          indicatorRef.current.style.setProperty(
            '--tab-indicator-width',
            `${tabRect.width}px`
          );
        } else {
          indicatorRef.current.style.setProperty(
            '--tab-indicator-top',
            `${tabRect.top - listRect.top}px`
          );
          indicatorRef.current.style.setProperty(
            '--tab-indicator-height',
            `${tabRect.height}px`
          );
        }
      }
    },
    [animated, variant, orientation]
  );

  // Handle tab change
  const handleValueChange = useCallback(
    (newTabId: string) => {
      // Emit signal
      const signalPayload: TabChangeSignalPayload = {
        previousTabId: previousTabRef.current,
        newTabId,
        groupId,
        source: 'TabGroup',
      };

      signalBus.publish('ui:tab:change', signalPayload);

      previousTabRef.current = newTabId;

      // Update indicator after state change
      requestAnimationFrame(() => {
        updateIndicator(newTabId);
      });

      // Call onChange callback
      onChange?.(newTabId);
    },
    [groupId, onChange, updateIndicator]
  );

  // Initialize indicator position
  useEffect(() => {
    if (currentValue) {
      previousTabRef.current = currentValue;
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        updateIndicator(currentValue);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentValue, updateIndicator]);

  // Update indicator on resize
  useEffect(() => {
    if (!animated) return;

    const handleResize = () => {
      if (currentValue) {
        updateIndicator(currentValue);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (tabListRef.current) {
      resizeObserver.observe(tabListRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [animated, currentValue, updateIndicator]);

  // Compute spring transition style
  const springStyle = useMemo(() => {
    if (!animated) return {};
    return {
      '--spring-stiffness': `${springStiffness}`,
      '--spring-damping': `${springDamping}`,
    } as React.CSSProperties;
  }, [animated, springStiffness, springDamping]);

  return (
    <Root
      value={isControlled ? activeTab : undefined}
      defaultValue={isControlled ? undefined : currentValue}
      onValueChange={handleValueChange}
      className={cn(
        styles.tabGroup,
        orientation === 'horizontal' ? styles.tabGroupHorizontal : styles.tabGroupVertical,
        className
      )}
      orientation={orientation}
      id={groupId}
    >
      <List
        ref={tabListRef}
        className={cn(
          styles.tabList,
          orientation === 'horizontal' ? styles.tabListHorizontal : styles.tabListVertical,
          equalWidth && styles.tabListEqualWidth,
          equalWidth && orientation === 'horizontal'
            ? styles.tabListEqualWidthHorizontal
            : equalWidth && styles.tabListEqualWidthVertical,
          getVariantClasses('list'),
          tabListClassName
        )}
        aria-label={ariaLabel || 'Tabs'}
        style={springStyle}
      >
        {/* Animated indicator (not for enclosed variant) */}
        {variant !== 'enclosed' && animated && (
          <div
            ref={indicatorRef}
            className={getVariantClasses('indicator')}
            aria-hidden="true"
          />
        )}

        {tabs.map((tab) => (
          <Trigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className={cn(
              'tab',
              getVariantClasses('tab'),
              styles.tab,
              tab.disabled && getVariantClasses('tab').includes('underline')
                ? styles.tabUnderlineDisabled
                : tab.disabled && getVariantClasses('tab').includes('pills')
                ? styles.tabPillsDisabled
                : tab.disabled && styles.tabEnclosedDisabled
            )}
            data-variant={variant}
          >
            <span className={styles.tabContent}>
              {tab.icon && (
                <IconComponent
                  name={tab.icon}
                  className={cn(styles.tabIcon)}
                />
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    styles.tabBadge,
                    typeof tab.badge === 'number' && tab.badge === 0 && styles.tabBadgeMuted
                  )}
                >
                  {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </span>
          </Trigger>
        ))}
      </List>

      {/* Tab Panels */}
      {panels && panels.length > 0 && (
        <div
          className={cn(
            styles.tabPanelsContainer,
            panelClassName
          )}
        >
          {panels.map((panel) => (
            <Content
              key={panel.tabId}
              value={panel.tabId}
              className={cn(
                styles.tabPanel,
                orientation === 'horizontal'
                  ? styles.tabPanelHorizontal
                  : styles.tabPanelVertical,
                animated && styles.tabPanelAnimated,
                panel.className
              )}
            >
              {panel.content}
            </Content>
          ))}
        </div>
      )}
    </Root>
  );
};

TabGroup.displayName = 'TabGroup';

export default TabGroup;
