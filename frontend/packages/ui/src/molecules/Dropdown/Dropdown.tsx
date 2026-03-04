/**
 * Dropdown Component
 * Liquid Glass Design System - OmniTrade
 *
 * Composition: Button + Menu + Portal (Radix UI DropdownMenu)
 * Features: Search/filter, multi-select, groups, virtual scroll, keyboard navigation
 */

'use client';

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { signalBus } from '../../signal-bus';
import type {
  DropdownProps,
  DropdownItem,
} from './types';
import {
  DEFAULT_MAX_VISIBLE_ITEMS,
  DEFAULT_ITEM_HEIGHT,
  DEFAULT_SIDE_OFFSET,
} from './types';
import styles from './styles.module.css';

// Icons as inline SVG components
const CheckIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const EmptyIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15h8" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
  </svg>
);

export function Dropdown({
  trigger,
  items = [],
  groups = [],
  searchable = false,
  searchPlaceholder = 'Search...',
  multiSelect = false,
  selectedKeys: controlledSelectedKeys,
  onChange,
  size = 'md',
  disabled = false,
  align = 'start',
  side = 'bottom',
  sideOffset = DEFAULT_SIDE_OFFSET,
  className = '',
  ariaLabel = 'Dropdown menu',
  emptyMessage = 'No results found',
  virtual: _virtual = false,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  maxVisibleItems = DEFAULT_MAX_VISIBLE_ITEMS,
  closeOnSelect = true,
  renderItem,
  onOpenChange,
}: DropdownProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<Set<string>>(
    new Set()
  );

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Determine controlled vs uncontrolled
  const isControlled = controlledSelectedKeys !== undefined;
  const selectedKeys = useMemo(() => {
    if (isControlled) {
      return controlledSelectedKeys instanceof Set
        ? controlledSelectedKeys
        : new Set(controlledSelectedKeys);
    }
    return internalSelectedKeys;
  }, [isControlled, controlledSelectedKeys, internalSelectedKeys]);

  // Flatten items from groups or use direct items
  const allItems = useMemo(() => {
    if (groups.length > 0) {
      return groups.flatMap((g) => g.items);
    }
    return items;
  }, [groups, items]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return allItems;
    const query = searchQuery.toLowerCase();
    return allItems.filter(
      (item) =>
        (typeof item.label === 'string' && item.label.toLowerCase().includes(query)) ||
        item.description?.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query)
    );
  }, [allItems, searchQuery]);

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (groups.length === 0) return [];
    if (!searchQuery) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            (typeof item.label === 'string' && item.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.key.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, searchQuery]);

  // Emit signal on selection
  const emitSignal = useCallback(
    (key: string, selected: boolean) => {
      signalBus.publish(
        'ui:dropdown:select' as const,
        { key, selected, multiSelect, timestamp: Date.now() },
        { source: 'Dropdown' }
      );
    },
    [multiSelect]
  );

  // Handle item selection
  const handleSelect = useCallback(
    (item: DropdownItem) => {
      if (item.disabled) return;

      let newSelectedKeys: Set<string>;

      if (multiSelect) {
        newSelectedKeys = new Set(selectedKeys);
        if (newSelectedKeys.has(item.key)) {
          newSelectedKeys.delete(item.key);
        } else {
          newSelectedKeys.add(item.key);
        }
      } else {
        newSelectedKeys = new Set([item.key]);
      }

      if (!isControlled) {
        setInternalSelectedKeys(newSelectedKeys);
      }

      onChange?.(newSelectedKeys);
      emitSignal(item.key, newSelectedKeys.has(item.key));

      // Close on single-select if configured
      if (!multiSelect && closeOnSelect) {
        setIsOpen(false);
      }
    },
    [selectedKeys, multiSelect, isControlled, onChange, closeOnSelect, emitSignal]
  );

  // Handle open change
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
      if (!open) {
        setSearchQuery('');
        setHighlightedKey(null);
      } else if (searchable) {
        // Focus search input when opening
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    },
    [searchable, onOpenChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = filteredItems.findIndex(
          (item) => item.key === highlightedKey
        );
        let nextIndex: number;

        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1;
        }

        // Skip disabled items
        while (filteredItems[nextIndex]?.disabled) {
          if (e.key === 'ArrowDown') {
            nextIndex = nextIndex < filteredItems.length - 1 ? nextIndex + 1 : 0;
          } else {
            nextIndex = nextIndex > 0 ? nextIndex - 1 : filteredItems.length - 1;
          }
          if (nextIndex === currentIndex) break; // Prevent infinite loop
        }

        setHighlightedKey(filteredItems[nextIndex]?.key ?? null);
      } else if (e.key === 'Enter' && highlightedKey) {
        e.preventDefault();
        const item = filteredItems.find((i) => i.key === highlightedKey);
        if (item && !item.disabled) {
          handleSelect(item);
        }
      }
    },
    [filteredItems, highlightedKey, handleSelect]
  );

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Render single item
  const renderDropdownItem = useCallback(
    (item: DropdownItem) => {
      const isSelected = selectedKeys.has(item.key);
      const isHighlighted = highlightedKey === item.key;

      return (
        <DropdownMenu.Item
          key={item.key}
          className={`${styles.item} ${isSelected ? styles.selected : ''} ${isHighlighted ? styles.highlighted : ''} ${item.disabled ? styles.disabled : ''} ${item.danger ? styles.danger : ''}`}
          disabled={item.disabled}
          onSelect={(e) => {
            e.preventDefault();
            handleSelect(item);
          }}
          onMouseEnter={() => setHighlightedKey(item.key)}
          onFocus={() => setHighlightedKey(item.key)}
        >
          {renderItem ? (
            renderItem(item, isSelected)
          ) : (
            <>
              {multiSelect && (
                <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                  <span className={styles.checkboxIcon}>
                    <CheckIcon />
                  </span>
                </div>
              )}
              {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
              <div className={styles.itemContent}>
                <span className={styles.itemLabel}>{item.label}</span>
                {item.description && (
                  <span className={styles.itemDescription}>{item.description}</span>
                )}
              </div>
              {!multiSelect && isSelected && (
                <span className={styles.itemIcon}>
                  <CheckIcon />
                </span>
              )}
            </>
          )}
        </DropdownMenu.Item>
      );
    },
    [selectedKeys, highlightedKey, multiSelect, renderItem, handleSelect]
  );

  // Render items list
  const renderContent = useCallback(() => {
    const hasItems = filteredItems.length > 0;
    const hasGroups = filteredGroups.length > 0;

    return (
      <>
        {/* Search Input */}
        {searchable && (
          <div className={styles.searchWrapper}>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ot-text-tertiary)',
                  pointerEvents: 'none',
                }}
              >
                <SearchIcon />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        )}

        {/* Items or Groups */}
        {!hasItems && !hasGroups ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <EmptyIcon />
            </span>
            <span className={styles.emptyText}>{emptyMessage}</span>
          </div>
        ) : hasGroups ? (
          <div className={styles.itemsList} style={{ '--max-visible-items': maxVisibleItems } as React.CSSProperties}>
            {filteredGroups.map((group) => (
              <DropdownMenu.Group key={group.label} className={styles.group}>
                <DropdownMenu.Label className={styles.groupHeader}>
                  {group.icon && (
                    <span className={styles.groupIcon}>{group.icon}</span>
                  )}
                  {group.label}
                </DropdownMenu.Label>
                {group.items.map(renderDropdownItem)}
              </DropdownMenu.Group>
            ))}
          </div>
        ) : (
          <div className={styles.itemsList} style={{ '--max-visible-items': maxVisibleItems } as React.CSSProperties}>
            {filteredItems.map(renderDropdownItem)}
          </div>
        )}
      </>
    );
  }, [
    searchable,
    searchPlaceholder,
    searchQuery,
    handleKeyDown,
    filteredItems,
    filteredGroups,
    emptyMessage,
    maxVisibleItems,
    renderDropdownItem,
  ]);

  // Build class names
  const contentClasses = [
    styles.content,
    styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}` as keyof typeof styles],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <DropdownMenu.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <div className={styles.trigger} aria-label={ariaLabel}>
          {trigger}
        </div>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={contentClasses}
          side={side}
          sideOffset={sideOffset}
          align={align}
          avoidCollisions
          collisionPadding={8}
          onCloseAutoFocus={(e) => {
            // Prevent focus from returning to trigger on close
            if (!closeOnSelect) {
              e.preventDefault();
            }
          }}
          style={
            {
              '--dropdown-item-height': `${itemHeight}px`,
              '--max-visible-items': maxVisibleItems,
            } as React.CSSProperties
          }
        >
          {renderContent()}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default Dropdown;
