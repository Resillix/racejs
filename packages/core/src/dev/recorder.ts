/**
 * Request Recorder - Time-travel debugging for HTTP requests
 *
 * Records all incoming requests with full details for replay and analysis
 */

import { IncomingMessage } from 'node:http';

export interface RecordedRequest {
  /** Unique ID for this request */
  id: string;

  /** Timestamp when request was received */
  timestamp: number;

  /** HTTP method */
  method: string;

  /** Request URL */
  url: string;

  /** Request headers */
  headers: Record<string, string | string[] | undefined>;

  /** Query parameters */
  query: Record<string, any>;

  /** Route parameters */
  params: Record<string, string>;

  /** Request body (if recorded) */
  body?: any;

  /** Response details */
  response?: RecordedResponse;

  /** Request duration in milliseconds */
  duration?: number;

  /** Request metadata */
  meta: {
    /** IP address */
    ip?: string;
    /** User agent */
    userAgent?: string;
    /** Content type */
    contentType?: string;
  };
}

export interface RecordedResponse {
  /** HTTP status code */
  statusCode: number;

  /** Response headers */
  headers: Record<string, string | string[] | number | undefined>;

  /** Response body (if recorded) */
  body?: any;

  /** Response timestamp */
  timestamp: number;
}

export interface RecorderStorage {
  /** Store a recorded request */
  store(request: RecordedRequest): Promise<void> | void;

  /** Get a recorded request by ID */
  get(id: string): Promise<RecordedRequest | null> | RecordedRequest | null;

  /** Get all recorded requests */
  getAll(): Promise<RecordedRequest[]> | RecordedRequest[];

  /** Get recent requests (limit) */
  getRecent(limit: number): Promise<RecordedRequest[]> | RecordedRequest[];

  /** Clear all recorded requests */
  clear(): Promise<void> | void;

  /** Get total count */
  count(): Promise<number> | number;

  /** Delete a specific request */
  delete(id: string): Promise<boolean> | boolean;
}

/**
 * In-memory storage implementation
 * Includes automatic cleanup of old requests
 */
export class MemoryStorage implements RecorderStorage {
  private requests = new Map<string, RecordedRequest>();
  private maxRequests: number;
  private maxAge: number; // Maximum age in milliseconds
  private cleanupInterval?: NodeJS.Timeout;

  constructor(maxRequests: number = 1000, maxAge: number = 60 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.maxAge = maxAge; // Default 1 hour

    // Start automatic cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupOldRequests();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Clean up requests older than maxAge
   */
  private cleanupOldRequests(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [id, request] of this.requests.entries()) {
      if (now - request.timestamp > this.maxAge) {
        this.requests.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`[MemoryStorage] Cleaned up ${removedCount} old requests`);
    }
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  store(request: RecordedRequest): void {
    // Enforce max limit (FIFO)
    if (this.requests.size >= this.maxRequests) {
      const firstKey = this.requests.keys().next().value;
      if (firstKey) {
        this.requests.delete(firstKey);
      }
    }

    this.requests.set(request.id, request);
  }

  get(id: string): RecordedRequest | null {
    return this.requests.get(id) || null;
  }

  getAll(): RecordedRequest[] {
    return Array.from(this.requests.values());
  }

  getRecent(limit: number): RecordedRequest[] {
    const all = this.getAll();
    return all.slice(-limit).reverse(); // Most recent first
  }

  clear(): void {
    this.requests.clear();
  }

  count(): number {
    return this.requests.size;
  }

  delete(id: string): boolean {
    return this.requests.delete(id);
  }
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract request body from IncomingMessage
 */
export async function extractBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }

      const buffer = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';

      // Parse JSON
      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(buffer.toString()));
        } catch {
          resolve(buffer.toString());
        }
        return;
      }

      // Parse form data
      if (contentType.includes('application/x-www-form-urlencoded')) {
        try {
          const parsed = new URLSearchParams(buffer.toString());
          const obj: Record<string, any> = {};
          parsed.forEach((value, key) => {
            obj[key] = value;
          });
          resolve(obj);
        } catch {
          resolve(buffer.toString());
        }
        return;
      }

      // Default to string
      resolve(buffer.toString());
    });

    req.on('error', () => {
      resolve(undefined);
    });
  });
}

/**
 * Sanitize headers (remove sensitive data)
 */
export function sanitizeHeaders(
  headers: Record<string, string | string[] | undefined>,
  sensitiveKeys: string[] = ['authorization', 'cookie', 'x-api-key']
): Record<string, string | string[] | undefined> {
  const sanitized: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.includes(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
