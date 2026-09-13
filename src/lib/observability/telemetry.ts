/**
 * PACT Phase 11: System Telemetry & Metrics Tracker
 *
 * Tracks system uptime, route latency, error counts, and operational health
 * without exposing personal identifiers or consequence data.
 */

interface MetricsSummary {
  uptimeSeconds: number;
  totalRequests: number;
  errorCount: number;
  activeRateLimits: number;
  routes: Record<string, { count: number; avgLatencyMs: number }>;
}

class TelemetryTracker {
  private startTime = Date.now();
  private totalRequests = 0;
  private errorCount = 0;
  private routeStats: Map<string, { count: number; totalDurationMs: number }> = new Map();

  public recordRequest(route: string, durationMs: number, isError: boolean = false): void {
    this.totalRequests++;
    if (isError) {
      this.errorCount++;
    }

    const current = this.routeStats.get(route) || { count: 0, totalDurationMs: 0 };
    current.count++;
    current.totalDurationMs += durationMs;
    this.routeStats.set(route, current);
  }

  public getSummary(): MetricsSummary {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const routes: Record<string, { count: number; avgLatencyMs: number }> = {};

    for (const [route, stat] of this.routeStats.entries()) {
      routes[route] = {
        count: stat.count,
        avgLatencyMs: stat.count > 0 ? Math.round(stat.totalDurationMs / stat.count) : 0,
      };
    }

    return {
      uptimeSeconds,
      totalRequests: this.totalRequests,
      errorCount: this.errorCount,
      activeRateLimits: 0,
      routes,
    };
  }

  public reset(): void {
    this.startTime = Date.now();
    this.totalRequests = 0;
    this.errorCount = 0;
    this.routeStats.clear();
  }
}

export const telemetry = new TelemetryTracker();
