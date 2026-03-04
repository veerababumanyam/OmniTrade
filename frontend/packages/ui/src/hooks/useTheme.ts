/**
 * useTheme - Theme management hook for OmniTrade
 * Manages light/dark theme, accessibility modes, and brand colors
 */
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

// ============================================================================
// Types
// ============================================================================

export type Theme = 'light' | 'dark';
export type AccessibilityMode = 'default' | 'calm' | 'dyslexic';

export interface ThemeState {
  theme: Theme;
  mode: AccessibilityMode;
  brand: string;
}

export interface ThemeActions {
  setTheme: (theme: Theme) => void;
  setMode: (mode: AccessibilityMode) => void;
  setBrand: (brand: string) => void;
  toggleTheme: () => void;
}

export type UseThemeReturn = ThemeState & ThemeActions;

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_THEME = 'omnitrade-theme';
const STORAGE_KEY_MODE = 'omnitrade-mode';
const STORAGE_KEY_BRAND = 'omnitrade-brand';

const DEFAULT_BRAND = '#0066FF';
const VALID_THEMES: Theme[] = ['light', 'dark'];
const VALID_MODES: AccessibilityMode[] = ['default', 'calm', 'dyslexic'];

// ============================================================================
// Storage utilities
// ============================================================================

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored && VALID_THEMES.includes(stored as Theme)) {
      return stored as Theme;
    }
  } catch {
    // localStorage not available
  }

  // Fall back to system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function getStoredMode(): AccessibilityMode {
  if (typeof window === 'undefined') return 'default';

  try {
    const stored = localStorage.getItem(STORAGE_KEY_MODE);
    if (stored && VALID_MODES.includes(stored as AccessibilityMode)) {
      return stored as AccessibilityMode;
    }
  } catch {
    // localStorage not available
  }

  return 'default';
}

function getStoredBrand(): string {
  if (typeof window === 'undefined') return DEFAULT_BRAND;

  try {
    const stored = localStorage.getItem(STORAGE_KEY_BRAND);
    if (stored && /^#[0-9A-Fa-f]{6}$/.test(stored)) {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  return DEFAULT_BRAND;
}

function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch {
    // localStorage not available
  }
}

function setStoredMode(mode: AccessibilityMode): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
  } catch {
    // localStorage not available
  }
}

function setStoredBrand(brand: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_BRAND, brand);
  } catch {
    // localStorage not available
  }
}

// ============================================================================
// DOM utilities
// ============================================================================

function applyThemeToDOM(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.setAttribute('data-theme', theme);
}

function applyModeToDOM(mode: AccessibilityMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-mode', mode);
}

function applyBrandToDOM(brand: string): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--brand-primary', brand);
}

// ============================================================================
// Simple store for SSR-safe state management
// ============================================================================

let listeners: Array<() => void> = [];
let themeState: ThemeState = {
  theme: 'dark',
  mode: 'default',
  brand: DEFAULT_BRAND,
};

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return (): void => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): ThemeState {
  return themeState;
}

function getServerSnapshot(): ThemeState {
  return {
    theme: 'dark',
    mode: 'default',
    brand: DEFAULT_BRAND,
  };
}

function updateState(newState: Partial<ThemeState>): void {
  themeState = { ...themeState, ...newState };
  listeners.forEach((listener) => listener());
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing theme, accessibility mode, and brand colors.
 * Persists preferences to localStorage and applies them to the DOM.
 *
 * @returns Theme state and actions
 *
 * @example
 * const { theme, mode, brand, setTheme, setMode, toggleTheme } = useTheme();
 *
 * // Toggle between light and dark
 * <button onClick={toggleTheme}>
 *   Switch to {theme === 'light' ? 'dark' : 'light'} mode
 * </button>
 *
 * // Set accessibility mode
 * <select onChange={(e) => setMode(e.target.value as AccessibilityMode)}>
 *   <option value="default">Default</option>
 *   <option value="calm">Calm</option>
 *   <option value="dyslexic">Dyslexic-friendly</option>
 * </select>
 */
export function useTheme(): UseThemeReturn {
  // Initialize state from storage on first client-side render
  const [isInitialized, setIsInitialized] = useState(false);

  // Use useSyncExternalStore for SSR-safe state
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Initialize from storage on mount
  useEffect(() => {
    if (isInitialized) return;

    const storedTheme = getStoredTheme();
    const storedMode = getStoredMode();
    const storedBrand = getStoredBrand();

    themeState = {
      theme: storedTheme,
      mode: storedMode,
      brand: storedBrand,
    };

    applyThemeToDOM(storedTheme);
    applyModeToDOM(storedMode);
    applyBrandToDOM(storedBrand);

    setIsInitialized(true);
    listeners.forEach((listener) => listener());
  }, [isInitialized]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent): void => {
      // Only update if no stored preference
      const stored = localStorage.getItem(STORAGE_KEY_THEME);
      if (!stored) {
        const newTheme: Theme = e.matches ? 'dark' : 'light';
        updateState({ theme: newTheme });
        applyThemeToDOM(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return (): void => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((theme: Theme): void => {
    setStoredTheme(theme);
    applyThemeToDOM(theme);
    updateState({ theme });
  }, []);

  const setMode = useCallback((mode: AccessibilityMode): void => {
    setStoredMode(mode);
    applyModeToDOM(mode);
    updateState({ mode });
  }, []);

  const setBrand = useCallback((brand: string): void => {
    // Validate hex color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(brand)) {
      console.warn('Invalid brand color format. Expected hex color like #0066FF');
      return;
    }
    setStoredBrand(brand);
    applyBrandToDOM(brand);
    updateState({ brand });
  }, []);

  const toggleTheme = useCallback((): void => {
    const newTheme: Theme = state.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [state.theme, setTheme]);

  return {
    theme: state.theme,
    mode: state.mode,
    brand: state.brand,
    setTheme,
    setMode,
    setBrand,
    toggleTheme,
  };
}

export default useTheme;
