/**
 * High-performance Express-compatible application
 *
 * Combines router, pipeline, and HTTP server with optimizations
 */
import { createServer } from 'node:http';
import { Router } from './router.js';
import { runPipeline } from './pipeline.js';
import { createRequest } from './request.js';
import { Response } from './response.js';
import { HotReloadManager } from './hot-reload/manager.js';
import path from 'node:path';
import { existsSync } from 'node:fs';
export class Application {
    router;
    server;
    globalMiddleware = [];
    errorHandler;
    settings = new Map();
    compiled = false;
    hotReload;
    options;
    constructor(options = {}) {
        this.options = options;
        this.router = new Router();
        this.setupHotReload();
    }
    /**
     * Setup built-in hot reload for development
     * Auto-detects common project structures and enables zero-config hot reloading
     */
    setupHotReload() {
        const hotReloadOpt = this.options.hotReload;
        // Disabled explicitly
        if (hotReloadOpt === false)
            return;
        // Auto-enable in development
        const isDev = process.env.NODE_ENV !== 'production';
        if (!isDev && hotReloadOpt !== true && typeof hotReloadOpt !== 'object')
            return;
        // Auto-detect watch directories
        const cwd = process.cwd();
        const autoDetectDirs = [];
        // Common patterns for route directories
        const candidates = [
            'src/routes',
            'src/api',
            'routes',
            'api',
            'src',
            'lib',
        ];
        for (const candidate of candidates) {
            const fullPath = path.resolve(cwd, candidate);
            if (existsSync(fullPath)) {
                autoDetectDirs.push(fullPath);
                break; // Use first match for minimal scope
            }
        }
        // Fallback to src or cwd if nothing found
        if (autoDetectDirs.length === 0) {
            const srcPath = path.resolve(cwd, 'src');
            autoDetectDirs.push(existsSync(srcPath) ? srcPath : cwd);
        }
        // Build hot reload config
        const hotReloadConfig = typeof hotReloadOpt === 'object'
            ? {
                ...hotReloadOpt,
                roots: hotReloadOpt.roots || autoDetectDirs,
            }
            : {
                enabled: true,
                roots: autoDetectDirs,
            };
        this.hotReload = new HotReloadManager(hotReloadConfig);
        this.hotReload.setRouter(this.router);
        // Wire up events
        this.hotReload.on('started', () => {
            if (isDev) {
                const backend = this.hotReload.getActiveBackend();
                const backendEmoji = backend === 'parcel' ? '🚀' : '📁';
                const backendName = backend === 'parcel' ? '@parcel/watcher' : 'fs.watch';
                console.log(`🔥 Hot reload enabled (${backendEmoji} ${backendName}) for:`, hotReloadConfig.roots);
            }
        });
        this.hotReload.on('reloading', ({ files }) => {
            if (isDev) {
                console.log('♻️  Reloading:', files.map((f) => path.relative(cwd, f)).join(', '));
            }
        });
        this.hotReload.on('reloaded', ({ duration }) => {
            if (isDev) {
                console.log(`✅ Reloaded in ${duration}ms`);
            }
        });
        this.hotReload.on('reload-error', ({ errors }) => {
            console.error('❌ Hot reload error:', errors[0]?.message || 'Unknown error');
        });
    }
    use(pathOrHandler, handler) {
        if (typeof pathOrHandler === 'function') {
            this.globalMiddleware.push(pathOrHandler);
        }
        else if (handler) {
            // Path-specific middleware - convert to route
            this.router.addRoute('ALL', pathOrHandler, [handler]);
        }
        return this;
    }
    /**
     * Register route handlers
     */
    get(path, ...handlers) {
        this.router.addRoute('GET', path, handlers);
        return this;
    }
    post(path, ...handlers) {
        this.router.addRoute('POST', path, handlers);
        return this;
    }
    put(path, ...handlers) {
        this.router.addRoute('PUT', path, handlers);
        return this;
    }
    delete(path, ...handlers) {
        this.router.addRoute('DELETE', path, handlers);
        return this;
    }
    patch(path, ...handlers) {
        this.router.addRoute('PATCH', path, handlers);
        return this;
    }
    all(path, ...handlers) {
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
        for (const method of methods) {
            this.router.addRoute(method, path, handlers);
        }
        return this;
    }
    /**
     * Set error handler
     */
    catch(handler) {
        this.errorHandler = handler;
        return this;
    }
    /**
     * Set/get application setting
     */
    set(name, value) {
        this.settings.set(name, value);
        return this;
    }
    getSetting(name) {
        return this.settings.get(name);
    }
    /**
     * Compile routes for optimal performance
     * Call before starting server
     */
    compile() {
        if (this.compiled)
            return this;
        this.router.compile();
        this.compiled = true;
        return this;
    }
    listen(port, hostOrCallback, callback) {
        // Auto-compile if not done
        if (!this.compiled) {
            this.compile();
        }
        // Start hot reload before server starts
        if (this.hotReload) {
            this.hotReload.start();
        }
        const host = typeof hostOrCallback === 'string' ? hostOrCallback : undefined;
        const cb = typeof hostOrCallback === 'function' ? hostOrCallback : callback;
        this.server = createServer((req, res) => {
            this.handleRequest(req, res);
        });
        if (host) {
            this.server.listen(port, host, cb);
        }
        else {
            this.server.listen(port, cb);
        }
        return this.server;
    }
    /**
     * Close server
     */
    close(callback) {
        // Stop hot reload
        if (this.hotReload) {
            this.hotReload.stop();
        }
        if (this.server) {
            this.server.close(callback);
        }
    }
    /**
     * Handle incoming HTTP request
     * This is the hot path - performance critical
     */
    async handleRequest(req, res) {
        const method = req.method || 'GET';
        const path = req.url?.split('?')[0] || '/';
        // Find matching route
        const match = this.router.find(method, path);
        // Create request/response wrappers
        const request = createRequest(req);
        const response = new Response(res);
        // Attach Request properties to IncomingMessage for handler compatibility
        req.params = {};
        req.query = request.query;
        req.path = request.path;
        req.hostname = request.hostname;
        req.ip = request.ip;
        // Attach Response methods to ServerResponse for handler compatibility
        // This allows handlers to call res.json(), res.send(), etc.
        res.json = response.json.bind(response);
        res.send = response.send.bind(response);
        res.status = response.status.bind(response);
        res.set = response.set.bind(response);
        res.get = response.get.bind(response);
        res.cookie = response.cookie.bind(response);
        res.clearCookie = response.clearCookie.bind(response);
        res.redirect = response.redirect.bind(response);
        res.type = response.type.bind(response);
        res.locals = response.locals;
        // Attach params if route matched
        if (match) {
            req.params = match.params;
        }
        // Build handler chain: global middleware + route handlers
        const handlers = [
            ...this.globalMiddleware,
            ...(match?.handlers || []),
        ];
        // Handle 404 if no route matched
        if (!match) {
            if (!res.headersSent) {
                res.statusCode = 404;
                res.setHeader('content-type', 'text/plain');
                res.end('Not Found');
            }
            return;
        }
        // Run pipeline with error handling
        await runPipeline(req, res, handlers, this.errorHandler);
    }
    /**
     * Get all registered routes
     */
    getRoutes() {
        return this.router.getRoutes();
    }
}
/**
 * Factory function to create application
 */
export function createApp(options) {
    return new Application(options);
}
//# sourceMappingURL=application.js.map