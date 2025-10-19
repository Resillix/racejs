/**
 * DevTools UI - Embedded HTML Dashboard
 *
 * Modern, responsive browser-based UI for RaceJS DevTools.
 * Features: Dashboard, Routes, Requests, Logs with real-time WebSocket updates.
 *
 * Note: This file is now a re-export of the modular UI structure.
 * The actual UI components are in the dev-ui/ directory.
 */

import { generateDevToolsUI as __generateDevToolsUI } from './dev-ui/index.js';
export { generateDevToolsUI } from './dev-ui/index.js';

/**
 * Legacy export for backwards compatibility
 * @deprecated Use the modular structure in dev-ui/ instead
 */
export function generateDevToolsUILegacy(): string {
  // Backwards-compat shim: delegate to the modular UI entrypoint (unified source of truth)
  return __generateDevToolsUI();
  // Legacy implementation retained below for reference (unreachable)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RaceJS DevTools</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #0066ff;
      --primary-dark: #0052cc;
      --success: #00c851;
      --warning: #ff9800;
      --danger: #ff4444;
      --dark: #1a1a1a;
      --dark-light: #2d2d2d;
      --gray: #666;
      --gray-light: #999;
      --border: #444;
      --bg: #0f0f0f;
      --text: #e0e0e0;
      --text-dim: #999;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow: hidden;
    }

    /* Header */
    .header {
      background: var(--dark);
      border-bottom: 2px solid var(--primary);
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 70px;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo::before {
      content: '⚡';
      font-size: 1.8rem;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--dark-light);
      border-radius: 20px;
      font-size: 0.875rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--gray);
      animation: pulse 2s infinite;
    }

    .status-dot.connected {
      background: var(--success);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Tabs */
    .tabs {
      background: var(--dark);
      display: flex;
      gap: 0.5rem;
      padding: 0 2rem;
      border-bottom: 1px solid var(--border);
    }

    .tab {
      padding: 1rem 1.5rem;
      cursor: pointer;
      border: none;
      background: none;
      color: var(--text-dim);
      font-size: 0.9rem;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab:hover {
      color: var(--text);
      background: var(--dark-light);
    }

    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    /* Content */
    .content {
      height: calc(100vh - 70px - 50px);
      overflow-y: auto;
      padding: 2rem;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
      animation: fadeIn 0.3s;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Dashboard */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: var(--dark);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      transition: border-color 0.3s;
    }

    .metric-card:hover {
      border-color: var(--primary);
    }

    .metric-label {
      font-size: 0.875rem;
      color: var(--text-dim);
      margin-bottom: 0.5rem;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
    }

    .metric-change {
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .metric-change.positive {
      color: var(--success);
    }

    .metric-change.negative {
      color: var(--danger);
    }

    /* Requests Table */
    .table-container {
      background: var(--dark);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .table-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-title {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-dark);
    }

    .btn-danger {
      background: var(--danger);
      color: white;
    }

    .btn-danger:hover {
      opacity: 0.9;
    }

    .btn-small {
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
      border-radius: 3px;
    }

    .btn-success {
      background: var(--success);
      color: white;
    }

    .btn-success:hover {
      opacity: 0.9;
    }

    .btn-warning {
      background: var(--warning);
      color: white;
    }

    .btn-warning:hover {
      opacity: 0.9;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-content {
      display: none;
      position: absolute;
      right: 0;
      background: var(--dark);
      border: 1px solid var(--border);
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      min-width: 150px;
    }

    .dropdown-content.show {
      display: block;
    }

    .dropdown-item {
      display: block;
      padding: 0.75rem 1rem;
      color: var(--text);
      text-decoration: none;
      font-size: 0.875rem;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background 0.2s;
    }

    .dropdown-item:hover {
      background: var(--dark-light);
    }

    /* Modal Styles */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 2000;
      justify-content: center;
      align-items: center;
    }

    .modal.show {
      display: flex;
    }

    .modal-content {
      background: var(--dark);
      border: 1px solid var(--border);
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 80%;
      overflow-y: auto;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-dim);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.25rem;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text);
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      background: var(--dark-light);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text);
      font-size: 0.9rem;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
      font-family: 'Courier New', monospace;
    }

    .diff-viewer {
      background: var(--dark-light);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1rem;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      max-height: 400px;
      overflow-y: auto;
    }

    .diff-line {
      margin: 2px 0;
      padding: 2px 4px;
      border-radius: 2px;
    }

    .diff-added {
      background: rgba(0, 200, 81, 0.2);
      border-left: 3px solid var(--success);
    }

    .diff-removed {
      background: rgba(255, 68, 68, 0.2);
      border-left: 3px solid var(--danger);
    }

    .diff-changed {
      background: rgba(255, 152, 0, 0.2);
      border-left: 3px solid var(--warning);
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: var(--dark-light);
    }

    th {
      text-align: left;
      padding: 1rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border);
      font-size: 0.9rem;
    }

    tbody tr {
      transition: background 0.2s;
    }

    tbody tr:hover {
      background: var(--dark-light);
    }

    .method {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .method-get { background: var(--success); color: white; }
    .method-post { background: var(--primary); color: white; }
    .method-put { background: var(--warning); color: white; }
    .method-delete { background: var(--danger); color: white; }

    .status-code {
      font-weight: 600;
    }

    .status-2xx { color: var(--success); }
    .status-3xx { color: var(--warning); }
    .status-4xx { color: var(--danger); }
    .status-5xx { color: var(--danger); }

    .duration {
      color: var(--text-dim);
      font-family: 'Courier New', monospace;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-dim);
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    /* Routes */
    .route-item {
      background: var(--dark);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem 1.5rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .route-method {
      flex-shrink: 0;
    }

    .route-path {
      flex: 1;
      font-family: 'Courier New', monospace;
      color: var(--primary);
    }

    /* Logs */
    .log-entry {
      padding: 0.75rem 1rem;
      border-left: 3px solid var(--border);
      margin-bottom: 0.5rem;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      background: var(--dark);
      border-radius: 4px;
    }

    .log-entry.info { border-left-color: var(--primary); }
    .log-entry.warn { border-left-color: var(--warning); }
    .log-entry.error { border-left-color: var(--danger); }

    .log-time {
      color: var(--text-dim);
      margin-right: 0.5rem;
    }

    .log-level {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.5rem;
    }

    .log-level.info { background: var(--primary); color: white; }
    .log-level.warn { background: var(--warning); color: white; }
    .log-level.error { background: var(--danger); color: white; }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--dark);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--gray);
    }

    /* Loading */
    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--text-dim);
    }

    .spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Performance Tab */
    .performance-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .perf-section {
      background: var(--dark);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .perf-section h3 {
      padding: 1rem 1.5rem;
      margin: 0;
      background: var(--dark-light);
      border-bottom: 1px solid var(--border);
      font-size: 1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .chart-container {
      padding: 1.5rem;
      background: var(--bg);
    }

    .chart-legend {
      display: flex;
      gap: 1rem;
      padding: 0 1.5rem 1.5rem;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .flame-graph-container {
      padding: 1.5rem;
      background: var(--bg);
      min-height: 400px;
    }

    #flameGraphViewer {
      background: var(--dark-light);
      border: 1px solid var(--border);
      border-radius: 4px;
      min-height: 350px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .route-perf-table {
      width: 100%;
      border-collapse: collapse;
    }

    .route-perf-table th,
    .route-perf-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    .route-perf-table th {
      background: var(--dark-light);
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-dim);
    }

    .route-perf-table td {
      font-size: 0.875rem;
    }

    .latency-fast {
      color: var(--success);
    }

    .latency-slow {
      color: var(--warning);
    }

    .latency-critical {
      color: var(--danger);
    }

    .error-rate-low {
      color: var(--success);
    }

    .error-rate-medium {
      color: var(--warning);
    }

    .error-rate-high {
      color: var(--danger);
    }

    .profiling-active {
      animation: pulse-glow 2s infinite;
    }

    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 5px var(--primary);
        border-color: var(--primary);
      }
      50% {
        box-shadow: 0 0 20px var(--primary);
        border-color: var(--primary);
      }
    }

    /* Errors Tab Styles */
    .error-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .error-filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .filter-group label {
      font-size: 0.875rem;
      color: var(--text-dim);
    }

    .filter-select, .filter-input {
      background: var(--dark-light);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .filter-input {
      min-width: 200px;
    }

    .error-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--dark);
      border-radius: 8px;
      overflow: hidden;
    }

    .error-table thead {
      background: var(--dark-light);
    }

    .error-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-dim);
      border-bottom: 2px solid var(--border);
    }

    .error-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
    }

    .error-table tr {
      cursor: pointer;
      transition: background 0.2s;
    }

    .error-table tbody tr:hover {
      background: var(--dark-light);
    }

    .error-severity {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .error-severity.critical {
      background: rgba(255, 68, 68, 0.2);
      color: var(--danger);
      border: 1px solid var(--danger);
    }

    .error-severity.high {
      background: rgba(255, 152, 0, 0.2);
      color: var(--warning);
      border: 1px solid var(--warning);
    }

    .error-severity.medium {
      background: rgba(255, 235, 59, 0.2);
      color: #ffeb3b;
      border: 1px solid #ffeb3b;
    }

    .error-severity.low {
      background: rgba(0, 200, 81, 0.2);
      color: var(--success);
      border: 1px solid var(--success);
    }

    .error-trend {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    .error-trend.increasing {
      color: var(--danger);
    }

    .error-trend.decreasing {
      color: var(--success);
    }

    .error-trend.stable {
      color: var(--text-dim);
    }

    .error-status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .error-status.open {
      background: rgba(0, 102, 255, 0.2);
      color: var(--primary);
    }

    .error-status.resolved {
      background: rgba(0, 200, 81, 0.2);
      color: var(--success);
    }

    .error-status.ignored {
      background: rgba(102, 102, 102, 0.2);
      color: var(--gray);
    }

    .error-details-panel {
      position: fixed;
      right: 0;
      top: 70px;
      width: 50%;
      height: calc(100vh - 70px);
      background: var(--dark);
      border-left: 1px solid var(--border);
      padding: 2rem;
      overflow-y: auto;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      z-index: 1000;
    }

    .error-details-panel.open {
      transform: translateX(0);
    }

    .error-details-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .error-details-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .error-details-actions {
      display: flex;
      gap: 0.5rem;
    }

    .error-stack {
      background: var(--dark-light);
      padding: 1rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.8125rem;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre-wrap;
      margin-bottom: 1.5rem;
    }

    .error-occurrences {
      margin-top: 1.5rem;
    }

    .occurrence-item {
      background: var(--dark-light);
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .occurrence-route {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.875rem;
    }

    .occurrence-time {
      font-size: 0.8125rem;
      color: var(--text-dim);
    }

    .error-count-badge {
      background: var(--danger);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .notification {
      position: fixed;
      top: 90px;
      right: 2rem;
      background: var(--dark);
      border: 1px solid var(--border);
      border-left: 4px solid var(--danger);
      padding: 1rem 1.5rem;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: translateX(400px);
      transition: transform 0.3s ease;
      z-index: 2000;
      max-width: 400px;
    }

    .notification.show {
      transform: translateX(0);
    }

    .notification-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .notification-message {
      font-size: 0.875rem;
      color: var(--text-dim);
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="logo">RaceJS DevTools</div>
    <div class="status">
      <div class="status-indicator">
        <div class="status-dot" id="wsStatus"></div>
        <span id="wsStatusText">Connecting...</span>
      </div>
      <div class="status-indicator">
        <span id="uptime">0s</span>
      </div>
    </div>
  </header>

  <!-- Tabs -->
  <nav class="tabs">
    <button class="tab active" data-tab="dashboard">📊 Dashboard</button>
    <button class="tab" data-tab="requests">📹 Requests</button>
    <button class="tab" data-tab="routes">🛣️ Routes</button>
    <button class="tab" data-tab="errors">🚨 Errors</button>
    <button class="tab" data-tab="performance">⚡ Performance</button>
    <button class="tab" data-tab="logs">📝 Logs</button>
  </nav>

  <!-- Content -->
  <main class="content">
    <!-- Dashboard Tab -->
    <div class="tab-content active" id="dashboard">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Requests</div>
          <div class="metric-value" id="totalRequests">0</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Errors</div>
          <div class="metric-value" id="totalErrors">0</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg Response Time</div>
          <div class="metric-value" id="avgResponseTime">0ms</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Memory Usage</div>
          <div class="metric-value" id="memoryUsage">0 MB</div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <div class="table-title">Recent Requests</div>
        </div>
        <div id="recentRequestsTable"></div>
      </div>
    </div>

    <!-- Requests Tab -->
    <div class="tab-content" id="requests">
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">Recorded Requests</div>
          <button class="btn btn-danger" onclick="clearRequests()">Clear All</button>
        </div>
        <div id="requestsTable">
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading requests...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Routes Tab -->
    <div class="tab-content" id="routes">
      <div id="routesList">
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading routes...</p>
        </div>
      </div>
    </div>

    <!-- Performance Tab -->
    <div class="tab-content" id="performance">
      <div class="performance-layout">
        <!-- Performance Metrics -->
        <div class="perf-section">
          <h3>📊 Live Metrics</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Response Time (P95)</div>
              <div class="metric-value" id="perfP95">0ms</div>
              <div class="metric-change" id="perfP95Change"></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Requests/sec</div>
              <div class="metric-value" id="perfRPS">0</div>
              <div class="metric-change" id="perfRPSChange"></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Memory Usage</div>
              <div class="metric-value" id="perfMemory">0 MB</div>
              <div class="metric-change" id="perfMemoryChange"></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Error Rate</div>
              <div class="metric-value" id="perfErrorRate">0%</div>
              <div class="metric-change" id="perfErrorRateChange"></div>
            </div>
          </div>
        </div>

        <!-- Latency Chart -->
        <div class="perf-section">
          <h3>📈 Response Time Trends</h3>
          <div class="chart-container">
            <canvas id="latencyChart" width="800" height="200"></canvas>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color" style="background: #0066ff;"></span>
              <span>P50</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #ff9800;"></span>
              <span>P95</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #ff4444;"></span>
              <span>P99</span>
            </div>
          </div>
        </div>

        <!-- Route Performance -->
        <div class="perf-section">
          <h3>🛣️ Route Performance</h3>
          <div class="table-container">
            <div class="table-header">
              <div class="table-title">Slowest Routes</div>
              <div class="action-buttons">
                <button class="btn btn-primary btn-small" id="startProfiling">Start CPU Profiling</button>
                <button class="btn btn-danger btn-small" id="stopProfiling" style="display: none;">Stop Profiling</button>
              </div>
            </div>
            <div id="routePerformanceList">
              <div class="loading">
                <div class="spinner"></div>
                <p>Loading route performance...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Flame Graph -->
        <div class="perf-section" id="flameGraphSection" style="display: none;">
          <h3>🔥 CPU Flame Graph</h3>
          <div class="flame-graph-container">
            <div id="flameGraphViewer">
              <div class="empty-state">
                <div class="empty-state-icon">🔥</div>
                <p>No profiling data available. Start CPU profiling to see flame graphs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logs Tab -->
    <div class="tab-content" id="logs">
      <div id="logsList">
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p>No logs yet. Logs will appear here in real-time.</p>
        </div>
      </div>
    </div>

    <!-- Errors Tab -->
    <div class="tab-content" id="errors">
      <!-- Error Statistics -->
      <div class="error-stats-grid">
        <div class="metric-card">
          <div class="metric-value" id="totalErrors">0</div>
          <div class="metric-label">Total Errors</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" id="uniqueErrors">0</div>
          <div class="metric-label">Unique Errors</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" id="errorRate">0.0</div>
          <div class="metric-label">Errors/min</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" id="criticalErrors">0</div>
          <div class="metric-label">Critical</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="error-filters">
        <div class="filter-group">
          <label>Status:</label>
          <select class="filter-select" id="errorStatusFilter">
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Severity:</label>
          <select class="filter-select" id="errorSeverityFilter">
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Search:</label>
          <input type="text" class="filter-input" id="errorSearchFilter" placeholder="Search errors...">
        </div>
        <button class="btn btn-secondary" onclick="clearFilters()">Clear Filters</button>
        <button class="btn btn-secondary" onclick="clearAllErrors()">Clear All</button>
        <button class="btn btn-secondary" onclick="exportErrors()">Export</button>
      </div>

      <!-- Error Table -->
      <div id="errorsList">
        <table class="error-table">
          <thead>
            <tr>
              <th>Error</th>
              <th>Type</th>
              <th>Count</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Trend</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody id="errorsTableBody">
            <tr>
              <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-dim);">
                <div class="empty-state-icon" style="font-size: 3rem;">🎉</div>
                <p>No errors yet! Your application is running smoothly.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- Error Details Panel -->
  <div class="error-details-panel" id="errorDetailsPanel">
    <div class="error-details-header">
      <div>
        <div class="error-details-title" id="errorDetailsTitle">Error Details</div>
        <span class="error-severity" id="errorDetailsSeverity">high</span>
        <span class="error-count-badge" id="errorDetailsCount">1</span>
      </div>
      <div class="error-details-actions">
        <button class="btn btn-sm btn-success" onclick="markErrorResolved()">✓ Resolve</button>
        <button class="btn btn-sm btn-secondary" onclick="markErrorIgnored()">◯ Ignore</button>
        <button class="btn btn-sm btn-secondary" onclick="closeErrorDetails()">✕ Close</button>
      </div>
    </div>

    <div>
      <h3 style="margin-bottom: 0.5rem;">Stack Trace</h3>
      <div class="error-stack" id="errorDetailsStack">
        No stack trace available
      </div>
    </div>

    <div class="error-occurrences">
      <h3 style="margin-bottom: 1rem;">Occurrences (<span id="errorOccurrenceCount">0</span>)</h3>
      <div id="errorOccurrencesList">
        <!-- Occurrences will be dynamically added here -->
      </div>
    </div>
  </div>

  <!-- Notification Toast -->
  <div class="notification" id="errorNotification">
    <div class="notification-title" id="notificationTitle">New Error</div>
    <div class="notification-message" id="notificationMessage">An error has occurred</div>
  </div>

  <script>
    // WebSocket connection
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    // State
    const state = {
      metrics: null,
      requests: [],
      routes: [],
      logs: [],
      errors: [],
      errorStats: null,
      selectedError: null,
      performance: null,
      profiling: false,
      latencyHistory: []
    };

    // Connect to WebSocket
    function connect() {
      const wsUrl = 'ws://' + window.location.hostname + ':' + (window.location.port || 9229) + '/devtools';

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Connected to DevTools');
        updateConnectionStatus(true);
        reconnectAttempts = 0;

        // Send HELLO
        send({ type: 'hello', data: { clientVersion: '1.0.0' } });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('❌ Disconnected from DevTools');
        updateConnectionStatus(false);

        // Attempt reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setTimeout(connect, 2000 * reconnectAttempts);
        }
      };
    }

    // Send message
    function send(message) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          ...message,
          timestamp: Date.now(),
          id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        }));
      }
    }

    // Handle incoming messages
    function handleMessage(message) {
      switch (message.type) {
        case 'connected':
          console.log('Connected to DevTools v' + message.data.version);
          break;

        case 'metrics_update':
          state.metrics = message.data;
          updateDashboard();
          break;

        case 'requests_list':
          state.requests = message.data.requests;
          updateRequestsTable();
          break;

        case 'routes_list':
          state.routes = message.data.routes;
          updateRoutesList();
          break;

        case 'request_recorded':
          // Add to requests list
          addRequestToList(message.data);
          break;

        case 'request_response':
          // Update request in list
          updateRequestInList(message.data);
          break;

        case 'log_entry':
          state.logs.unshift(message.data);
          if (state.logs.length > 100) state.logs.pop();
          updateLogsList();
          break;

        case 'replay_result':
          if (message.data.success) {
            showNotification(\`Replay completed! Status: \${message.data.response.statusCode}\`, 'success');
          } else {
            showNotification(\`Replay failed: \${message.data.error}\`, 'error');
          }
          break;

        case 'replay_comparison':
          const comparison = message.data;
          const diffViewer = document.getElementById('diffViewer');

          let diffHtml = \`<h4>Comparison Summary</h4>\`;
          diffHtml += \`<p>Identical: \${comparison.summary.identical ? '✅' : '❌'}</p>\`;
          diffHtml += \`<p>Status Code Match: \${comparison.summary.statusCodeMatch ? '✅' : '❌'}</p>\`;
          diffHtml += \`<p>Body Match: \${comparison.summary.bodyMatch ? '✅' : '❌'}</p>\`;
          diffHtml += \`<p>Headers Match: \${comparison.summary.headersMatch ? '✅' : '❌'}</p>\`;

          if (comparison.differences.length > 0) {
            diffHtml += \`<h4>Differences</h4>\`;
            comparison.differences.forEach(diff => {
              const className = diff.type === 'added' ? 'diff-added' :
                              diff.type === 'removed' ? 'diff-removed' : 'diff-changed';
              diffHtml += \`<div class="diff-line \${className}">\`;
              diffHtml += \`<strong>\${diff.path}:</strong> \${diff.originalValue} → \${diff.replayValue}\`;
              diffHtml += \`</div>\`;
            });
          }

          diffViewer.innerHTML = diffHtml;
          break;

        case 'test_generated':
          const testData = message.data;
          showNotification(\`\${testData.framework} test generated (\${testData.testCount} tests)\`, 'success');

          // Create download link
          const blob = new Blob([testData.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = testData.filename;
          a.click();
          URL.revokeObjectURL(url);
          break;

        case 'performance_metrics':
          state.performance = message.data;
          updatePerformanceMetrics();
          break;

        case 'profiling_started':
          state.profiling = true;
          updateProfilingState();
          showNotification('CPU profiling started', 'success');
          break;

        case 'profiling_stopped':
          state.profiling = false;
          updateProfilingState();
          if (message.data.flamegraph) {
            showFlameGraph(message.data.flamegraph);
          }
          showNotification('CPU profiling stopped', 'success');
          break;

        case 'error_tracked':
          // Real-time error notification
          showErrorNotification(message.data);
          // Refresh error list if on errors tab
          if (document.getElementById('errors').classList.contains('active')) {
            requestErrors();
          }
          break;

        case 'error_list':
          state.errors = message.data.errors;
          updateErrorsTable();
          break;

        case 'error_details':
          showErrorDetails(message.data);
          break;

        case 'error_stats':
          state.errorStats = message.data;
          updateErrorStats();
          break;

        case 'error_spike_alert':
          showErrorSpikeAlert(message.data);
          break;
      }
    }

    // Update connection status
    function updateConnectionStatus(connected) {
      const dot = document.getElementById('wsStatus');
      const text = document.getElementById('wsStatusText');

      if (connected) {
        dot.classList.add('connected');
        text.textContent = 'Connected';
      } else {
        dot.classList.remove('connected');
        text.textContent = 'Disconnected';
      }
    }

    // Update dashboard
    function updateDashboard() {
      if (!state.metrics) return;

      document.getElementById('totalRequests').textContent = state.metrics.requests;
      document.getElementById('totalErrors').textContent = state.metrics.errors;
      document.getElementById('avgResponseTime').textContent = state.metrics.avgResponseTime.toFixed(2) + 'ms';

      const memoryMB = (state.metrics.memory.heapUsed / 1024 / 1024).toFixed(1);
      document.getElementById('memoryUsage').textContent = memoryMB + ' MB';

      const uptimeSeconds = Math.floor(state.metrics.uptime / 1000);
      document.getElementById('uptime').textContent = formatDuration(uptimeSeconds);

      // Update recent requests in dashboard
      updateRecentRequestsTable();
    }

    // Update recent requests table (dashboard)
    function updateRecentRequestsTable() {
      const container = document.getElementById('recentRequestsTable');
      const recent = state.requests.slice(0, 5);

      if (recent.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📹</div><p>No requests recorded yet.</p></div>';
        return;
      }

      container.innerHTML = \`
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            \${recent.map(req => \`
              <tr>
                <td><span class="method method-\${req.method.toLowerCase()}">\${req.method}</span></td>
                <td>\${req.url}</td>
                <td><span class="status-code status-\${Math.floor(req.statusCode / 100)}xx">\${req.statusCode || '-'}</span></td>
                <td><span class="duration">\${req.duration ? req.duration.toFixed(2) + 'ms' : 'pending'}</span></td>
                <td>\${formatTime(req.timestamp)}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
    }

    // Update requests table (requests tab)
    function updateRequestsTable() {
      const container = document.getElementById('requestsTable');

      if (state.requests.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📹</div><p>No requests recorded yet.</p></div>';
        return;
      }

      container.innerHTML = \`
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            \${state.requests.map(req => \`
              <tr>
                <td><span class="method method-\${req.method.toLowerCase()}">\${req.method}</span></td>
                <td>\${req.url}</td>
                <td><span class="status-code status-\${Math.floor(req.statusCode / 100)}xx">\${req.statusCode || '-'}</span></td>
                <td><span class="duration">\${req.duration ? req.duration.toFixed(2) + 'ms' : 'pending'}</span></td>
                <td>\${formatTime(req.timestamp)}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-success btn-small" onclick="replayRequest('\${req.id}')">
                      🔄 Replay
                    </button>
                    <button class="btn btn-warning btn-small" onclick="editAndReplay('\${req.id}')">
                      ✏️ Edit & Replay
                    </button>
                    <div class="dropdown">
                      <button class="btn btn-primary btn-small" onclick="toggleExportDropdown('\${req.id}')">
                        📤 Export ▼
                      </button>
                      <div class="dropdown-content" id="export-\${req.id}">
                        <button class="dropdown-item" onclick="generateTest('\${req.id}', 'vitest')">Vitest Test</button>
                        <button class="dropdown-item" onclick="generateTest('\${req.id}', 'jest')">Jest Test</button>
                        <button class="dropdown-item" onclick="generateTest('\${req.id}', 'postman')">Postman Collection</button>
                        <button class="dropdown-item" onclick="generateTest('\${req.id}', 'har')">HAR File</button>
                        <button class="dropdown-item" onclick="generateCurl('\${req.id}')">cURL Command</button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
    }

    // Update routes list
    function updateRoutesList() {
      const container = document.getElementById('routesList');

      if (state.routes.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛣️</div><p>No routes registered yet.</p></div>';
        return;
      }

      container.innerHTML = state.routes.map(route => \`
        <div class="route-item">
          <span class="method route-method method-\${route.method.toLowerCase()}">\${route.method}</span>
          <span class="route-path">\${route.path}</span>
          <span class="route-handlers">\${route.handlers} handler(s)</span>
        </div>
      \`).join('');
    }

    // Update logs list
    function updateLogsList() {
      const container = document.getElementById('logsList');

      if (state.logs.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><p>No logs yet.</p></div>';
        return;
      }

      container.innerHTML = state.logs.map(log => \`
        <div class="log-entry \${log.level}">
          <span class="log-time">\${formatTime(log.timestamp)}</span>
          <span class="log-level \${log.level}">\${log.level.toUpperCase()}</span>
          <span class="log-message">\${log.message}</span>
        </div>
      \`).join('');
    }

    // Update performance metrics
    function updatePerformanceMetrics() {
      if (!state.performance) return;

      const { latency, throughput, memory, routes } = state.performance;

      // Update metric cards
      document.getElementById('perfP95').textContent = latency.p95.toFixed(2) + 'ms';
      document.getElementById('perfRPS').textContent = throughput.requestsPerSecond;
      document.getElementById('perfMemory').textContent = (memory.heapUsed / 1024 / 1024).toFixed(1) + ' MB';
      document.getElementById('perfErrorRate').textContent = throughput.errorRate.toFixed(1) + '%';

      // Update latency chart
      state.latencyHistory.push({
        timestamp: Date.now(),
        p50: latency.p50,
        p95: latency.p95,
        p99: latency.p99
      });

      // Keep only last 50 data points
      if (state.latencyHistory.length > 50) {
        state.latencyHistory.shift();
      }

      drawLatencyChart();

      // Update route performance table
      updateRoutePerformanceTable(routes);
    }

    // Draw latency chart
    function drawLatencyChart() {
      const canvas = document.getElementById('latencyChart');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const padding = 40;

      // Clear canvas
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, width, height);

      if (state.latencyHistory.length < 2) return;

      // Calculate scales
      const maxLatency = Math.max(...state.latencyHistory.flatMap(d => [d.p50, d.p95, d.p99]));
      const xScale = (width - 2 * padding) / (state.latencyHistory.length - 1);
      const yScale = (height - 2 * padding) / maxLatency;

      // Draw grid
      ctx.strokeStyle = '#2d2d2d';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding + ((height - 2 * padding) * i / 5);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        // Y-axis labels
        const value = maxLatency * (1 - i / 5);
        ctx.fillStyle = '#999';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(0) + 'ms', padding - 10, y + 4);
      }

      // Draw lines
      function drawLine(data, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        state.latencyHistory.forEach((point, i) => {
          const x = padding + (i * xScale);
          const y = height - padding - (point[data] * yScale);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();
      }

      drawLine('p50', '#0066ff');
      drawLine('p95', '#ff9800');
      drawLine('p99', '#ff4444');
    }

    // Update route performance table
    function updateRoutePerformanceTable(routes) {
      const container = document.getElementById('routePerformanceList');

      if (!routes || routes.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛣️</div><p>No route performance data yet.</p></div>';
        return;
      }

      // Sort by P95 latency
      const sorted = routes.slice().sort((a, b) => b.latency.p95 - a.latency.p95);

      container.innerHTML = \`
        <table class="route-perf-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Method</th>
              <th>Requests</th>
              <th>P50</th>
              <th>P95</th>
              <th>P99</th>
              <th>Error Rate</th>
            </tr>
          </thead>
          <tbody>
            \${sorted.slice(0, 10).map(route => {
              const latencyClass = route.latency.p95 < 100 ? 'latency-fast' :
                                  route.latency.p95 < 500 ? 'latency-slow' : 'latency-critical';
              const errorClass = route.errorRate < 1 ? 'error-rate-low' :
                                route.errorRate < 5 ? 'error-rate-medium' : 'error-rate-high';

              return \`
                <tr>
                  <td>\${route.route}</td>
                  <td><span class="method method-\${route.method.toLowerCase()}">\${route.method}</span></td>
                  <td>\${route.count}</td>
                  <td class="\${latencyClass}">\${route.latency.p50.toFixed(2)}ms</td>
                  <td class="\${latencyClass}">\${route.latency.p95.toFixed(2)}ms</td>
                  <td class="\${latencyClass}">\${route.latency.p99.toFixed(2)}ms</td>
                  <td class="\${errorClass}">\${route.errorRate.toFixed(1)}%</td>
                </tr>
              \`;
            }).join('')}
          </tbody>
        </table>
      \`;
    }

    // Update profiling state
    function updateProfilingState() {
      const startBtn = document.getElementById('startProfiling');
      const stopBtn = document.getElementById('stopProfiling');
      const perfTab = document.querySelector('[data-tab="performance"]');

      if (state.profiling) {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        perfTab.classList.add('profiling-active');
      } else {
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
        perfTab.classList.remove('profiling-active');
      }
    }

    // Show flame graph
    function showFlameGraph(flamegraphData) {
      const section = document.getElementById('flameGraphSection');
      const viewer = document.getElementById('flameGraphViewer');

      section.style.display = 'block';

      // Simple flame graph visualization (can be enhanced with D3.js or similar)
      let html = '<div class="flame-graph-simple">';
      html += \`<p>Profile captured: \${flamegraphData.duration}ms</p>\`;
      html += \`<p>Total samples: \${flamegraphData.samples}</p>\`;
      html += '<p>Download the profile to view in Chrome DevTools or Speedscope.</p>';
      html += \`<button class="btn btn-primary" onclick="downloadFlameGraph(\${JSON.stringify(flamegraphData).replace(/"/g, '&quot;')})">Download Profile</button>\`;
      html += '</div>';

      viewer.innerHTML = html;
    }

    // Download flame graph
    function downloadFlameGraph(data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`profile-\${Date.now()}.json\`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Make downloadFlameGraph global
    window.downloadFlameGraph = downloadFlameGraph;

    // Add request to list
    function addRequestToList(data) {
      // Check if request already exists (prevent duplicates)
      const existingIndex = state.requests.findIndex(r => r.id === data.id);

      if (existingIndex >= 0) {
        // Update existing request instead of adding duplicate
        state.requests[existingIndex] = { ...state.requests[existingIndex], ...data };
      } else {
        // Add new request
        state.requests.unshift(data);
        if (state.requests.length > 100) state.requests.pop();
      }

      updateRequestsTable();
      updateRecentRequestsTable();
    }

    // Update request in list
    function updateRequestInList(data) {
      const index = state.requests.findIndex(r => r.id === data.id);
      if (index !== -1) {
        state.requests[index] = { ...state.requests[index], statusCode: data.statusCode, duration: data.duration };
        updateRequestsTable();
        updateRecentRequestsTable();
      }
    }

    // Clear requests
    function clearRequests() {
      if (confirm('Are you sure you want to clear all recorded requests?')) {
        send({ type: 'clear_requests' });
        state.requests = [];
        updateRequestsTable();
        updateRecentRequestsTable();
      }
    }

    // Format duration
    function formatDuration(seconds) {
      if (seconds < 60) return seconds + 's';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return minutes + 'm';
      const hours = Math.floor(minutes / 60);
      return hours + 'h';
    }

    // Format time
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    }

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        // Request data if needed
        if (tabName === 'requests') {
          send({ type: 'get_requests', data: { limit: 100 } });
        } else if (tabName === 'routes') {
          send({ type: 'get_routes' });
        } else if (tabName === 'performance') {
          send({ type: 'get_performance_metrics' });
        }
      });
    });

    // Profiling button handlers
    document.getElementById('startProfiling')?.addEventListener('click', () => {
      send({ type: 'start_profiling' });
    });

    document.getElementById('stopProfiling')?.addEventListener('click', () => {
      send({ type: 'stop_profiling' });
    });

    // Initialize
    connect();

    // Request initial data
    setTimeout(() => {
      send({ type: 'get_metrics' });
      send({ type: 'get_requests', data: { limit: 100 } });
      send({ type: 'get_routes' });
      send({ type: 'get_errors', data: { limit: 100 } });
      send({ type: 'get_error_stats' });
    }, 500);

    // === Error Management Functions ===

    // Request errors from server
    function requestErrors() {
      const statusFilter = document.getElementById('errorStatusFilter').value;
      const severityFilter = document.getElementById('errorSeverityFilter').value;
      const searchFilter = document.getElementById('errorSearchFilter').value;

      const data = { limit: 100 };
      if (statusFilter) data.status = statusFilter;
      if (severityFilter) data.severity = severityFilter;
      if (searchFilter) data.search = searchFilter;

      send({ type: 'get_errors', data });
      send({ type: 'get_error_stats' });
    }

    // Update error statistics
    function updateErrorStats() {
      if (!state.errorStats) return;

      document.getElementById('totalErrors').textContent = state.errorStats.totalErrors || 0;
      document.getElementById('uniqueErrors').textContent = state.errorStats.uniqueErrors || 0;
      document.getElementById('errorRate').textContent = (state.errorStats.errorRate || 0).toFixed(1);
      document.getElementById('criticalErrors').textContent = state.errorStats.criticalErrors || 0;
    }

    // Update errors table
    function updateErrorsTable() {
      const tbody = document.getElementById('errorsTableBody');

      if (!state.errors || state.errors.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-dim);">
              <div class="empty-state-icon" style="font-size: 3rem;">🎉</div>
              <p>No errors yet! Your application is running smoothly.</p>
            </td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = state.errors.map(error => {
        const trendIcon = error.trend === 'increasing' ? '📈' :
                         error.trend === 'decreasing' ? '📉' : '➡️';

        return \`
          <tr onclick="showErrorDetailsById('\${error.hash}')">
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              \${escapeHtml(error.message)}
            </td>
            <td><code>\${escapeHtml(error.type)}</code></td>
            <td><strong>\${error.count}</strong></td>
            <td><span class="error-severity \${error.severity}">\${error.severity}</span></td>
            <td><span class="error-status \${error.status}">\${error.status}</span></td>
            <td><span class="error-trend \${error.trend}">\${trendIcon} \${error.trend}</span></td>
            <td>\${formatTimestamp(error.lastSeen)}</td>
          </tr>
        \`;
      }).join('');
    }

    // Show error details in panel
    function showErrorDetailsById(hash) {
      send({ type: 'get_error_details', data: { hash } });
    }

    // Show error details panel
    function showErrorDetails(error) {
      state.selectedError = error;

      document.getElementById('errorDetailsTitle').textContent = error.message;
      document.getElementById('errorDetailsSeverity').textContent = error.severity;
      document.getElementById('errorDetailsSeverity').className = 'error-severity ' + error.severity;
      document.getElementById('errorDetailsCount').textContent = error.count;
      document.getElementById('errorDetailsStack').textContent = error.stack || 'No stack trace available';

      // Show occurrences
      const occurrencesList = document.getElementById('errorOccurrencesList');
      document.getElementById('errorOccurrenceCount').textContent = error.occurrences.length;

      if (error.occurrences && error.occurrences.length > 0) {
        occurrencesList.innerHTML = error.occurrences.slice(0, 10).map(occ => \`
          <div class="occurrence-item">
            <div>
              <span class="occurrence-route"><strong>\${occ.method}</strong> \${escapeHtml(occ.route)}</span>
            </div>
            <span class="occurrence-time">\${formatTimestamp(occ.timestamp)}</span>
          </div>
        \`).join('');
      } else {
        occurrencesList.innerHTML = '<p>No occurrence details available</p>';
      }

      // Open panel
      document.getElementById('errorDetailsPanel').classList.add('open');
    }

    // Close error details panel
    function closeErrorDetails() {
      document.getElementById('errorDetailsPanel').classList.remove('open');
      state.selectedError = null;
    }

    // Mark error as resolved
    function markErrorResolved() {
      if (!state.selectedError) return;

      send({
        type: 'mark_error_resolved',
        data: { hash: state.selectedError.hash }
      });

      showNotification('Error marked as resolved', 'success');
      closeErrorDetails();
    }

    // Mark error as ignored
    function markErrorIgnored() {
      if (!state.selectedError) return;

      send({
        type: 'mark_error_ignored',
        data: { hash: state.selectedError.hash }
      });

      showNotification('Error marked as ignored', 'info');
      closeErrorDetails();
    }

    // Clear all errors
    function clearAllErrors() {
      if (!confirm('Are you sure you want to clear all errors?')) return;

      send({ type: 'clear_errors' });
      showNotification('All errors cleared', 'success');
    }

    // Export errors
    function exportErrors() {
      const format = prompt('Export format (json or csv):', 'json');
      if (!format || !['json', 'csv'].includes(format)) return;

      send({ type: 'export_errors', data: { format } });
      showNotification('Exporting errors...', 'info');
    }

    // Clear filters
    function clearFilters() {
      document.getElementById('errorStatusFilter').value = '';
      document.getElementById('errorSeverityFilter').value = '';
      document.getElementById('errorSearchFilter').value = '';
      requestErrors();
    }

    // Show error notification toast
    function showErrorNotification(error) {
      const notification = document.getElementById('errorNotification');
      document.getElementById('notificationTitle').textContent = 'New Error: ' + error.name;
      document.getElementById('notificationMessage').textContent = error.message.substring(0, 100);

      notification.classList.add('show');

      setTimeout(() => {
        notification.classList.remove('show');
      }, 5000);
    }

    // Show error spike alert
    function showErrorSpikeAlert(alert) {
      showNotification(
        \`⚠️ Error Spike Alert: \${alert.message} - Rate increased \${alert.threshold}x!\`,
        'error'
      );
    }

    // Format timestamp
    function formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      const now = Date.now();
      const diff = now - timestamp;

      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
      if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
      return date.toLocaleString();
    }

    // Escape HTML
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Setup error filter listeners
    document.getElementById('errorStatusFilter').addEventListener('change', requestErrors);
    document.getElementById('errorSeverityFilter').addEventListener('change', requestErrors);
    document.getElementById('errorSearchFilter').addEventListener('input', debounce(requestErrors, 500));

    // Debounce helper
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
    }, 500);

    // Replay functionality
    function replayRequest(id) {
      const request = state.requests.find(req => req.id === id);
      if (!request) return;

      send({
        type: 'replay_request',
        data: { id, mockMode: false }
      });

      showNotification(\`Replaying \${request.method} \${request.url}...\`, 'info');
    }

    function editAndReplay(id) {
      const request = state.requests.find(req => req.id === id);
      if (!request) return;

      // Show edit modal
      document.getElementById('editModal').style.display = 'flex';
      document.getElementById('editRequestId').value = id;
      document.getElementById('editMethod').value = request.method;
      document.getElementById('editUrl').value = request.url;
      document.getElementById('editHeaders').value = JSON.stringify(request.headers || {}, null, 2);
      document.getElementById('editBody').value = request.body ? JSON.stringify(request.body, null, 2) : '';
    }

    function generateTest(id, framework) {
      send({
        type: 'generate_test',
        data: { id, framework }
      });

      showNotification(\`Generating \${framework} test...\`, 'info');
    }

    function generateCurl(id) {
      const request = state.requests.find(req => req.id === id);
      if (!request) return;

      let curlCommand = \`curl -X \${request.method} "\${window.location.origin}\${request.url}"\`;

      if (request.headers) {
        Object.entries(request.headers).forEach(([key, value]) => {
          if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
            curlCommand += \` -H "\${key}: \${value}"\`;
          }
        });
      }

      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        curlCommand += \` -d '\${JSON.stringify(request.body)}'\`;
        curlCommand += \` -H "Content-Type: application/json"\`;
      }

      navigator.clipboard.writeText(curlCommand).then(() => {
        showNotification('cURL command copied to clipboard!', 'success');
      });
    }

    function toggleExportDropdown(id) {
      const dropdown = document.getElementById(\`export-\${id}\`);
      const isVisible = dropdown.classList.contains('show');

      // Close all dropdowns first
      document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));

      if (!isVisible) {
        dropdown.classList.add('show');
      }
    }

    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = \`notification notification-\${type}\`;
      notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--dark);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 1rem;
        color: var(--text);
        z-index: 3000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
      \`;

      if (type === 'success') {
        notification.style.borderColor = 'var(--success)';
      } else if (type === 'error') {
        notification.style.borderColor = 'var(--danger)';
      } else if (type === 'warning') {
        notification.style.borderColor = 'var(--warning)';
      }

      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 5000);
    }

    // Modal management
    function closeModal(modalId) {
      document.getElementById(modalId).style.display = 'none';
    }

    function executeEditedReplay() {
      const id = document.getElementById('editRequestId').value;
      const method = document.getElementById('editMethod').value;
      const url = document.getElementById('editUrl').value;
      const headers = document.getElementById('editHeaders').value;
      const body = document.getElementById('editBody').value;

      let headersObj, bodyObj;

      try {
        headersObj = headers ? JSON.parse(headers) : {};
      } catch (e) {
        showNotification('Invalid headers JSON', 'error');
        return;
      }

      try {
        bodyObj = body ? JSON.parse(body) : undefined;
      } catch (e) {
        showNotification('Invalid body JSON', 'error');
        return;
      }

      send({
        type: 'edit_and_replay',
        data: {
          originalId: id,
          editedRequest: {
            method,
            url,
            headers: headersObj,
            body: bodyObj
          },
          mockMode: false
        }
      });

      closeModal('editModal');
      showNotification(\`Replaying edited \${method} \${url}...\`, 'info');
    }

    function showCompareModal(originalId, replayId) {
      document.getElementById('compareModal').style.display = 'flex';

      send({
        type: 'compare_responses',
        data: { originalId, replayId }
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
      }
    });

    // CSS animation
    const style = document.createElement('style');
    style.textContent = \`
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    \`;
    document.head.appendChild(style);
  </script>

  <!-- Modals -->
  <div id="editModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Edit & Replay Request</h3>
        <button class="modal-close" onclick="closeModal('editModal')">&times;</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="editRequestId">

        <div class="form-group">
          <label class="form-label">Method</label>
          <select id="editMethod" class="form-input">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">URL</label>
          <input type="text" id="editUrl" class="form-input" placeholder="/api/endpoint">
        </div>

        <div class="form-group">
          <label class="form-label">Headers (JSON)</label>
          <textarea id="editHeaders" class="form-input form-textarea" placeholder="{\\n  \\"Content-Type\\": \\"application/json\\"\\n}"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Body (JSON)</label>
          <textarea id="editBody" class="form-input form-textarea" placeholder="{\\n  \\"key\\": \\"value\\"\\n}"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('editModal')">Cancel</button>
        <button class="btn btn-primary" onclick="executeEditedReplay()">Replay</button>
      </div>
    </div>
  </div>

  <div id="compareModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Response Comparison</h3>
        <button class="modal-close" onclick="closeModal('compareModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div id="diffViewer" class="diff-viewer">
          Loading comparison...
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="closeModal('compareModal')">Close</button>
      </div>
    </div>
  </div>

</body>
</html>\`;`;
}
