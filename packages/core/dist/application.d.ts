/**
 * High-performance Express-compatible application
 *
 * Combines router, pipeline, and HTTP server with optimizations
 */
import { type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { type Handler, type RouteMatch } from './router.js';
import { Request } from './request.js';
import { Response } from './response.js';
import { HotReloadManager, type HotReloadOptions } from './hot-reload/manager.js';
import { DevModeManager } from './dev/manager.js';
import type { DevModeOptions } from './dev/types.js';
export interface AppOptions {
    /** Enable HTTP/2 support */
    http2?: boolean;
    /** Enable async context tracking */
    asyncContext?: boolean | 'auto';
    /** Compatibility mode for Express 4.x */
    compat?: boolean;
    /** Hot reload configuration (auto-enabled in development) */
    hotReload?: boolean | HotReloadOptions;
    /** Dev mode configuration (auto-enabled in development) */
    devMode?: boolean | DevModeOptions;
}
export declare class Application {
    private router;
    private server?;
    private globalMiddleware;
    private settings;
    private compiled;
    private hotReload?;
    private devMode?;
    private options;
    constructor(options?: AppOptions);
    /**
     * Setup dev mode for enhanced developer experience
     * Auto-enables in development with zero configuration
     */
    private setupDevMode;
    /**
     * Setup built-in hot reload for development
     * Auto-detects common project structures and enables zero-config hot reloading
     */
    private setupHotReload;
    /**
     * Register global middleware (runs before routes)
     */
    use(handler: Handler): this;
    use(path: string, handler: Handler): this;
    /**
     * Register route handlers
     */
    get(path: string, ...handlers: Handler[]): this;
    post(path: string, ...handlers: Handler[]): this;
    put(path: string, ...handlers: Handler[]): this;
    delete(path: string, ...handlers: Handler[]): this;
    patch(path: string, ...handlers: Handler[]): this;
    all(path: string, ...handlers: Handler[]): this;
    /**
     * Set error handler
     */
    catch(_handler: (err: any, req: IncomingMessage, res: ServerResponse) => void): this;
    /**
     * Set/get application setting
     */
    set(name: string, value: any): this;
    getSetting(name: string): any;
    /**
     * Compile routes for optimal performance
     * Call before starting server
     *
     * Note: Compilation is skipped when hot reload is enabled to allow route updates
     */
    compile(): this;
    /**
     * Start HTTP server
     */
    listen(port: number, callback?: () => void): Server;
    listen(port: number, host: string, callback?: () => void): Server;
    /**
     * Get hot reload manager for event subscription
     * Users can subscribe to events like 'started', 'reloading', 'reloaded', 'syntax-error', 'reload-error'
     *
     * @example
     * ```ts
     * const app = createApp({ hotReload: true });
     * const hotReload = app.getHotReload();
     * if (hotReload) {
     *   hotReload.on('reloaded', ({ duration }) => {
     *     console.log(`Reloaded in ${duration}ms`);
     *   });
     * }
     * ```
     */
    getHotReload(): HotReloadManager | undefined;
    /**
     * Get dev mode manager for accessing logger, metrics, and dev features
     *
     * @example
     * ```ts
     * const app = createApp({ devMode: true });
     * const devMode = app.getDevMode();
     * if (devMode) {
     *   const logger = devMode.getLogger();
     *   logger.info('Custom log', { userId: 123 });
     *
     *   const metrics = devMode.getMetrics();
     *   console.log('Total requests:', metrics.totalRequests);
     * }
     * ```
     */
    getDevMode(): DevModeManager | undefined;
    /**
     * Close server
     */
    close(callback?: (err?: Error) => void): void;
    /**
     * Handle incoming HTTP request
     * This is the hot path - performance critical
     */
    private handleRequest;
    /**
     * Get all registered routes
     */
    getRoutes(): {
        method: string;
        path: string;
        handlerCount: number;
    }[];
}
/**
 * Factory function to create application
 */
export declare function createApp(options?: AppOptions): Application;
/**
 * Export types
 */
export type { Handler, RouteMatch, Request, Response };
//# sourceMappingURL=application.d.ts.map