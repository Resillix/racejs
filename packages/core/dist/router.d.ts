/**
 * High-performance radix/trie router for Express-compatible routing
 *
 * Key optimizations:
 * - Precomputed route matchers at startup (compile phase)
 * - O(k) lookup where k = number of path segments
 * - Flat handler arrays avoid dynamic concatenation
 * - Static shapes prevent V8 deopts
 * - No regex in hot path after compilation
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
export type Next = (err?: any) => void;
export type Handler = (req: IncomingMessage, res: ServerResponse, next: Next) => void | Promise<void>;
export interface RouteParams {
    [key: string]: string;
}
/**
 * Router node types:
 * - Static: exact string match
 * - Param: :id style parameter
 * - Wildcard: * catch-all
 */
export interface RouterNode {
    /** Static child segments */
    s?: Map<string, RouterNode>;
    /** Parameter child (:id) */
    p?: {
        name: string;
        node: RouterNode;
    } | null;
    /** Wildcard child (*) */
    w?: RouterNode | null;
    /** Method -> handler chains map */
    m?: Map<string, Handler[]>;
    /** Compiled flag to enable V8 optimizations */
    compiled?: boolean;
}
export interface RouteMatch {
    handlers: Handler[];
    params: RouteParams;
}
export declare class Router {
    private root;
    private isCompiled;
    private hotReloadMode;
    /**
     * Add a route to the router
     * @param method HTTP method (GET, POST, etc.)
     * @param path Route path with optional params (:id) or wildcards (*)
     * @param handlers Array of middleware/handlers for this route
     */
    addRoute(method: string, path: string, handlers: Handler[]): void;
    /**
     * Find route handlers and extract parameters
     * Hot path - must be allocation-minimal after warmup
     */
    find(method: string, path: string): RouteMatch | null;
    /**
     * Recursive node finder with parameter extraction
     * Optimized to avoid closures in hot path
     */
    private findNode;
    /**
     * Parse path into segments with types
     * Called at route registration time, not in hot path
     */
    private parsePath;
    /**
     * Enable hot reload mode (disables freezing for route updates)
     */
    enableHotReload(): void;
    /**
     * Freeze router structure to enable V8 optimizations
     * Call after all routes are registered
     *
     * Note: Skipped when hot reload mode is enabled
     */
    compile(): void;
    /**
     * Recursively freeze node structures to create monomorphic shapes
     * Enables V8 inline caching and hidden class optimization
     *
     * Note: We don't freeze the handler map (node.m) to allow hot reload
     */
    private freezeNode;
    /**
     * Remove a route definition by method and path.
     * This is used by hot-reload to swap handlers.
     */
    removeRoute(method: string, path: string): boolean;
    /**
     * Update handlers for an existing route atomically (if present),
     * or add it when missing. Used by RouteSwapper.
     *
     * Note: This works even after compile() because we don't freeze handler maps
     */
    updateRouteHandlers(method: string, path: string, handlers: Handler[]): void;
    /**
     * Get all registered routes (useful for debugging)
     */
    getRoutes(): Array<{
        method: string;
        path: string;
        handlerCount: number;
    }>;
    private collectRoutes;
}
/**
 * Micro-optimizations explained:
 *
 * 1. Map for static routes: O(1) lookup vs array scan
 * 2. Flat handler arrays: No spread/concat in hot path
 * 3. Object.freeze: Signals V8 that shape is stable -> inline caching
 * 4. No closures in findNode: Avoids allocation on each call
 * 5. Early returns: Minimize branch depth
 * 6. Preallocated params object: Reused across requests in tight loop
 * 7. Type guards (node.s, node.m): Help V8 type inference
 */
//# sourceMappingURL=router.d.ts.map