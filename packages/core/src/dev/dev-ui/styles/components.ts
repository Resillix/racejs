/**
 * Component Styles - Cards, Buttons, Tables, Badges
 */

export function generateComponentStyles(): string {
  return `
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

    /* Status Indicator */
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

    /* Cards */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      transition: var(--transition);
    }

    .card:hover {
      border-color: var(--border-light);
      box-shadow: 0 4px 12px var(--shadow);
    }

    .card-header {
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text);
    }

    .card-body {
      color: var(--text-dim);
    }

    /* Stat Cards */
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      text-align: center;
      transition: var(--transition);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--shadow);
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0.5rem 0;
    }

    .stat-label {
      color: var(--text-dim);
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-change {
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    /* Buttons */
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px var(--shadow);
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-dark);
    }

    .btn-success {
      background: var(--success);
      color: white;
    }

    .btn-warning {
      background: var(--warning);
      color: white;
    }

    .btn-danger {
      background: var(--danger);
      color: white;
    }

    .btn-sm {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-success {
      background: rgba(0, 200, 81, 0.2);
      color: var(--success);
    }

    .badge-warning {
      background: rgba(255, 152, 0, 0.2);
      color: var(--warning);
    }

    .badge-danger {
      background: rgba(255, 68, 68, 0.2);
      color: var(--danger);
    }

    .badge-info {
      background: rgba(51, 181, 229, 0.2);
      color: var(--info);
    }

    .badge-primary {
      background: rgba(0, 102, 255, 0.2);
      color: var(--primary);
    }

    /* Method Badges */
    .method {
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 700;
      font-family: monospace;
    }

    .method-get { background: rgba(0, 200, 81, 0.2); color: var(--success); }
    .method-post { background: rgba(0, 102, 255, 0.2); color: var(--primary); }
    .method-put { background: rgba(255, 152, 0, 0.2); color: var(--warning); }
    .method-delete { background: rgba(255, 68, 68, 0.2); color: var(--danger); }
    .method-patch { background: rgba(51, 181, 229, 0.2); color: var(--info); }

    /* Tables */
    .table {
      width: 100%;
      border-collapse: collapse;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .table thead {
      background: var(--dark-light);
    }

    .table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--text);
      border-bottom: 2px solid var(--border);
    }

    .table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border);
      color: var(--text-dim);
    }

    .table tr:last-child td {
      border-bottom: none;
    }

    .table tbody tr:hover {
      background: var(--dark-light);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-dim);
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    /* Loading Spinner */
    .spinner {
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 2rem auto;
    }

    /* Filters */
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.875rem;
      color: var(--text-dim);
      font-weight: 500;
    }

    input, select {
      background: var(--dark-light);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      transition: var(--transition);
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
    }

    /* Charts Container */
    .chart-container {
      position: relative;
      height: 300px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
    }
  `;
}
