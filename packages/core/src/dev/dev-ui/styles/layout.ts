/**
 * Layout Styles - Grid, Container, Navigation
 */

export function generateLayoutStyles(): string {
  return `
    /* Main Layout */
    .main-container {
      display: flex;
      height: calc(100vh - 70px);
      overflow: hidden;
    }

    /* Sidebar Navigation */
    .sidebar {
      width: 250px;
      background: var(--dark);
      border-right: 1px solid var(--border);
      overflow-y: auto;
      flex-shrink: 0;
    }

    .nav {
      padding: 1rem 0;
    }

    .nav-item {
      padding: 0.875rem 1.5rem;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-dim);
      border-left: 3px solid transparent;
    }

    .nav-item:hover {
      background: var(--dark-light);
      color: var(--text);
    }

    .nav-item.active {
      background: var(--dark-light);
      color: var(--primary);
      border-left-color: var(--primary);
    }

    .nav-item::before {
      font-size: 1.25rem;
    }

    /* Content Area */
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      background: var(--bg);
    }

    /* Tab Content */
    .tab-content {
      display: none;
      animation: fadeIn 0.3s ease;
    }

    .tab-content.active {
      display: block;
    }

    /* Grid System */
    .grid {
      display: grid;
      gap: 1.5rem;
    }

    .grid-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    .grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    .grid-4 {
      grid-template-columns: repeat(4, 1fr);
    }

    @media (max-width: 1200px) {
      .grid-4 { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .grid-2, .grid-3, .grid-4 {
        grid-template-columns: 1fr;
      }

      .sidebar {
        display: none;
      }
    }

    /* Flex Utilities */
    .flex {
      display: flex;
    }

    .flex-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .flex-center {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .flex-wrap {
      flex-wrap: wrap;
    }

    .gap-1 { gap: 0.5rem; }
    .gap-2 { gap: 1rem; }
    .gap-3 { gap: 1.5rem; }

    /* Spacing */
    .mt-1 { margin-top: 0.5rem; }
    .mt-2 { margin-top: 1rem; }
    .mt-3 { margin-top: 1.5rem; }
    .mt-4 { margin-top: 2rem; }

    .mb-1 { margin-bottom: 0.5rem; }
    .mb-2 { margin-bottom: 1rem; }
    .mb-3 { margin-bottom: 1.5rem; }
    .mb-4 { margin-bottom: 2rem; }

    .p-1 { padding: 0.5rem; }
    .p-2 { padding: 1rem; }
    .p-3 { padding: 1.5rem; }
    .p-4 { padding: 2rem; }
  `;
}
