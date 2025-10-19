/**
 * UI Scripts - Tab Navigation, Filtering, and Interactions
 */

export function generateUIScripts(): string {
  return `
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const tabName = item.dataset.tab;

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        // Load tab data
        loadTabData(tabName);
      });
    });

    // Load tab-specific data
    function loadTabData(tabName) {
      switch(tabName) {
        case 'dashboard':
          loadDashboardData();
          break;
        case 'requests':
          // Render from existing state (already loaded via WebSocket)
          if (typeof renderRequestsTable === 'function') {
            renderRequestsTable();
          }
          break;
        case 'performance':
          loadPerformanceData();
          break;
        case 'errors':
          loadErrorsData();
          break;
      }
    }

    // Dashboard functions
    function loadDashboardData() {
      // Request data from server
      sendMessage({ type: 'get_dashboard' });
    }

    function updateRecentRequests(request) {
      const container = document.getElementById('recent-requests');
      if (!container) return;

      // Remove empty state if present
      const emptyState = container.querySelector('.empty-state');
      if (emptyState) emptyState.remove();

      // Create request item
      const item = document.createElement('div');
      item.className = 'flex-between mb-2 p-2';
      item.style.background = 'var(--dark-light)';
      item.style.borderRadius = 'var(--radius-sm)';
      item.innerHTML = \`
        <div>
          <span class="method method-\${request.method.toLowerCase()}">\${request.method}</span>
          <span class="ml-2">\${request.url}</span>
        </div>
        <span class="text-dim">\${formatTime(request.timestamp)}</span>
      \`;

      // Prepend to list (newest first)
      container.insertBefore(item, container.firstChild);

      // Keep only last 10
      while (container.children.length > 10) {
        container.removeChild(container.lastChild);
      }
    }

    function updateRecentErrors(error) {
      const container = document.getElementById('recent-errors');
      if (!container) return;

      // Remove empty state
      const emptyState = container.querySelector('.empty-state');
      if (emptyState) emptyState.remove();

      const item = document.createElement('div');
      item.className = 'p-2 mb-2';
      item.style.background = 'var(--dark-light)';
      item.style.borderRadius = 'var(--radius-sm)';
      item.style.borderLeft = '3px solid var(--danger)';
      item.innerHTML = \`
        <div class="text-danger mb-1">\${error.message || error.error}</div>
        <div class="text-dim text-sm">\${formatTime(error.timestamp)}</div>
      \`;

      container.insertBefore(item, container.firstChild);

      while (container.children.length > 10) {
        container.removeChild(container.lastChild);
      }
    }

    // Requests functions
    function loadRequestsData() {
      // Data is already in state from WebSocket, just render
      if (typeof renderRequestsTable === 'function') {
        renderRequestsTable();
      }
    }

    function updateRequestsTable(request) {
      // Deprecated - handled by WebSocket state management
      if (typeof renderRequestsTable === 'function') {
        renderRequestsTable();
      }
    }

    function getStatusBadge(status) {
      if (!status) return 'info';
      if (status < 300) return 'success';
      if (status < 400) return 'info';
      if (status < 500) return 'warning';
      return 'danger';
    }

    function viewRequest(id) {
      sendMessage({ type: 'get_request', data: { id } });
    }

    function replayRequest(id) {
      if (confirm('Replay this request?')) {
        sendMessage({ type: 'replay_request', data: { id, mockMode: false } });
      }
    }

    function clearFilters() {
      document.getElementById('filter-method').value = '';
      document.getElementById('filter-status').value = '';
      document.getElementById('filter-search').value = '';
      loadRequestsData();
    }

    // Performance functions
    function loadPerformanceData() {
      // Use metrics summary channel
      sendMessage({ type: 'get_performance_metrics' });
    }

    // Errors functions
    function loadErrorsData() {
      sendMessage({ type: 'get_errors' });
    }

    // Utility functions
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
      if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
      return date.toLocaleString();
    }

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / 1048576).toFixed(2) + ' MB';
    }

    // Update uptime
    let startTime = Date.now();
    setInterval(() => {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;

      const uptimeEl = document.getElementById('uptime');
      if (uptimeEl) {
        uptimeEl.textContent = \`\${hours}h \${minutes}m \${seconds}s\`;
      }
    }, 1000);

    // Load initial dashboard data
    setTimeout(() => {
      loadDashboardData();
    }, 100);
  `;
}
