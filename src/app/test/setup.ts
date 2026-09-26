import '@testing-library/jest-dom/vitest'

// jsdom has no layout engine; supply the browser observer used by responsive charts.
class TestResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = TestResizeObserver
