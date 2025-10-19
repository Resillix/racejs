/**
 * DevTools WebSocket Server
 *
 * Real-time communication server for the DevTools UI.
 * Handles WebSocket connections, broadcasts updates, and processes client requests.
 */
import { EventEmitter } from 'node:events';
import type { Server as HttpServer } from 'node:http';
import type { ServerMessage, ClientMessage } from './devtools-protocol.js';
interface WebSocket {
    readyState: number;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    terminate(): void;
    ping(): void;
    on(event: string, listener: (...args: any[]) => void): void;
}
interface ExtendedWebSocket extends WebSocket {
    isAlive?: boolean;
    clientId?: string;
    messageQueue?: ServerMessage[];
    lastActivity?: number;
    messageCount?: number;
    connectedAt?: number;
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
export declare class DevToolsServer extends EventEmitter {
    private wss;
    private clients;
    private running;
    private options;
    private WebSocketServer;
    private httpServer?;
    private heartbeatInterval;
    private readonly HEARTBEAT_INTERVAL;
    private readonly MESSAGE_RATE_LIMIT;
    private readonly MAX_QUEUE_SIZE;
    constructor(options?: DevToolsServerOptions);
    /**
     * Attach WebSocket server to an existing HTTP server
     * Call this before start() to share the same port
     */
    attachToHttpServer(httpServer: HttpServer): void;
    /**
     * Start the WebSocket server
     */
    start(httpServer?: HttpServer): Promise<void>;
    /**
     * Stop the WebSocket server
     */
    stop(): Promise<void>;
    /**
     * Check if server is running
     */
    isRunning(): boolean;
    /**
     * Get connected client count
     */
    getClientCount(): number;
    /**
     * Broadcast message to all connected clients
     */
    broadcast(message: ServerMessage): void;
    /**
     * Broadcast with filtering capability
     */
    broadcastFiltered(message: ServerMessage, filter?: (client: ExtendedWebSocket) => boolean): void;
    /**
     * Send message to specific client with queue fallback and rate limiting
     */
    send(client: ExtendedWebSocket, message: ServerMessage): void;
    /**
     * Queue message for later delivery
     */
    private queueMessage;
    /**
     * Flush queued messages to client respecting rate limit
     */
    private flushMessageQueue;
    /**
     * Setup WebSocket server event handlers
     */
    private setupWebSocketServer;
    /**
     * Handle new WebSocket connection
     */
    private handleConnection;
    /**
     * Handle client disconnection
     */
    private handleDisconnection;
    /**
     * Handle incoming message from client
     */
    private handleMessage;
    /**
     * Start heartbeat to detect dead connections
     */
    private startHeartbeat;
    /**
     * Generate unique client ID
     */
    private generateClientId;
    /**
     * Get server URL
     */
    getUrl(): string;
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
    };
}
export {};
//# sourceMappingURL=devtools-server.d.ts.map