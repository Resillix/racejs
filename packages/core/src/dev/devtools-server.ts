/**
 * DevTools WebSocket Server
 *
 * Real-time communication server for the DevTools UI.
 * Handles WebSocket connections, broadcasts updates, and processes client requests.
 */

import { EventEmitter } from 'node:events';
import type { Server as HttpServer } from 'node:http';
import type { ServerMessage, ClientMessage } from './devtools-protocol.js';
import { createServerMessage, ClientMessageType, ServerMessageType } from './devtools-protocol.js';

// Type definitions for WebSocket (ws package)
interface WebSocket {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  terminate(): void;
  ping(): void;
  on(event: string, listener: (...args: any[]) => void): void;
}

// Extended WebSocket with additional properties for connection management
interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  clientId?: string;
  messageQueue?: ServerMessage[];
  lastActivity?: number;
  messageCount?: number;
  connectedAt?: number;
  // Rate limiting state
  rateWindowStart?: number;
  rateCount?: number;
}

export interface DevToolsServerOptions {
  port?: number;
  host?: string;
  path?: string;
}

export interface DevToolsServerEvents {
  started: () => void;
  stopped: () => void;
  connection: (client: WebSocket) => void;
  disconnection: (client: WebSocket) => void;
  message: (message: ClientMessage, client: WebSocket) => void;
  error: (error: Error) => void;
}

/**
 * DevTools WebSocket Server
 *
 * Manages WebSocket connections with DevTools clients and handles
 * real-time bidirectional communication.
 *
 * Features:
 * - Automatic heartbeat/ping-pong for connection health
 * - Graceful reconnection handling
 * - Message queuing during disconnection
 * - Compression support (per-message deflate)
 * - Per-client rate limiting
 * - Connection state tracking
 */
export class DevToolsServer extends EventEmitter {
  private wss: any = null;
  private clients: Set<ExtendedWebSocket> = new Set();
  private running: boolean = false;
  private options: Required<DevToolsServerOptions>;
  private WebSocketServer: any = null;
  private httpServer?: HttpServer;
  private heartbeatInterval: NodeJS.Timeout | undefined;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly MESSAGE_RATE_LIMIT = 100; // messages per second per client
  private readonly MAX_QUEUE_SIZE = 100;

  constructor(options: DevToolsServerOptions = {}) {
    super();

    this.options = {
      port: options.port ?? 9229,
      host: options.host ?? 'localhost',
      path: options.path ?? '/devtools',
    };
  }

  /**
   * Attach WebSocket server to an existing HTTP server
   * Call this before start() to share the same port
   */
  attachToHttpServer(httpServer: HttpServer): void {
    this.httpServer = httpServer;
  }

  /**
   * Start the WebSocket server
   */
  async start(httpServer?: HttpServer): Promise<void> {
    if (this.running) {
      return;
    }

    try {
      // Dynamically import ws package
      const ws = await import('ws');
      this.WebSocketServer = ws.WebSocketServer;

      // Use attached HTTP server if available, otherwise use parameter
      const serverToAttach = this.httpServer || httpServer;

      if (serverToAttach) {
        // Attach to existing HTTP server with compression
        this.wss = new this.WebSocketServer({
          server: serverToAttach,
          path: this.options.path,
          // Enable per-message deflate compression
          perMessageDeflate: {
            zlibDeflateOptions: {
              chunkSize: 1024,
              memLevel: 7,
              level: 3,
            },
            zlibInflateOptions: {
              chunkSize: 10 * 1024,
            },
            clientNoContextTakeover: true,
            serverNoContextTakeover: true,
            serverMaxWindowBits: 10,
            concurrencyLimit: 10,
            threshold: 1024,
          },
        });
      } else {
        // Create standalone WebSocket server with compression
        this.wss = new this.WebSocketServer({
          port: this.options.port,
          host: this.options.host,
          perMessageDeflate: true,
        });
      }

      this.setupWebSocketServer();
      this.startHeartbeat();
      this.running = true;
      this.emit('started');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    // Gracefully close all client connections
    for (const client of this.clients) {
      try {
        // Send shutdown notification
        client.send(
          JSON.stringify(
            createServerMessage('shutdown' as any, {
              reason: 'Server shutting down',
              timestamp: Date.now(),
            })
          )
        );
        client.close(1000, 'Server shutdown');
      } catch (error) {
        // Ignore errors during shutdown, just terminate
        client.terminate();
      }
    }
    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve());
      });
      this.wss = null;
    }

    this.running = false;
    this.emit('stopped');
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: ServerMessage): void {
    // ...existing code removed: direct JSON.stringify and client.send...
    for (const client of this.clients) {
      if (client.readyState === 1) {
        this.send(client, message);
      }
    }
  }

  /**
   * Broadcast with filtering capability
   */
  broadcastFiltered(message: ServerMessage, filter?: (client: ExtendedWebSocket) => boolean): void {
    // ...existing code removed: direct JSON.stringify and client.send...
    for (const client of this.clients) {
      if (client.readyState === 1 && (!filter || filter(client))) {
        this.send(client, message);
      }
    }
  }

  /**
   * Send message to specific client with queue fallback and rate limiting
   */
  send(client: ExtendedWebSocket, message: ServerMessage): void {
    const now = Date.now();

    // Initialize rate window
    if (!client.rateWindowStart || now - client.rateWindowStart >= 1000) {
      client.rateWindowStart = now;
      client.rateCount = 0;
    }

    // Check rate limit
    if ((client.rateCount ?? 0) >= this.MESSAGE_RATE_LIMIT) {
      this.queueMessage(client, message);
      // Schedule a flush when the window resets
      const delay = client.rateWindowStart + 1000 - now;
      setTimeout(() => this.flushMessageQueue(client), Math.max(1, delay));
      return;
    }

    if (client.readyState === 1) {
      try {
        client.send(JSON.stringify(message));
        client.lastActivity = now;
        client.rateCount = (client.rateCount ?? 0) + 1;

        // Try to flush any queued messages within remaining allowance
        if (client.messageQueue && client.messageQueue.length > 0) {
          this.flushMessageQueue(client);
        }
      } catch (error) {
        // Queue message for retry
        this.queueMessage(client, message);
        this.emit('error', error as Error);
      }
    } else {
      // Queue for when connection reopens
      this.queueMessage(client, message);
    }
  }

  /**
   * Queue message for later delivery
   */
  private queueMessage(client: ExtendedWebSocket, message: ServerMessage): void {
    if (!client.messageQueue) {
      client.messageQueue = [];
    }

    if (client.messageQueue.length < this.MAX_QUEUE_SIZE) {
      client.messageQueue.push(message);
    } else {
      // Queue is full, drop oldest message
      client.messageQueue.shift();
      client.messageQueue.push(message);
    }
  }

  /**
   * Flush queued messages to client respecting rate limit
   */
  private flushMessageQueue(client: ExtendedWebSocket): void {
    if (!client.messageQueue || client.messageQueue.length === 0) {
      return;
    }

    // Ensure rate window
    const now = Date.now();
    if (!client.rateWindowStart || now - client.rateWindowStart >= 1000) {
      client.rateWindowStart = now;
      client.rateCount = 0;
    }

    let available = this.MESSAGE_RATE_LIMIT - (client.rateCount ?? 0);
    if (available <= 0) {
      const delay = client.rateWindowStart + 1000 - now;
      setTimeout(() => this.flushMessageQueue(client), Math.max(1, delay));
      return;
    }

    // Copy current queue and attempt to send up to 'available'
    const queue = client.messageQueue;
    const remaining: ServerMessage[] = [];
    client.messageQueue = [];

    for (const msg of queue) {
      if (available <= 0) {
        remaining.push(msg);
        continue;
      }

      try {
        if (client.readyState === 1) {
          client.send(JSON.stringify(msg));
          client.rateCount = (client.rateCount ?? 0) + 1;
          available--;
        } else {
          // Connection closed, keep message for later
          remaining.push(msg);
        }
      } catch {
        // On error, keep message for later
        remaining.push(msg);
      }
    }

    // Put back any remaining messages
    if (remaining.length > 0) {
      client.messageQueue.push(...remaining);

      // Schedule next flush when the window resets or when connection might reopen
      const nextNow = Date.now();
      const delay =
        client.rateWindowStart && nextNow - client.rateWindowStart < 1000
          ? client.rateWindowStart + 1000 - nextNow
          : 50;
      setTimeout(() => this.flushMessageQueue(client), Math.max(1, delay));
    }
  }

  /**
   * Setup WebSocket server event handlers
   */
  private setupWebSocketServer(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    this.wss.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: ExtendedWebSocket): void {
    // Initialize extended properties
    ws.isAlive = true;
    ws.clientId = this.generateClientId();
    ws.messageQueue = [];
    ws.lastActivity = Date.now();
    ws.messageCount = 0;
    ws.connectedAt = Date.now();
    // Initialize rate-limiter counters
    ws.rateWindowStart = Date.now();
    ws.rateCount = 0;

    this.clients.add(ws);
    this.emit('connection', ws);

    // Handle pong responses (heartbeat)
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastActivity = Date.now();
    });

    // Send welcome message
    this.send(
      ws,
      createServerMessage('connected' as any, {
        clientId: ws.clientId,
        version: '1.0.0',
        features: {
          logger: true,
          recorder: true,
          profiler: false,
          devtools: true,
        },
        serverTime: Date.now(),
      })
    );

    // Handle messages from client
    ws.on('message', (data: Buffer) => {
      this.handleMessage(data, ws);
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(ws: ExtendedWebSocket): void {
    this.clients.delete(ws);
    this.emit('disconnection', ws);
  }

  /**
   * Handle incoming message from client
   */
  private handleMessage(data: Buffer, client: ExtendedWebSocket): void {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      // Update activity tracking
      client.lastActivity = Date.now();
      client.messageCount = (client.messageCount || 0) + 1;

      // Handle ping messages
      if (message.type === ClientMessageType.PING) {
        this.send(
          client,
          createServerMessage(ServerMessageType.PONG, {
            timestamp: Date.now(),
            clientTime: (message as any).data?.timestamp,
          })
        );
        return;
      }

      this.emit('message', message, client);
    } catch (error) {
      this.emit('error', error as Error);

      // Send error response to client
      this.send(
        client,
        createServerMessage('error' as any, {
          message: 'Invalid message format',
          code: 'INVALID_MESSAGE',
        })
      );
    }
  }

  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws: ExtendedWebSocket) => {
        if (ws.isAlive === false) {
          this.clients.delete(ws);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get server URL
   */
  getUrl(): string {
    if (this.options.path) {
      return `ws://${this.options.host}:${this.options.port}${this.options.path}`;
    }
    return `ws://${this.options.host}:${this.options.port}`;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    clientCount: number;
    totalMessages: number;
    avgMessagesPerClient: number;
    clients: Array<{
      id: string;
      connectedAt: number;
      messageCount: number;
      lastActivity: number;
      queueSize: number;
    }>;
  } {
    const clients = Array.from(this.clients).map((client) => ({
      id: client.clientId || 'unknown',
      connectedAt: client.connectedAt || 0,
      messageCount: client.messageCount || 0,
      lastActivity: client.lastActivity || 0,
      queueSize: client.messageQueue?.length || 0,
    }));

    const totalMessages = clients.reduce((sum, c) => sum + c.messageCount, 0);

    return {
      clientCount: this.clients.size,
      totalMessages,
      avgMessagesPerClient: this.clients.size > 0 ? totalMessages / this.clients.size : 0,
      clients,
    };
  }
}
