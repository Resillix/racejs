/**
 * Requests Component - View and Replay Requests
 */

export function generateRequestsTab(): string {
  return `
        <h2 class="mb-3">Recorded Requests</h2>

        <!-- Filters -->
        <div class="filters">
          <div class="filter-group">
            <label class="filter-label">Method</label>
            <select id="filter-method">
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select id="filter-status">
              <option value="">All Status</option>
              <option value="2xx">2xx Success</option>
              <option value="3xx">3xx Redirect</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Search</label>
            <input type="text" id="filter-search" placeholder="Search URL...">
          </div>

          <div class="filter-group">
            <label class="filter-label">&nbsp;</label>
            <button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button>
            <button class="btn ml-2" onclick="exportRequests()">Export</button>
          </div>
        </div>

        <!-- Requests Table -->
        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Method</th>
                <th>URL</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="requests-list">
              <tr>
                <td colspan="6">
                  <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No recorded requests yet</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Request Details Modal (hidden by default) -->
        <div id="request-modal" class="hidden">
          <!-- Will be populated dynamically -->
        </div>
  `;
}
