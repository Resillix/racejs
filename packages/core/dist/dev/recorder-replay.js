/**
 * Request Replay Engine
 *
 * Time-travel debugging: Replay any recorded request with exact conditions
 * Edit requests before replay, compare responses, generate tests
 */
import { EventEmitter } from 'node:events';
/**
 * Request Replay Engine
 *
 * Single Responsibility: Handles ONLY replay logic
 * - Replay recorded requests with exact conditions
 * - Edit requests before replay
 * - Compare responses before/after
 * - Generate cURL commands for external testing
 */
export class RequestReplayEngine extends EventEmitter {
    logger;
    requestStore = new Map();
    recorder;
    serverPort;
    serverHost = 'localhost';
    constructor(logger, recorder) {
        super();
        this.logger = logger.child({ component: 'RequestReplayEngine' });
        if (recorder) {
            this.recorder = recorder;
        }
    }
    /**
     * Set the server port for replay requests
     * This should be called when the server starts listening
     */
    setServerPort(port, host = 'localhost') {
        this.serverPort = port;
        this.serverHost = host;
        this.logger.info('Server port configured for replay', { port, host });
    }
    /**
     * Get the current server port
     */
    getServerPort() {
        return this.serverPort;
    }
    /**
     * Add a recorded request to the replay store
     */
    addRequest(request) {
        this.requestStore.set(request.id, request);
        this.logger.debug('Added request to replay store', {
            requestId: request.id,
            method: request.method,
            url: request.url,
        });
    }
    /**
     * Remove a request from the replay store
     */
    removeRequest(requestId) {
        const removed = this.requestStore.delete(requestId);
        if (removed) {
            this.logger.debug('Removed request from replay store', { requestId });
        }
        return removed;
    }
    /**
     * Get a recorded request by ID from either the recorder or internal store
     */
    async getRequest(requestId) {
        if (this.recorder) {
            const request = await this.recorder.getRequest(requestId);
            return request || undefined;
        }
        return this.requestStore.get(requestId);
    }
    /**
     * Replay a recorded request (simple API)
     */
    async replay(requestId, options) {
        return this.replayRequest({
            requestId,
            ...options,
        });
    }
    /**
     * Replay a recorded request
     */
    async replayRequest(options) {
        const startTime = performance.now();
        this.emit('replay-started', options.requestId, options);
        this.logger.info('Replaying request', {
            requestId: options.requestId,
            mockMode: options.mockMode,
        });
        try {
            // Get original request
            const originalRequest = await this.getRequest(options.requestId);
            if (!originalRequest) {
                throw new Error(`Request ${options.requestId} not found in replay store`);
            }
            // Build replay request
            const replayRequest = this.buildReplayRequest(originalRequest, options);
            let replayResponse;
            if (options.mockMode) {
                // Mock mode - return original response
                replayResponse = this.createMockResponse(originalRequest);
            }
            else {
                // Real replay - make actual HTTP request
                replayResponse = await this.executeReplay(replayRequest, options);
            }
            const endTime = performance.now();
            const result = {
                originalRequest,
                replayResponse,
                timing: {
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                },
                mocked: options.mockMode || false,
            };
            this.emit('replay-completed', result);
            this.logger.info('Request replay completed', {
                requestId: options.requestId,
                duration: result.timing.duration,
                statusCode: replayResponse.statusCode,
            });
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emit('replay-failed', options.requestId, err);
            this.logger.error('Request replay failed', {
                requestId: options.requestId,
                error: err.message,
            });
            const endTime = performance.now();
            return {
                originalRequest: this.requestStore.get(options.requestId),
                replayResponse: this.createErrorResponse(err),
                timing: {
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                },
                mocked: false,
                error: err.message,
            };
        }
    }
    /**
     * Compare two responses (original vs replayed)
     */
    compareResponses(original, replayed) {
        this.logger.debug('Comparing responses', {
            originalStatus: original.statusCode,
            replayedStatus: replayed.statusCode,
        });
        const comparison = {
            identical: true,
            differences: {},
            summary: '',
        };
        // Compare status codes
        if (original.statusCode !== replayed.statusCode) {
            comparison.identical = false;
            comparison.differences.statusCode = {
                original: original.statusCode,
                replayed: replayed.statusCode,
            };
        }
        // Compare headers
        const headerDiff = this.compareHeaders(original.headers, replayed.headers);
        if (headerDiff) {
            comparison.identical = false;
            comparison.differences.headers = headerDiff;
        }
        // Compare bodies
        const bodyDiff = this.compareBodies(original.body, replayed.body);
        if (bodyDiff.type !== 'identical') {
            comparison.identical = false;
            comparison.differences.body = bodyDiff;
        }
        // Generate summary
        comparison.summary = this.generateComparisonSummary(comparison);
        this.emit('comparison-completed', comparison);
        return comparison;
    }
    /**
     * Generate cURL command for a request
     */
    generateCurl(request, options) {
        this.logger.debug('Generating cURL command', {
            requestId: request.id,
            method: request.method,
        });
        let curl = `curl -X ${request.method}`;
        // Add headers
        const headers = { ...request.headers, ...options?.headers };
        for (const [key, value] of Object.entries(headers)) {
            // Skip pseudo-headers and sensitive headers
            if (!key.startsWith(':') && !this.isSensitiveHeader(key)) {
                curl += ` -H "${key}: ${value}"`;
            }
        }
        // Add body for POST/PUT/PATCH requests
        if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
            const body = options?.body || request.body;
            const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
            curl += ` -d '${bodyStr.replace(/'/g, "\\'")}'`;
        }
        // Build URL with query parameters
        let url = options?.baseUrl ? options.baseUrl + request.url : `http://localhost${request.url}`;
        if (request.query || options?.query) {
            const query = { ...request.query, ...options?.query };
            const queryString = new URLSearchParams(query).toString();
            if (queryString) {
                url += (url.includes('?') ? '&' : '?') + queryString;
            }
        }
        curl += ` "${url}"`;
        return curl;
    }
    /**
     * Generate automated test from a request
     */
    generateTest(request, framework = 'vitest') {
        this.logger.debug('Generating test', {
            requestId: request.id,
            framework,
        });
        const testName = `${request.method} ${request.url}`;
        const expectedStatus = request.response?.statusCode || 200;
        if (framework === 'vitest') {
            return this.generateVitestTest(request, testName, expectedStatus);
        }
        else {
            return this.generateJestTest(request, testName, expectedStatus);
        }
    }
    /**
     * Build replay request with overrides
     */
    buildReplayRequest(original, options) {
        return {
            ...original,
            id: `replay-${original.id}-${Date.now()}`,
            timestamp: Date.now(),
            headers: { ...original.headers, ...options.headers },
            body: options.body !== undefined ? options.body : original.body,
            query: { ...original.query, ...options.query },
        };
    }
    /**
     * Execute actual HTTP request replay
     */
    async executeReplay(request, options) {
        // Dynamic import to avoid bundling issues
        const http = await import('node:http');
        const https = await import('node:https');
        const { URL } = await import('node:url');
        return new Promise((resolve, reject) => {
            const timeout = options.timeout || 30000;
            // Determine base URL with proper port handling
            let baseUrl = options.baseUrl;
            if (!baseUrl) {
                // Use configured server port or default
                const port = this.serverPort || 3000;
                const host = this.serverHost || 'localhost';
                baseUrl = `http://${host}:${port}`;
                this.logger.debug('Using default base URL for replay', {
                    baseUrl,
                    configuredPort: this.serverPort,
                });
            }
            // Parse URL and handle port properly
            let fullUrl;
            try {
                fullUrl = new URL(request.url, baseUrl);
            }
            catch (error) {
                reject(new Error(`Invalid URL construction: ${request.url} with base ${baseUrl}`));
                return;
            }
            // Choose http or https based on protocol
            const client = fullUrl.protocol === 'https:' ? https : http;
            // Build query string
            if (request.query && Object.keys(request.query).length > 0) {
                for (const [key, value] of Object.entries(request.query)) {
                    fullUrl.searchParams.set(key, value);
                }
            }
            // Prepare headers with proper formatting
            const headers = this.sanitizeHeaders(request.headers);
            // Add Content-Type and Content-Length for requests with body
            if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
                const bodyStr = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
                if (!headers['content-type'] && !headers['Content-Type']) {
                    headers['content-type'] = 'application/json';
                }
                if (!headers['content-length'] && !headers['Content-Length']) {
                    headers['content-length'] = Buffer.byteLength(bodyStr).toString();
                }
            }
            // Determine port (ensure it's a number or undefined, not empty string)
            let port;
            if (fullUrl.port) {
                port = parseInt(fullUrl.port, 10);
            }
            else {
                // Use default port based on protocol
                port = fullUrl.protocol === 'https:' ? 443 : 80;
            }
            // Prepare request options
            const reqOptions = {
                method: request.method,
                hostname: fullUrl.hostname,
                port: port,
                path: fullUrl.pathname + fullUrl.search,
                headers: headers,
                timeout,
            };
            this.logger.debug('Executing replay request', {
                method: reqOptions.method,
                hostname: reqOptions.hostname,
                port: reqOptions.port,
                path: reqOptions.path,
                protocol: fullUrl.protocol,
            });
            const req = client.request(reqOptions, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    const endTime = performance.now();
                    resolve({
                        statusCode: res.statusCode || 500,
                        headers: res.headers,
                        body: this.parseBody(body, res.headers['content-type']),
                        timestamp: endTime,
                    });
                });
                res.on('error', (error) => {
                    this.logger.error('Response stream error', { error: error.message });
                    reject(error);
                });
            });
            req.on('error', (error) => {
                this.logger.error('Request error', {
                    error: error.message,
                    hostname: reqOptions.hostname,
                    port: reqOptions.port,
                    path: reqOptions.path,
                });
                reject(error);
            });
            req.on('timeout', () => {
                req.destroy();
                const timeoutError = new Error(`Request timeout after ${timeout}ms`);
                this.logger.error('Request timeout', {
                    timeout,
                    url: `${reqOptions.hostname}:${reqOptions.port}${reqOptions.path}`,
                });
                reject(timeoutError);
            });
            // Send body for POST/PUT/PATCH
            if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
                const bodyStr = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
                req.write(bodyStr);
            }
            req.end();
        });
    }
    /**
     * Create mock response (returns original)
     */
    createMockResponse(request) {
        return {
            statusCode: request.response?.statusCode || 200,
            headers: request.response?.headers || {},
            body: request.response?.body,
            timestamp: performance.now(),
        };
    }
    /**
     * Create error response
     */
    createErrorResponse(error) {
        return {
            statusCode: 500,
            headers: { 'content-type': 'application/json' },
            body: { error: error.message },
            timestamp: performance.now(),
        };
    }
    /**
     * Compare headers between responses
     */
    compareHeaders(original, replayed) {
        const added = {};
        const removed = [];
        const modified = {};
        // Find added and modified headers
        for (const [key, value] of Object.entries(replayed)) {
            const valueStr = Array.isArray(value) ? value.join(', ') : String(value || '');
            if (!(key in original)) {
                added[key] = valueStr;
            }
            else {
                const originalStr = Array.isArray(original[key])
                    ? original[key].join(', ')
                    : String(original[key] || '');
                if (originalStr !== valueStr) {
                    modified[key] = { original: originalStr, replayed: valueStr };
                }
            }
        }
        // Find removed headers
        for (const key of Object.keys(original)) {
            if (!(key in replayed)) {
                removed.push(key);
            }
        }
        // Return null if no differences
        if (Object.keys(added).length === 0 &&
            removed.length === 0 &&
            Object.keys(modified).length === 0) {
            return null;
        }
        return { added, removed, modified };
    }
    /**
     * Compare response bodies
     */
    compareBodies(original, replayed) {
        // Type check
        if (typeof original !== typeof replayed) {
            return {
                type: 'type-changed',
                original,
                replayed,
            };
        }
        // Deep comparison for objects/arrays
        if (typeof original === 'object' && original !== null) {
            const originalStr = JSON.stringify(original, null, 2);
            const replayedStr = JSON.stringify(replayed, null, 2);
            if (originalStr === replayedStr) {
                return { type: 'identical', original, replayed };
            }
            return {
                type: 'different',
                original,
                replayed,
                diff: this.generateJsonDiff(originalStr, replayedStr),
            };
        }
        // String comparison
        if (original === replayed) {
            return { type: 'identical', original, replayed };
        }
        return {
            type: 'different',
            original,
            replayed,
            diff: this.generateTextDiff(String(original), String(replayed)),
        };
    }
    /**
     * Generate comparison summary
     */
    generateComparisonSummary(comparison) {
        if (comparison.identical) {
            return 'Responses are identical';
        }
        const changes = [];
        if (comparison.differences.statusCode) {
            changes.push(`Status: ${comparison.differences.statusCode.original} → ${comparison.differences.statusCode.replayed}`);
        }
        if (comparison.differences.headers) {
            const { added, removed, modified } = comparison.differences.headers;
            if (Object.keys(added).length > 0) {
                changes.push(`${Object.keys(added).length} headers added`);
            }
            if (removed.length > 0) {
                changes.push(`${removed.length} headers removed`);
            }
            if (Object.keys(modified).length > 0) {
                changes.push(`${Object.keys(modified).length} headers modified`);
            }
        }
        if (comparison.differences.body?.type !== 'identical') {
            changes.push('Body changed');
        }
        return changes.join(', ');
    }
    /**
     * Generate simple JSON diff (basic implementation)
     */
    generateJsonDiff(original, replayed) {
        const originalLines = original.split('\n');
        const replayedLines = replayed.split('\n');
        // Simple line-by-line diff
        const diff = [];
        const maxLines = Math.max(originalLines.length, replayedLines.length);
        for (let i = 0; i < maxLines; i++) {
            const originalLine = originalLines[i] || '';
            const replayedLine = replayedLines[i] || '';
            if (originalLine !== replayedLine) {
                if (originalLine)
                    diff.push(`- ${originalLine}`);
                if (replayedLine)
                    diff.push(`+ ${replayedLine}`);
            }
        }
        return diff.join('\n');
    }
    /**
     * Generate simple text diff
     */
    generateTextDiff(original, replayed) {
        return `- ${original}\n+ ${replayed}`;
    }
    /**
     * Generate Vitest test
     */
    generateVitestTest(request, testName, expectedStatus) {
        return `import { describe, it, expect } from 'vitest';
import { request } from 'supertest';
import { app } from '../src/app'; // Adjust import path

describe('${testName}', () => {
  it('should return ${expectedStatus}', async () => {
    const response = await request(app)
      .${request.method.toLowerCase()}('${request.url}')${request.headers
            ? `
      .set(${JSON.stringify(request.headers, null, 6)})`
            : ''}${request.body
            ? `
      .send(${JSON.stringify(request.body, null, 6)})`
            : ''};

    expect(response.status).toBe(${expectedStatus});
    ${request.response?.body ? `expect(response.body).toEqual(${JSON.stringify(request.response.body, null, 4)});` : ''}
  });
});`;
    }
    /**
     * Generate Jest test
     */
    generateJestTest(request, testName, expectedStatus) {
        return `const request = require('supertest');
const app = require('../src/app'); // Adjust import path

describe('${testName}', () => {
  test('should return ${expectedStatus}', async () => {
    const response = await request(app)
      .${request.method.toLowerCase()}('${request.url}')${request.headers
            ? `
      .set(${JSON.stringify(request.headers, null, 6)})`
            : ''}${request.body
            ? `
      .send(${JSON.stringify(request.body, null, 6)})`
            : ''};

    expect(response.status).toBe(${expectedStatus});
    ${request.response?.body ? `expect(response.body).toEqual(${JSON.stringify(request.response.body, null, 4)});` : ''}
  });
});`;
    }
    /**
     * Sanitize headers for replay (remove sensitive data but keep necessary headers)
     */
    sanitizeHeaders(headers) {
        const sanitized = {};
        // Headers to remove (sensitive or connection-specific)
        const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token'];
        // Connection-specific headers that should be removed/regenerated
        const connectionHeaders = [
            'host', // Will be set by http.request
            'connection', // Will be set by http.request
            'transfer-encoding', // Will be set by http.request if needed
        ];
        for (const [key, value] of Object.entries(headers)) {
            const lowerKey = key.toLowerCase();
            // Skip sensitive and connection-specific headers
            if (sensitiveHeaders.includes(lowerKey) || connectionHeaders.includes(lowerKey)) {
                continue;
            }
            // Convert value to string and add to sanitized headers
            if (value != null) {
                sanitized[key] = Array.isArray(value) ? value.join(', ') : String(value);
            }
        }
        return sanitized;
    }
    /**
     * Check if header is sensitive
     */
    isSensitiveHeader(key) {
        const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token'];
        return sensitiveHeaders.includes(key.toLowerCase());
    }
    /**
     * Parse response body based on content type
     */
    parseBody(body, contentType) {
        if (!body)
            return null;
        if (contentType?.includes('application/json')) {
            try {
                return JSON.parse(body);
            }
            catch {
                return body;
            }
        }
        return body;
    }
}
/**
 * Create a request replay engine instance
 */
export function createRequestReplayEngine(logger) {
    return new RequestReplayEngine(logger);
}
//# sourceMappingURL=recorder-replay.js.map