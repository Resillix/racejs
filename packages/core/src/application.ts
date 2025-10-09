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
import { HotReloadManager, type HotReloadOptions } from './hot-reload/manager.js';
import path from 'node:path';
import { existsSync } from 'node:fs';

export interface AppOptions {
  /** Enable HTTP/2 support */
  http2?: boolean;
  /** Enable async context tracking */
  asyncContext?: boolean | 'auto';
  /** Compatibility mode for Express 4.x */
  compat?: boolean;
  /** Hot reload configuration (auto-enabled in development) */
  hotReload?: boolean | HotReloadOptions;
}

export class Application {
  private router: Router;
  private server?: Server;
  private globalMiddleware: Handler[] = [];
  private errorHandler?: (err: any, req: IncomingMessage, res: ServerResponse) => void;
  private settings: Map<string, any> = new Map();
  private compiled = false;
  private hotReload?: HotReloadManager;
  private options: AppOptions;

  constructor(options: AppOptions = {}) {
    this.options = options;
    this.router = new Router();
    this.setupHotReload();
  }

  /**
   * Setup built-in hot reload for development
   * Auto-detects common project structures and enables zero-config hot reloading
   */
  private setupHotReload(): void {
    const hotReloadOpt = this.options.hotReload;

    // Disabled explicitly
    if (hotReloadOpt === false) return;

    // Auto-enable in development
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && hotReloadOpt !== true && typeof hotReloadOpt !== 'object') return;

    // Auto-detect watch directories
    const cwd = process.cwd();
    const autoDetectDirs: string[] = [];
    
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
    const hotReloadConfig: HotReloadOptions = typeof hotReloadOpt === 'object' 
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
        const backend = this.hotReload!.getActiveBackend();
        const backendEmoji = backend === 'parcel' ? '🚀' : '📁';
        const backendName = backend === 'parcel' ? '@parcel/watcher' : 'fs.watch';
        console.log(`🔥 Hot reload enabled (${backendEmoji} ${backendName}) for:`, hotReloadConfig.roots);
      }
    });

    this.hotReload.on('reloading', ({ files }) => {
      if (isDev) {
        console.log('♻️  Reloading:', files.map((f: string) => path.relative(cwd, f)).join(', '));
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
    } else {
      this.server.listen(port, cb);
    }

    return this.server;
  }

  /**
   * Close server
   */
  close(callback?: (err?: Error) => void): void {
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
