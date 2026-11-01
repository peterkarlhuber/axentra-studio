import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import i18n from '@/i18n';

// jsdom lacks matchMedia and ResizeObserver, which Radix primitives and the theme use.
function installMatchMedia(prefersDark = false) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({
      matches: query.includes('dark') ? prefersDark : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(async () => {
  installMatchMedia(false);
  globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
  window.localStorage.clear();
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
});

export { installMatchMedia };
