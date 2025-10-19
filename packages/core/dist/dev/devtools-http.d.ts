/**
 * DevTools HTTP Server
 *
 * Simple HTTP server to serve the embedded DevTools UI.
 */
import { Server } from 'node:http';
export interface DevToolsHttpServerOptions {
    port?: number;
    host?: string;
    autoOpen?: boolean;
}
/**
 * HTTP server for serving DevTools UI
 */
export declare class DevToolsHttpServer {
    private server;
    private options;
    private running;
    constructor(options?: DevToolsHttpServerOptions);
    /**
     * Start the HTTP server
     */
    start(): Promise<void>;
    /**
     * Stop the HTTP server
     */
    stop(): Promise<void>;
    /**
     * Check if server is running
     */
    isRunning(): boolean;
    /**
     * Get server URL
     */
    getUrl(): string;
    /**
     * Get underlying HTTP server (for WebSocket attachment)
     */
    getServer(): Server | null;
    /**
     * Handle HTTP request
     */
    private handleRequest;
    /**
     * Open browser (platform-specific)
     */
    private openBrowser;
}
//# sourceMappingURL=devtools-http.d.ts.map