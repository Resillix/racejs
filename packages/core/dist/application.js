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
export class Application {
    router;
    server;
    globalMiddleware = [];
    errorHandler;
    settings = new Map();
    compiled = false;
    constructor(_options = {}) {
        // Options reserved for future use (HTTP/2, async context, etc.)
        this.router = new Router();
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