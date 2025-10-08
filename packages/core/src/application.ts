/**
 * High-performance Express-compatible application
 *
 * Combines router, pipeline, and HTTP server with optimizations
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { Router, type Handler, type RouteMatch } from './router.js';
import { runPipeline } from './pipeline.js';
import { Request, createRequest } from './request.js';
import { Response } from './response.js';

export interface AppOptions {
  /** Enable HTTP/2 support */
  http2?: boolean;
  /** Enable async context tracking */
  asyncContext?: boolean | 'auto';
  /** Compatibility mode for Express 4.x */
  compat?: boolean;
}

export class Application {
  private router: Router;
  private server?: Server;
  private globalMiddleware: Handler[] = [];
  private errorHandler?: (err: any, req: IncomingMessage, res: ServerResponse) => void;
  private settings: Map<string, any> = new Map();
  private compiled = false;

  constructor(_options: AppOptions = {}) {
    // Options reserved for future use (HTTP/2, async context, etc.)
    this.router = new Router();
  }

  /**
   * Register global middleware (runs before routes)
   */
  use(handler: Handler): this;
  use(path: string, handler: Handler): this;
  use(pathOrHandler: string | Handler, handler?: Handler): this {
    if (typeof pathOrHandler === 'function') {
      this.globalMiddleware.push(pathOrHandler);
    } else if (handler) {
      // Path-specific middleware - convert to route
      this.router.addRoute('ALL', pathOrHandler, [handler]);
    }
    return this;
  }

  /**
   * Register route handlers
   */
  get(path: string, ...handlers: Handler[]): this {
    this.router.addRoute('GET', path, handlers);
    return this;
  }

  post(path: string, ...handlers: Handler[]): this {
    this.router.addRoute('POST', path, handlers);
    return this;
  }

  put(path: string, ...handlers: Handler[]): this {
    this.router.addRoute('PUT', path, handlers);
    return this;
  }

  delete(path: string, ...handlers: Handler[]): this {
    this.router.addRoute('DELETE', path, handlers);
    return this;
  }

  patch(path: string, ...handlers: Handler[]): this {
    this.router.addRoute('PATCH', path, handlers);
    return this;
  }

  all(path: string, ...handlers: Handler[]): this {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
    for (const method of methods) {
      this.router.addRoute(method, path, handlers);
    }
    return this;
  }

  /**
   * Set error handler
   */
  catch(handler: (err: any, req: IncomingMessage, res: ServerResponse) => void): this {
    this.errorHandler = handler;
    return this;
  }

  /**
   * Set/get application setting
   */
  set(name: string, value: any): this {
    this.settings.set(name, value);
    return this;
  }

  getSetting(name: string): any {
    return this.settings.get(name);
  }

  /**
   * Compile routes for optimal performance
   * Call before starting server
   */
  compile(): this {
    if (this.compiled) return this;
    this.router.compile();
    this.compiled = true;
    return this;
  }

  /**
   * Start HTTP server
   */
  listen(port: number, callback?: () => void): Server;
  listen(port: number, host: string, callback?: () => void): Server;
  listen(port: number, hostOrCallback?: string | (() => void), callback?: () => void): Server {
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
    } else {
      this.server.listen(port, cb);
    }

    return this.server;
  }

  /**
   * Close server
   */
  close(callback?: (err?: Error) => void): void {
    if (this.server) {
      this.server.close(callback);
    }
  }

  /**
   * Handle incoming HTTP request
   * This is the hot path - performance critical
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = req.method || 'GET';
    const path = req.url?.split('?')[0] || '/';

    // Find matching route
    const match: RouteMatch | null = this.router.find(method, path);

    // Create request/response wrappers
    const request = createRequest(req);
    const response = new Response(res);

    // Attach Request properties to IncomingMessage for handler compatibility
    (req as any).params = {};
    (req as any).query = request.query;
    (req as any).path = request.path;
    (req as any).hostname = request.hostname;
    (req as any).ip = request.ip;

    // Attach Response methods to ServerResponse for handler compatibility
    // This allows handlers to call res.json(), res.send(), etc.
    (res as any).json = response.json.bind(response);
    (res as any).send = response.send.bind(response);
    (res as any).status = response.status.bind(response);
    (res as any).set = response.set.bind(response);
    (res as any).get = response.get.bind(response);
    (res as any).cookie = response.cookie.bind(response);
    (res as any).clearCookie = response.clearCookie.bind(response);
    (res as any).redirect = response.redirect.bind(response);
    (res as any).type = response.type.bind(response);
    (res as any).locals = response.locals;

    // Attach params if route matched
    if (match) {
      (req as any).params = match.params;
    }

    // Build handler chain: global middleware + route handlers
    const handlers: Handler[] = [
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
    await runPipeline(
      req as any,
      res,
      handlers as any,
      this.errorHandler
    );
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
export function createApp(options?: AppOptions): Application {
  return new Application(options);
}

/**
 * Export types
 */
export type { Handler, RouteMatch, Request, Response };
