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
import { ErrorAggregator } from './error-aggregator.js';
import { ErrorSolutionEngine } from './error-solutions.js';
import type { ErrorHandlerOptions, Breadcrumb } from './types.js';
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
export declare class DevErrorHandler extends EventEmitter {
    private renderer;
    private aggregator;
    private solutions;
    private options;
    private breadcrumbs;
    /**
     * Creates a new DevErrorHandler
     *
     * @param options - Configuration options
     * @param aggregator - Optional error aggregator instance
     */
    constructor(options?: Partial<ErrorHandlerOptions>, aggregator?: ErrorAggregator);
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
    handle(error: Error, req: IncomingMessage, res: ServerResponse): Promise<void>;
    /**
     * Enhance error with source context, solutions, and metadata
     *
     * @param error - Original error
     * @param req - HTTP request object
     * @returns Enhanced error with additional context
     */
    private enhance;
    /**
     * Extract source code context from error stack trace
     *
     * Reads the file where the error occurred and extracts
     * surrounding lines for context.
     *
     * @param error - Error with stack trace
     * @returns Source context or null if unable to extract
     */
    private extractSourceContext;
    /**
     * Detect programming language from file extension
     *
     * @param filePath - Path to file
     * @returns Language identifier (for syntax highlighting)
     */
    private detectLanguage;
    /**
     * Find solution suggestions for the error
     *
     * Uses the solution engine to match error patterns
     * and provide helpful suggestions.
     *
     * @param error - Error to find solutions for
     * @returns Array of solution suggestions
     */
    private findSolutions;
    /**
     * Send error response to client
     *
     * @param error - Enhanced error
     * @param res - HTTP response object
     */
    private sendErrorResponse;
    /**
     * Check if detailed error information should be shown
     *
     * @returns True if details should be shown
     */
    private shouldShowDetails;
    /**
     * Open file in configured editor at specific line
     *
     * Uses editor-specific URI schemes to open files directly.
     *
     * @param file - File path
     * @param line - Line number
     */
    private openInEditor;
    /**
     * Add a breadcrumb for request tracking
     *
     * Breadcrumbs help trace the sequence of events leading to an error.
     *
     * @param requestId - Request identifier
     * @param breadcrumb - Breadcrumb to add
     */
    addBreadcrumb(requestId: string, breadcrumb: Breadcrumb): void;
    /**
     * Clear breadcrumbs for a request
     *
     * @param requestId - Request identifier
     */
    clearBreadcrumbs(requestId: string): void;
    /**
     * Get error aggregator instance
     *
     * @returns Error aggregator
     */
    getAggregator(): ErrorAggregator;
    /**
     * Get solution engine instance
     *
     * @returns Solution engine
     */
    getSolutionEngine(): ErrorSolutionEngine;
    /**
     * Update handler options
     *
     * @param options - Options to update
     */
    setOptions(options: Partial<ErrorHandlerOptions>): void;
    /**
     * Get current options
     *
     * @returns Current options
     */
    getOptions(): ErrorHandlerOptions;
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
//# sourceMappingURL=error-handler.d.ts.map