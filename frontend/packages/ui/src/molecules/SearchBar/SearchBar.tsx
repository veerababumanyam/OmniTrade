/**
 * SearchBar Component
 * Liquid Glass Design System - OmniTrade
 *
 * Composition: Input + Icon + Button
 * Features: Debounced input, suggestions dropdown, keyboard navigation, clear button, loading state
 */

'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { signalBus } from '../../signal-bus';
import type {
  SearchBarProps,
  SearchSuggestion,
} from './types';
import { DEFAULT_DEBOUNCE, DEFAULT_MAX_SUGGESTIONS } from './types';
import styles from './styles.module.css';

// Icons as inline SVG components for self-containment
const SearchIcon = () => (
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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ClearIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.spinnerIcon}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  debounce = DEFAULT_DEBOUNCE,
  suggestions = [],
  loading = false,
  onSuggestionSelect,
  defaultValue = '',
  value: controlledValue,
  onChange,
  size = 'md',
  disabled = false,
  showSearchButton = false,
  searchButtonLabel = 'Search',
  ariaLabel = 'Search',
  className = '',
  id,
  name,
  autoFocus = false,
  maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
  renderSuggestion,
  onFocus,
  onBlur,
  onSuggestionsOpenChange,
}: SearchBarProps) {
  // State management
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine if component is controlled
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  // Filter suggestions based on query and limit
  const filteredSuggestions = useMemo(() => {
    if (!currentValue || suggestions.length === 0) return [];
    const query = currentValue.toLowerCase();
    const filtered = suggestions.filter(
      (s) =>
        s.label.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
    );
    return filtered.slice(0, maxSuggestions);
  }, [currentValue, suggestions, maxSuggestions]);

  // Group suggestions by category
  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, SearchSuggestion[]> = {};
    filteredSuggestions.forEach((suggestion) => {
      const group = suggestion.group || 'default';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(suggestion);
    });
    return groups;
  }, [filteredSuggestions]);

  // Emit signal helper
  const emitSignal = useCallback(
    (query: string) => {
      signalBus.publish(
        'ui:search:query' as const,
        { query, timestamp: Date.now() },
        { source: 'SearchBar' }
      );
    },
    []
  );

  // Debounced change handler
  const debouncedOnChange = useCallback(
    (newValue: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange?.(newValue);
        emitSignal(newValue);
      }, debounce);
    },
    [debounce, onChange, emitSignal]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      debouncedOnChange(newValue);
      setShowSuggestions(newValue.length > 0);
      setHighlightedIndex(-1);
    },
    [isControlled, debouncedOnChange]
  );

  // Handle search action
  const handleSearch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearch?.(currentValue);
    onChange?.(currentValue);
    emitSignal(currentValue);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }, [currentValue, onSearch, onChange, emitSignal]);

  // Handle clear
  const handleClear = useCallback(() => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChange?.('');
    inputRef.current?.focus();
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  }, [isControlled, onChange]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      if (!isControlled) {
        setInternalValue(suggestion.label);
      }
      onSuggestionSelect?.(suggestion);
      onChange?.(suggestion.label);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [isControlled, onSuggestionSelect, onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      const totalSuggestions = filteredSuggestions.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!showSuggestions && totalSuggestions > 0) {
            setShowSuggestions(true);
          }
          setHighlightedIndex((prev) =>
            prev < totalSuggestions - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : totalSuggestions - 1
          );
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && showSuggestions) {
            handleSuggestionSelect(filteredSuggestions[highlightedIndex]);
          } else {
            handleSearch();
          }
          break;

        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;

        case 'Tab':
          setShowSuggestions(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [filteredSuggestions, showSuggestions, highlightedIndex, handleSuggestionSelect, handleSearch]
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
    if (currentValue.length > 0 && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [currentValue, filteredSuggestions.length, onFocus]);

  // Handle blur
  const handleBlur = useCallback(
    (_e: FocusEvent<HTMLInputElement>) => {
      // Delay blur to allow click events on suggestions
      blurTimeoutRef.current = setTimeout(() => {
        setIsFocused(false);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        onBlur?.();
      }, 150);
    },
    [onBlur]
  );

  // Track suggestions dropdown state
  useEffect(() => {
    onSuggestionsOpenChange?.(showSuggestions);
  }, [showSuggestions, onSuggestionsOpenChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Cancel blur timeout when interacting with suggestions
  const handleSuggestionMouseEnter = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
  }, []);

  // Build class names
  const containerClasses = [
    styles.searchBar,
    styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}` as keyof typeof styles],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClasses = [
    styles.inputWrapper,
    isFocused && styles.focused,
    disabled && styles.disabled,
  ]
    .filter(Boolean)
    .join(' ');

  const showClearButton = currentValue.length > 0 && !disabled;

  return (
    <div className={containerClasses}>
      <div className={wrapperClasses}>
        {/* Search Icon */}
        <div className={styles.searchIcon} aria-hidden="true">
          <SearchIcon />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          className={styles.input}
          placeholder={placeholder}
          value={currentValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-activedescendant={
            highlightedIndex >= 0
              ? `suggestion-${highlightedIndex}`
              : undefined
          }
          role="combobox"
        />

        {/* Actions (Right Side) */}
        <div className={styles.actions}>
          {/* Loading Spinner */}
          {loading && (
            <div className={styles.spinner} aria-label="Loading">
              <SpinnerIcon />
            </div>
          )}

          {/* Clear Button */}
          <button
            type="button"
            className={`${styles.clearButton} ${showClearButton ? styles.visible : ''}`}
            onClick={handleClear}
            disabled={disabled}
            aria-label="Clear search"
            tabIndex={showClearButton ? 0 : -1}
          >
            <ClearIcon />
          </button>

          {/* Search Button */}
          {showSearchButton && (
            <button
              type="button"
              className={styles.searchButton}
              onClick={handleSearch}
              disabled={disabled || loading}
              aria-label={searchButtonLabel}
            >
              {searchButtonLabel}
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className={styles.suggestionsDropdown}
          id="search-suggestions"
          role="listbox"
        >
          <ul className={styles.suggestionsList}>
            {Object.entries(groupedSuggestions).map(([group, items], groupIndex) => (
              <li
                key={group}
                className={
                  groupIndex > 0 ? styles.suggestionGroup : undefined
                }
              >
                {group !== 'default' && (
                  <div className={styles.suggestionGroupHeader}>{group}</div>
                )}
                {items.map((suggestion) => {
                  const globalIndex = filteredSuggestions.indexOf(suggestion);
                  const isHighlighted = globalIndex === highlightedIndex;

                  return (
                    <button
                      key={suggestion.id}
                      type="button"
                      id={`suggestion-${globalIndex}`}
                      className={`${styles.suggestionItem} ${isHighlighted ? styles.highlighted : ''}`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      onMouseEnter={handleSuggestionMouseEnter}
                      role="option"
                      aria-selected={isHighlighted}
                    >
                      {renderSuggestion ? (
                        renderSuggestion(suggestion)
                      ) : (
                        <>
                          {suggestion.icon && (
                            <div className={styles.suggestionIcon}>
                              {suggestion.icon}
                            </div>
                          )}
                          <div className={styles.suggestionContent}>
                            <div className={styles.suggestionLabel}>
                              {suggestion.label}
                            </div>
                            {suggestion.description && (
                              <div className={styles.suggestionDescription}>
                                {suggestion.description}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
