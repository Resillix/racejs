/**
 * Dashboard Component - Overview and Statistics
 */

export function generateDashboard(): string {
  return `
        <h2 class="mb-3">Dashboard</h2>

        <!-- Statistics Cards -->
        <div class="grid grid-4 mb-4">
          <div class="stat-card">
            <div class="stat-label">Total Requests</div>
            <div class="stat-value" id="total-requests">0</div>
            <div class="stat-change text-success">↑ Live</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Errors</div>
            <div class="stat-value text-danger" id="total-errors">0</div>
            <div class="stat-change" id="error-trend">--</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Avg Response Time</div>
            <div class="stat-value text-info" id="avg-response">--</div>
            <div class="stat-change" id="response-trend">--</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Active Recordings</div>
            <div class="stat-value text-success" id="recordings-count">0</div>
            <div class="stat-change">Last hour</div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="grid grid-2">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Recent Requests</h3>
            </div>
            <div class="card-body">
              <div id="recent-requests">
                <div class="empty-state">
                  <div class="empty-state-icon">📭</div>
                  <p>No requests yet</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Recent Errors</h3>
            </div>
            <div class="card-body">
              <div id="recent-errors">
                <div class="empty-state">
                  <div class="empty-state-icon">✅</div>
                  <p>No errors</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Chart -->
        <div class="card mt-3">
          <div class="card-header">
            <h3 class="card-title">Performance Overview</h3>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="performance-chart"></canvas>
            </div>
          </div>
        </div>
  `;
}
