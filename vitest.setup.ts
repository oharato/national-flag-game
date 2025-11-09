import { beforeEach, afterEach, vi } from 'vitest';

// IntersectionObserver のグローバルモック
if (typeof IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as any;
}

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const shouldSuppressMessage = (args: any[]): boolean => {
  const message = args.join(' ');
  return message.includes('AbortError') || 
         message.includes('The operation was aborted') ||
         message.includes('DOMException');
};

beforeEach(() => {
  console.error = (...args: any[]) => {
    if (!shouldSuppressMessage(args)) {
      originalConsoleError.apply(console, args);
    }
  };

  console.warn = (...args: any[]) => {
    if (!shouldSuppressMessage(args)) {
      originalConsoleWarn.apply(console, args);
    }
  };
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
