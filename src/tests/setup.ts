import { vi } from 'vitest';

// ─── Mock localStorage for jsdom test environment ───
// jsdom does not provide localStorage by default. The useDarkMode hook
// calls localStorage.getItem('theme') in its useState initializer, so we
// mock it here to prevent the test from crashing with "Cannot read properties
// of undefined (reading 'getItem')".
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock fetch for API calls like loading the network JSON
global.fetch = vi.fn().mockImplementation((url) => {
  if (url === '/mini-metro-network.json') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ lines: [], stations: [] }),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
}) as any;
