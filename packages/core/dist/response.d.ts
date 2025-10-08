/**
 * High-performance Response wrapper
 *
 * Key optimizations:
 * - Batched header operations
 * - Fast JSON serialization path
 * - Minimal allocations in hot path
 * - Backpressure-aware streaming
 */
import type { ServerResponse } from 'node:http';
/**
 * Extended response interface with Express-compatible methods
 */
export declare class Response {
    readonly raw: ServerResponse;
    locals: Record<string, any>;
    constructor(res: ServerResponse); /**
     * Set response status code
     * Chainable for Express compatibility
     */
    status(code: number): this;
    /**
     * Set header value
     * Optimized for lowercase header names (Node.js standard)
     */
    set(name: string, value: string | string[]): this;
    /**
     * Get header value
     */
    get(name: string): string | string[] | number | undefined;
    /**
     * Set Content-Type header
     * Fast path for common types
     */
    type(contentType: string): this;
    /**
     * Send JSON response
     * Optimized hot path for API responses
     */
    json(body: any): void;
    /**
     * Send response (auto-detects type)
     * Fast path for common scenarios
     */
    send(body: any): void;
    /**
     * Send status code with optional message
     */
    sendStatus(code: number): void;
    /**
     * Redirect to URL
     */
    redirect(url: string, status?: number): void;
    /**
     * Set cookie
     * Minimal implementation - can be extended
     */
    cookie(name: string, value: string, options?: {
        maxAge?: number;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'Strict' | 'Lax' | 'None';
    }): this;
    /**
     * Clear cookie
     */
    clearCookie(name: string): this;
    /**
     * Append header value
     */
    append(name: string, value: string): this;
    /**
     * Check if headers have been sent
     */
    get headersSent(): boolean;
    /**
     * End response
     */
    end(data?: any): void;
}
/**
 * Factory function to create response wrapper
 */
export declare function createResponse(raw: ServerResponse): Response;
/**
 * Micro-optimizations explained:
 *
 * 1. Lowercase headers: Node.js stores headers in lowercase internally
 *    - Direct lowercase comparison avoids case-insensitive lookup overhead
 *
 * 2. Type shortcuts in send(): Typeof checks are very fast
 *    - Early string check handles most common case first
 *    - Avoids unnecessary JSON.stringify attempts
 *
 * 3. Minimal header checks: hasHeader() is faster than getHeader() + comparison
 *    - Only check when needed
 *
 * 4. Direct JSON.stringify: Modern V8 has heavily optimized JSON serialization
 *    - For plain objects, this is faster than any userland solution
 *    - Try/catch only catches serialization errors (rare)
 *
 * 5. Chainable methods: Return 'this' allows fluent API
 *    - res.status(200).json({...}) feels natural
 *    - No performance cost (same reference)
 *
 * 6. Static status messages: Object lookup faster than large switch
 *    - Most common status codes covered
 *    - Fallback to String(code) for others
 *
 * 7. Cookie string building: Template literals + concatenation
 *    - Faster than array join for small strings
 *    - Minimal allocations
 */
//# sourceMappingURL=response.d.ts.map