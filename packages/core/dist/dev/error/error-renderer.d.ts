/**
 * Error Renderer - Beautiful HTML Error Pages
 *
 * Generates modern, responsive error pages with:
 * - Syntax-highlighted source code
 * - Interactive stack traces
 * - Solution suggestions
 * - Dark/light theme support
 */
import { EnhancedError } from './types';
export interface ErrorRendererOptions {
    theme: 'dark' | 'light' | 'auto';
    showRequestDetails: boolean;
    enableEditorLinks: boolean;
    editor: 'vscode' | 'webstorm' | 'sublime';
}
/**
 * ErrorRenderer generates beautiful HTML error pages
 * Pattern: Template Method - defines rendering structure, subclasses can customize
 */
export declare class ErrorRenderer {
    private options;
    constructor(options?: Partial<ErrorRendererOptions>);
    /**
     * Main rendering method - generates complete HTML error page
     */
    renderHTML(error: EnhancedError): string;
    /**
     * Render error header with icon, title, and metadata
     */
    private renderHeader;
    /**
     * Render navigation tabs
     */
    private renderTabs;
    /**
     * Render all tab content panels
     */
    private renderTabContent;
    /**
     * Render source code tab with syntax highlighting
     */
    private renderSourceCodeTab;
    /**
     * Render source code context with highlighting
     */
    private renderSourceContext;
    /**
     * Render stack trace tab
     */
    private renderStackTraceTab;
    /**
     * Render individual stack trace line
     */
    private renderStackLine;
    /**
     * Render solutions tab with pattern-matched suggestions
     */
    private renderSolutionsTab;
    /**
     * Render individual solution card
     */
    private renderSolutionCard;
    /**
     * Render request details tab
     */
    private renderRequestTab;
    /**
     * Render footer with action buttons
     */
    private renderFooter;
    /**
     * Render clickable file link for editor
     */
    private renderFileLink;
    /**
     * Get editor URL for opening files
     */
    private getEditorUrl;
    /**
     * Get error icon based on status code
     */
    private getErrorIcon;
    /**
     * Get current theme
     */
    private getTheme;
    /**
     * Highlight code with syntax highlighting
     * Note: For now, returns escaped HTML. Can be enhanced with highlight.js later.
     */
    private highlightCode;
    /**
     * Format stack trace into array of lines
     */
    private formatStackTrace;
    /**
     * Escape HTML special characters
     */
    private escapeHTML;
    /**
     * Get embedded CSS styles
     */
    private getCSS;
    /**
     * Get embedded JavaScript
     */
    private getJS;
}
//# sourceMappingURL=error-renderer.d.ts.map