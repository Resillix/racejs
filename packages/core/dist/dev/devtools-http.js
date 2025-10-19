/**
 * DevTools HTTP Server
 *
 * Simple HTTP server to serve the embedded DevTools UI.
 */
import { createServer } from 'node:http';
import { generateDevToolsUI } from './devtools-ui.js';
/**
 * HTTP server for serving DevTools UI
 */
export class DevToolsHttpServer {
    server = null;
    options;
    running = false;
    constructor(options = {}) {
        this.options = {
            port: options.port ?? 9229,
            host: options.host ?? 'localhost',
            autoOpen: options.autoOpen ?? false,
        };
    }
    /**
     * Start the HTTP server
     */
    async start() {
        if (this.running) {
            return;
        }
        return new Promise((resolve, reject) => {
            this.server = createServer((req, res) => {
                this.handleRequest(req, res);
            });
            this.server.on('error', (error) => {
                reject(error);
            });
            this.server.listen(this.options.port, this.options.host, () => {
                this.running = true;
                // Auto-open browser if enabled
                if (this.options.autoOpen) {
                    this.openBrowser();
                }
                resolve();
            });
        });
    }
    /**
     * Stop the HTTP server
     */
    async stop() {
        if (!this.running || !this.server) {
            return;
        }
        return new Promise((resolve) => {
            this.server.close(() => {
                this.running = false;
                this.server = null;
                resolve();
            });
        });
    }
    /**
     * Check if server is running
     */
    isRunning() {
        return this.running;
    }
    /**
     * Get server URL
     */
    getUrl() {
        return `http://${this.options.host}:${this.options.port}`;
    }
    /**
     * Get underlying HTTP server (for WebSocket attachment)
     */
    getServer() {
        return this.server;
    }
    /**
     * Handle HTTP request
     */
    handleRequest(req, res) {
        const url = req.url || '/';
        // Skip WebSocket upgrade requests (handled by WebSocket server)
        if (req.headers.upgrade === 'websocket') {
            return;
        }
        // Serve UI on root path
        if (url === '/' || url.startsWith('/?')) {
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            });
            res.end(generateDevToolsUI());
            return;
        }
        // Favicon
        if (url === '/favicon.ico') {
            res.writeHead(204);
            res.end();
            return;
        }
        // Health check
        if (url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', running: this.running }));
            return;
        }
        // 404 for everything else
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
    /**
     * Open browser (platform-specific)
     */
    openBrowser() {
        const url = this.getUrl();
        const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        try {
            const { exec } = require('node:child_process');
            exec(`${start} ${url}`);
        }
        catch (error) {
            // Silently fail - user can open manually
        }
    }
}
//# sourceMappingURL=devtools-http.js.map