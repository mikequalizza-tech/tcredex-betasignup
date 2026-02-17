/**
 * Performance monitoring utilities for tCredex frontend
 * Helps identify and track performance bottlenecks
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled =
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_ENABLE_PERF_MONITORING === "true";
  }

  startMeasurement(name: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  endMeasurement(name: string): number | undefined {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[PerformanceMonitor] No measurement started for: ${name}`);
      return;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    console.log(
      `[PerformanceMonitor] ${name}: ${metric.duration.toFixed(2)}ms`,
      metric.metadata,
    );

    return metric.duration;
  }

  measureFunction<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>,
  ): T {
    if (!this.isEnabled) return fn();

    this.startMeasurement(name, metadata);
    try {
      const result = fn();
      this.endMeasurement(name);
      return result;
    } catch (error) {
      this.endMeasurement(name);
      throw error;
    }
  }

  async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.isEnabled) return fn();

    this.startMeasurement(name, metadata);
    try {
      const result = await fn();
      this.endMeasurement(name);
      return result;
    } catch (error) {
      this.endMeasurement(name);
      throw error;
    }
  }

  getMetrics(): Record<string, PerformanceMetric> {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const startTimeRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    startTimeRef.current = performance.now();
    performanceMonitor.startMeasurement(`${componentName}-render`);

    return () => {
      if (startTimeRef.current) {
        performanceMonitor.endMeasurement(`${componentName}-render`);
      }
    };
  });

  const measureFunction = React.useCallback(
    <T>(name: string, fn: () => T) => {
      return performanceMonitor.measureFunction(`${componentName}-${name}`, fn);
    },
    [componentName],
  );

  const measureAsyncFunction = React.useCallback(
    <T>(name: string, fn: () => Promise<T>) => {
      return performanceMonitor.measureAsyncFunction(
        `${componentName}-${name}`,
        fn,
      );
    },
    [componentName],
  );

  return { measureFunction, measureAsyncFunction };
}

// Utility for measuring expensive computations
export function measureComputation<T>(
  name: string,
  computation: () => T,
  threshold = 16, // 16ms = 1 frame at 60fps
): T {
  const startTime = performance.now();
  const result = computation();
  const duration = performance.now() - startTime;

  if (duration > threshold) {
    console.warn(
      `[PerformanceMonitor] Expensive computation "${name}" took ${duration.toFixed(2)}ms`,
    );
  }

  return result;
}

// React hook for measuring useMemo computations
export function useMeasuredMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  name: string,
): T {
  return React.useMemo(() => {
    return performanceMonitor.measureFunction(`useMemo-${name}`, factory);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generic wrapper: deps are forwarded from caller
  }, deps);
}

// React hook for measuring useEffect executions
export function useMeasuredEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  name: string,
): void {
  React.useEffect(() => {
    return performanceMonitor.measureFunction(`useEffect-${name}`, () =>
      effect(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generic wrapper: deps are forwarded from caller
  }, deps);
}

// Bundle size monitoring (development only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Monitor bundle size changes
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === "navigation") {
        const navEntry = entry as NavigationTiming;
        console.log("[PerformanceMonitor] Navigation timing:", {
          domContentLoaded:
            navEntry.domContentLoadedEventEnd -
            navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          totalTime: navEntry.loadEventEnd - navEntry.fetchStart,
        });
      }
    }
  });

  observer.observe({ entryTypes: ["navigation", "resource"] });
}

// Import React for the hook
import React from "react";

// Type definitions for performance monitoring
interface NavigationTiming extends PerformanceEntry {
  domContentLoadedEventEnd: number;
  domContentLoadedEventStart: number;
  loadEventEnd: number;
  loadEventStart: number;
  fetchStart: number;
}
