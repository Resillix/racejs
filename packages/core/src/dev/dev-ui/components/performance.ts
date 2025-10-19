/**
 * Performance Component - Profiler and Metrics
 */

export function generatePerformanceTab(): string {
  return `
        <h2 class="mb-3">Performance Metrics</h2>

        <!-- Performance Stats -->
        <div class="grid grid-4 mb-4">
          <div class="stat-card">
            <div class="stat-label">P50 Latency</div>
            <div class="stat-value text-info" id="p50-latency">--</div>
            <div class="stat-change">Median</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">P95 Latency</div>
            <div class="stat-value text-warning" id="p95-latency">--</div>
            <div class="stat-change">95th Percentile</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">P99 Latency</div>
            <div class="stat-value text-danger" id="p99-latency">--</div>
            <div class="stat-change">99th Percentile</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Requests/sec</div>
            <div class="stat-value text-success" id="req-per-sec">--</div>
            <div class="stat-change">Current Rate</div>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-2 mb-4">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Response Time Distribution</h3>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <canvas id="latency-chart"></canvas>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Memory Usage</h3>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <canvas id="memory-chart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Slow Routes -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Slowest Routes</h3>
          </div>
          <div class="card-body">
            <table class="table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Method</th>
                  <th>Avg Duration</th>
                  <th>Requests</th>
                  <th>Max Duration</th>
                </tr>
              </thead>
              <tbody id="slow-routes">
                <tr>
                  <td colspan="5">
                    <div class="empty-state">
                      <div class="empty-state-icon">⚡</div>
                      <p>No performance data yet</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Event Loop Lag -->
        <div class="card mt-3">
          <div class="card-header">
            <h3 class="card-title">Event Loop Monitoring</h3>
          </div>
          <div class="card-body">
            <div class="grid grid-3">
              <div>
                <div class="stat-label">Current Lag</div>
                <div class="stat-value" id="event-loop-lag">--</div>
              </div>
              <div>
                <div class="stat-label">Avg Lag (1min)</div>
                <div class="stat-value" id="event-loop-avg">--</div>
              </div>
              <div>
                <div class="stat-label">Max Lag</div>
                <div class="stat-value" id="event-loop-max">--</div>
              </div>
            </div>
          </div>
        </div>
  `;
}
