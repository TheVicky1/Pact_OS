/**
 * PACT Phase 12: Screen Reader Live Region Announcer
 *
 * Dynamically announces asynchronous updates (e.g. task completed, ritual saved, timer completed)
 * to screen readers via an aria-live assertive/polite container.
 */

class ScreenReaderAnnouncer {
  private liveRegion: HTMLElement | null = null;

  public init(): void {
    if (typeof document === 'undefined' || this.liveRegion) return;

    const el = document.createElement('div');
    el.id = 'pact-a11y-live-region';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.className = 'sr-only';
    el.style.position = 'absolute';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.padding = '0';
    el.style.margin = '-1px';
    el.style.overflow = 'hidden';
    el.style.clip = 'rect(0, 0, 0, 0)';
    el.style.whiteSpace = 'nowrap';
    el.style.border = '0';

    document.body.appendChild(el);
    this.liveRegion = el;
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) {
      this.init();
    }
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = '';
    // Small timeout ensures screen readers catch the text node change
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 50);
  }
}

export const announcer = new ScreenReaderAnnouncer();
