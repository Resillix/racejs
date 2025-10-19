/**
 * DevTools Message Handler
 *
 * Handles client messages and sends appropriate responses.
 * Bridges events from DevModeManager components to WebSocket clients.
 */

import type { DevToolsServer } from './devtools-server.js';
import type { DevModeManager } from './manager.js';
import type { ClientMessage } from './devtools-protocol.js';
import { createServerMessage, ServerMessageType, ClientMessageType } from './devtools-protocol.js';
import { TestGenerator } from './recorder-test-gen.js';

/**
 * DevTools Message Handler
 *
 * Processes client messages and coordinates with DevModeManager
 * to fetch data and stream updates.
 */
export class DevToolsMessageHandler {
  constructor(
    private server: DevToolsServer,
    private devMode: DevModeManager
  ) {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for real-time updates
   */
  private setupEventListeners(): void {
    // Listen for DevModeManager events and broadcast to clients

    // Metrics updates (every 5 seconds)
    setInterval(() => {
      this.broadcastMetrics();
    }, 5000);

    // Recorder events
    const recorder = this.devMode.getRecorder();
    if (recorder) {
      recorder.on('recorded', async ({ id, request }) => {
        this.server.broadcast(
          createServerMessage(ServerMessageType.REQUEST_RECORDED, {
            id,
            method: request.method,
            url: request.url,
            timestamp: request.timestamp,
          })
        );
      });

      recorder.on('response-recorded', async ({ id, request }) => {
        this.server.broadcast(
          createServerMessage(ServerMessageType.REQUEST_RESPONSE, {
            id,
            statusCode: request.response?.statusCode || 0,
            duration: request.duration || 0,
          })
        );
      });
    }

    // Logger events
    const logger = this.devMode.getLogger();
    if (logger) {
      // Note: We'll need to add event emission to the logger
      // For now, this is a placeholder
    }

    // Error aggregator events
    const errorAggregator = this.devMode.getErrorAggregator();
    if (errorAggregator) {
      // Real-time error tracking notification
      errorAggregator.on('error-tracked', ({ hash, error }) => {
        this.server.broadcast(
          createServerMessage(ServerMessageType.ERROR_TRACKED, {
            hash: hash,
            name: error.type,
            message: error.message,
            count: error.count,
            timestamp: error.lastSeen,
          })
        );
      });

      // Error spike alert
      errorAggregator.on('error-spike', (error) => {
        this.server.broadcast(
          createServerMessage(ServerMessageType.ERROR_SPIKE_ALERT, {
            hash: error.hash,
            message: error.message,
            count: error.count,
            trend: error.trend,
          })
        );
      });

      // New error type detected
      errorAggregator.on('new-error-type', (error) => {
        this.server.broadcast(
          createServerMessage(ServerMessageType.ERROR_TRACKED, {
            hash: error.hash,
            name: error.type,
            message: error.message,
            count: 1,
            timestamp: error.firstSeen,
          })
        );
      });
    }
  }

  /**
   * Handle incoming client message
   */
  async handleMessage(message: ClientMessage, client: any): Promise<void> {
    try {
      switch (message.type) {
        case ClientMessageType.HELLO:
          await this.handleHello(client);
          break;

        case ClientMessageType.GET_METRICS:
          await this.handleGetMetrics(client);
          break;

        case ClientMessageType.GET_ROUTES:
          await this.handleGetRoutes(client);
          break;

        case ClientMessageType.GET_REQUESTS:
          await this.handleGetRequests(client, message.data);
          break;

        case ClientMessageType.GET_REQUEST:
          await this.handleGetRequest(client, message.data);
          break;

        case ClientMessageType.CLEAR_REQUESTS:
          await this.handleClearRequests(client);
          break;

        case ClientMessageType.DELETE_REQUEST:
          await this.handleDeleteRequest(client, message.data);
          break;

        case ClientMessageType.EXPORT_REQUESTS:
          await this.handleExportRequests(client);
          break;

        case ClientMessageType.REPLAY_REQUEST:
          await this.handleReplayRequest(client, message.data);
          break;

        case ClientMessageType.COMPARE_RESPONSES:
          await this.handleCompareResponses(client, message.data);
          break;

        case ClientMessageType.GENERATE_TEST:
          await this.handleGenerateTest(client, message.data);
          break;

        case ClientMessageType.EDIT_AND_REPLAY:
          await this.handleEditAndReplay(client, message.data);
          break;

        case ClientMessageType.GET_PERFORMANCE_METRICS:
          await this.handleGetPerformanceMetrics(client);
          break;

        case ClientMessageType.START_PROFILING:
          await this.handleStartProfiling(client);
          break;

        case ClientMessageType.STOP_PROFILING:
          await this.handleStopProfiling(client);
          break;

        case ClientMessageType.GET_ERRORS:
          await this.handleGetErrors(client, message.data);
          break;

        case ClientMessageType.GET_ERROR_DETAILS:
          await this.handleGetErrorDetails(client, message.data);
          break;

        case ClientMessageType.GET_ERROR_STATS:
          await this.handleGetErrorStats(client);
          break;

        case ClientMessageType.MARK_ERROR_RESOLVED:
          await this.handleMarkErrorResolved(client, message.data);
          break;

        case ClientMessageType.MARK_ERROR_IGNORED:
          await this.handleMarkErrorIgnored(client, message.data);
          break;

        case ClientMessageType.CLEAR_ERRORS:
          await this.handleClearErrors(client);
          break;

        case ClientMessageType.EXPORT_ERRORS:
          await this.handleExportErrors(client, message.data);
          break;

        default:
          this.server.send(
            client,
            createServerMessage(ServerMessageType.ERROR, {
              message: `Unknown message type: ${message.type}`,
              code: 'UNKNOWN_MESSAGE_TYPE',
            })
          );
      }
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'HANDLER_ERROR',
        })
      );
    }
  }

  /**
   * Handle HELLO message
   */
  private async handleHello(client: any): Promise<void> {
    // Send initial metrics
    await this.handleGetMetrics(client);

    // Send routes list
    await this.handleGetRoutes(client);

    // Send existing requests on connection (fix for UI refresh wiping data)
    await this.handleGetRequests(client, { limit: 100 });
  }

  /**
   * Handle GET_METRICS message
   */
  private async handleGetMetrics(client: any): Promise<void> {
    const metrics = this.devMode.getMetrics();
    const memory = process.memoryUsage();

    this.server.send(
      client,
      createServerMessage(ServerMessageType.METRICS_UPDATE, {
        requests: metrics.totalRequests,
        errors: metrics.totalErrors,
        avgResponseTime: metrics.avgResponseTime,
        memory: {
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          external: memory.external,
          rss: memory.rss,
        },
        uptime: process.uptime(),
      })
    );
  }

  /**
   * Handle GET_ROUTES message
   */
  private async handleGetRoutes(client: any): Promise<void> {
    // Note: We'll need to add a method to Application to get routes
    // For now, send empty array
    this.server.send(
      client,
      createServerMessage(ServerMessageType.ROUTES_LIST, {
        routes: [],
      })
    );
  }

  /**
   * Handle GET_REQUESTS message
   */
  private async handleGetRequests(
    client: any,
    data?: { limit?: number; offset?: number }
  ): Promise<void> {
    const recorder = this.devMode.getRecorder();
    if (!recorder) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Recorder not enabled',
          code: 'RECORDER_NOT_ENABLED',
        })
      );
      return;
    }

    const limit = data?.limit || 50;
    const requests = await recorder.getRecentRequests(limit);
    const total = await recorder.getCount();

    this.server.send(
      client,
      createServerMessage(ServerMessageType.REQUESTS_LIST, {
        total,
        requests: requests.map((r) => ({
          id: r.id,
          method: r.method,
          url: r.url,
          timestamp: r.timestamp,
          duration: r.duration,
          statusCode: r.response?.statusCode,
        })),
      })
    );
  }

  /**
   * Handle GET_REQUEST message
   */
  private async handleGetRequest(client: any, data: { id: string }): Promise<void> {
    const recorder = this.devMode.getRecorder();
    if (!recorder) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Recorder not enabled',
          code: 'RECORDER_NOT_ENABLED',
        })
      );
      return;
    }

    const request = await recorder.getRequest(data.id);
    if (!request) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Request not found',
          code: 'REQUEST_NOT_FOUND',
        })
      );
      return;
    }

    // Send the full request details
    this.server.send(client, createServerMessage(ServerMessageType.REQUEST_DETAILS, request));
  }

  /**
   * Handle CLEAR_REQUESTS message
   */
  private async handleClearRequests(_client: any): Promise<void> {
    const recorder = this.devMode.getRecorder();
    if (!recorder) {
      return;
    }

    await recorder.clearRequests();

    // Broadcast update to all clients
    this.server.broadcast(
      createServerMessage(ServerMessageType.REQUESTS_LIST, {
        total: 0,
        requests: [],
      })
    );
  }

  /**
   * Handle DELETE_REQUEST message
   */
  private async handleDeleteRequest(client: any, data: { id: string }): Promise<void> {
    const recorder = this.devMode.getRecorder();
    if (!recorder) {
      return;
    }

    await recorder.deleteRequest(data.id);

    // Send updated list
    await this.handleGetRequests(client);
  }

  /**
   * Handle EXPORT_REQUESTS message
   */
  private async handleExportRequests(client: any): Promise<void> {
    const recorder = this.devMode.getRecorder();
    if (!recorder) {
      return;
    }

    const json = await recorder.exportRequests();

    // Send the JSON data
    this.server.send(
      client,
      createServerMessage(ServerMessageType.REQUESTS_EXPORT, {
        data: json,
      })
    );
  }

  /**
   * Broadcast metrics update to all clients
   */
  private broadcastMetrics(): void {
    if (this.server.getClientCount() === 0) {
      return;
    }

    const metrics = this.devMode.getMetrics();
    const memory = process.memoryUsage();

    this.server.broadcast(
      createServerMessage(ServerMessageType.METRICS_UPDATE, {
        requests: metrics.totalRequests,
        errors: metrics.totalErrors,
        avgResponseTime: metrics.avgResponseTime,
        memory: {
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          external: memory.external,
          rss: memory.rss,
        },
        uptime: process.uptime(),
      })
    );
  }

  /**
   * Handle REPLAY_REQUEST message
   */
  private async handleReplayRequest(
    client: any,
    data: { id: string; mockMode?: boolean }
  ): Promise<void> {
    const recorder = this.devMode.getRecorder();
    if (!recorder) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Recorder not enabled',
          code: 'RECORDER_NOT_ENABLED',
        })
      );
      return;
    }

    try {
      // Use the recorder's replay engine to maintain state and configuration
      const replayEngine = recorder.getReplayEngine();

      // Get the original request
      const originalRequest = await recorder.getRequest(data.id);
      if (!originalRequest) {
        throw new Error(`Request ${data.id} not found`);
      }

      const result = await replayEngine.replayRequest({
        requestId: data.id,
        ...(data.mockMode !== undefined && { mockMode: data.mockMode }),
      });

      this.server.send(
        client,
        createServerMessage(ServerMessageType.REPLAY_RESULT, {
          success: true,
          originalId: data.id,
          replayId: `replay_${Date.now()}`, // Generate a replay ID
          response: {
            statusCode: result.replayResponse.statusCode,
            body: result.replayResponse.body,
            headers: result.replayResponse.headers as Record<string, string>,
            duration: result.timing.duration,
          },
        })
      );
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.REPLAY_RESULT, {
          success: false,
          originalId: data.id,
          replayId: '',
          error: error instanceof Error ? error.message : 'Unknown replay error',
        })
      );
    }
  }

  /**
   * Handle COMPARE_RESPONSES message
   */
  private async handleCompareResponses(
    client: any,
    data: { originalId: string; replayId: string }
  ): Promise<void> {
    const recorder = this.devMode.getRecorder();
    if (!recorder) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Recorder not enabled',
          code: 'RECORDER_NOT_ENABLED',
        })
      );
      return;
    }

    try {
      // Use the recorder's replay engine to maintain state and configuration
      const replayEngine = recorder.getReplayEngine();

      // Get both requests
      const originalRequest = await recorder.getRequest(data.originalId);
      const replayRequest = await recorder.getRequest(data.replayId);

      if (!originalRequest || !replayRequest) {
        throw new Error('One or both requests not found');
      }

      if (!originalRequest.response || !replayRequest.response) {
        throw new Error('One or both requests have no response data');
      }

      const comparison = replayEngine.compareResponses(
        originalRequest.response,
        replayRequest.response
      );

      this.server.send(
        client,
        createServerMessage(ServerMessageType.REPLAY_COMPARISON, {
          originalId: data.originalId,
          replayId: data.replayId,
          differences: comparison.differences,
          summary: comparison.summary,
        })
      );
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Unknown comparison error',
          code: 'COMPARISON_ERROR',
        })
      );
    }
  }

  /**
   * Handle GENERATE_TEST message
   */
  private async handleGenerateTest(
    client: any,
    data: {
      id?: string;
      ids?: string[];
      framework: 'vitest' | 'jest' | 'postman' | 'har';
      options?: any;
    }
  ): Promise<void> {
    const recorder = this.devMode.getRecorder();
    if (!recorder) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Recorder not enabled',
          code: 'RECORDER_NOT_ENABLED',
        })
      );
      return;
    }

    try {
      const testGenerator = new TestGenerator(this.devMode.getLogger());

      let requests;
      if (data.id) {
        // Single request
        const request = await recorder.getRequest(data.id);
        if (!request) {
          throw new Error(`Request ${data.id} not found`);
        }
        requests = [request];
      } else if (data.ids && data.ids.length > 0) {
        // Multiple requests
        requests = [];
        for (const id of data.ids) {
          const request = await recorder.getRequest(id);
          if (request) {
            requests.push(request);
          }
        }
        if (requests.length === 0) {
          throw new Error('No valid requests found');
        }
      } else {
        throw new Error('Either id or ids must be provided');
      }

      const result = await testGenerator.generateTestSuite(requests, {
        framework: data.framework,
        ...data.options,
      });

      this.server.send(
        client,
        createServerMessage(ServerMessageType.TEST_GENERATED, {
          requestId: data.id || data.ids?.[0] || '',
          framework: result.framework,
          content: result.content,
          filename: result.filename,
          testCount: result.meta.testCount,
          dependencies: result.meta.dependencies,
        })
      );
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Unknown test generation error',
          code: 'TEST_GENERATION_ERROR',
        })
      );
    }
  }

  /**
   * Handle EDIT_AND_REPLAY message
   */
  private async handleEditAndReplay(
    client: any,
    data: {
      originalId: string;
      editedRequest: {
        method?: string;
        url?: string;
        headers?: Record<string, string>;
        body?: any;
        query?: Record<string, string>;
      };
      mockMode?: boolean;
    }
  ): Promise<void> {
    const recorder = this.devMode.getRecorder();
    if (!recorder) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Recorder not enabled',
          code: 'RECORDER_NOT_ENABLED',
        })
      );
      return;
    }

    try {
      // Use the recorder's replay engine to maintain state and configuration
      const replayEngine = recorder.getReplayEngine();

      // Get the original request
      const originalRequest = await recorder.getRequest(data.originalId);
      if (!originalRequest) {
        throw new Error(`Original request ${data.originalId} not found`);
      }

      // Build edited request options
      const replayOptions: any = {
        requestId: data.originalId,
        ...(data.mockMode !== undefined && { mockMode: data.mockMode }),
        ...(data.editedRequest.headers && { headers: data.editedRequest.headers }),
        ...(data.editedRequest.body && { body: data.editedRequest.body }),
        ...(data.editedRequest.query && { query: data.editedRequest.query }),
      };

      const result = await replayEngine.replayRequest(replayOptions);

      this.server.send(
        client,
        createServerMessage(ServerMessageType.REPLAY_RESULT, {
          success: true,
          originalId: data.originalId,
          replayId: `replay_${Date.now()}`, // Generate a replay ID
          response: {
            statusCode: result.replayResponse.statusCode,
            body: result.replayResponse.body,
            headers: result.replayResponse.headers as Record<string, string>,
            duration: result.timing.duration,
          },
        })
      );
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.REPLAY_RESULT, {
          success: false,
          originalId: data.originalId,
          replayId: '',
          error: error instanceof Error ? error.message : 'Unknown edit and replay error',
        })
      );
    }
  }

  /**
   * Handle GET_PERFORMANCE_METRICS message
   */
  private async handleGetPerformanceMetrics(client: any): Promise<void> {
    const metricsCollector = this.devMode.getMetricsCollector();

    if (!metricsCollector) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Performance profiler is not enabled',
          code: 'PROFILER_DISABLED',
        })
      );
      return;
    }

    const metrics = metricsCollector.getMetricsSummary();

    this.server.send(client, createServerMessage(ServerMessageType.PERFORMANCE_METRICS, metrics));
  }

  /**
   * Handle START_PROFILING message
   */
  private async handleStartProfiling(client: any): Promise<void> {
    const profiler = this.devMode.getProfiler();

    if (!profiler) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Performance profiler is not enabled',
          code: 'PROFILER_DISABLED',
        })
      );
      return;
    }

    try {
      await profiler.startCPUProfile('devtools-profile');

      this.server.send(
        client,
        createServerMessage(ServerMessageType.PROFILING_STARTED, {
          startTime: Date.now(),
        })
      );
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Failed to start profiling',
          code: 'PROFILING_ERROR',
        })
      );
    }
  }

  /**
   * Handle STOP_PROFILING message
   */
  private async handleStopProfiling(client: any): Promise<void> {
    const profiler = this.devMode.getProfiler();

    if (!profiler) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Performance profiler is not enabled',
          code: 'PROFILER_DISABLED',
        })
      );
      return;
    }

    try {
      await profiler.stopCPUProfile('devtools-profile');

      // For now, just send basic profile info
      // In the future, we can use the FlameGraphBuilder to create visualization data
      this.server.send(
        client,
        createServerMessage(ServerMessageType.PROFILING_STOPPED, {
          endTime: Date.now(),
          profileAvailable: true,
        })
      );
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Failed to stop profiling',
          code: 'PROFILING_ERROR',
        })
      );
    }
  }

  /**
   * Handle GET_ERRORS message
   */
  private async handleGetErrors(client: any, data: any): Promise<void> {
    const errorAggregator = this.devMode.getErrorAggregator();

    if (!errorAggregator) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Error aggregator is not available',
          code: 'ERROR_AGGREGATOR_UNAVAILABLE',
        })
      );
      return;
    }

    try {
      // Build filter from client request
      const filter: any = {};
      if (data?.status) filter.status = data.status;
      if (data?.severity) filter.severity = data.severity;
      if (data?.route) filter.route = data.route;
      if (data?.search) filter.search = data.search;

      const limit = data?.limit || 100;
      const allErrors = errorAggregator.listErrors(filter);
      const errors = allErrors.slice(0, limit);

      // Transform to protocol format
      const errorList = errors.map((error) => ({
        hash: error.hash,
        message: error.message,
        type: error.type,
        count: error.count,
        firstSeen: error.firstSeen,
        lastSeen: error.lastSeen,
        status: error.status,
        severity: error.severity,
        trend: error.trend,
      }));

      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR_LIST, {
          errors: errorList,
          total: allErrors.length,
        })
      );
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Failed to get errors',
          code: 'GET_ERRORS_FAILED',
        })
      );
    }
  }

  /**
   * Handle GET_ERROR_DETAILS message
   */
  private async handleGetErrorDetails(client: any, data: any): Promise<void> {
    const errorAggregator = this.devMode.getErrorAggregator();

    if (!errorAggregator) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Error aggregator is not available',
          code: 'ERROR_AGGREGATOR_UNAVAILABLE',
        })
      );
      return;
    }

    try {
      const { hash } = data;
      if (!hash) {
        throw new Error('Error hash is required');
      }

      const error = errorAggregator.getError(hash);
      if (!error) {
        throw new Error(`Error not found: ${hash}`);
      }

      // Transform occurrences and routes to protocol format
      const occurrences = error.occurrences.map((occ) => ({
        requestId: occ.requestId,
        timestamp: occ.timestamp,
        route: occ.route,
        method: occ.method,
      }));

      const routes = new Map<string, number>();
      error.occurrences.forEach((occ) => {
        const route = occ.route;
        routes.set(route, (routes.get(route) || 0) + 1);
      });

      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR_DETAILS, {
          hash: error.hash,
          message: error.message,
          type: error.type,
          stack: error.stack,
          count: error.count,
          firstSeen: error.firstSeen,
          lastSeen: error.lastSeen,
          status: error.status,
          severity: error.severity,
          trend: error.trend,
          routes: Object.fromEntries(routes),
          occurrences,
        })
      );
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Failed to get error details',
          code: 'GET_ERROR_DETAILS_FAILED',
        })
      );
    }
  }

  /**
   * Handle GET_ERROR_STATS message
   */
  private async handleGetErrorStats(client: any): Promise<void> {
    const errorAggregator = this.devMode.getErrorAggregator();

    if (!errorAggregator) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Error aggregator is not available',
          code: 'ERROR_AGGREGATOR_UNAVAILABLE',
        })
      );
      return;
    }

    try {
      const allErrors = errorAggregator.listErrors();

      // Calculate statistics
      const totalErrors = allErrors.reduce((sum, err) => sum + err.count, 0);
      const uniqueErrors = allErrors.length;
      const criticalErrors = allErrors.filter((err) => err.severity === 'critical').length;

      // Calculate error rate (errors per minute in last 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const recentErrors = allErrors.filter((err) => err.lastSeen >= fiveMinutesAgo);
      const recentCount = recentErrors.reduce((sum, err) => sum + err.count, 0);
      const errorRate = recentCount / 5; // per minute

      // Top errors by count
      const topErrors = [...allErrors]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((err) => ({
          hash: err.hash,
          message: err.message,
          count: err.count,
          severity: err.severity,
        }));

      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR_STATS, {
          totalErrors,
          uniqueErrors,
          errorRate,
          criticalErrors,
          topErrors,
        })
      );
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Failed to get error stats',
          code: 'GET_ERROR_STATS_FAILED',
        })
      );
    }
  }

  /**
   * Handle MARK_ERROR_RESOLVED message
   */
  private async handleMarkErrorResolved(client: any, data: any): Promise<void> {
    const errorAggregator = this.devMode.getErrorAggregator();

    if (!errorAggregator) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Error aggregator is not available',
          code: 'ERROR_AGGREGATOR_UNAVAILABLE',
        })
      );
      return;
    }

    try {
      const { hash } = data;
      if (!hash) {
        throw new Error('Error hash is required');
      }

      const error = errorAggregator.getError(hash);
      if (!error) {
        throw new Error(`Error not found: ${hash}`);
      }

      // Update error status
      error.status = 'resolved';

      // Send updated error list
      await this.handleGetErrors(client, {});
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Failed to mark error as resolved',
          code: 'MARK_ERROR_RESOLVED_FAILED',
        })
      );
    }
  }

  /**
   * Handle MARK_ERROR_IGNORED message
   */
  private async handleMarkErrorIgnored(client: any, data: any): Promise<void> {
    const errorAggregator = this.devMode.getErrorAggregator();

    if (!errorAggregator) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Error aggregator is not available',
          code: 'ERROR_AGGREGATOR_UNAVAILABLE',
        })
      );
      return;
    }

    try {
      const { hash } = data;
      if (!hash) {
        throw new Error('Error hash is required');
      }

      const error = errorAggregator.getError(hash);
      if (!error) {
        throw new Error(`Error not found: ${hash}`);
      }

      // Update error status
      error.status = 'ignored';

      // Send updated error list
      await this.handleGetErrors(client, {});
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Failed to mark error as ignored',
          code: 'MARK_ERROR_IGNORED_FAILED',
        })
      );
    }
  }

  /**
   * Handle CLEAR_ERRORS message
   */
  private async handleClearErrors(client: any): Promise<void> {
    const errorAggregator = this.devMode.getErrorAggregator();

    if (!errorAggregator) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Error aggregator is not available',
          code: 'ERROR_AGGREGATOR_UNAVAILABLE',
        })
      );
      return;
    }

    try {
      // Clear all errors
      await errorAggregator.clearAll();

      // Send empty error list
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR_LIST, {
          errors: [],
          total: 0,
        })
      );
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Failed to clear errors',
          code: 'CLEAR_ERRORS_FAILED',
        })
      );
    }
  }

  /**
   * Handle EXPORT_ERRORS message
   */
  private async handleExportErrors(client: any, data: any): Promise<void> {
    const errorAggregator = this.devMode.getErrorAggregator();

    if (!errorAggregator) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: 'Error aggregator is not available',
          code: 'ERROR_AGGREGATOR_UNAVAILABLE',
        })
      );
      return;
    }

    try {
      const format = data?.format || 'json';
      const allErrors = errorAggregator.listErrors();

      let exportData: string;
      if (format === 'csv') {
        // Export as CSV
        const headers = [
          'Hash',
          'Type',
          'Message',
          'Count',
          'First Seen',
          'Last Seen',
          'Status',
          'Severity',
          'Trend',
        ];
        const rows = allErrors.map((err) => [
          err.hash,
          err.type,
          `"${err.message.replace(/"/g, '""')}"`,
          err.count.toString(),
          new Date(err.firstSeen).toISOString(),
          new Date(err.lastSeen).toISOString(),
          err.status,
          err.severity,
          err.trend,
        ]);
        exportData = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      } else {
        // Export as JSON (default)
        exportData = JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            totalErrors: allErrors.length,
            errors: allErrors,
          },
          null,
          2
        );
      }

      // For now, send the data as a string wrapped in an error list format
      // In the future, we could create a dedicated EXPORT_DATA message type
      this.server.send(client, {
        type: ServerMessageType.ERROR_LIST,
        data: {
          errors: [],
          total: 0,
          exportData: {
            format,
            content: exportData,
            filename: `errors-${Date.now()}.${format}`,
          },
        },
      } as any);
    } catch (error) {
      this.server.send(
        client,
        createServerMessage(ServerMessageType.ERROR, {
          message: error instanceof Error ? error.message : 'Failed to export errors',
          code: 'EXPORT_ERRORS_FAILED',
        })
      );
    }
  }
}
