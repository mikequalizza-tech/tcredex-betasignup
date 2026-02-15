// Stub performance monitor for beta site
const timers: Record<string, number> = {};

export function startTimer(name: string, _metadata?: Record<string, unknown>) {
  timers[name] = performance.now();
}

export function endTimer(name: string): number {
  const start = timers[name] || performance.now();
  const duration = performance.now() - start;
  delete timers[name];
  return duration;
}

export const mapPerformance = {
  trackTractLoad: (_count: number, _duration: number, _mode: string) => {},
};
