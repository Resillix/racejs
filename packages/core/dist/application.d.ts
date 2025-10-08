/**
 * High-performance Express-compatible application
 *
 * Combines router, pipeline, and HTTP server with optimizations
 */
import { type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { type Handler, type RouteMatch } from './router.js';
import { Request } from './request.js';
import { Response } from './response.js';
export interface AppOptions {
    /** Enable HTTP/2 support */
    http2?: boolean;
    /** Enable async context tracking */
    asyncContext?: boolean | 'auto';
    /** Compatibility mode for Express 4.x */
    compat?: boolean;
}
export declare class Application {
    private router;
    private server?;
    private globalMiddleware;
    private errorHandler?;
    private settings;
    private compiled;
    constructor(_options?: AppOptions);
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
    catch(handler: (err: any, req: IncomingMessage, res: ServerResponse) => void): this;
    /**
     * Set/get application setting
     */
    set(name: string, value: any): this;
    getSetting(name: string): any;
    /**
     * Compile routes for optimal performance
     * Call before starting server
     */
    compile(): this;
    /**
     * Start HTTP server
     */
    listen(port: number, callback?: () => void): Server;
    listen(port: number, host: string, callback?: () => void): Server;
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