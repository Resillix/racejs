/**
 * WebSocket Client - Main Module
 * Principles: Separation of Concerns, Progressive Complexity, Encapsulation
 */

import { generateUIRenderer } from './ui/renderer.js';
import { generateMessageHandlers } from './handlers/index.js';

export function generateWebSocketClient(): string {
  return `
    // ============= State Manager =============
    const StateManager = (function() {
      'use strict';

      let requests = [];
      let errors = [];
      let metrics = {};
      let performance = {};
      const MAX_REQUESTS = 100;
      const MAX_ERRORS = 50;

      return {
        getRequests: function() { return requests.slice(); },
        getRequest: function(id) { return requests.find(function(r) { return r.id === id; }); },
        setRequests: function(reqs) { requests = reqs.slice(0, MAX_REQUESTS); },
        upsertRequest: function(req) {
          const idx = requests.findIndex(function(r) { return r.id === req.id; });
          if (idx >= 0) {
            requests[idx] = Object.assign({}, requests[idx], req);
          } else {
            requests.unshift(req);
            if (requests.length > MAX_REQUESTS) {
              requests = requests.slice(0, MAX_REQUESTS);
            }
          }
        },
        updateRequest: function(id, updates) {
          const idx = requests.findIndex(function(r) { return r.id === id; });
          if (idx === -1) return false;
          requests[idx] = Object.assign({}, requests[idx], updates);
          return true;
        },
        getRequestsCount: function() { return requests.length; },

        getErrors: function() { return errors.slice(); },
        addError: function(err) {
          errors.unshift(err);
          if (errors.length > MAX_ERRORS) {
            errors = errors.slice(0, MAX_ERRORS);
          }
        },
        getErrorsCount: function() { return errors.length; },

        getMetrics: function() { return Object.assign({}, metrics); },
        updateMetrics: function(m) { metrics = Object.assign({}, metrics, m); },

        getPerformance: function() { return Object.assign({}, performance); },
        updatePerformance: function(p) { performance = Object.assign({}, performance, p); }
      };
    })();

    ${generateUIRenderer()}

    // ============= Connection Manager =============
    const ConnectionManager = (function() {
      'use strict';

      // Connection states
      const ConnectionState = {
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        CONNECTED: 'connected',
        RECONNECTING: 'reconnecting',
        FAILED: 'failed'
      };

      let ws = null;
      let state = ConnectionState.DISCONNECTED;
      let reconnectAttempts = 0;
      let reconnectTimer = null;
      let heartbeatTimer = null;
      let messageQueue = [];

      const MAX_ATTEMPTS = 10;
      const BASE_DELAY = 1000;
      const MAX_DELAY = 30000;
      const HEARTBEAT_INTERVAL = 25000; // Send ping every 25s
      const MAX_QUEUE_SIZE = 100;

      let messageHandlers = [];
      let statusHandlers = [];
      let errorHandlers = [];

      function getWsUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return protocol + '//' + window.location.host + '/devtools';
      }

      function calculateDelay() {
        const delay = BASE_DELAY * Math.pow(2, reconnectAttempts);
        const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
        return Math.min(delay + jitter, MAX_DELAY);
      }

      function setState(newState) {
        if (state !== newState) {
          console.log('[DevTools] State: ' + state + ' -> ' + newState);
          state = newState;
          notifyStatusChange(newState);
        }
      }

      function notifyStatusChange(status) {
        statusHandlers.forEach(function(handler) {
          try { handler(status); } catch (e) { console.error('[DevTools] Status handler error', e); }
        });
      }

      function notifyMessage(message) {
        messageHandlers.forEach(function(handler) {
          try { handler(message); } catch (e) { console.error('[DevTools] Message handler error', e); }
        });
      }

      function notifyError(error) {
        errorHandlers.forEach(function(handler) {
          try { handler(error); } catch (e) { console.error('[DevTools] Error handler error', e); }
        });
      }

      function startHeartbeat() {
        stopHeartbeat();
        heartbeatTimer = setInterval(function() {
          if (ws && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            } catch (e) {
              console.error('[DevTools] Heartbeat failed', e);
            }
          }
        }, HEARTBEAT_INTERVAL);
      }

      function stopHeartbeat() {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
      }

      function flushMessageQueue() {
        if (!ws || ws.readyState !== WebSocket.OPEN || messageQueue.length === 0) {
          return;
        }

        console.log('[DevTools] Flushing ' + messageQueue.length + ' queued messages');

        while (messageQueue.length > 0) {
          const message = messageQueue.shift();
          try {
            ws.send(JSON.stringify(message));
          } catch (error) {
            console.error('[DevTools] Failed to send queued message', error);
            // Put it back at the front
            messageQueue.unshift(message);
            break;
          }
        }
      }

      function handleConnectionError() {
        stopHeartbeat();

        if (reconnectAttempts >= MAX_ATTEMPTS) {
          console.error('[DevTools] Max reconnection attempts reached');
          setState(ConnectionState.FAILED);
          notifyError({ type: 'max_retries', message: 'Failed to reconnect after ' + MAX_ATTEMPTS + ' attempts' });
          return;
        }

        reconnectAttempts++;
        const delay = calculateDelay();
        console.log('[DevTools] Reconnecting in ' + delay + 'ms... (attempt ' + reconnectAttempts + ')');

        setState(ConnectionState.RECONNECTING);

        reconnectTimer = setTimeout(function() {
          connect();
        }, delay);
      }

      function connect() {
        if (ws && ws.readyState === WebSocket.OPEN) {
          console.warn('[DevTools] Already connected');
          return;
        }

        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        setState(ConnectionState.CONNECTING);
        const url = getWsUrl();
        console.log('[DevTools] Connecting to', url);

        try {
          ws = new WebSocket(url);

          ws.onopen = function() {
            console.log('[DevTools] Connected');
            reconnectAttempts = 0;
            setState(ConnectionState.CONNECTED);
            startHeartbeat();

            // Send HELLO
            send({ type: 'hello', data: { clientVersion: '1.0.0', timestamp: Date.now() } });

            // Flush queued messages
            setTimeout(flushMessageQueue, 100);

            // Request initial data
            setTimeout(function() {
              send({ type: 'get_requests', data: { limit: 100 } });
              send({ type: 'get_metrics' });
              send({ type: 'get_performance_metrics' });
            }, 500);
          };

          ws.onmessage = function(event) {
            try {
              const message = JSON.parse(event.data);
              if (message && typeof message.type === 'string') {
                console.log('[DevTools] <-', message.type);

                // Handle pong responses
                if (message.type === 'pong') {
                  return; // Just acknowledgment
                }

                notifyMessage(message);
              }
            } catch (error) {
              console.error('[DevTools] Failed to parse message', error);
              notifyError({ type: 'parse_error', message: String(error) });
            }
          };

          ws.onerror = function(error) {
            console.error('[DevTools] WebSocket error', error);
            notifyError({ type: 'connection_error', error: error });
          };

          ws.onclose = function(event) {
            console.log('[DevTools] Disconnected', event.code, event.reason);
            stopHeartbeat();
            setState(ConnectionState.DISCONNECTED);

            // Only reconnect if not a normal closure
            if (event.code !== 1000 && event.code !== 1001) {
              handleConnectionError();
            }
          };
        } catch (error) {
          console.error('[DevTools] Failed to create WebSocket', error);
          notifyError({ type: 'creation_error', error: error });
          handleConnectionError();
        }
      }

      function send(message) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          console.warn('[DevTools] Cannot send: not connected, queueing message');

          // Queue message
          if (messageQueue.length < MAX_QUEUE_SIZE) {
            messageQueue.push(message);
          } else {
            console.warn('[DevTools] Message queue full, dropping message');
          }
          return false;
        }

        try {
          ws.send(JSON.stringify(message));
          console.log('[DevTools] ->', message.type);
          return true;
        } catch (error) {
          console.error('[DevTools] Failed to send', error);

          // Queue for retry
          if (messageQueue.length < MAX_QUEUE_SIZE) {
            messageQueue.push(message);
          }
          return false;
        }
      }

      function disconnect() {
        stopHeartbeat();

        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        if (ws) {
          ws.close(1000, 'Client disconnect');
          ws = null;
        }

        setState(ConnectionState.DISCONNECTED);
      }

      function getState() {
        return state;
      }

      function isConnected() {
        return state === ConnectionState.CONNECTED;
      }

      function getQueueSize() {
        return messageQueue.length;
      }

      function clearQueue() {
        messageQueue = [];
      }

      function onMessage(handler) {
        messageHandlers.push(handler);
        return function() {
          const idx = messageHandlers.indexOf(handler);
          if (idx >= 0) messageHandlers.splice(idx, 1);
        };
      }

      function onStatusChange(handler) {
        statusHandlers.push(handler);
        // Call immediately with current state
        handler(state);
        return function() {
          const idx = statusHandlers.indexOf(handler);
          if (idx >= 0) statusHandlers.splice(idx, 1);
        };
      }

      function onError(handler) {
        errorHandlers.push(handler);
        return function() {
          const idx = errorHandlers.indexOf(handler);
          if (idx >= 0) errorHandlers.splice(idx, 1);
        };
      }

      return {
        connect: connect,
        disconnect: disconnect,
        send: send,
        getState: getState,
        isConnected: isConnected,
        getQueueSize: getQueueSize,
        clearQueue: clearQueue,
        onMessage: onMessage,
        onStatusChange: onStatusChange,
        onError: onError,
        ConnectionState: ConnectionState
      };
    })();

    ${generateMessageHandlers()}

    // ============= Initialize Application =============
    (function() {
      'use strict';

      // Create handler instance
      const handlers = MessageHandlers(StateManager, UIRenderer, ConnectionManager);

      // Wire connection status to UI
      ConnectionManager.onStatusChange(function(status) {
        const connected = status === ConnectionManager.ConnectionState.CONNECTED;
        const reconnecting = status === ConnectionManager.ConnectionState.RECONNECTING;
        UIRenderer.renderConnectionStatus(connected, reconnecting);
      });

      // Handle errors
      ConnectionManager.onError(function(error) {
        console.error('[DevTools] Connection error:', error);
        if (error.type === 'max_retries') {
          // Could show UI notification here
        }
      });

      // Wire messages to handlers
      ConnectionManager.onMessage(handlers.handleMessage);

      // Expose global API for UI onclick handlers
      window.viewRequest = function(id) {
        ConnectionManager.send({ type: 'get_request', data: { id: id } });
      };

      window.replayRequest = function(id) {
        ConnectionManager.send({ type: 'replay_request', data: { id: id } });
      };

      window.generateTest = function(id) {
        ConnectionManager.send({ type: 'generate_test', data: { id: id, framework: 'vitest' } });
      };

      window.exportRequests = function() {
        ConnectionManager.send({ type: 'export_requests' });
      };

      window.closeRequestModal = function() {
        const modal = document.getElementById('request-modal');
        if (modal) modal.classList.add('hidden');
      };

      window.copyCurlFromDetails = function() {
        try {
          const url = document.getElementById('edit-url').value;
          const headersTxt = document.getElementById('edit-headers').value;
          const bodyTxt = document.getElementById('edit-body').value;
          let headers = {};
          try { headers = JSON.parse(headersTxt); } catch (e) {}

          let curl = 'curl -X GET';
          for (const key in headers) {
            curl += ' -H "' + key + ': ' + headers[key] + '"';
          }
          if (bodyTxt && bodyTxt.trim()) {
            curl += " -d '" + bodyTxt.replace(/'/g, "\\\\'") + "'";
          }
          curl += ' "' + url + '"';

          if (navigator.clipboard) {
            navigator.clipboard.writeText(curl);
            alert('cURL copied to clipboard');
          }
        } catch (error) {
          console.error('[DevTools] Failed to copy cURL', error);
        }
      };

      window.editAndReplay = function(id) {
        try {
          const url = document.getElementById('edit-url').value;
          const headersTxt = document.getElementById('edit-headers').value;
          const bodyTxt = document.getElementById('edit-body').value;

          const edited = { url: url };
          try { edited.headers = JSON.parse(headersTxt); } catch (e) {}
          try { edited.body = JSON.parse(bodyTxt); } catch (e) { edited.body = bodyTxt; }

          ConnectionManager.send({
            type: 'edit_and_replay',
            data: { originalId: id, editedRequest: edited }
          });
        } catch (error) {
          console.error('[DevTools] Failed to edit and replay', error);
        }
      };

      // Refresh requests table when tab becomes active
      window.refreshRequestsTab = function() {
        UIRenderer.renderRequestsTable(StateManager.getRequests());
      };

      // Expose renderRequestsTable globally for UI scripts (ui.ts)
      window.renderRequestsTable = function() {
        UIRenderer.renderRequestsTable(StateManager.getRequests());
      };

      // Start connection
      ConnectionManager.connect();

      console.log('[DevTools] Client initialized');
    })();
  `;
}
