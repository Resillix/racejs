/**
 * Dev Mode Manager
 *
 * Central orchestrator for all dev mode features
 * Follows Single Responsibility: coordinates dev features without implementing them
 */

import { EventEmitter } from 'node:events';
import { DevLogger, createDevLogger } from './logger.js';
import { RequestRecorder } from './recorder-manager.js';
import { DevToolsServer } from './devtools-server.js';
import { DevToolsHttpServer } from './devtools-http.js';
import { DevToolsMessageHandler } from './devtools-handler.js';
import { PerformanceProfiler } from './profiler.js';
import { MetricsCollector } from './profiler-metrics.js';
import { DevErrorHandler } from './error/error-handler.js';
import { ErrorAggregator } from './error/error-aggregator.js';
import type { DevModeOptions } from './types.js';
import { normalizeDevModeOptions } from './types.js';
import type { Application } from '../application.js';

export interface DevModeMetrics {
  /** Total requests processed */
  totalRequests: number;

  /** Total errors encountered */
  totalErrors: number;

  /** Average response time */
  avgResponseTime: number;

  /** Memory usage */
  memoryUsage: NodeJS.MemoryUsage;

  /** Uptime in milliseconds */
  uptime: number;
}

export class DevModeManager extends EventEmitter {
  private logger: DevLogger;
  private recorder?: RequestRecorder;
  private devtoolsServer?: DevToolsServer;
  private devtoolsHttpServer?: DevToolsHttpServer;
  private devtoolsHandler?: DevToolsMessageHandler;
  private profiler?: PerformanceProfiler;
  private metricsCollector?: MetricsCollector;
  private errorHandler?: DevErrorHandler;
  private errorAggregator?: ErrorAggregator;
  private options: DevModeOptions;
  private startTime = Date.now();

  // State tracking
  private _isReady = false;
  private _isStarting = false;
  private _startPromise: Promise<void> | undefined = undefined;

  // Metrics tracking
  private metrics: DevModeMetrics = {
    totalRequests: 0,
    totalErrors: 0,
    avgResponseTime: 0,
    memoryUsage: process.memoryUsage(),
    uptime: 0,
  };

  constructor(options: boolean | DevModeOptions = {}) {
    super();

    const normalized = normalizeDevModeOptions(options);
    if (!normalized) {
      throw new Error('Dev mode is disabled');
    }

    this.options = normalized;

    // Initialize logger
    this.logger =
      this.options.logger instanceof DevLogger
        ? this.options.logger
        : createDevLogger(this.options.logger);

    // Initialize recorder if enabled
    if (this.options.recorder) {
      this.recorder = new RequestRecorder(
        typeof this.options.recorder === 'object' ? (this.options.recorder as any) : undefined
      );
    }

    // Initialize profiler if enabled
    if (this.options.profiler) {
      const profilerOptions =
        typeof this.options.profiler === 'object' ? this.options.profiler : {};
      this.profiler = new PerformanceProfiler(profilerOptions);
      this.metricsCollector = new MetricsCollector();
    }

    // Initialize error handler and aggregator (always enabled in dev mode)
    this.errorAggregator = new ErrorAggregator();
    this.errorHandler = new DevErrorHandler({}, this.errorAggregator);
  }

  /**
   * Set the application instance (for future use)
   */
  setApplication(_app: Application): void {
    // Reserved for future integration
  }

  /**
   * Start dev mode features
   */
  async start(): Promise<void> {
    // Already started
    if (this._isReady) {
      return;
    }

    // Return existing promise if already starting
    if (this._isStarting && this._startPromise) {
      return this._startPromise;
    }

    // Mark as starting and create promise
    this._isStarting = true;

    // Create and store the start promise
    this._startPromise = (async () => {
      try {
        this.logger.info('🚀 Dev mode starting...');

        // Start recorder if enabled
        if (this.recorder) {
          await this.recorder.start();
          this.logger.debug('Request recorder started');
        }

        // Start profiler if enabled
        if (this.profiler) {
          this.profiler.start();
          this.logger.debug('Performance profiler started');
        }

        // Start metrics collector if enabled
        if (this.metricsCollector) {
          this.metricsCollector.start();
          this.logger.debug('Metrics collector started');
        }

        // Start DevTools server if enabled
        if (this.options.devtools) {
          this.logger.debug('DevTools option detected', { devtools: this.options.devtools });
          const devtoolsOptions =
            typeof this.options.devtools === 'object' ? this.options.devtools : {};
          if (devtoolsOptions.enabled !== false) {
            this.logger.debug('Starting DevTools server...');
            try {
              await this.startDevTools();
              this.logger.debug('DevTools server started successfully');
            } catch (error) {
              this.logger.error('Failed to start DevTools', {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          } else {
            this.logger.debug('DevTools explicitly disabled');
          }
        } else {
          this.logger.debug('No DevTools configuration');
        }

        // Update metrics
        this.updateMetrics();

        // Start metrics collection interval
        setInterval(() => this.updateMetrics(), 5000);

        this.logger.info('✅ Dev mode ready', {
          features: {
            logger: true,
            devtools: !!this.devtoolsServer?.isRunning(),
            recorder: !!this.recorder,
            profiler: !!this.options.profiler,
          },
        });

        // Mark as ready before emitting events
        this._isReady = true;
        this._isStarting = false;

        this.emit('started');
        this.emit('ready');
      } catch (error) {
        this._isStarting = false;
        this._isReady = false;
        throw error;
      }
    })();

    return this._startPromise;
  }

  /**
   * Stop dev mode features
   */
  async stop(): Promise<void> {
    this.logger.info('🛑 Dev mode stopping...');

    // Stop DevTools server if running
    await this.stopDevTools();

    // Stop recorder if enabled
    if (this.recorder) {
      await this.recorder.stop();
    }

    // Stop profiler if enabled
    if (this.profiler) {
      this.profiler.stop();
      this.logger.debug('Performance profiler stopped');
    }

    // Stop metrics collector if enabled
    if (this.metricsCollector) {
      this.metricsCollector.stop();
      this.logger.debug('Metrics collector stopped');
    }

    // Reset state
    this._isReady = false;
    this._isStarting = false;
    this._startPromise = undefined;

    this.emit('stopped');
  }

  /**
   * Get the dev logger
   */
  getLogger(): DevLogger {
    return this.logger;
  }

  /**
   * Check if dev mode has completed initialization
   * @returns true if dev mode is ready, false otherwise
   */
  isReady(): boolean {
    return this._isReady;
  }

  /**
   * Check if dev mode is currently starting
   * @returns true if dev mode is in the process of starting
   */
  isStarting(): boolean {
    return this._isStarting;
  }

  /**
   * Wait for dev mode to complete initialization
   * If dev mode is not yet started, this will start it.
   * If already ready, returns immediately.
   * @returns Promise that resolves when dev mode is ready
   */
  async waitForReady(): Promise<void> {
    if (this._isReady) {
      return;
    }

    if (this._isStarting && this._startPromise) {
      return this._startPromise;
    }

    return this.start();
  }

  /**
   * Get the request recorder (if enabled)
   */
  getRecorder(): RequestRecorder | undefined {
    return this.recorder;
  }

  /**
   * Get the performance profiler (if enabled)
   */
  getProfiler(): PerformanceProfiler | undefined {
    return this.profiler;
  }

  /**
   * Get the metrics collector (if enabled)
   */
  getMetricsCollector(): MetricsCollector | undefined {
    return this.metricsCollector;
  }

  /**
   * Get the error handler
   */
  getErrorHandler(): DevErrorHandler | undefined {
    return this.errorHandler;
  }

  /**
   * Get the error aggregator
   */
  getErrorAggregator(): ErrorAggregator | undefined {
    return this.errorAggregator;
  }

  /**
   * Set server information for replay functionality
   */
  setServerInfo(port: number, host: string = 'localhost'): void {
    if (this.recorder) {
      const replayEngine = this.recorder.getReplayEngine();
      replayEngine.setServerPort(port);
      this.logger.debug('Server info configured for replay', { port, host });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): DevModeMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Record a request
   */
  recordRequest(route: string, method: string, duration: number, isError: boolean = false): void {
    this.metrics.totalRequests++;

    // Update average response time
    const n = this.metrics.totalRequests;
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime * (n - 1) + duration) / n;

    // Record in metrics collector if enabled
    if (this.metricsCollector) {
      this.metricsCollector.recordRequestEnd(route, method, duration, isError);
    }
  }

  /**
   * Record an error
   */
  recordError(error: Error): void {
    this.metrics.totalErrors++;
    this.logger.error('Request error', { error: error.message, stack: error.stack });
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.uptime = Date.now() - this.startTime;
  }

  /**
   * Log with context
   */
  log(level: 'info' | 'warn' | 'error', message: string, meta?: any): void {
    this.logger[level](message, meta);
  }

  /**
   * Start DevTools server
   */
  private async startDevTools(): Promise<void> {
    try {
      const devtoolsOptions =
        typeof this.options.devtools === 'object' ? this.options.devtools : {};

      // Create DevTools server
      this.devtoolsServer = new DevToolsServer({
        port: devtoolsOptions.port || 9229,
        host: devtoolsOptions.host || 'localhost',
        path: '/devtools',
      });

      // Create HTTP server for UI
      const httpServerOptions: any = {
        port: devtoolsOptions.port || 9229,
        host: devtoolsOptions.host || 'localhost',
      };

      if (devtoolsOptions.autoOpen !== undefined) {
        httpServerOptions.autoOpen = devtoolsOptions.autoOpen;
      }

      this.devtoolsHttpServer = new DevToolsHttpServer(httpServerOptions);

      // Start HTTP server first
      await this.devtoolsHttpServer.start();

      // Attach WebSocket to HTTP server
      const httpServer = this.devtoolsHttpServer.getServer();
      if (httpServer) {
        this.devtoolsServer.attachToHttpServer(httpServer);
      }

      // Create message handler
      this.devtoolsHandler = new DevToolsMessageHandler(this.devtoolsServer, this);

      // Setup message handling
      this.devtoolsServer.on('message', (message, client) => {
        this.devtoolsHandler?.handleMessage(message, client);
      });

      // Log events
      this.devtoolsServer.on('connection', () => {
        this.logger.debug('DevTools client connected');
      });

      this.devtoolsServer.on('disconnection', () => {
        this.logger.debug('DevTools client disconnected');
      });

      this.devtoolsServer.on('error', (error) => {
        this.logger.error('DevTools server error', { error: error.message });
      });

      // Start WebSocket server (now attached to HTTP server)
      await this.devtoolsServer.start();

      const url = this.devtoolsHttpServer.getUrl();
      this.logger.info(`🛠️  DevTools UI available at ${url}`);
    } catch (error) {
      this.logger.error('Failed to start DevTools server', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Clean up on failure
      if (this.devtoolsServer) {
        await this.devtoolsServer.stop().catch(() => {});
        delete this.devtoolsServer;
      }
      if (this.devtoolsHttpServer) {
        await this.devtoolsHttpServer.stop().catch(() => {});
        delete this.devtoolsHttpServer;
      }
      throw error;
    }
  }

  /**
   * Stop DevTools server
   */
  async stopDevTools(): Promise<void> {
    // Stop WebSocket server first
    if (this.devtoolsServer) {
      await this.devtoolsServer.stop();
      delete this.devtoolsServer;
      delete this.devtoolsHandler;
    }

    // Stop HTTP server
    if (this.devtoolsHttpServer) {
      await this.devtoolsHttpServer.stop();
      delete this.devtoolsHttpServer;
    }

    this.logger.debug('DevTools server stopped');
  }

  /**
   * Get DevTools server instance
   */
  getDevToolsServer(): DevToolsServer | undefined {
    return this.devtoolsServer;
  }

  /**
   * Create request recording middleware
   * This middleware automatically records all incoming requests
   *
   * @deprecated This middleware is no longer needed as recording is now handled
   * automatically in the application's request handler. Using this middleware
   * will cause duplicate response interception and double execution.
   *
   * The recording is now integrated directly into Application.handleRequest()
   * for better performance and to avoid conflicts.
   */
  createRecordingMiddleware(): (req: any, res: any, next: any) => Promise<void> {
    return async (req, res, next) => {
      if (!this.recorder || !this.recorder.isRecording()) {
        return next();
      }

      const startTime = Date.now();

      try {
        // Record request start
        const requestId = await this.recorder.recordRequest(req, startTime);

        if (requestId) {
          // Store request ID for later
          (req as any).__devModeRequestId = requestId;

          // Intercept response
          const originalEnd = res.end;
          const originalWrite = res.write;
          const chunks: Buffer[] = [];
          const recorder = this.recorder; // Capture recorder reference

          res.write = function (chunk: any, ...args: any[]) {
            if (chunk) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            return originalWrite.apply(res, [chunk, ...args]);
          };

          res.end = function (chunk: any, ...args: any[]) {
            if (chunk) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }

            // Record response
            const endTime = Date.now();
            const body = Buffer.concat(chunks).toString('utf8');

            void recorder!.recordResponse(requestId, res, body, endTime).catch(() => {
              // Ignore recording errors
            });

            return originalEnd.apply(res, [chunk, ...args]);
          };
        }
      } catch (error) {
        // Don't break request on recording error
        this.logger.error('Failed to record request', { error });
      }

      next();
    };
  }

  /**
   * Create error tracking middleware
   * This middleware automatically tracks all errors
   */
  createErrorMiddleware(): (err: any, req: any, res: any, next: any) => Promise<void> {
    return async (err, req, res, _next) => {
      if (!this.errorAggregator || !this.errorHandler) {
        // If no error handler, re-throw
        throw err;
      }

      try {
        // Track the error
        this.errorAggregator.track(err, {
          route: req.url || '/',
          method: req.method || 'GET',
          timestamp: Date.now(),
          requestId: (req as any).__devModeRequestId,
          statusCode: res.statusCode || 500,
        });

        // Handle the error (render error page)
        await this.errorHandler.handle(err, req, res);
      } catch (handlerError) {
        // If error handler fails, send basic error response
        this.logger.error('Error handler failed', { error: handlerError });
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Internal Server Error');
        }
      }
    };
  }
}

/**
 * Create a dev mode manager instance
 */
export function createDevMode(options?: boolean | DevModeOptions): DevModeManager | null {
  const normalized = normalizeDevModeOptions(options);
  if (!normalized) return null;

  return new DevModeManager(normalized);
}
