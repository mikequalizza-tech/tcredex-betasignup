/**
 * Performance Monitoring Utilities
 * ================================
 * Lightweight performance tracking for production optimization
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private timerMetadata: Map<string, Record<string, unknown>> = new Map();

  // Start timing an operation
  startTimer(name: string, metadata?: Record<string, unknown>): void {
    this.timers.set(name, performance.now());
    if (metadata) {
      this.timerMetadata.set(name, metadata);
    }
  }

  // End timing and record metric
  endTimer(name: string): number | null {
    const startTime = this.timers.get(name);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    const metadata = this.timerMetadata.get(name);

    this.recordMetric(name, duration, metadata);

    this.timers.delete(name);
    this.timerMetadata.delete(name);

    return duration;
  }

  // Record a metric directly
  recordMetric(
    name: string,
    value: number,
    metadata?: Record<string, unknown>,
  ): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Get metrics for analysis
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return [...this.metrics];
  }

  // Get average for a metric
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
    this.timers.clear();
    this.timerMetadata.clear();
  }

  // Export metrics for analysis
  export(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        summary: this.getSummary(),
        timestamp: Date.now(),
      },
      null,
      2,
    );
  }

  private getSummary(): Record<string, unknown> {
    const summary: Record<string, unknown> = {};

    const metricNames = [...new Set(this.metrics.map((m) => m.name))];

    for (const name of metricNames) {
      const metrics = this.getMetrics(name);
      summary[name] = {
        count: metrics.length,
        average: this.getAverage(name),
        min: Math.min(...metrics.map((m) => m.value)),
        max: Math.max(...metrics.map((m) => m.value)),
        latest: metrics[metrics.length - 1]?.value || 0,
      };
    }

    return summary;
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const startTimer = (name: string, metadata?: Record<string, unknown>) =>
  performanceMonitor.startTimer(name, metadata);

export const endTimer = (name: string) => performanceMonitor.endTimer(name);

export const recordMetric = (
  name: string,
  value: number,
  metadata?: Record<string, unknown>,
) => performanceMonitor.recordMetric(name, value, metadata);

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    startTimer,
    endTimer,
    recordMetric,
    getMetrics: (name?: string) => performanceMonitor.getMetrics(name),
    getAverage: (name: string) => performanceMonitor.getAverage(name),
    export: () => performanceMonitor.export(),
  };
}

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === "undefined") return;

  // Track Core Web Vitals
  if ("web-vital" in window) {
    // This would integrate with @vercel/analytics or similar
    return;
  }

  // Basic performance tracking
  window.addEventListener("load", () => {
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;

    recordMetric(
      "page_load_time",
      navigation.loadEventEnd - navigation.fetchStart,
    );
    recordMetric(
      "dom_content_loaded",
      navigation.domContentLoadedEventEnd - navigation.fetchStart,
    );
    recordMetric(
      "first_paint",
      performance.getEntriesByName("first-paint")[0]?.startTime || 0,
    );
    recordMetric(
      "first_contentful_paint",
      performance.getEntriesByName("first-contentful-paint")[0]?.startTime || 0,
    );
  });
}

// Map-specific performance tracking
export const mapPerformance = {
  trackTileLoad: (z: number, x: number, y: number, duration: number) => {
    recordMetric("tile_load_time", duration, { z, x, y });
  },

  trackTractLoad: (count: number, duration: number, mode: string) => {
    recordMetric("tract_load_time", duration, { count, mode });
  },

  trackMapRender: (duration: number, zoom: number) => {
    recordMetric("map_render_time", duration, { zoom });
  },
};
