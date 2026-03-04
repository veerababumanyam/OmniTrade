/**
 * SearchBar Component Types
 * Liquid Glass Design System - OmniTrade
 */

import type { ReactNode, KeyboardEvent, ChangeEvent } from 'react';

export type SearchBarSize = 'sm' | 'md' | 'lg';

export interface SearchSuggestion {
  /** Unique identifier for the suggestion */
  id: string;
  /** Display label */
  label: string;
  /** Optional description or subtitle */
  description?: string;
  /** Optional icon name or element */
  icon?: ReactNode;
  /** Optional group for categorization */
  group?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface SearchBarProps {
  /** Placeholder text for the input */
  placeholder?: string;
  /** Callback when search is triggered (enter or button click) */
  onSearch?: (query: string) => void;
  /** Debounce delay in milliseconds (default: 300) */
  debounce?: number;
  /** Array of suggestions to display */
  suggestions?: SearchSuggestion[];
  /** Loading state */
  loading?: boolean;
  /** Callback when a suggestion is selected */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** Initial/default value */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Size variant */
  size?: SearchBarSize;
  /** Disabled state */
  disabled?: boolean;
  /** Show search button on the right */
  showSearchButton?: boolean;
  /** Custom search button label */
  searchButtonLabel?: string;
  /** Custom aria-label */
  ariaLabel?: string;
  /** Custom class name */
  className?: string;
  /** Custom ID for the input */
  id?: string;
  /** Name attribute for the input */
  name?: string;
  /** Autofocus on mount */
  autoFocus?: boolean;
  /** Max number of visible suggestions (default: 8) */
  maxSuggestions?: number;
  /** Optional render function for custom suggestion items */
  renderSuggestion?: (suggestion: SearchSuggestion) => ReactNode;
  /** Optional callback for input focus */
  onFocus?: () => void;
  /** Optional callback for input blur */
  onBlur?: () => void;
  /** Optional callback when suggestions dropdown opens/closes */
  onSuggestionsOpenChange?: (open: boolean) => void;
}

export interface SearchBarState {
  query: string;
  isFocused: boolean;
  showSuggestions: boolean;
  highlightedIndex: number;
}

export interface SearchBarKeyboardEvent extends KeyboardEvent<HTMLInputElement> {
  key: 'ArrowUp' | 'ArrowDown' | 'Enter' | 'Escape' | 'Tab';
}

export interface SearchBarChangeEvent extends ChangeEvent<HTMLInputElement> {}

export interface SearchBarStyleVars {
  '--searchbar-height': string;
  '--searchbar-font-size': string;
  '--searchbar-padding-x': string;
}

export const SEARCHBAR_SIZES: Record<SearchBarSize, SearchBarStyleVars> = {
  sm: {
    '--searchbar-height': 'var(--ot-input-height-sm)',
    '--searchbar-font-size': 'var(--ot-font-size-sm)',
    '--searchbar-padding-x': 'var(--ot-input-padding-x-sm)',
  },
  md: {
    '--searchbar-height': 'var(--ot-input-height-md)',
    '--searchbar-font-size': 'var(--ot-font-size-md)',
    '--searchbar-padding-x': 'var(--ot-input-padding-x-md)',
  },
  lg: {
    '--searchbar-height': 'var(--ot-input-height-lg)',
    '--searchbar-font-size': 'var(--ot-font-size-lg)',
    '--searchbar-padding-x': 'var(--ot-input-padding-x-lg)',
  },
} as const;

export const DEFAULT_DEBOUNCE = 300;
export const DEFAULT_MAX_SUGGESTIONS = 8;
