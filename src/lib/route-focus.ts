/**
 * Focus management on client-side navigation: after a route change the new page's h1
 * (rendered by PageHeader with `data-page-title`) receives focus, so keyboard and screen
 * reader users start at the new content. Falls back to the main landmark.
 */
let pending = false;
let fallbackTimer: number | undefined;

function focusElement(element: HTMLElement | null): boolean {
  if (!element) return false;
  element.focus({ preventScroll: false });
  return document.activeElement === element;
}

export function requestRouteFocus(): void {
  pending = true;
  window.clearTimeout(fallbackTimer);
  // Try right away (page already rendered) and fall back to <main> for lazy pages.
  window.requestAnimationFrame(() => {
    if (pending && focusElement(document.querySelector<HTMLElement>('[data-page-title]'))) {
      pending = false;
    }
  });
  fallbackTimer = window.setTimeout(() => {
    if (!pending) return;
    pending = false;
    if (!focusElement(document.querySelector<HTMLElement>('[data-page-title]'))) {
      focusElement(document.getElementById('main-content'));
    }
  }, 600);
}

/** Called by PageHeader on mount: claims a pending focus request. */
export function claimRouteFocus(element: HTMLElement | null): void {
  if (!pending || !element) return;
  pending = false;
  window.clearTimeout(fallbackTimer);
  element.focus();
}
