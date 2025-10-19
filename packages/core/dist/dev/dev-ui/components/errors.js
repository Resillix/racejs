/**
 * Errors Component - Error Tracking and Aggregation
 */
export function generateErrorsTab() {
    return `
        <h2 class="mb-3">Error Tracking</h2>

        <!-- Error Stats -->
        <div class="grid grid-4 mb-4">
          <div class="stat-card">
            <div class="stat-label">Total Errors</div>
            <div class="stat-value text-danger" id="errors-total">0</div>
            <div class="stat-change">All time</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Error Groups</div>
            <div class="stat-value text-warning" id="errors-groups">0</div>
            <div class="stat-change">Unique</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Recent Errors</div>
            <div class="stat-value text-info" id="errors-recent">0</div>
            <div class="stat-change">Last hour</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Error Rate</div>
            <div class="stat-value" id="errors-rate">--</div>
            <div class="stat-change">Errors/min</div>
          </div>
        </div>

        <!-- Error Filters -->
        <div class="filters">
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select id="error-filter-status">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Search</label>
            <input type="text" id="error-filter-search" placeholder="Search errors...">
          </div>
        </div>

        <!-- Error Groups -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Error Groups</h3>
          </div>
          <div class="card-body">
            <div id="error-groups-list">
              <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <p>No errors tracked</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Details (shown when clicking an error) -->
        <div id="error-details" class="hidden mt-3">
          <!-- Will be populated dynamically -->
        </div>
  `;
}
//# sourceMappingURL=errors.js.map