/**
 * @fileoverview DevErrorHandler - Main error handler for development mode
 *
 * Provides beautiful error pages with source code context, stack trace enhancement,
 * and solution suggestions. Coordinates error aggregation and rendering.
 *
 * @module dev/error/error-handler
 */

import { EventEmitter } from 'node:events';
import { IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { cwd } from 'node:process';
import { ErrorRenderer } from './error-renderer.js';
import { ErrorAggregator } from './error-aggregator.js';
import { ErrorSolutionEngine } from './error-solutions.js';
import type {
  ErrorHandlerOptions,
  EnhancedError,
  SourceContext,
  CodeLine,
  Solution,
  Breadcrumb,
} from './types.js';

/**
 * Default options for DevErrorHandler
 */
const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  enabled: true,
  showErrorDetails: true,
  editor: 'vscode',
  openEditorOnError: false,
  solutionFinders: ['pattern'],
  theme: 'dark',
};

/**
 * Main error handler for development mode
 *
 * Catches errors, enhances them with source context and solutions,
 * renders beautiful error pages, and tracks errors for aggregation.
 *
 * @example
 * ```typescript
 * const errorHandler = new DevErrorHandler({
 *   theme: 'dark',
 *   editor: 'vscode',
 *   solutionFinders: ['pattern']
 * });
 *
 * // In application error handler
 * try {
 *   await handleRequest(req, res);
 * } catch (error) {
 *   await errorHandler.handle(error, req, res);
 * }
 * ```
 *
 * @fires DevErrorHandler#error-handled
 * @fires DevErrorHandler#error-opened-in-editor
 */
export class DevErrorHandler extends EventEmitter {
  private renderer: ErrorRenderer;
  private aggregator: ErrorAggregator;
  private solutions: ErrorSolutionEngine;
  private options: ErrorHandlerOptions;
  private breadcrumbs: Map<string, Breadcrumb[]> = new Map();

  /**
   * Creates a new DevErrorHandler
   *
   * @param options - Configuration options
   * @param aggregator - Optional error aggregator instance
   */
  constructor(options: Partial<ErrorHandlerOptions> = {}, aggregator?: ErrorAggregator) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.renderer = new ErrorRenderer({
      theme: this.options.theme,
      showRequestDetails: this.options.showErrorDetails,
      enableEditorLinks: this.options.openEditorOnError,
      editor: this.options.editor,
    });
    this.aggregator = aggregator || new ErrorAggregator();
    this.solutions = new ErrorSolutionEngine();
  }

  /**
   * Main error handling method
   *
   * Enhances the error with context, tracks it in aggregator,
   * and sends a beautiful HTML response.
   *
   * @param error - The error to handle
   * @param req - HTTP request object
   * @param res - HTTP response object
   */
  async handle(error: Error, req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      console.log('[DevErrorHandler] Handling error:', error.name, error.message);
      console.log('[DevErrorHandler] Options:', this.options);

      // Enhance error with additional context
      const enhanced = await this.enhance(error, req);
      console.log('[DevErrorHandler] Enhanced error, has solutions:', !!enhanced.solutions);

      // Track in aggregator
      const context: { route: string; method: string; timestamp: number; requestId?: string } = {
        route: enhanced.route || req.url || '/',
        method: enhanced.method || req.method || 'GET',
        timestamp: enhanced.timestamp,
      };

      if (enhanced.requestId) {
        context.requestId = enhanced.requestId;
      }

      const errorHash = this.aggregator.track(enhanced, context);

      enhanced.aggregationId = errorHash;

      // Emit event for DevTools
      this.emit('error-handled', enhanced);

      // Send error response
      console.log('[DevErrorHandler] Sending error response...');
      await this.sendErrorResponse(enhanced, res);
      console.log('[DevErrorHandler] Response sent successfully');

      // Open in editor if configured
      if (this.options.openEditorOnError && enhanced.sourceContext) {
        this.openInEditor(enhanced.sourceContext.file, enhanced.sourceContext.line);
      }
    } catch (handlingError) {
      // Fallback if error handling itself fails
      console.error('Error in error handler:', handlingError);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Internal Server Error\n\n' + error.stack);
    }
  }

  /**
   * Enhance error with source context, solutions, and metadata
   *
   * @param error - Original error
   * @param req - HTTP request object
   * @returns Enhanced error with additional context
   */
  private async enhance(error: Error, req: IncomingMessage): Promise<EnhancedError> {
    // Check if error already has EnhancedError properties
    const existingEnhanced = error as Partial<EnhancedError>;

    // Extract request ID if available (from headers or custom property)
    const requestId = req.headers['x-request-id'] as string | undefined;

    // Extract source context
    const sourceContext = this.extractSourceContext(error);

    // Find solutions
    const solutions = await this.findSolutions(error);

    // Get breadcrumbs if available
    const breadcrumbRequestId = requestId || existingEnhanced.requestId || 'default';
    const breadcrumbs = this.breadcrumbs.get(breadcrumbRequestId);

    // Create properly structured EnhancedError object
    const enhanced: EnhancedError = {
      // Copy all error properties
      name: error.name,
      message: error.message,
      stack: error.stack || '',

      // Add timestamp (required field)
      timestamp: existingEnhanced.timestamp || Date.now(),
    };

    // Add optional properties only if they have values
    const method = existingEnhanced.method || req.method;
    if (method) {
      enhanced.method = method;
    }

    const route = existingEnhanced.route || req.url;
    if (route) {
      enhanced.route = route;
    }

    if (requestId) {
      enhanced.requestId = requestId;
    }

    // Set status code
    enhanced.statusCode = existingEnhanced.statusCode || 500;

    if (sourceContext) {
      enhanced.sourceContext = sourceContext;
    }

    if (solutions.length > 0) {
      enhanced.solutions = solutions;
    }

    if (breadcrumbs && breadcrumbs.length > 0) {
      enhanced.breadcrumbs = breadcrumbs;
    }

    if (existingEnhanced.aggregationId) {
      enhanced.aggregationId = existingEnhanced.aggregationId;
    }

    return enhanced;
  }

  /**
   * Extract source code context from error stack trace
   *
   * Reads the file where the error occurred and extracts
   * surrounding lines for context.
   *
   * @param error - Error with stack trace
   * @returns Source context or null if unable to extract
   */
  private extractSourceContext(error: Error): SourceContext | null {
    if (!error.stack) {
      return null;
    }

    try {
      // Parse stack trace to find first user code frame
      const stackLines = error.stack.split('\n');
      const projectRoot = cwd();

      for (const line of stackLines) {
        // Skip error message line
        if (!line.includes('at ')) {
          continue;
        }

        // Extract file path and line number
        // Formats: "at func (file.js:10:5)" or "at file.js:10:5"
        const match = line.match(/\((.+):(\d+):(\d+)\)/) || line.match(/at (.+):(\d+):(\d+)/);

        if (!match) {
          continue;
        }

        const [, filePath, lineStr, columnStr] = match;

        // Skip if we don't have all parts
        if (!filePath || !lineStr || !columnStr) {
          continue;
        }

        const lineNumber = parseInt(lineStr, 10);
        const column = parseInt(columnStr, 10);

        // Skip node_modules
        if (filePath.includes('node_modules')) {
          continue;
        }

        // Resolve to absolute path
        const absolutePath = resolve(filePath);

        // Check if file exists
        if (!existsSync(absolutePath)) {
          continue;
        }

        // Read file content
        const fileContent = readFileSync(absolutePath, 'utf-8');
        const lines = fileContent.split('\n');

        // Extract context lines (10 before and 10 after)
        const startLine = Math.max(1, lineNumber - 10);
        const endLine = Math.min(lines.length, lineNumber + 10);

        const codeLines: CodeLine[] = [];
        for (let i = startLine; i <= endLine; i++) {
          codeLines.push({
            number: i,
            content: lines[i - 1] || '',
            isError: i === lineNumber,
          });
        }

        // Detect language from file extension
        const language = this.detectLanguage(absolutePath);

        // Return relative path for display
        const relativePath = relative(projectRoot, absolutePath);

        return {
          file: relativePath,
          line: lineNumber,
          column,
          codeLines,
          language,
        };
      }
    } catch (err) {
      // If extraction fails, return null
      console.error('Failed to extract source context:', err);
    }

    return null;
  }

  /**
   * Detect programming language from file extension
   *
   * @param filePath - Path to file
   * @returns Language identifier (for syntax highlighting)
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'ts':
        return 'typescript';
      case 'js':
      case 'mjs':
      case 'cjs':
        return 'javascript';
      case 'jsx':
        return 'jsx';
      case 'tsx':
        return 'tsx';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      default:
        return 'javascript';
    }
  }

  /**
   * Find solution suggestions for the error
   *
   * Uses the solution engine to match error patterns
   * and provide helpful suggestions.
   *
   * @param error - Error to find solutions for
   * @returns Array of solution suggestions
   */
  private async findSolutions(error: Error): Promise<Solution[]> {
    if (!this.options.solutionFinders.includes('pattern')) {
      return [];
    }

    try {
      return this.solutions.find(error);
    } catch (err) {
      console.error('Failed to find solutions:', err);
      return [];
    }
  }

  /**
   * Send error response to client
   *
   * @param error - Enhanced error
   * @param res - HTTP response object
   */
  private async sendErrorResponse(error: EnhancedError, res: ServerResponse): Promise<void> {
    // Set status code
    res.statusCode = error.statusCode || 500;

    console.log(
      '[DevErrorHandler] sendErrorResponse - shouldShowDetails:',
      this.shouldShowDetails()
    );
    console.log('[DevErrorHandler] sendErrorResponse - enabled:', this.options.enabled);
    console.log(
      '[DevErrorHandler] sendErrorResponse - showErrorDetails:',
      this.options.showErrorDetails
    );

    // Check if we should show detailed error page
    if (!this.shouldShowDetails()) {
      console.log('[DevErrorHandler] Not showing details, sending plain text');
      res.setHeader('Content-Type', 'text/plain');
      res.end('Internal Server Error');
      return;
    }

    // Render beautiful HTML error page
    console.log('[DevErrorHandler] Rendering HTML error page...');
    const html = this.renderer.renderHTML(error);
    console.log('[DevErrorHandler] HTML length:', html.length);

    // Send response
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
    console.log('[DevErrorHandler] HTML response sent');
  }

  /**
   * Check if detailed error information should be shown
   *
   * @returns True if details should be shown
   */
  private shouldShowDetails(): boolean {
    return this.options.enabled && this.options.showErrorDetails;
  }

  /**
   * Open file in configured editor at specific line
   *
   * Uses editor-specific URI schemes to open files directly.
   *
   * @param file - File path
   * @param line - Line number
   */
  private openInEditor(file: string, line: number): void {
    const absolutePath = resolve(cwd(), file);

    let editorUri: string;

    switch (this.options.editor) {
      case 'vscode':
        editorUri = `vscode://file/${absolutePath}:${line}`;
        break;
      case 'webstorm':
        editorUri = `webstorm://open?file=${absolutePath}&line=${line}`;
        break;
      case 'sublime':
        editorUri = `subl://open?url=file://${absolutePath}&line=${line}`;
        break;
      default:
        editorUri = `vscode://file/${absolutePath}:${line}`;
    }

    this.emit('error-opened-in-editor', { file: absolutePath, line, uri: editorUri });

    // Note: Actually opening the editor would require a platform-specific command
    // This is handled by the DevTools UI in the browser
  }

  /**
   * Add a breadcrumb for request tracking
   *
   * Breadcrumbs help trace the sequence of events leading to an error.
   *
   * @param requestId - Request identifier
   * @param breadcrumb - Breadcrumb to add
   */
  addBreadcrumb(requestId: string, breadcrumb: Breadcrumb): void {
    const crumbs = this.breadcrumbs.get(requestId) || [];
    crumbs.push(breadcrumb);

    // Keep only last 50 breadcrumbs per request
    if (crumbs.length > 50) {
      crumbs.shift();
    }

    this.breadcrumbs.set(requestId, crumbs);
  }

  /**
   * Clear breadcrumbs for a request
   *
   * @param requestId - Request identifier
   */
  clearBreadcrumbs(requestId: string): void {
    this.breadcrumbs.delete(requestId);
  }

  /**
   * Get error aggregator instance
   *
   * @returns Error aggregator
   */
  getAggregator(): ErrorAggregator {
    return this.aggregator;
  }

  /**
   * Get solution engine instance
   *
   * @returns Solution engine
   */
  getSolutionEngine(): ErrorSolutionEngine {
    return this.solutions;
  }

  /**
   * Update handler options
   *
   * @param options - Options to update
   */
  setOptions(options: Partial<ErrorHandlerOptions>): void {
    this.options = { ...this.options, ...options };
    this.renderer = new ErrorRenderer({
      theme: this.options.theme,
      showRequestDetails: this.options.showErrorDetails,
      enableEditorLinks: this.options.openEditorOnError,
      editor: this.options.editor,
    });
  }

  /**
   * Get current options
   *
   * @returns Current options
   */
  getOptions(): ErrorHandlerOptions {
    return { ...this.options };
  }
}

/**
 * Error handled event
 * @event DevErrorHandler#error-handled
 * @type {EnhancedError}
 */

/**
 * Error opened in editor event
 * @event DevErrorHandler#error-opened-in-editor
 * @type {{ file: string, line: number, uri: string }}
 */
