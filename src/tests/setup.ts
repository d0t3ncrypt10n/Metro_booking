import { vi } from 'vitest';

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
