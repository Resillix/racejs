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
import { DevModeManager } from './dev/manager.js';
import type { DevModeOptions } from './dev/types.js';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

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

export class Application {
  private router: Router;
  private server?: Server;
  private globalMiddleware: Handler[] = [];
  private settings: Map<string, any> = new Map();
  private compiled = false;
  private hotReload?: HotReloadManager;
  private devMode?: DevModeManager;
  private options: AppOptions;

  constructor(options: AppOptions = {}) {
    this.options = options;
    this.router = new Router();
    this.setupDevMode();
    this.setupHotReload();
  }

  /**
   * Setup dev mode for enhanced developer experience
   * Auto-enables in development with zero configuration
   */
  private setupDevMode(): void {
    // Skip if disabled explicitly
    if (this.options.devMode === false) return;

    // Auto-enable in development
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && this.options.devMode !== true && typeof this.options.devMode !== 'object') {
      return;
    }

    try {
      this.devMode = new DevModeManager(this.options.devMode || true);
      this.devMode.setApplication(this);
    } catch (error) {
      // Dev mode failed to initialize, continue without it
      if (isDev) {
        console.warn('⚠️  Dev mode initialization failed:', error);
      }
    }
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
    const candidates = ['src/routes', 'src/api', 'routes', 'api', 'src', 'lib'];

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
    const hotReloadConfig: HotReloadOptions =
      typeof hotReloadOpt === 'object'
        ? {
            ...hotReloadOpt,
            roots: hotReloadOpt.roots || autoDetectDirs,
          }
        : {
            enabled: true,
            roots: autoDetectDirs,
          };

    // Initialize hot reload manager
    this.hotReload = new HotReloadManager(hotReloadConfig);
    this.hotReload.setRouter(this.router);

    // Enable hot reload mode on router (prevents freezing)
    this.router.enableHotReload();
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
  catch(_handler: (err: any, req: IncomingMessage, res: ServerResponse) => void): this {
    // TODO: Implement error handler integration
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
   *
   * Note: Compilation is skipped when hot reload is enabled to allow route updates
   */
  compile(): this {
    if (this.compiled) return this;

    // Skip compilation if hot reload is enabled (routes need to be mutable)
    if (this.hotReload && this.options.hotReload !== false) {
      console.log('ℹ️  Skipping compile() - hot reload requires mutable routes');
      return this;
    }

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

    // Start dev mode before server starts
    if (this.devMode) {
      this.devMode.start().catch((err) => {
        console.warn('⚠️  Dev mode failed to start:', err);
      });
    }

    // Start hot reload before server starts
    if (this.hotReload) {
      this.hotReload.start();
    }

    const host = typeof hostOrCallback === 'string' ? hostOrCallback : undefined;
    const cb = typeof hostOrCallback === 'function' ? hostOrCallback : callback;

    // Wrap callback to configure dev mode after server starts
    const wrappedCallback = () => {
      // Configure replay engine with actual server port
      if (this.devMode) {
        this.devMode.setServerInfo(port, host);
      }
      // Call original callback
      if (cb) cb();
    };

    this.server = createServer((req, res) => {
      this.handleRequest(req, res);
    });

    if (host) {
      this.server.listen(port, host, wrappedCallback);
    } else {
      this.server.listen(port, wrappedCallback);
    }

    return this.server;
  }

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
  getHotReload(): HotReloadManager | undefined {
    return this.hotReload;
  }

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
  getDevMode(): DevModeManager | undefined {
    return this.devMode;
  }

  /**
   * Close server
   */
  close(callback?: (err?: Error) => void): void {
    // Stop dev mode
    if (this.devMode) {
      this.devMode.stop().catch(() => {
        // Ignore errors during shutdown
      });
    }

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
    const startTime = performance.now();
    const method = req.method || 'GET';
    const path = req.url?.split('?')[0] || '/';

    // Record request in dev mode if recorder enabled
    let requestId: string | null = null;
    const recorder = this.devMode?.getRecorder();
    if (recorder?.isRecording()) {
      requestId = await recorder.recordRequest(req, startTime);
    }

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
    const handlers: Handler[] = [...this.globalMiddleware, ...(match?.handlers || [])];

    // Handle 404 if no route matched
    if (!match) {
      if (!res.headersSent) {
        res.statusCode = 404;
        res.setHeader('content-type', 'text/plain');
        res.end('Not Found');
      }

      // Track metrics in dev mode
      if (this.devMode) {
        const duration = performance.now() - startTime;
        this.devMode.recordRequest(path, method, duration, false);
      }

      // Record response in dev mode (404 response)
      if (requestId && recorder) {
        await recorder.recordResponse(requestId, res, 'Not Found', performance.now());
      }
      return;
    }

    // Run pipeline with error handling
    try {
      // Intercept response body if recorder is enabled
      let responseBody: any = null;
      if (requestId && recorder && recorder.isRecording()) {
        const originalEnd = res.end.bind(res);
        const originalWrite = res.write.bind(res);
        const chunks: Buffer[] = [];

        res.write = function (chunk: any, ...args: any[]): boolean {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          return originalWrite(chunk, ...args);
        };

        res.end = function (chunk: any, ...args: any[]): any {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          if (chunks.length > 0) {
            responseBody = Buffer.concat(chunks).toString('utf8');
          }

          // Record response when end is called
          void recorder!
            .recordResponse(requestId!, res, responseBody, performance.now())
            .catch(() => {
              // Ignore recording errors
            });

          return originalEnd(chunk, ...args);
        };
      }

      // Don't pass errorHandler to pipeline - let errors bubble up to our catch block
      // This allows DevErrorHandler to work properly
      await runPipeline(req as any, res, handlers as any, undefined);

      // Track successful request in dev mode
      if (this.devMode) {
        const duration = performance.now() - startTime;
        this.devMode.recordRequest(path, method, duration, false);
      }

      // Note: Response recording is now handled in the res.end() wrapper above
      // This prevents duplicate response recording
    } catch (error) {
      process.stdout.write(
        `[Application] ERROR CAUGHT: ${error instanceof Error ? error.message : error}\n`
      );
      process.stdout.write(`[Application] devMode: ${!!this.devMode}\n`);
      process.stdout.write(`[Application] error instanceof Error: ${error instanceof Error}\n`);
      process.stdout.write(`[Application] res.headersSent: ${res.headersSent}\n`);

      // Handle error with beautiful error page in dev mode
      if (this.devMode && error instanceof Error && !res.headersSent) {
        process.stdout.write('[Application] Calling error handler...\n');
        const errorHandler = this.devMode.getErrorHandler();
        process.stdout.write(`[Application] errorHandler exists: ${!!errorHandler}\n`);
        if (errorHandler) {
          try {
            await errorHandler.handle(error, req, res);

            // Record error response in dev mode
            if (requestId && recorder) {
              await recorder.recordResponse(requestId, res, error.message, performance.now());
            }
            return; // Error handler sends response
          } catch (handlerError) {
            // If error handler fails, fall through to default handling
            console.error('Error handler failed:', handlerError);
          }
        }
      }

      // Default error handling (production or if dev error handler fails)
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end('Internal Server Error');
      }

      // Record error response in dev mode
      if (requestId && recorder) {
        await recorder.recordResponse(
          requestId,
          res,
          error instanceof Error ? error.message : 'Error',
          performance.now()
        );
      }
    }
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
