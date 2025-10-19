/**
 * Base Styles - CSS Reset, Variables, and Foundation
 */

export function generateBaseStyles(): string {
  return `
    /* CSS Reset */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* CSS Variables */
    :root {
      --primary: #0066ff;
      --primary-dark: #0052cc;
      --success: #00c851;
      --warning: #ff9800;
      --danger: #ff4444;
      --info: #33b5e5;

      --dark: #1a1a1a;
      --dark-light: #2d2d2d;
      --dark-lighter: #3a3a3a;

      --gray: #666;
      --gray-light: #999;
      --gray-lighter: #ccc;

      --border: #444;
      --border-light: #555;

      --bg: #0f0f0f;
      --bg-card: #1a1a1a;

      --text: #e0e0e0;
      --text-dim: #999;
      --text-muted: #666;

      --shadow: rgba(0, 0, 0, 0.5);
      --shadow-lg: rgba(0, 0, 0, 0.7);

      --radius: 8px;
      --radius-sm: 4px;
      --radius-lg: 12px;

      --transition: all 0.3s ease;
    }

    /* Base Typography */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow: hidden;
      font-size: 14px;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 0.5rem;
    }

    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    h4 { font-size: 1.1rem; }

    /* Links */
    a {
      color: var(--primary);
      text-decoration: none;
      transition: var(--transition);
    }

    a:hover {
      color: var(--primary-dark);
    }

    /* Code */
    code, pre {
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      background: var(--dark-light);
      padding: 0.2rem 0.4rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
    }

    pre {
      padding: 1rem;
      overflow-x: auto;
      line-height: 1.5;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-track {
      background: var(--dark);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--gray);
      border-radius: 5px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--gray-light);
    }

    /* Animations */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Utilities */
    .hidden {
      display: none !important;
    }

    .text-muted {
      color: var(--text-muted);
    }

    .text-success {
      color: var(--success);
    }

    .text-warning {
      color: var(--warning);
    }

    .text-danger {
      color: var(--danger);
    }

    .text-info {
      color: var(--info);
    }
  `;
}
