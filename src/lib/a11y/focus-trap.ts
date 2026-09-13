/**
 * PACT Phase 12: WCAG 2.1 AA Compliant Focus Trap Manager
 *
 * Traps keyboard focus within an active dialog / modal container,
 * supports Shift+Tab cycling, and restores focus to previous trigger upon unmount.
 */

export function createFocusTrap(containerElement: HTMLElement | null, onEscape?: () => void): () => void {
  if (!containerElement || typeof window === 'undefined') {
    return () => {};
  }

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const previouslyFocused = document.activeElement as HTMLElement | null;

  const getFocusableElements = (): HTMLElement[] => {
    return Array.from(containerElement.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
      (el) => el.offsetParent !== null // visible elements only
    );
  };

  const focusable = getFocusableElements();
  if (focusable.length > 0 && focusable[0]) {
    focusable[0].focus();
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    if (e.key !== 'Tab') return;

    const currentFocusable = getFocusableElements();
    if (currentFocusable.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = currentFocusable[0];
    const lastElement = currentFocusable[currentFocusable.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement && lastElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement && firstElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  // Return cleanup function to restore focus
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}
