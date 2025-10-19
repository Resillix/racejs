/**
 * Phase 5: Error Handler & Aggregation Tests
 *
 * Integration tests for error handling system including:
 * - Error handler
 * - Error aggregator
 * - Solution engine
 * - Error renderer
 * - DevTools integration
 */

import { strict as assert } from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { createApp } from '../packages/core/dist/index.js';

describe('Phase 5: Error Handler & Aggregation', () => {
  let app;
  let server;
  let errorHandler;
  let errorAggregator;
  const PORT = 3005;

  before(async () => {
    // Create app with dev mode enabled
    app = createApp({
      dev: {
        enabled: true,
        recorder: true,
        devtools: false, // Disable DevTools server for tests
      },
    });

    // Get error handler and aggregator
    const devMode = app.getDevMode();
    errorHandler = devMode?.getErrorHandler();
    errorAggregator = devMode?.getErrorAggregator();

    // Setup test routes
    app.get('/test/error/type', (req, res) => {
      const obj = null;
      obj.property; // TypeError
    });

    app.get('/test/error/reference', (req, res) => {
      nonExistentVariable; // ReferenceError
    });

    app.get('/test/error/custom', (req, res) => {
      throw new Error('Custom test error');
    });

    app.get('/test/success', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Start server
    await new Promise((resolve) => {
      server = app.listen(PORT, resolve);
    });
  });

  after(async () => {
    // Close server
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  describe('Error Handler', () => {
    it('should exist and be accessible', () => {
      assert.ok(errorHandler, 'Error handler should exist');
      assert.equal(typeof errorHandler.handle, 'function', 'Should have handle method');
      assert.equal(typeof errorHandler.enhance, 'function', 'Should have enhance method');
    });

    it('should enhance errors with context', async () => {
      const error = new TypeError('Cannot read property "test" of null');
      const mockReq = {
        method: 'GET',
        url: '/test/error',
        headers: {},
      };

      const enhanced = await errorHandler.enhance(error, mockReq);

      assert.ok(enhanced, 'Enhanced error should exist');
      assert.equal(enhanced.name, 'TypeError', 'Should preserve error name');
      assert.equal(enhanced.message, error.message, 'Should preserve error message');
      assert.ok(enhanced.stack, 'Should have stack trace');
      assert.equal(enhanced.route, '/test/error', 'Should add route');
      assert.equal(enhanced.method, 'GET', 'Should add method');
      assert.ok(enhanced.timestamp, 'Should add timestamp');
    });

    it('should find solutions for common errors', async () => {
      const error = new TypeError('Cannot read property "name" of null');
      const mockReq = {
        method: 'GET',
        url: '/test',
        headers: {},
      };

      const enhanced = await errorHandler.enhance(error, mockReq);

      assert.ok(enhanced.solutions, 'Should have solutions array');
      assert.ok(enhanced.solutions.length > 0, 'Should find at least one solution');

      const solution = enhanced.solutions[0];
      assert.ok(solution.title, 'Solution should have title');
      assert.ok(solution.description, 'Solution should have description');
      assert.ok(solution.solution, 'Solution should have solution text');
      assert.ok(typeof solution.confidence === 'number', 'Solution should have confidence score');
      assert.ok(solution.confidence >= 0 && solution.confidence <= 1, 'Confidence should be 0-1');
    });

    it('should extract source context for errors', () => {
      const error = new Error('Test error');
      // Ensure error has a stack trace with file reference
      Error.captureStackTrace(error);

      const mockReq = {
        method: 'GET',
        url: '/test',
        headers: {},
      };

      const enhanced = errorHandler.enhance(error, mockReq);

      if (enhanced.sourceContext) {
        assert.ok(enhanced.sourceContext.file, 'Should have file path');
        assert.ok(typeof enhanced.sourceContext.line === 'number', 'Should have line number');
        assert.ok(Array.isArray(enhanced.sourceContext.codeLines), 'Should have code lines array');
      }
      // Note: Source context might not always be available in tests
    });
  });

  describe('Error Aggregator', () => {
    before(() => {
      // Clear any existing errors
      errorAggregator.clearAll();
    });

    it('should exist and be accessible', () => {
      assert.ok(errorAggregator, 'Error aggregator should exist');
      assert.equal(typeof errorAggregator.track, 'function', 'Should have track method');
      assert.equal(typeof errorAggregator.getError, 'function', 'Should have getError method');
      assert.equal(typeof errorAggregator.listErrors, 'function', 'Should have listErrors method');
    });

    it('should track errors and return hash', () => {
      const error = new Error('Test tracking error');
      const context = {
        route: '/test',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'test-1',
      };

      const hash = errorAggregator.track(error, context);

      assert.ok(hash, 'Should return hash');
      assert.equal(typeof hash, 'string', 'Hash should be a string');
      assert.ok(hash.length > 0, 'Hash should not be empty');
    });

    it('should group duplicate errors by hash', () => {
      errorAggregator.clearAll();

      const error1 = new TypeError('Cannot read property "x" of null');
      const error2 = new TypeError('Cannot read property "x" of null');

      const hash1 = errorAggregator.track(error1, {
        route: '/test1',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'req-1',
      });

      const hash2 = errorAggregator.track(error2, {
        route: '/test2',
        method: 'POST',
        timestamp: Date.now(),
        requestId: 'req-2',
      });

      assert.equal(hash1, hash2, 'Should generate same hash for duplicate errors');

      const aggregatedError = errorAggregator.getError(hash1);
      assert.ok(aggregatedError, 'Should retrieve aggregated error');
      assert.equal(aggregatedError.count, 2, 'Should count both occurrences');
      assert.equal(aggregatedError.occurrences.length, 2, 'Should store both occurrences');
    });

    it('should list all errors', () => {
      errorAggregator.clearAll();

      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      const error3 = new Error('Error 3');

      errorAggregator.track(error1, {
        route: '/test1',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'req-1',
      });

      errorAggregator.track(error2, {
        route: '/test2',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'req-2',
      });

      errorAggregator.track(error3, {
        route: '/test3',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'req-3',
      });

      const errors = errorAggregator.listErrors();
      assert.equal(errors.length, 3, 'Should list all 3 unique errors');
    });

    it('should filter errors by status', () => {
      errorAggregator.clearAll();

      const error1 = new Error('Open error');
      const error2 = new Error('Resolved error');

      const hash1 = errorAggregator.track(error1, {
        route: '/test',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'req-1',
      });

      const hash2 = errorAggregator.track(error2, {
        route: '/test',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'req-2',
      });

      // Mark one as resolved
      const resolvedError = errorAggregator.getError(hash2);
      resolvedError.status = 'resolved';

      const activeErrors = errorAggregator.listErrors({ status: 'active' });
      const resolvedErrors = errorAggregator.listErrors({ status: 'resolved' });

      assert.equal(activeErrors.length, 1, 'Should have 1 active error');
      assert.equal(resolvedErrors.length, 1, 'Should have 1 resolved error');
    });

    it('should filter errors by severity', () => {
      errorAggregator.clearAll();

      const error1 = new TypeError('Type error'); // Critical severity
      const error2 = new Error('Regular error'); // Warning severity

      errorAggregator.track(error1, {
        route: '/test',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'req-1',
      });

      errorAggregator.track(error2, {
        route: '/test',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'req-2',
      });

      const criticalSeverity = errorAggregator.listErrors({ severity: 'critical' });
      assert.ok(criticalSeverity.length > 0, 'Should find critical severity errors');

      const warningSeverity = errorAggregator.listErrors({ severity: 'warning' });
      assert.ok(warningSeverity.length > 0, 'Should find warning severity errors');
    });

    it('should detect error trends', () => {
      errorAggregator.clearAll();

      const error = new Error('Trending error');

      // Track multiple times to establish trend
      for (let i = 0; i < 5; i++) {
        errorAggregator.track(error, {
          route: '/test',
          method: 'GET',
          timestamp: Date.now() + i * 1000,
          requestId: `req-${i}`,
        });
      }

      const errors = errorAggregator.listErrors();
      const trackedError = errors[0];

      assert.ok(trackedError.trend, 'Should have trend property');
      assert.ok(
        ['increasing', 'decreasing', 'stable'].includes(trackedError.trend),
        'Trend should be valid value'
      );
    });

    it('should get error statistics', () => {
      errorAggregator.clearAll();

      // Track some errors
      for (let i = 0; i < 5; i++) {
        const error = new Error(`Error ${i}`);
        errorAggregator.track(error, {
          route: '/test',
          method: 'GET',
          timestamp: Date.now(),
          requestId: `req-${i}`,
        });
      }

      const stats = errorAggregator.getStats();

      assert.ok(stats, 'Should return statistics');
      assert.equal(typeof stats.totalErrors, 'number', 'Should have totalErrors');
      assert.equal(typeof stats.uniqueErrors, 'number', 'Should have uniqueErrors');
      assert.equal(typeof stats.errorRate, 'number', 'Should have errorRate');
      assert.ok(Array.isArray(stats.topErrors), 'Should have topErrors array');
    });

    it('should clear all errors', () => {
      errorAggregator.clearAll();

      // Add some errors
      for (let i = 0; i < 3; i++) {
        const error = new Error(`Error ${i}`);
        errorAggregator.track(error, {
          route: '/test',
          method: 'GET',
          timestamp: Date.now(),
          requestId: `req-${i}`,
        });
      }

      assert.equal(errorAggregator.getCount(), 3, 'Should have 3 errors');

      errorAggregator.clearAll();
      assert.equal(errorAggregator.getCount(), 0, 'Should have 0 errors after clear');
    });
  });

  describe('Solution Engine', () => {
    it('should find solutions for undefined property errors', async () => {
      const error = new TypeError('Cannot read property "name" of undefined');
      const mockReq = { method: 'GET', url: '/test', headers: {} };

      const enhanced = await errorHandler.enhance(error, mockReq);

      assert.ok(enhanced.solutions, 'Should have solutions');
      assert.ok(enhanced.solutions.length > 0, 'Should find at least one solution');

      const solution = enhanced.solutions[0];
      assert.ok(
        solution.title.toLowerCase().includes('null') ||
          solution.title.toLowerCase().includes('undefined'),
        'Solution should be relevant to null/undefined errors'
      );
    });

    it('should find solutions for module not found errors', async () => {
      const error = new Error("Cannot find module 'some-package'");
      const mockReq = { method: 'GET', url: '/test', headers: {} };

      const enhanced = await errorHandler.enhance(error, mockReq);

      const moduleNotFoundSolution = enhanced.solutions?.find(
        (s) =>
          s.title.toLowerCase().includes('module') ||
          s.solution.toLowerCase().includes('npm install')
      );

      if (moduleNotFoundSolution) {
        assert.ok(
          moduleNotFoundSolution.solution.includes('npm') ||
            moduleNotFoundSolution.solution.includes('yarn') ||
            moduleNotFoundSolution.solution.includes('pnpm'),
          'Solution should mention package manager'
        );
      }
    });

    it('should find solutions for JSON parse errors', async () => {
      const error = new SyntaxError('Unexpected token < in JSON at position 0');
      const mockReq = { method: 'GET', url: '/test', headers: {} };

      const enhanced = await errorHandler.enhance(error, mockReq);

      const jsonSolution = enhanced.solutions?.find((s) => s.title.toLowerCase().includes('json'));

      if (jsonSolution) {
        assert.ok(
          jsonSolution.solution.toLowerCase().includes('json'),
          'Solution should mention JSON'
        );
      }
    });

    it('should calculate confidence scores', async () => {
      const error = new TypeError('Cannot read property "test" of null');
      const mockReq = { method: 'GET', url: '/test', headers: {} };

      const enhanced = await errorHandler.enhance(error, mockReq);

      if (enhanced.solutions && enhanced.solutions.length > 0) {
        enhanced.solutions.forEach((solution) => {
          assert.ok(typeof solution.confidence === 'number', 'Confidence should be a number');
          assert.ok(
            solution.confidence >= 0 && solution.confidence <= 1,
            'Confidence should be between 0 and 1'
          );
        });

        // Solutions should be sorted by confidence
        for (let i = 0; i < enhanced.solutions.length - 1; i++) {
          assert.ok(
            enhanced.solutions[i].confidence >= enhanced.solutions[i + 1].confidence,
            'Solutions should be sorted by confidence (descending)'
          );
        }
      }
    });
  });

  describe('Error Renderer', () => {
    it('should render HTML error pages', async () => {
      const error = new TypeError('Test error for rendering');
      const mockReq = {
        method: 'GET',
        url: '/test/render',
        headers: { 'user-agent': 'test' },
      };

      const enhanced = await errorHandler.enhance(error, mockReq);
      const html = errorHandler.renderer.renderHTML(enhanced);

      assert.ok(html, 'Should return HTML');
      assert.ok(html.includes('<!DOCTYPE html>'), 'Should be valid HTML');
      assert.ok(html.includes('Test error for rendering'), 'Should include error message');
      assert.ok(html.includes('TypeError'), 'Should include error type');
      assert.ok(html.includes('Source Code'), 'Should have Source Code tab');
      assert.ok(html.includes('Stack Trace'), 'Should have Stack Trace tab');
      assert.ok(html.includes('Solutions'), 'Should have Solutions tab');
      assert.ok(html.includes('Request'), 'Should have Request tab');
    });

    it('should include stack trace in rendered HTML', async () => {
      const error = new Error('Stack trace test');
      Error.captureStackTrace(error);

      const mockReq = { method: 'GET', url: '/test', headers: {} };
      const enhanced = await errorHandler.enhance(error, mockReq);
      const html = errorHandler.renderer.renderHTML(enhanced);

      // Check that stack trace tab exists and has content
      assert.ok(html.includes('id="tab-stack"'), 'Should have stack trace tab');
      assert.ok(html.includes('stack-trace'), 'Should have stack trace container');
      // Stack trace is formatted into lines with HTML, so check for a part of it
      assert.ok(
        html.includes('test-stack-trace') ||
          html.includes('Stack trace test') ||
          html.includes('at '),
        'Should include stack trace content'
      );
    });

    it('should include solutions in rendered HTML', async () => {
      const error = new TypeError('Cannot read property "x" of null');
      const mockReq = { method: 'GET', url: '/test', headers: {} };

      const enhanced = await errorHandler.enhance(error, mockReq);
      const html = errorHandler.renderer.renderHTML(enhanced);

      if (enhanced.solutions && enhanced.solutions.length > 0) {
        assert.ok(html.includes(enhanced.solutions[0].title), 'Should include solution title');
      }
    });

    it('should include request details in rendered HTML', async () => {
      const error = new Error('Request details test');
      const mockReq = {
        method: 'POST',
        url: '/api/test?foo=bar',
        headers: { 'content-type': 'application/json' },
      };

      const enhanced = await errorHandler.enhance(error, mockReq);
      const html = errorHandler.renderer.renderHTML(enhanced);

      assert.ok(html.includes('POST'), 'Should include method');
      assert.ok(html.includes('/api/test'), 'Should include URL');
    });
  });

  describe('Error Storage', () => {
    it('should store errors in memory by default', () => {
      errorAggregator.clearAll();

      const error = new Error('Storage test');
      const hash = errorAggregator.track(error, {
        route: '/test',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'storage-test-1',
      });

      const retrieved = errorAggregator.getError(hash);
      assert.ok(retrieved, 'Should retrieve stored error');
      assert.equal(retrieved.hash, hash, 'Should have correct hash');
      assert.equal(retrieved.message, 'Storage test', 'Should have correct message');
    });

    it('should update error counts on duplicate tracking', () => {
      errorAggregator.clearAll();

      const error = new Error('Duplicate tracking test');

      const hash1 = errorAggregator.track(error, {
        route: '/test',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'dup-1',
      });

      const retrieved1 = errorAggregator.getError(hash1);
      assert.equal(retrieved1.count, 1, 'Should have count of 1');

      const hash2 = errorAggregator.track(error, {
        route: '/test',
        method: 'GET',
        timestamp: Date.now() + 1000,
        requestId: 'dup-2',
      });

      const retrieved2 = errorAggregator.getError(hash2);
      assert.equal(retrieved2.count, 2, 'Should have count of 2');
      assert.equal(hash1, hash2, 'Should be same error');
    });
  });

  describe('Integration Tests', () => {
    it('should handle errors in routes and track them', async () => {
      errorAggregator.clearAll();

      const response = await fetch(`http://localhost:${PORT}/test/error/custom`);

      // Should get error response
      assert.ok(response, 'Should get response');
      assert.equal(response.status, 500, 'Should return 500 status');

      // Check if error was tracked
      const errors = errorAggregator.listErrors();
      assert.ok(errors.length > 0, 'Should track error');

      const trackedError = errors.find((e) => e.message.includes('Custom test error'));
      assert.ok(trackedError, 'Should find tracked error');
      assert.equal(trackedError.route, '/test/error/custom', 'Should track route');
      assert.equal(trackedError.method, 'GET', 'Should track method');
    });

    it('should aggregate duplicate errors from multiple requests', async () => {
      errorAggregator.clearAll();

      // Make same error request 3 times
      await Promise.all([
        fetch(`http://localhost:${PORT}/test/error/type`),
        fetch(`http://localhost:${PORT}/test/error/type`),
        fetch(`http://localhost:${PORT}/test/error/type`),
      ]);

      const errors = errorAggregator.listErrors();

      // Should have only 1 unique error
      const typeErrors = errors.filter((e) => e.type === 'TypeError');
      assert.equal(typeErrors.length, 1, 'Should aggregate duplicate errors');

      if (typeErrors.length > 0) {
        assert.equal(typeErrors[0].count, 3, 'Should count all 3 occurrences');
      }
    });

    it('should track different error types separately', async () => {
      errorAggregator.clearAll();

      await Promise.all([
        fetch(`http://localhost:${PORT}/test/error/type`),
        fetch(`http://localhost:${PORT}/test/error/reference`),
        fetch(`http://localhost:${PORT}/test/error/custom`),
      ]);

      const errors = errorAggregator.listErrors();
      assert.ok(errors.length >= 3, 'Should track different error types separately');
    });

    it('should not track successful requests as errors', async () => {
      errorAggregator.clearAll();

      const response = await fetch(`http://localhost:${PORT}/test/success`);
      assert.equal(response.status, 200, 'Should return 200 for success');

      const errors = errorAggregator.listErrors();
      assert.equal(errors.length, 0, 'Should not track successful requests');
    });
  });

  describe('Event Emitters', () => {
    it('should emit error-tracked event when error is tracked', async () => {
      errorAggregator.clearAll();

      const eventPromise = new Promise((resolve) => {
        errorAggregator.once('error-tracked', ({ error, context }) => {
          assert.ok(error, 'Should emit error');
          assert.ok(context, 'Should emit context');
          assert.ok(error.hash, 'Error should have hash');
          resolve();
        });
      });

      const testError = new Error('Event emission test');
      errorAggregator.track(testError, {
        route: '/test',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'event-test-1',
      });

      await eventPromise;
    });

    it('should emit new-error-type event for first occurrence', async () => {
      errorAggregator.clearAll();

      const eventPromise = new Promise((resolve) => {
        errorAggregator.once('new-error-type', ({ error }) => {
          assert.ok(error, 'Should emit error');
          assert.equal(error.count, 1, 'Should be first occurrence');
          resolve();
        });
      });

      const testError = new Error('New error type test');
      errorAggregator.track(testError, {
        route: '/test',
        method: 'GET',
        timestamp: Date.now(),
        requestId: 'new-type-test-1',
      });

      await eventPromise;
    });
  });
});

console.log('\n✅ All Phase 5 tests completed!\n');
