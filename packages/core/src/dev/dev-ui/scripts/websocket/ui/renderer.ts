/**
 * UI Renderer - Safe DOM Manipulation
 * Principles: Separation of Concerns, Security
 */

export function generateUIRenderer(): string {
  return `
    // UI Renderer Module
    const UIRenderer = (function() {
      'use strict';

      // ============= Utility Functions =============

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

      function getMethodClass(method) {
        return 'method-' + method.toLowerCase();
      }

      function createElement(tag, attrs, textContent) {
        const el = document.createElement(tag);
        if (attrs) {
          for (const key in attrs) {
            if (['class', 'id', 'data-request-id', 'style'].includes(key)) {
              el.setAttribute(key, attrs[key]);
            }
          }
        }
        if (textContent !== undefined) {
          el.textContent = textContent;
        }
        return el;
      }

      // ============= Render Functions =============

      function renderConnectionStatus(connected, reconnecting) {
        const dot = document.getElementById('ws-status');
        const text = document.getElementById('ws-text');
        if (!dot || !text) return;

        if (connected) {
          dot.classList.add('connected');
          text.textContent = 'Connected';
        } else {
          dot.classList.remove('connected');
          text.textContent = reconnecting ? 'Reconnecting...' : 'Disconnected';
        }
      }

      function renderRequestsTable(requests) {
        const tbody = document.getElementById('requests-list');
        if (!tbody) return;

        if (!requests || requests.length === 0) {
          tbody.innerHTML =
            '<tr><td colspan="6" style="text-align: center; padding: 3rem;">' +
            '<div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>' +
            '<p style="color: var(--text-dim);">No recorded requests yet</p>' +
            '</td></tr>';
          return;
        }

        // Clear existing rows
        tbody.innerHTML = '';

        // Build rows safely
        requests.forEach(function(req) {
          const row = createElement('tr', { 'data-request-id': req.id });

          // Method cell
          const methodCell = createElement('td');
          const methodSpan = createElement('span', {
            'class': 'method ' + getMethodClass(req.method)
          }, req.method);
          methodCell.appendChild(methodSpan);
          row.appendChild(methodCell);

          // URL cell
          const urlCell = createElement('td', {}, req.url);
          row.appendChild(urlCell);

          // Status cell
          const statusCell = createElement('td', { 'class': 'status-cell' });
          const statusBadge = createElement('span', {
            'class': 'badge badge-' + getStatusColor(req.statusCode || 0)
          }, String(req.statusCode != null ? req.statusCode : '--'));
          statusCell.appendChild(statusBadge);
          row.appendChild(statusCell);

          // Duration cell
          const duration = req.duration != null ? req.duration.toFixed(2) + 'ms' : '--';
          const durationCell = createElement('td', { 'class': 'duration-cell' }, duration);
          row.appendChild(durationCell);

          // Time cell
          const timeCell = createElement('td', {}, formatTime(req.timestamp));
          row.appendChild(timeCell);

          // Actions cell
          const actionsCell = createElement('td');

          const viewBtn = createElement('button', {
            'class': 'btn btn-sm btn-primary'
          }, 'View');
          viewBtn.onclick = function() { window.viewRequest(req.id); };

          const replayBtn = createElement('button', {
            'class': 'btn btn-sm btn-success'
          }, 'Replay');
          replayBtn.onclick = function() { window.replayRequest(req.id); };

          const testBtn = createElement('button', {
            'class': 'btn btn-sm'
          }, 'Test');
          testBtn.onclick = function() { window.generateTest(req.id); };

          actionsCell.appendChild(viewBtn);
          actionsCell.appendChild(document.createTextNode(' '));
          actionsCell.appendChild(replayBtn);
          actionsCell.appendChild(document.createTextNode(' '));
          actionsCell.appendChild(testBtn);

          row.appendChild(actionsCell);
          tbody.appendChild(row);
        });
      }

      function renderRecentRequest(request) {
        const container = document.getElementById('recent-requests');
        if (!container) return;

        // Check if already exists
        const existing = container.querySelector('[data-request-id="' + request.id + '"]');
        if (existing) return;

        const item = createElement('div', {
          'class': 'flex-between mb-2 p-2',
          'style': 'background: var(--dark-light); border-radius: var(--radius-sm);',
          'data-request-id': request.id
        });

        const leftDiv = createElement('div');
        const methodSpan = createElement('span', {
          'class': 'method ' + getMethodClass(request.method)
        }, request.method);
        const urlSpan = createElement('span', { 'class': 'ml-2' }, request.url);
        leftDiv.appendChild(methodSpan);
        leftDiv.appendChild(urlSpan);

        const timeSpan = createElement('span', { 'class': 'text-dim' }, formatTime(request.timestamp));

        item.appendChild(leftDiv);
        item.appendChild(timeSpan);

        container.insertBefore(item, container.firstChild);

        // Keep only last 10
        while (container.children.length > 10) {
          container.removeChild(container.lastChild);
        }
      }

      function renderRecentError(error) {
        const container = document.getElementById('recent-errors');
        if (!container) return;

        const item = createElement('div', {
          'class': 'p-2 mb-2',
          'style': 'background: var(--dark-light); border-radius: var(--radius-sm); border-left: 3px solid var(--danger);'
        });

        const messageDiv = createElement('div', {
          'class': 'text-danger mb-1'
        }, error.message || error.error);

        const timeDiv = createElement('div', {
          'class': 'text-dim text-sm'
        }, formatTime(error.timestamp));

        item.appendChild(messageDiv);
        item.appendChild(timeDiv);

        container.insertBefore(item, container.firstChild);

        while (container.children.length > 10) {
          container.removeChild(container.lastChild);
        }
      }

      function updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      }

      function renderMetrics(metrics) {
        if (metrics.avgResponseTime != null) {
          updateElement('avg-response', metrics.avgResponseTime.toFixed(2) + 'ms');
        }
        if (metrics.recordingsCount != null) {
          updateElement('recordings-count', String(metrics.recordingsCount));
        }
        if (metrics.totalErrors != null) {
          updateElement('total-errors', String(metrics.totalErrors));
        }
      }

      function renderPerformance(performance) {
        if (performance.percentiles) {
          updateElement('p50-latency', performance.percentiles.p50 + 'ms');
          updateElement('p95-latency', performance.percentiles.p95 + 'ms');
          updateElement('p99-latency', performance.percentiles.p99 + 'ms');
        }
        if (performance.requestRate != null) {
          updateElement('req-per-sec', performance.requestRate.toFixed(2));
        }
        if (performance.slowestRoutes) {
          renderSlowRoutes(performance.slowestRoutes);
        }
      }

      function renderSlowRoutes(routes) {
        const tbody = document.getElementById('slow-routes');
        if (!tbody || !routes) return;

        tbody.innerHTML = '';
        routes.forEach(function(route) {
          const row = createElement('tr');
          row.appendChild(createElement('td', {}, route.route));
          row.appendChild(createElement('td', {}, route.method));
          row.appendChild(createElement('td', {}, route.avgDuration.toFixed(2) + 'ms'));
          row.appendChild(createElement('td', {}, String(route.count)));
          row.appendChild(createElement('td', {}, route.maxDuration.toFixed(2) + 'ms'));
          tbody.appendChild(row);
        });
      }

      function renderErrorList(errors) {
        const list = document.getElementById('error-groups-list');
        if (!list) return;

        if (!errors || errors.length === 0) {
          list.innerHTML =
            '<div class="empty-state">' +
            '<div class="empty-state-icon">✅</div>' +
            '<p>No errors tracked</p>' +
            '</div>';
          return;
        }

        list.innerHTML = '';
        errors.forEach(function(e) {
          const item = createElement('div', {
            'class': 'p-2 mb-2',
            'style': 'background: var(--dark-light); border-radius: var(--radius-sm);'
          });

          const flexDiv = createElement('div', { 'class': 'flex-between' });

          const leftDiv = createElement('div');
          const strong = createElement('strong', {}, e.message);
          const typeDiv = createElement('div', { 'class': 'text-dim text-sm' }, e.type);
          leftDiv.appendChild(strong);
          leftDiv.appendChild(typeDiv);

          const countDiv = createElement('div', { 'class': 'text-dim' }, e.count + 'x');

          flexDiv.appendChild(leftDiv);
          flexDiv.appendChild(countDiv);
          item.appendChild(flexDiv);
          list.appendChild(item);
        });
      }

      // Public API
      return {
        renderConnectionStatus: renderConnectionStatus,
        renderRequestsTable: renderRequestsTable,
        renderRecentRequest: renderRecentRequest,
        renderRecentError: renderRecentError,
        renderMetrics: renderMetrics,
        renderPerformance: renderPerformance,
        renderErrorList: renderErrorList,
        updateElement: updateElement
      };
    })();
  `;
}
