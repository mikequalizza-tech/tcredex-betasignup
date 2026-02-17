/**
 * Performance monitoring and optimization utilities
 */

/**
 * Performance monitoring and optimization utilities
 */

// Simple performance tracking without external dependencies
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Use Performance Observer API if available
  if ('PerformanceObserver' in window) {
    try {
      // Track Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart?: number };
          if (fidEntry.processingStart && fidEntry.startTime) {
            console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Track Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!clsEntry.hadRecentInput && clsEntry.value) {
            clsValue += clsEntry.value;
          }
        });
        console.log('CLS:', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (_error) {
      console.log('Performance tracking not supported');
    }
  }
}

// Image lazy loading helper
export function createIntersectionObserver(callback: IntersectionObserverCallback) {
  if (typeof window === 'undefined') return null;

  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.01,
  });
}

// Debounce utility for performance
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Preload critical resources
export function preloadResource(href: string, as: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// Memory usage monitoring (development only)
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

  if ('memory' in performance) {
    const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    console.log('Memory Usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
    });
  }
}

// Bundle size analyzer helper
export function analyzeBundleSize() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

  // Log loaded scripts for bundle analysis
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const totalSize = scripts.reduce((size, script) => {
    const src = script.getAttribute('src');
    if (src?.includes('/_next/static/')) {
      // Estimate size based on filename patterns
      return size + 1; // Placeholder - would need actual size data
    }
    return size;
  }, 0);

  console.log('Loaded Scripts:', scripts.length, 'Estimated Size:', totalSize);
}