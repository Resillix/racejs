/**
 * DevTools UI - Main Entry Point
 *
 * Assembles all UI components into a complete HTML page
 */
import { generateBaseStyles } from './styles/base.js';
import { generateLayoutStyles } from './styles/layout.js';
import { generateComponentStyles } from './styles/components.js';
import { generateHeader } from './components/header.js';
import { generateNavigation } from './components/navigation.js';
import { generateDashboard } from './components/dashboard.js';
import { generateRequestsTab } from './components/requests.js';
import { generatePerformanceTab } from './components/performance.js';
import { generateErrorsTab } from './components/errors.js';
import { generateWebSocketClient } from './scripts/websocket.js';
import { generateUIScripts } from './scripts/ui.js';
/**
 * Generate the complete DevTools UI HTML
 */
export function generateDevToolsUI() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RaceJS DevTools</title>
  <style>
${generateBaseStyles()}
${generateLayoutStyles()}
${generateComponentStyles()}
  </style>
</head>
<body>
${generateHeader()}

  <div class="main-container">
${generateNavigation()}

    <main class="content">
      <!-- Dashboard Tab -->
      <div id="dashboard" class="tab-content active">
${generateDashboard()}
      </div>

      <!-- Requests Tab -->
      <div id="requests" class="tab-content">
${generateRequestsTab()}
      </div>

      <!-- Performance Tab -->
      <div id="performance" class="tab-content">
${generatePerformanceTab()}
      </div>

      <!-- Errors Tab -->
      <div id="errors" class="tab-content">
${generateErrorsTab()}
      </div>
    </main>
  </div>

  <script>
${generateWebSocketClient()}
${generateUIScripts()}
  </script>
</body>
</html>`;
}
//# sourceMappingURL=index.js.map