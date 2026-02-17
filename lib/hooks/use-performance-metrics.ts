/**
 * Performance metrics hook for React components
 * Provides easy-to-use performance monitoring for components and operations
 */

import { useCallback, useRef } from "react";
import { performanceMonitor } from "@/lib/utils/performance-monitor";

export function usePerformanceMetrics(componentName: string) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number | undefined>(undefined);

  // Track component renders
  renderCountRef.current += 1;

  // Track mount time
  if (!mountTimeRef.current) {
    mountTimeRef.current = performance.now();
  }

  const measureFunction = useCallback(
    <T extends unknown[], R>(
      functionName: string,
      fn: (...args: T) => R,
      ...args: T
    ): R => {
      return performanceMonitor.measureFunction(
        `${componentName}.${functionName}`,
        () => fn(...args),
      );
    },
    [componentName],
  );

  const measureAsyncFunction = useCallback(
    async <T extends unknown[], R>(
      functionName: string,
      fn: (...args: T) => Promise<R>,
      ...args: T
    ): Promise<R> => {
      return performanceMonitor.measureAsyncFunction(
        `${componentName}.${functionName}`,
        () => fn(...args),
      );
    },
    [componentName],
  );

  const measureRender = useCallback(
    (renderName = "render") => {
      const startTime = performance.now();
      return () => {
        const duration = performance.now() - startTime;
        if (duration > 16) {
          // Log slow renders (> 1 frame at 60fps)
          console.warn(
            `[Performance] Slow ${componentName} ${renderName}: ${duration.toFixed(2)}ms`,
          );
        }
      };
    },
    [componentName],
  );

  const getMetrics = useCallback(() => {
    return {
      componentName,
      renderCount: renderCountRef.current,
      mountTime: mountTimeRef.current,
      uptime: mountTimeRef.current
        ? performance.now() - mountTimeRef.current
        : 0,
    };
  }, [componentName]);

  return {
    measureFunction,
    measureAsyncFunction,
    measureRender,
    getMetrics,
  };
}

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
) {
  const WrappedComponent = (props: P) => {
    const metrics = usePerformanceMetrics(
      componentName ||
        Component.displayName ||
        Component.name ||
        "UnknownComponent",
    );

    const endRenderMeasurement = metrics.measureRender();

    React.useEffect(() => {
      endRenderMeasurement();
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for measuring expensive computations
export function useMeasuredMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  name: string,
  componentName: string,
): T {
  return React.useMemo(() => {
    const startTime = performance.now();
    const result = factory();
    const duration = performance.now() - startTime;

    if (duration > 10) {
      // Log computations taking more than 10ms
      console.warn(
        `[Performance] Expensive memo in ${componentName}.${name}: ${duration.toFixed(2)}ms`,
      );
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generic wrapper: deps are forwarded from caller
  }, deps);
}

// Hook for measuring useEffect executions
export function useMeasuredEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  name: string,
  componentName: string,
): void {
  React.useEffect(() => {
    const startTime = performance.now();
    const cleanup = effect();
    const duration = performance.now() - startTime;

    if (duration > 5) {
      // Log effects taking more than 5ms
      console.warn(
        `[Performance] Slow effect in ${componentName}.${name}: ${duration.toFixed(2)}ms`,
      );
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generic wrapper: deps are forwarded from caller
  }, deps);
}

// Utility for measuring API calls
export function measureApiCall<T>(
  apiName: string,
  promise: Promise<T>,
): Promise<T> {
  return performanceMonitor.measureAsyncFunction(
    `api.${apiName}`,
    () => promise,
  );
}

// Import React for JSX
import React from "react";
