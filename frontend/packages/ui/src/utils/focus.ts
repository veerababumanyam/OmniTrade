/**
 * Focus Management Utilities
 * Helpers for managing keyboard focus in accessible UI components
 */

/**
 * CSS selector for focusable elements
 * Excludes elements with tabindex="-1" and hidden/inert elements
 */
const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Checks if an element is visible and focusable
 */
function isElementFocusable(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  // Check if element is hidden
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  // Check if element has dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }

  // Check if element or ancestor is inert
  let parent: Element | null = element;
  while (parent) {
    if (parent.hasAttribute('inert')) {
      return false;
    }
    parent = parent.parentElement;
  }

  return true;
}

/**
 * Gets all focusable elements within a container, sorted by tabindex.
 *
 * @param container - The container element to search within
 * @returns Array of focusable HTMLElements, sorted by tabindex
 *
 * @example
 * const focusable = getFocusableElements(modalRef.current);
 * console.log(focusable.length); // Number of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));

  // Filter to only visible/focusable elements
  const focusable = elements.filter(isElementFocusable) as HTMLElement[];

  // Sort by tabindex: elements with tabindex > 0 come first in order,
  // then elements with tabindex 0 or no tabindex (DOM order)
  return focusable.sort((a, b) => {
    const aTabIndex = a.tabIndex;
    const bTabIndex = b.tabIndex;

    // Both have explicit tabindex > 0, sort by tabindex value
    if (aTabIndex > 0 && bTabIndex > 0) {
      return aTabIndex - bTabIndex;
    }

    // Only a has explicit tabindex > 0, a comes first
    if (aTabIndex > 0) {
      return -1;
    }

    // Only b has explicit tabindex > 0, b comes first
    if (bTabIndex > 0) {
      return 1;
    }

    // Both have tabindex 0 or no tabindex, maintain DOM order
    return 0;
  });
}

/**
 * Focuses the first focusable element within a container.
 *
 * @param container - The container element to search within
 * @returns true if an element was focused, false otherwise
 *
 * @example
 * // Focus first input when modal opens
 * useEffect(() => {
 *   focusFirst(modalRef.current);
 * }, []);
 */
export function focusFirst(container: HTMLElement): boolean {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
    return true;
  }
  return false;
}

/**
 * Focuses the last focusable element within a container.
 *
 * @param container - The container element to search within
 * @returns true if an element was focused, false otherwise
 *
 * @example
 * // Focus last element when Shift+Tab from first element
 * handleKeyDown={(e) => {
 *   if (e.key === 'Tab' && e.shiftKey && isFirstElement) {
 *     e.preventDefault();
 *     focusLast(modalRef.current);
 *   }
 * }}
 */
export function focusLast(container: HTMLElement): boolean {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[focusable.length - 1].focus();
    return true;
  }
  return false;
}

/**
 * Creates a focus trap within a container.
 * When active, Tab and Shift+Tab cycle focus within the container.
 * Returns a cleanup function to remove the trap.
 *
 * @param container - The container element to trap focus within
 * @returns Cleanup function to remove the focus trap
 *
 * @example
 * useEffect(() => {
 *   const cleanup = trapFocus(modalRef.current);
 *   return cleanup;
 * }, []);
 */
export function trapFocus(container: HTMLElement): () => void {
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    // Check if we need to wrap focus
    if (event.shiftKey) {
      // Shift+Tab: if on first element, go to last
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if on last element, go to first
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  // Add event listener
  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Stores the currently focused element and returns a function to restore it.
 * Useful for temporarily moving focus (e.g., to a modal) and restoring it later.
 *
 * @returns Function to restore focus to the previously focused element
 *
 * @example
 * const restoreFocus = storeFocus();
 * // ... open modal and move focus
 * onClose={() => {
 *   restoreFocus();
 * }}
 */
export function storeFocus(): () => void {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  return (): void => {
    if (
      previouslyFocused &&
      typeof previouslyFocused.focus === 'function' &&
      document.body.contains(previouslyFocused)
    ) {
      previouslyFocused.focus();
    }
  };
}

/**
 * Focuses an element by selector within a container.
 *
 * @param container - The container element to search within
 * @param selector - CSS selector for the element to focus
 * @returns true if element was found and focused, false otherwise
 */
export function focusBySelector(
  container: HTMLElement,
  selector: string
): boolean {
  const element = container.querySelector<HTMLElement>(selector);
  if (element && isElementFocusable(element)) {
    element.focus();
    return true;
  }
  return false;
}
