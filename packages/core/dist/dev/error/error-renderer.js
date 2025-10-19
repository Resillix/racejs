/**
 * Error Renderer - Beautiful HTML Error Pages
 *
 * Generates modern, responsive error pages with:
 * - Syntax-highlighted source code
 * - Interactive stack traces
 * - Solution suggestions
 * - Dark/light theme support
 */
/**
 * ErrorRenderer generates beautiful HTML error pages
 * Pattern: Template Method - defines rendering structure, subclasses can customize
 */
export class ErrorRenderer {
    options;
    constructor(options) {
        this.options = {
            theme: options?.theme || 'dark',
            showRequestDetails: options?.showRequestDetails !== false,
            enableEditorLinks: options?.enableEditorLinks !== false,
            editor: options?.editor || 'vscode',
        };
    }
    /**
     * Main rendering method - generates complete HTML error page
     */
    renderHTML(error) {
        const theme = this.getTheme();
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHTML(error.name)}: ${this.escapeHTML(error.message)}</title>
  <style>${this.getCSS(theme)}</style>
</head>
<body class="theme-${theme}">
  <div class="error-page">
    ${this.renderHeader(error)}
    ${this.renderTabs()}
    ${this.renderTabContent(error)}
    ${this.renderFooter(error)}
  </div>
  <script>${this.getJS()}</script>
</body>
</html>`;
    }
    /**
     * Render error header with icon, title, and metadata
     */
    renderHeader(error) {
        const statusCode = error.statusCode || 500;
        const icon = this.getErrorIcon(statusCode);
        const timestamp = new Date(error.timestamp).toLocaleString();
        return `
    <header class="error-header">
      <div class="error-icon">${icon}</div>
      <div class="error-title">
        <h1>${this.escapeHTML(error.name)}</h1>
        <p class="error-message">${this.escapeHTML(error.message)}</p>
      </div>
      <div class="error-meta">
        ${error.method ? `<span class="badge badge-method">${error.method}</span>` : ''}
        ${error.route ? `<span class="badge badge-route">${this.escapeHTML(error.route)}</span>` : ''}
        <span class="badge badge-time">${timestamp}</span>
        ${error.requestId ? `<span class="badge badge-id">${error.requestId}</span>` : ''}
      </div>
    </header>`;
    }
    /**
     * Render navigation tabs
     */
    renderTabs() {
        return `
    <div class="error-tabs">
      <button class="tab active" data-tab="code" onclick="switchTab('code')">
        📝 Source Code
      </button>
      <button class="tab" data-tab="stack" onclick="switchTab('stack')">
        📚 Stack Trace
      </button>
      <button class="tab" data-tab="solutions" onclick="switchTab('solutions')">
        💡 Solutions
      </button>
      <button class="tab" data-tab="request" onclick="switchTab('request')">
        🌐 Request
      </button>
    </div>`;
    }
    /**
     * Render all tab content panels
     */
    renderTabContent(error) {
        return `
    <div class="tab-content-container">
      ${this.renderSourceCodeTab(error)}
      ${this.renderStackTraceTab(error)}
      ${this.renderSolutionsTab(error)}
      ${this.renderRequestTab(error)}
    </div>`;
    }
    /**
     * Render source code tab with syntax highlighting
     */
    renderSourceCodeTab(error) {
        if (!error.sourceContext) {
            return `
      <div class="tab-content active" id="tab-code">
        <div class="empty-state">
          <p>📄 Source code context not available</p>
        </div>
      </div>`;
        }
        const { sourceContext } = error;
        const highlightedCode = this.renderSourceContext(sourceContext);
        return `
    <div class="tab-content active" id="tab-code">
      <div class="source-header">
        <span class="source-file">
          ${this.renderFileLink(sourceContext.file, sourceContext.line)}
        </span>
        <span class="source-location">
          Line ${sourceContext.line}, Column ${sourceContext.column}
        </span>
      </div>
      <div class="source-code">
        ${highlightedCode}
      </div>
    </div>`;
    }
    /**
     * Render source code context with highlighting
     */
    renderSourceContext(context) {
        const lines = context.codeLines
            .map((line) => {
            const lineClass = line.isError ? 'line-error' : '';
            const highlighted = this.highlightCode(line.content, context.language);
            return `
      <div class="code-line ${lineClass}">
        <span class="line-number">${line.number}</span>
        <span class="line-content">${highlighted}</span>
      </div>`;
        })
            .join('');
        return `<div class="code-block">${lines}</div>`;
    }
    /**
     * Render stack trace tab
     */
    renderStackTraceTab(error) {
        const stackLines = this.formatStackTrace(error.stack || '');
        return `
    <div class="tab-content" id="tab-stack">
      <div class="stack-trace">
        ${stackLines.map((line) => this.renderStackLine(line)).join('')}
      </div>
    </div>`;
    }
    /**
     * Render individual stack trace line
     */
    renderStackLine(line) {
        // Parse stack line: "at functionName (file:line:col)"
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
            const [, funcName, file, lineNum, col] = match;
            if (funcName && file && lineNum && col) {
                const isNodeModules = file.includes('node_modules');
                const className = isNodeModules ? 'stack-line stack-line-external' : 'stack-line';
                return `
        <div class="${className}">
          <span class="stack-function">${this.escapeHTML(funcName)}</span>
          <span class="stack-location">
            ${this.renderFileLink(file, parseInt(lineNum))}:${col}
          </span>
        </div>`;
            }
        }
        return `<div class="stack-line">${this.escapeHTML(line)}</div>`;
    }
    /**
     * Render solutions tab with pattern-matched suggestions
     */
    renderSolutionsTab(error) {
        if (!error.solutions || error.solutions.length === 0) {
            return `
      <div class="tab-content" id="tab-solutions">
        <div class="empty-state">
          <p>💡 No solutions found for this error</p>
          <p class="empty-hint">Try searching on Stack Overflow or GitHub Issues</p>
        </div>
      </div>`;
        }
        const solutionsHTML = error.solutions
            .map((solution) => this.renderSolutionCard(solution))
            .join('');
        return `
    <div class="tab-content" id="tab-solutions">
      <div class="solutions-list">
        ${solutionsHTML}
      </div>
    </div>`;
    }
    /**
     * Render individual solution card
     */
    renderSolutionCard(solution) {
        const confidencePercent = Math.round(solution.confidence * 100);
        const confidenceClass = solution.confidence > 0.8 ? 'high' : solution.confidence > 0.5 ? 'medium' : 'low';
        return `
    <div class="solution-card">
      <div class="solution-header">
        <h3 class="solution-title">${this.escapeHTML(solution.title)}</h3>
        <span class="solution-confidence confidence-${confidenceClass}">
          ${confidencePercent}% match
        </span>
      </div>
      <p class="solution-description">${this.escapeHTML(solution.description)}</p>
      <div class="solution-text">${this.escapeHTML(solution.solution)}</div>
      ${solution.code
            ? `
        <div class="solution-code">
          <pre><code>${this.escapeHTML(solution.code)}</code></pre>
        </div>
      `
            : ''}
      ${solution.links.length > 0
            ? `
        <div class="solution-links">
          <strong>📚 Learn More:</strong>
          ${solution.links
                .map((link) => `
            <a href="${link.url}" target="_blank" class="solution-link">
              ${this.escapeHTML(link.title)}
            </a>
          `)
                .join('')}
        </div>
      `
            : ''}
    </div>`;
    }
    /**
     * Render request details tab
     */
    renderRequestTab(error) {
        if (!this.options.showRequestDetails) {
            return `
      <div class="tab-content" id="tab-request">
        <div class="empty-state">
          <p>🔒 Request details hidden in production</p>
        </div>
      </div>`;
        }
        return `
    <div class="tab-content" id="tab-request">
      <div class="request-details">
        <section class="request-section">
          <h3>Request Information</h3>
          <table class="request-table">
            <tr>
              <td class="label">Method:</td>
              <td>${error.method || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Route:</td>
              <td>${this.escapeHTML(error.route || 'N/A')}</td>
            </tr>
            <tr>
              <td class="label">Request ID:</td>
              <td>${error.requestId || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Timestamp:</td>
              <td>${new Date(error.timestamp).toISOString()}</td>
            </tr>
          </table>
        </section>

        ${error.breadcrumbs && error.breadcrumbs.length > 0
            ? `
          <section class="request-section">
            <h3>Event Timeline</h3>
            <div class="breadcrumbs">
              ${error.breadcrumbs
                .map((bc) => `
                <div class="breadcrumb">
                  <span class="breadcrumb-time">${new Date(bc.timestamp).toLocaleTimeString()}</span>
                  <span class="breadcrumb-type">${bc.type}</span>
                  <span class="breadcrumb-message">${this.escapeHTML(bc.message)}</span>
                </div>
              `)
                .join('')}
            </div>
          </section>
        `
            : ''}
      </div>
    </div>`;
    }
    /**
     * Render footer with action buttons
     */
    renderFooter(error) {
        return `
    <footer class="error-actions">
      <button class="btn btn-primary" onclick="copyError()">
        📋 Copy Error Details
      </button>
      ${this.options.enableEditorLinks && error.sourceContext
            ? `
        <button class="btn btn-secondary" onclick="openInEditor()">
          📝 Open in ${this.options.editor === 'vscode' ? 'VS Code' : this.options.editor}
        </button>
      `
            : ''}
      <button class="btn btn-secondary" onclick="window.location.reload()">
        🔄 Retry Request
      </button>
    </footer>`;
    }
    /**
     * Render clickable file link for editor
     */
    renderFileLink(file, line) {
        if (!this.options.enableEditorLinks) {
            return this.escapeHTML(file);
        }
        const editorUrl = this.getEditorUrl(file, line);
        return `<a href="${editorUrl}" class="file-link" title="Open in editor">${this.escapeHTML(file)}</a>`;
    }
    /**
     * Get editor URL for opening files
     */
    getEditorUrl(file, line) {
        switch (this.options.editor) {
            case 'vscode':
                return `vscode://file${file}:${line}`;
            case 'webstorm':
                return `webstorm://open?file=${file}&line=${line}`;
            case 'sublime':
                return `subl://open?url=file://${file}&line=${line}`;
            default:
                return `vscode://file${file}:${line}`;
        }
    }
    /**
     * Get error icon based on status code
     */
    getErrorIcon(statusCode) {
        if (statusCode >= 500)
            return '🚨';
        if (statusCode >= 400)
            return '⚠️';
        return '❌';
    }
    /**
     * Get current theme
     */
    getTheme() {
        if (this.options.theme === 'auto') {
            // Default to dark for now
            return 'dark';
        }
        return this.options.theme;
    }
    /**
     * Highlight code with syntax highlighting
     * Note: For now, returns escaped HTML. Can be enhanced with highlight.js later.
     */
    highlightCode(code, _language) {
        // TODO: Integrate highlight.js for syntax highlighting
        // For now, just return escaped HTML
        return this.escapeHTML(code);
    }
    /**
     * Format stack trace into array of lines
     */
    formatStackTrace(stack) {
        return stack.split('\n').filter((line) => line.trim().length > 0);
    }
    /**
     * Escape HTML special characters
     */
    escapeHTML(str) {
        if (!str)
            return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return str.replace(/[&<>"']/g, (m) => map[m] || m);
    }
    /**
     * Get embedded CSS styles
     */
    getCSS(theme) {
        return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --color-bg: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
      --color-fg: ${theme === 'dark' ? '#d4d4d4' : '#1e1e1e'};
      --color-bg-secondary: ${theme === 'dark' ? '#252526' : '#f3f3f3'};
      --color-border: ${theme === 'dark' ? '#3e3e42' : '#e0e0e0'};
      --color-error: #f48771;
      --color-warning: #ddb769;
      --color-success: #89d185;
      --color-accent: #569cd6;
      --color-link: #4ec9b0;
      --font-mono: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      font-family: var(--font-sans);
      background: var(--color-bg);
      color: var(--color-fg);
      line-height: 1.6;
      padding: 20px;
    }

    .error-page {
      max-width: 1400px;
      margin: 0 auto;
      background: var(--color-bg-secondary);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .error-header {
      padding: 30px;
      background: linear-gradient(135deg, var(--color-error) 0%, #c73e1d 100%);
      color: white;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .error-icon {
      font-size: 48px;
    }

    .error-title {
      flex: 1;
    }

    .error-title h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .error-message {
      font-size: 16px;
      opacity: 0.95;
    }

    .error-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    }

    .error-tabs {
      display: flex;
      background: var(--color-bg);
      border-bottom: 2px solid var(--color-border);
      padding: 0 20px;
    }

    .tab {
      background: none;
      border: none;
      color: var(--color-fg);
      padding: 16px 24px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 500;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      opacity: 0.7;
    }

    .tab:hover {
      opacity: 1;
      background: var(--color-bg-secondary);
    }

    .tab.active {
      opacity: 1;
      border-bottom-color: var(--color-accent);
    }

    .tab-content-container {
      padding: 30px;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .source-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--color-bg);
      border-radius: 8px 8px 0 0;
      border: 1px solid var(--color-border);
      border-bottom: none;
    }

    .source-file {
      font-family: var(--font-mono);
      font-size: 14px;
      color: var(--color-link);
    }

    .source-location {
      font-size: 13px;
      opacity: 0.7;
    }

    .source-code {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 0 0 8px 8px;
      overflow-x: auto;
    }

    .code-block {
      font-family: var(--font-mono);
      font-size: 14px;
      line-height: 1.5;
    }

    .code-line {
      display: flex;
      padding: 4px 0;
      transition: background 0.1s;
    }

    .code-line:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .line-error {
      background: rgba(244, 135, 113, 0.15);
      border-left: 4px solid var(--color-error);
    }

    .line-number {
      display: inline-block;
      width: 50px;
      text-align: right;
      padding: 0 16px;
      color: var(--color-fg);
      opacity: 0.5;
      user-select: none;
    }

    .line-content {
      flex: 1;
      padding-right: 16px;
      white-space: pre;
    }

    .stack-trace {
      font-family: var(--font-mono);
      font-size: 14px;
    }

    .stack-line {
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stack-line:hover {
      background: var(--color-bg);
    }

    .stack-line-external {
      opacity: 0.5;
    }

    .stack-function {
      font-weight: 600;
      color: var(--color-accent);
    }

    .stack-location {
      font-size: 13px;
      opacity: 0.8;
    }

    .file-link {
      color: var(--color-link);
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .file-link:hover {
      opacity: 0.7;
      text-decoration: underline;
    }

    .solutions-list {
      display: grid;
      gap: 20px;
    }

    .solution-card {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 20px;
    }

    .solution-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .solution-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-accent);
    }

    .solution-confidence {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }

    .confidence-high {
      background: rgba(137, 209, 133, 0.2);
      color: var(--color-success);
    }

    .confidence-medium {
      background: rgba(221, 183, 105, 0.2);
      color: var(--color-warning);
    }

    .confidence-low {
      background: rgba(244, 135, 113, 0.2);
      color: var(--color-error);
    }

    .solution-description {
      margin-bottom: 16px;
      opacity: 0.8;
    }

    .solution-text {
      padding: 12px;
      background: var(--color-bg-secondary);
      border-left: 4px solid var(--color-success);
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .solution-code {
      margin-bottom: 16px;
    }

    .solution-code pre {
      background: var(--color-bg-secondary);
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }

    .solution-code code {
      font-family: var(--font-mono);
      font-size: 13px;
    }

    .solution-links {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    .solution-link {
      color: var(--color-link);
      text-decoration: none;
      font-size: 14px;
      transition: opacity 0.2s;
    }

    .solution-link:hover {
      opacity: 0.7;
      text-decoration: underline;
    }

    .request-details {
      display: grid;
      gap: 24px;
    }

    .request-section h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--color-accent);
    }

    .request-table {
      width: 100%;
      border-collapse: collapse;
    }

    .request-table tr {
      border-bottom: 1px solid var(--color-border);
    }

    .request-table td {
      padding: 12px 16px;
    }

    .request-table .label {
      font-weight: 600;
      width: 150px;
      opacity: 0.7;
    }

    .breadcrumbs {
      display: grid;
      gap: 8px;
    }

    .breadcrumb {
      display: flex;
      gap: 12px;
      padding: 10px 16px;
      background: var(--color-bg);
      border-radius: 6px;
      font-size: 14px;
    }

    .breadcrumb-time {
      font-family: var(--font-mono);
      opacity: 0.6;
      min-width: 100px;
    }

    .breadcrumb-type {
      font-weight: 600;
      color: var(--color-accent);
      min-width: 80px;
    }

    .breadcrumb-message {
      flex: 1;
    }

    .error-actions {
      display: flex;
      gap: 12px;
      padding: 20px 30px;
      background: var(--color-bg);
      border-top: 1px solid var(--color-border);
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--color-accent);
      color: white;
    }

    .btn-primary:hover {
      background: #4a9ecf;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(86, 156, 214, 0.3);
    }

    .btn-secondary {
      background: var(--color-bg-secondary);
      color: var(--color-fg);
      border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
      background: var(--color-bg);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      opacity: 0.6;
    }

    .empty-state p {
      font-size: 16px;
      margin-bottom: 8px;
    }

    .empty-hint {
      font-size: 14px;
      opacity: 0.7;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .error-header {
        flex-direction: column;
        text-align: center;
      }

      .error-meta {
        align-items: center;
      }

      .error-tabs {
        overflow-x: auto;
      }

      .tab {
        padding: 12px 16px;
        font-size: 14px;
      }

      .tab-content-container {
        padding: 20px;
      }

      .error-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
    `;
    }
    /**
     * Get embedded JavaScript
     */
    getJS() {
        return `
    // Tab switching
    function switchTab(tabName) {
      // Hide all tabs
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
      });
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });

      // Show selected tab
      document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
      document.getElementById('tab-' + tabName).classList.add('active');
    }

    // Copy error to clipboard
    function copyError() {
      const errorData = {
        name: document.querySelector('.error-title h1').textContent,
        message: document.querySelector('.error-message').textContent,
        stack: Array.from(document.querySelectorAll('.stack-line'))
          .map(line => line.textContent.trim())
          .join('\\n'),
        timestamp: new Date().toISOString()
      };

      const text = JSON.stringify(errorData, null, 2);

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          alert('Error details copied to clipboard!');
        }).catch(() => {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    }

    function fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert('Error details copied to clipboard!');
      } catch (err) {
        alert('Failed to copy. Please copy manually.');
      }
      document.body.removeChild(textarea);
    }

    // Open in editor
    function openInEditor() {
      const fileLink = document.querySelector('.file-link');
      if (fileLink) {
        window.location.href = fileLink.href;
      }
    }
    `;
    }
}
//# sourceMappingURL=error-renderer.js.map