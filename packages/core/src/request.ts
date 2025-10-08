/**
 * High-performance Request wrapper
 *
 * Key optimizations:
 * - Lazy parsing (compute only when accessed)
 * - Property caching to avoid repeated parsing
 * - Minimal object shape changes
 * - Direct property access over getters when possible
 */

import type { IncomingMessage } from 'node:http';
import { parse as parseQuerystring } from 'node:querystring';
import type { RouteParams } from './router.js';

/**
 * Extended request interface with Express-compatible properties
 */
export class Request {
  // Core Node.js request
  readonly raw: IncomingMessage;

  // Route params (set by router)
  params: RouteParams = {};

  // Cached parsed data (lazy initialization)
  private _query?: Record<string, string | string[]>;
  private _path?: string;
  private _hostname?: string;

  // Body (set by body parser middleware)
  body?: any;

  constructor(req: IncomingMessage) {
    this.raw = req;

    // Freeze shape early to enable V8 optimization
    // Properties added after construction prevent inline caching
  }

  /**
   * Get request URL
   */
  get url(): string | undefined {
    return this.raw.url;
  }

  /**
   * Get request method
   */
  get method(): string | undefined {
    return this.raw.method;
  }

  /**
   * Get request headers
   */
  get headers(): IncomingMessage['headers'] {
    return this.raw.headers;
  }

  /**
   * Parse and cache query parameters
   * Lazy evaluation - only parse when accessed
   */
  get query(): Record<string, string | string[]> {
    if (this._query) return this._query;

    const url = this.raw.url;
    if (!url) {
      this._query = {};
      return this._query;
    }

    const queryStart = url.indexOf('?');
    if (queryStart === -1) {
      this._query = {};
      return this._query;
    }

    const queryString = url.slice(queryStart + 1);
    const parsed = parseQuerystring(queryString);
    // Filter out undefined values to match expected type
    const filtered: Record<string, string | string[]> = {};
    for (const key in parsed) {
      const val = parsed[key];
      if (val !== undefined) {
        filtered[key] = val;
      }
    }
    this._query = filtered;
    return this._query;
  }

  /**
   * Get parsed pathname (without query)
   * Lazy evaluation with caching
   */
  get path(): string {
    if (this._path) return this._path;

    const url = this.raw.url;
    if (!url) {
      this._path = '/';
      return this._path;
    }

    const queryStart = url.indexOf('?');
    this._path = queryStart === -1 ? url : url.slice(0, queryStart);
    return this._path;
  }

  /**
   * Get request hostname
   * Checks X-Forwarded-Host, then Host header
   */
  get hostname(): string {
    if (this._hostname) return this._hostname;

    // Check X-Forwarded-Host first (proxy support)
    let host = this.get('X-Forwarded-Host');

    if (!host) {
      host = this.get('Host');
    }

    if (!host) {
      this._hostname = '';
      return this._hostname;
    }

    // Remove port if present
    const colonIndex = host.indexOf(':');
    this._hostname = colonIndex !== -1 ? host.slice(0, colonIndex) : host;
    return this._hostname;
  }

  /**
   * Get header value (case-insensitive)
   * Express-compatible helper
   */
  get(name: string): string | undefined {
    const lowerName = name.toLowerCase();
    const value = this.raw.headers[lowerName];
    return Array.isArray(value) ? value[0] : value;
  }

  /**
   * Check if request is XHR (XMLHttpRequest)
   */
  get xhr(): boolean {
    const requestedWith = this.get('X-Requested-With');
    return requestedWith === 'XMLHttpRequest';
  }

  /**
   * Get request protocol
   */
  get protocol(): string {
    // Check X-Forwarded-Proto for proxy support
    const proto = this.get('X-Forwarded-Proto');
    if (proto) return proto;

    // @ts-ignore - encrypted exists on TLS sockets
    return this.raw.socket?.encrypted ? 'https' : 'http';
  }

  /**
   * Check if request is secure (HTTPS)
   */
  get secure(): boolean {
    return this.protocol === 'https';
  }

  /**
   * Get client IP address
   * Checks X-Forwarded-For, X-Real-IP, then socket
   */
  get ip(): string {
    // Check X-Forwarded-For (comma-separated list, first is client)
    const forwarded = this.get('X-Forwarded-For');
    if (forwarded) {
      const ips = forwarded.split(',');
      return ips[0]!.trim();
    }

    // Check X-Real-IP
    const realIp = this.get('X-Real-IP');
    if (realIp) return realIp;

    // Fall back to socket remote address
    return this.raw.socket.remoteAddress || '';
  }

  /**
   * Get all IPs from X-Forwarded-For chain
   */
  get ips(): string[] {
    const forwarded = this.get('X-Forwarded-For');
    if (!forwarded) return [];

    return forwarded.split(',').map((ip) => ip.trim());
  }

  /**
   * Get content type
   */
  get type(): string {
    const contentType = this.get('Content-Type');
    if (!contentType) return '';

    // Remove charset and other parameters
    const semiIndex = contentType.indexOf(';');
    return semiIndex !== -1 ? contentType.slice(0, semiIndex).trim() : contentType;
  }
}

/**
 * Factory function to create request wrapper
 * Preallocates shape for V8 optimization
 */
export function createRequest(raw: IncomingMessage): Request {
  return new Request(raw);
}

/**
 * Micro-optimizations explained:
 *
 * 1. Lazy parsing: Query and path parsing only happens on first access
 *    - Most requests don't use all properties
 *    - Avoids upfront cost for unused features
 *
 * 2. Caching: Parsed values stored in private properties
 *    - Subsequent accesses are instant (just property lookup)
 *    - No repeated regex or string operations
 *
 * 3. Direct string operations: Use indexOf/slice instead of regex
 *    - Significantly faster for simple parsing
 *    - Regex compilation and backtracking has overhead
 *
 * 4. Stable object shape: All properties defined in constructor
 *    - V8 can create stable hidden class
 *    - Enables inline caching and optimization
 *
 * 5. Case-sensitive headers: Node stores headers lowercase
 *    - Convert once in get() rather than multiple lookups
 *
 * 6. Array.isArray check: Headers can be string or string[]
 *    - Fast check prevents type errors
 *
 * 7. Early returns: Avoid unnecessary computation
 *    - If _query exists, return immediately
 *    - Reduces branching in common path
 */
