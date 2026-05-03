// Pin to Gen Con's host city — all date display (day names, times) is relative to Indianapolis time
process.env.TZ = "America/Indianapolis";

import "@testing-library/jest-dom";
import { server } from "./msw/server";

window.scrollTo = () => {};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom doesn't implement canvas — stub getContext to return null so tests that render
// components using useColumnMinSizes don't emit jsdomError events that vitest treats as failures
HTMLCanvasElement.prototype.getContext = () => null;

// Force GC at the START of each file, not afterAll. The previous file's module
// context is released before beforeAll runs, so gc() here actually frees the
// previous file's jsdom. In afterAll the current file is still live — gc() there
// is one file too late and doesn't prevent accumulation across a worker's queue.
beforeAll(() => {
  global.gc?.();
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
});
