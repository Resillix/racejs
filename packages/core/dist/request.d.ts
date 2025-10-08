/**
 * High-performance Request wrapper
 *
 * Key optimizations:
 * - Lazy parsing (compute only when accessed)
 * - Property caching to avoid repeated parsing
 * - Minimal object shape changes
 * - Direct property access over getters when possible
 */
import type { IncomingMessage } from 'node:http';
import type { RouteParams } from './router.js';
/**
 * Extended request interface with Express-compatible properties
 */
export declare class Request {
    readonly raw: IncomingMessage;
    params: RouteParams;
    private _query?;
    private _path?;
    private _hostname?;
    body?: any;
    constructor(req: IncomingMessage);
    /**
     * Get request URL
     */
    get url(): string | undefined;
    /**
     * Get request method
     */
    get method(): string | undefined;
    /**
     * Get request headers
     */
    get headers(): IncomingMessage['headers'];
    /**
     * Parse and cache query parameters
     * Lazy evaluation - only parse when accessed
     */
    get query(): Record<string, string | string[]>;
    /**
     * Get parsed pathname (without query)
     * Lazy evaluation with caching
     */
    get path(): string;
    /**
     * Get request hostname
     * Checks X-Forwarded-Host, then Host header
     */
    get hostname(): string;
    /**
     * Get header value (case-insensitive)
     * Express-compatible helper
     */
    get(name: string): string | undefined;
    /**
     * Check if request is XHR (XMLHttpRequest)
     */
    get xhr(): boolean;
    /**
     * Get request protocol
     */
    get protocol(): string;
    /**
     * Check if request is secure (HTTPS)
     */
    get secure(): boolean;
    /**
     * Get client IP address
     * Checks X-Forwarded-For, X-Real-IP, then socket
     */
    get ip(): string;
    /**
     * Get all IPs from X-Forwarded-For chain
     */
    get ips(): string[];
    /**
     * Get content type
     */
    get type(): string;
}
/**
 * Factory function to create request wrapper
 * Preallocates shape for V8 optimization
 */
export declare function createRequest(raw: IncomingMessage): Request;
/**
 * Micro-optimizations explained:
 *
 * 1. Lazy parsing: Query and path parsing only happens on first access
 *    - Most requests don't use all properties
 *    - Avoids upfront cost for unused features
 *
 * 2. Caching: Parsed values stored in private properties
 *    - Subsequent accesses are instant (just property lookup)
 *    - No repeated regex or string operations
 *
 * 3. Direct string operations: Use indexOf/slice instead of regex
 *    - Significantly faster for simple parsing
 *    - Regex compilation and backtracking has overhead
 *
 * 4. Stable object shape: All properties defined in constructor
 *    - V8 can create stable hidden class
 *    - Enables inline caching and optimization
 *
 * 5. Case-sensitive headers: Node stores headers lowercase
 *    - Convert once in get() rather than multiple lookups
 *
 * 6. Array.isArray check: Headers can be string or string[]
 *    - Fast check prevents type errors
 *
 * 7. Early returns: Avoid unnecessary computation
 *    - If _query exists, return immediately
 *    - Reduces branching in common path
 */
//# sourceMappingURL=request.d.ts.map