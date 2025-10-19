/**
 * Header Component
 */
export function generateHeader() {
    return `
  <header class="header">
    <div class="logo">
      RaceJS DevTools
    </div>
    <div class="status">
      <div class="status-indicator">
        <div class="status-dot" id="ws-status"></div>
        <span id="ws-text">Connecting...</span>
      </div>
      <div class="status-indicator">
        <span id="uptime">--</span>
      </div>
    </div>
  </header>
  `;
}
//# sourceMappingURL=header.js.map