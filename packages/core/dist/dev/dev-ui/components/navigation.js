/**
 * Navigation Sidebar Component
 */
export function generateNavigation() {
    return `
    <aside class="sidebar">
      <nav class="nav">
        <div class="nav-item active" data-tab="dashboard">
          📊 Dashboard
        </div>
        <div class="nav-item" data-tab="requests">
          📝 Requests
        </div>
        <div class="nav-item" data-tab="performance">
          ⚡ Performance
        </div>
        <div class="nav-item" data-tab="errors">
          🚨 Errors
        </div>
      </nav>
    </aside>
  `;
}
//# sourceMappingURL=navigation.js.map