/**
 * WebSocket Client - Real-time Communication with DevTools Server
 *
 * This module has been refactored to follow architectural principles:
 * - Separation of Concerns: Connection, State, Handlers, UI are separate
 * - Single Responsibility: Each module has one clear purpose
 * - Encapsulation: State is managed through controlled interfaces
 * - Security: Safe DOM manipulation, XSS prevention
 * - Testability: Modular structure allows isolated testing
 * - Observability: Structured logging throughout
 *
 * Architecture:
 * - websocket/index.ts: Main orchestration module
 * - websocket/connection.ts: WebSocket lifecycle management
 * - websocket/state.ts: Encapsulated state management
 * - websocket/protocol.ts: Type contracts and validation
 * - websocket/handlers/: Domain-specific message handlers
 * - websocket/ui/: Safe UI rendering
 * - websocket/utils/: Logger, sanitizer, formatters, retry logic
 */
export { generateWebSocketClient } from './websocket/index.js';
/**
 * Legacy export for backward compatibility
 * @deprecated Use named export from ./websocket/index instead
 */
export function generateWebSocketClientLegacy() {
    return `
    // Global state for requests and errors
    const state = {
      requests: [],
      errors: [],
      metrics: {},
      performance: {}
    };

    // WebSocket connection
    let ws = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    function connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = protocol + '//' + window.location.host + '/devtools';

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0;
        updateConnectionStatus(true);

        // Send HELLO to get initial data
        sendMessage({ type: 'hello', data: { clientVersion: '1.0.0' } });

        // Request initial requests list (will be loaded from .racejs files)
        setTimeout(() => {
          sendMessage({ type: 'get_requests', data: { limit: 100 } });
          sendMessage({ type: 'get_metrics' });
          sendMessage({ type: 'get_performance_metrics' });
        }, 500);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus(false);

        // Attempt to reconnect
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log('Reconnecting in ' + delay + 'ms... (attempt ' + reconnectAttempts + ')');
          setTimeout(connectWebSocket, delay);
        }
      };
    }

    function sendMessage(message) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }

    function updateConnectionStatus(connected) {
      const dot = document.getElementById('ws-status');
      const text = document.getElementById('ws-text');

      if (connected) {
        dot.classList.add('connected');
        text.textContent = 'Connected';
      } else {
        dot.classList.remove('connected');
        text.textContent = reconnectAttempts > 0 ? 'Reconnecting...' : 'Disconnected';
      }
    }

    // Message handlers
    function handleMessage(message) {
      console.log('Received message:', message.type);

      switch (message.type) {
        case 'requests_list':
          handleRequestsList(message.data);
          break;
        case 'request_details':
          handleRequestDetails(message.data);
          break;
        case 'request_recorded':
          handleRequestRecorded(message.data);
          break;
        case 'request_response':
          handleRequestResponse(message.data);
          break;
        case 'replay_result':
          handleReplayResult(message.data);
          break;
        case 'replay_comparison':
          handleReplayComparison(message.data);
          break;
        case 'test_generated':
          handleTestGenerated(message.data);
          break;
          case 'error_tracked':
          handleErrorTracked(message.data);
          break;
          case 'error_stats':
            handleErrorStats(message.data);
            break;
          case 'error_list':
            handleErrorList(message.data);
            break;
        case 'metrics_update':
          handleMetricsUpdate(message.data);
          break;
        case 'performance_metrics':
          handlePerformanceMetrics(message.data);
          break;
        case 'performance_update':
          handlePerformanceUpdate(message.data);
          break;
        case 'connected':
          handleConnected(message.data);
          break;
        case 'requests_export':
          handleRequestsExport(message.data);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    }

    function handleRequestsList(data) {
      // Received full list of requests (on connect or manual request)
      state.requests = data.requests || [];
      console.log('Loaded', state.requests.length, 'requests');

      // Update UI if loadRequestsData function exists
      if (typeof loadRequestsData === 'function') {
        renderRequestsTable();
      }
    }

    function handleRequestRecorded(data) {
      // Check if request already exists (prevent duplicates)
      const existingIndex = state.requests.findIndex(r => r.id === data.id);

      if (existingIndex >= 0) {
        // Update existing request
        state.requests[existingIndex] = {
          ...state.requests[existingIndex],
          ...data
        };
        console.log('Updated existing request:', data.id);
      } else {
        // Add new request
        state.requests.unshift(data);
        if (state.requests.length > 100) {
          state.requests = state.requests.slice(0, 100);
        }
        console.log('Added new request:', data.id);

        // Update request count
        const totalRequests = document.getElementById('total-requests');
        if (totalRequests) {
          totalRequests.textContent = state.requests.length;
        }
      }

      // Update UI
      updateRecentRequests(data);
      if (document.getElementById('requests').classList.contains('active')) {
        renderRequestsTable();
      }
    }

    function handleErrorTracked(data) {
      // Update error count
      const totalErrors = document.getElementById('total-errors');
      if (totalErrors) {
        totalErrors.textContent = parseInt(totalErrors.textContent || '0') + 1;
      }

      // Update recent errors
      updateRecentErrors(data);
    }

    function handleErrorStats(data) {
      const total = document.getElementById('errors-total');
      const groups = document.getElementById('errors-groups');
      const recent = document.getElementById('errors-recent');
      const rate = document.getElementById('errors-rate');
      if (total) total.textContent = String(data.totalErrors ?? 0);
      if (groups) groups.textContent = String(data.uniqueErrors ?? 0);
      if (recent) recent.textContent = String((data.topErrors && data.topErrors.length) || 0);
      if (rate) rate.textContent = (data.errorRate != null ? data.errorRate.toFixed(2) : '--');
    }

    function handleErrorList(data) {
      const list = document.getElementById('error-groups-list');
      if (!list) return;
      if (!data.errors || data.errors.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><p>No errors tracked</p></div>';
        return;
      }
      list.innerHTML = data.errors.map(function(e) {
        return (
          '<div class="p-2 mb-2" style="background: var(--dark-light); border-radius: var(--radius-sm);">' +
            '<div class="flex-between">' +
              '<div><strong>' + e.message + '</strong><div class="text-dim text-sm">' + e.type + '</div></div>' +
              '<div class="text-dim">' + e.count + 'x</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }

    function handleMetricsUpdate(data) {
      // Update dashboard metrics
      if (data.avgResponseTime) {
        const avgResponse = document.getElementById('avg-response');
        if (avgResponse) {
          avgResponse.textContent = data.avgResponseTime.toFixed(2) + 'ms';
        }
      }

      if (data.recordingsCount !== undefined) {
        const recordingsCount = document.getElementById('recordings-count');
        if (recordingsCount) {
          recordingsCount.textContent = data.recordingsCount;
        }
      }
    }

    function handlePerformanceMetrics(data) {
      // Fill performance summary cards if present
      if (data.percentiles) {
        updateElement('p50-latency', data.percentiles.p50 + 'ms');
        updateElement('p95-latency', data.percentiles.p95 + 'ms');
        updateElement('p99-latency', data.percentiles.p99 + 'ms');
      }
      if (data.requestRate !== undefined) {
        updateElement('req-per-sec', data.requestRate.toFixed(2));
      }
      if (Array.isArray(data.slowestRoutes)) {
        const tbody = document.getElementById('slow-routes');
        if (tbody) {
          tbody.innerHTML = data.slowestRoutes.map(function(r) {
            return '<tr>' +
              '<td>' + r.route + '</td>' +
              '<td>' + r.method + '</td>' +
              '<td>' + r.avgDuration.toFixed(2) + 'ms</td>' +
              '<td>' + r.count + '</td>' +
              '<td>' + r.maxDuration.toFixed(2) + 'ms</td>' +
            '</tr>';
          }).join('');
        }
      }
    }

    function handlePerformanceUpdate(data) {
      // Update performance metrics
      if (data.percentiles) {
        updateElement('p50-latency', data.percentiles.p50 + 'ms');
        updateElement('p95-latency', data.percentiles.p95 + 'ms');
        updateElement('p99-latency', data.percentiles.p99 + 'ms');
      }

      if (data.eventLoop) {
        updateElement('event-loop-lag', data.eventLoop.current + 'ms');
        updateElement('event-loop-avg', data.eventLoop.avg + 'ms');
        updateElement('event-loop-max', data.eventLoop.max + 'ms');
      }
    }

    function handleRequestResponse(data) {
      console.log('Request response received:', data);

      // Update request in state
      const index = state.requests.findIndex(r => r.id === data.id);
      if (index !== -1) {
        state.requests[index] = {
          ...state.requests[index],
          statusCode: data.statusCode,
          duration: data.duration
        };
        console.log('Updated request response:', data.id);

        // Update UI
        if (document.getElementById('requests').classList.contains('active')) {
          renderRequestsTable();
        }
      }
    }

    function handleConnected(data) {
      console.log('Connected to DevTools server:', data);
      // Initial data will be sent automatically by server via HELLO handler
    }

    // Render the requests table from state
    function renderRequestsTable() {
      const tbody = document.getElementById('requests-list');
      if (!tbody) return;

      if (state.requests.length === 0) {
        tbody.innerHTML = '\n          <tr>\n            <td colspan="6" style="text-align: center; padding: 3rem;">\n              <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>\n              <p style="color: var(--text-dim);">No recorded requests yet</p>\n            </td>\n          </tr>\n        ';
        return;
      }

      tbody.innerHTML = state.requests.map(function(req) {
        var methodClass = 'method-' + String(req.method || '').toLowerCase();
        var status = req.statusCode != null ? req.statusCode : '--';
        var duration = req.duration != null ? req.duration.toFixed(2) + 'ms' : '--';
        var time = formatTime(req.timestamp);
        var statusColor = getStatusColor(req.statusCode || 0);
        return (
          '<tr data-request-id="' + req.id + '">' +
            '<td><span class="method ' + methodClass + '">' + req.method + '</span></td>' +
            '<td>' + req.url + '</td>' +
            '<td class="status-cell">' +
              '<span class="badge badge-' + statusColor + '">' + status + '</span>' +
            '</td>' +
            '<td class="duration-cell">' + duration + '</td>' +
            '<td>' + time + '</td>' +
            '<td>' +
              '<button class="btn btn-sm btn-primary" onclick="viewRequest(\'' + req.id + '\')">View</button> ' +
              '<button class="btn btn-sm btn-success" onclick="replayRequest(\'' + req.id + '\')">Replay</button> ' +
              '<button class="btn btn-sm" onclick="generateTest(\'' + req.id + '\')">Test</button>' +
            '</td>' +
          '</tr>'
        );
      }).join('');
    }
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;

      if (diff < 5000) return 'Just now';
      if (diff < 60000) return Math.floor(diff / 1000) + 's ago';
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
      return date.toLocaleTimeString();
    }

    function getStatusColor(status) {
      if (status >= 200 && status < 300) return 'success';
      if (status >= 300 && status < 400) return 'info';
      if (status >= 400 && status < 500) return 'warning';
      return 'danger';
    }

    function updateElement(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    // Update recent requests in dashboard
    function updateRecentRequests(data) {
      const container = document.getElementById('recent-requests');
      if (!container) return;

      // Check if request already in recent list
      const existing = container.querySelector('[data-request-id="' + data.id + '"]');
      if (existing) {
        // Don't add duplicate
        return;
      }

      const item = document.createElement('div');
      item.className = 'flex-between mb-2 p-2';
      item.style.background = 'var(--dark-light)';
      item.style.borderRadius = 'var(--radius-sm)';
      item.setAttribute('data-request-id', data.id);
      item.innerHTML = '<div>' +
          '<span class="method method-' + data.method.toLowerCase() + '">' + data.method + '</span>' +
          '<span class="ml-2">' + data.url + '</span>' +
        '</div>' +
        '<span class="text-dim">' + formatTime(data.timestamp) + '</span>';

      container.insertBefore(item, container.firstChild);

      // Keep only last 10
      while (container.children.length > 10) {
        container.removeChild(container.lastChild);
      }
    }

    function updateRequestsTable(data) {
      // Deprecated - using renderRequestsTable from state instead
      renderRequestsTable();
    }

    function updateRecentErrors(data) {
      const container = document.getElementById('recent-errors');
      if (!container) return;

      const item = document.createElement('div');
      item.className = 'p-2 mb-2';
      item.style.background = 'var(--dark-light)';
      item.style.borderRadius = 'var(--radius-sm)';
      item.style.borderLeft = '3px solid var(--danger)';
      item.innerHTML = '<div class="text-danger mb-1">' + (data.message || data.error) + '</div>' +
        '<div class="text-dim text-sm">' + formatTime(data.timestamp) + '</div>';

      container.insertBefore(item, container.firstChild);

      while (container.children.length > 10) {
        container.removeChild(container.lastChild);
      }
    }

    // --- Request details and replay results ---
    function handleRequestDetails(details) {
      const modal = document.getElementById('request-modal');
      if (!modal) return;
      modal.classList.remove('hidden');
        modal.innerHTML = '<div class="card">' +
            '<div class="card-header flex-between">' +
              '<h3>Request ' + details.method + ' ' + details.url + '</h3>' +
              '<button class="btn" onclick="closeRequestModal()">Close</button>' +
            '</div>' +
            '<div class="card-body">' +
              '<div class="grid grid-2">' +
                '<div>' +
                  '<h4 class="mb-1">Headers</h4>' +
                  '<textarea id="edit-headers" style="width:100%; height:120px;">' + JSON.stringify(details.headers || {}, null, 2) + '</textarea>' +
                '</div>' +
                '<div>' +
                  '<h4 class="mb-1">Body</h4>' +
                  '<textarea id="edit-body" style="width:100%; height:120px;">' + (typeof details.body === 'string' ? details.body : JSON.stringify(details.body || {}, null, 2)) + '</textarea>' +
                '</div>' +
              '</div>' +
              '<div class="mt-2">' +
                '<label class="filter-label">URL</label>' +
                '<input id="edit-url" type="text" style="width:100%" value="' + details.url + '"/>' +
              '</div>' +
              '<div class="mt-2">' +
                '<button class="btn btn-success" onclick="replayRequest(\'' + details.id + '\')">Replay</button>' +
                '<button class="btn" onclick="editAndReplay(\'' + details.id + '\')">Edit & Replay</button>' +
                '<button class="btn" onclick="copyCurlFromDetails()">Copy cURL</button>' +
              '</div>' +
            '</div>' +
          '</div>';
    }

    function closeRequestModal() {
      const modal = document.getElementById('request-modal');
      if (modal) modal.classList.add('hidden');
    }

    function handleReplayResult(result) {
      // Simple toast
      console.log('Replay result', result);
      alert(result.success ? 'Replay OK: ' + result.response.statusCode + ' in ' + result.response.duration.toFixed(1) + 'ms' : 'Replay failed: ' + result.error);
    }

    function handleReplayComparison(data) {
      console.log('Replay comparison', data);
    }

    function handleTestGenerated(data) {
      // Offer download
      const blob = new Blob([data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    function handleRequestsExport(data) {
      try {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'racejs-recordings.json';
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Failed to export requests', e);
      }
    }

    // Expose few helpers globally for onclick handlers
    window.viewRequest = function(id) { sendMessage({ type: 'get_request', data: { id } }); };
    window.replayRequest = function(id) { sendMessage({ type: 'replay_request', data: { id } }); };
    window.generateTest = function(id) { sendMessage({ type: 'generate_test', data: { id, framework: 'vitest' } }); };
    window.copyCurl = function(id) { sendMessage({ type: 'get_request', data: { id } }); };
  window.exportRequests = function() { sendMessage({ type: 'export_requests' }); };
    window.copyCurlFromDetails = function() {
      try {
        var url = (document.getElementById('edit-url') as HTMLInputElement).value;
        var headersTxt = (document.getElementById('edit-headers') as HTMLTextAreaElement).value;
        var bodyTxt = (document.getElementById('edit-body') as HTMLTextAreaElement).value;
        var method = 'GET';
        var headers = {} as any;
        try { headers = headersTxt ? JSON.parse(headersTxt) : {}; } catch {}
        var curl = 'curl -X ' + method;
        Object.keys(headers).forEach(function(k){ curl += ' -H "' + k + ': ' + headers[k] + '"'; });
        if (bodyTxt && bodyTxt.trim()) { curl += " -d '" + bodyTxt.replace(/'/g, "\\'") + "'"; }
        curl += ' "' + url + '"';
        navigator.clipboard && navigator.clipboard.writeText(curl);
        alert('cURL copied to clipboard');
      } catch (e) { console.error(e); }
    };
    window.editAndReplay = function(id) {
      var url = (document.getElementById('edit-url') as HTMLInputElement).value;
      var headersTxt = (document.getElementById('edit-headers') as HTMLTextAreaElement).value;
      var bodyTxt = (document.getElementById('edit-body') as HTMLTextAreaElement).value;
      var edited: any = {};
      if (url) edited.url = url;
      try { if (headersTxt) edited.headers = JSON.parse(headersTxt); } catch {}
      try { if (bodyTxt) edited.body = JSON.parse(bodyTxt); else edited.body = bodyTxt; } catch { edited.body = bodyTxt; }
      sendMessage({ type: 'edit_and_replay', data: { originalId: id, editedRequest: edited } });
    };

    // Initialize WebSocket on load
    connectWebSocket();
  `;
}
//# sourceMappingURL=websocket.js.map