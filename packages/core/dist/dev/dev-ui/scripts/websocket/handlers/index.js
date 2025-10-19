/**
 * Message Handlers - Domain-Specific Message Processing
 * Principles: Single Responsibility, Separation of Concerns
 */
export function generateMessageHandlers() {
    return `
    // Message Handlers Module
    const MessageHandlers = (function(state, ui, connection) {
      'use strict';

      // ============= Request Handlers =============

      function handleRequestsList(data) {
        if (!data.requests) return;

        state.setRequests(data.requests);
        console.log('[DevTools] Loaded', data.requests.length, 'requests');

        if (document.getElementById('requests').classList.contains('active')) {
          ui.renderRequestsTable(state.getRequests());
        }
      }

      function handleRequestRecorded(data) {
        state.upsertRequest(data);
        console.log('[DevTools] Request recorded:', data.id);

        // Update UI
        ui.renderRecentRequest(data);
        ui.updateElement('total-requests', String(state.getRequestsCount()));

        if (document.getElementById('requests').classList.contains('active')) {
          ui.renderRequestsTable(state.getRequests());
        }
      }

      function handleRequestResponse(data) {
        const updated = state.updateRequest(data.id, {
          statusCode: data.statusCode,
          duration: data.duration
        });

        if (updated) {
          console.log('[DevTools] Request response updated:', data.id);

          if (document.getElementById('requests').classList.contains('active')) {
            ui.renderRequestsTable(state.getRequests());
          }
        }
      }

      function handleRequestDetails(details) {
        const modal = document.getElementById('request-modal');
        if (!modal) return;

        modal.classList.remove('hidden');

        const safeDetails = {
          id: details.id,
          method: details.method || 'GET',
          url: details.url || '',
          headers: details.headers || {},
          body: details.body
        };

        modal.innerHTML =
          '<div class="card">' +
            '<div class="card-header flex-between">' +
              '<h3>Request ' + safeDetails.method + ' ' + safeDetails.url + '</h3>' +
              '<button class="btn" onclick="closeRequestModal()">Close</button>' +
            '</div>' +
            '<div class="card-body">' +
              '<div class="grid grid-2">' +
                '<div>' +
                  '<h4 class="mb-1">Headers</h4>' +
                  '<textarea id="edit-headers" style="width:100%; height:120px;">' +
                    JSON.stringify(safeDetails.headers, null, 2) +
                  '</textarea>' +
                '</div>' +
                '<div>' +
                  '<h4 class="mb-1">Body</h4>' +
                  '<textarea id="edit-body" style="width:100%; height:120px;">' +
                    (typeof safeDetails.body === 'string' ? safeDetails.body : JSON.stringify(safeDetails.body || {}, null, 2)) +
                  '</textarea>' +
                '</div>' +
              '</div>' +
              '<div class="mt-2">' +
                '<label class="filter-label">URL</label>' +
                '<input id="edit-url" type="text" style="width:100%" value="' + safeDetails.url + '"/>' +
              '</div>' +
              '<div class="mt-2">' +
                '<button class="btn btn-success" onclick="replayRequest(\\'' + safeDetails.id + '\\')">Replay</button>' +
                '<button class="btn" onclick="editAndReplay(\\'' + safeDetails.id + '\\')">Edit & Replay</button>' +
                '<button class="btn" onclick="copyCurlFromDetails()">Copy cURL</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      }

      // ============= Error Handlers =============

      function handleErrorTracked(data) {
        state.addError(data);

        ui.renderRecentError(data);
        ui.updateElement('total-errors', String(state.getErrorsCount()));
      }

      function handleErrorStats(data) {
        state.updateMetrics({
          totalErrors: data.totalErrors,
          uniqueErrors: data.uniqueErrors,
          errorRate: data.errorRate,
          topErrors: data.topErrors
        });

        ui.updateElement('errors-total', String(data.totalErrors || 0));
        ui.updateElement('errors-groups', String(data.uniqueErrors || 0));
        ui.updateElement('errors-recent', String((data.topErrors && data.topErrors.length) || 0));
        ui.updateElement('errors-rate', data.errorRate != null ? data.errorRate.toFixed(2) : '--');
      }

      function handleErrorList(data) {
        ui.renderErrorList(data.errors);
      }

      // ============= Metrics Handlers =============

      function handleMetricsUpdate(data) {
        state.updateMetrics(data);
        ui.renderMetrics(data);
      }

      function handlePerformanceMetrics(data) {
        state.updatePerformance(data);
        ui.renderPerformance(data);
      }

      function handlePerformanceUpdate(data) {
        state.updatePerformance(data);
        ui.renderPerformance(data);
      }

      // ============= Replay Handlers =============

      function handleReplayResult(result) {
        console.log('[DevTools] Replay result:', result);

        if (result.success && result.response) {
          alert(
            'Replay OK: ' + result.response.statusCode +
            ' in ' + result.response.duration.toFixed(1) + 'ms'
          );
        } else {
          alert('Replay failed: ' + (result.error || 'Unknown error'));
        }
      }

      function handleReplayComparison(data) {
        console.log('[DevTools] Replay comparison:', data);
      }

      // ============= Test Generation Handlers =============

      function handleTestGenerated(data) {
        try {
          const blob = new Blob([data.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('[DevTools] Failed to download test', error);
        }
      }

      // ============= Export Handlers =============

      function handleRequestsExport(data) {
        try {
          const blob = new Blob([JSON.stringify(data.data, null, 2)], {
            type: 'application/json'
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'racejs-recordings.json';
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('[DevTools] Failed to export requests', error);
        }
      }

      // ============= Connection Handlers =============

      function handleConnected(data) {
        console.log('[DevTools] Connected to server:', data);
      }

      // ============= Message Router =============

      function handleMessage(message) {
        try {
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
            case 'requests_export':
              handleRequestsExport(message.data);
              break;
            case 'connected':
              handleConnected(message.data);
              break;
            default:
              console.log('[DevTools] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[DevTools] Handler error for', message.type, error);
        }
      }

      // Public API
      return {
        handleMessage: handleMessage
      };
    });
  `;
}
//# sourceMappingURL=index.js.map