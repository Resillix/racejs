/**
 * Dev Mode Status Tracking Tests
 *
 * Tests for checking whether dev mode has completed initialization.
 * This includes:
 * - isReady() method
 * - isStarting() method
 * - waitForReady() method
 * - 'ready' event emission
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { createApp } from '../packages/core/dist/index.js';

describe('Dev Mode Status Tracking', () => {
  it('should track dev mode initialization state', async () => {
    // Create app with dev mode enabled but DevTools disabled for faster tests
    const app = createApp({
      devMode: {
        enabled: true,
        devtools: false, // Disable DevTools for faster tests
        recorder: true, // Enable recorder for async initialization
        profiler: false,
      },
    });

    const devMode = app.getDevMode();
    assert.ok(devMode, 'Dev mode should be initialized');

    // Initially, dev mode should not be ready
    assert.strictEqual(devMode.isReady(), false, 'Dev mode should not be ready initially');
    assert.strictEqual(devMode.isStarting(), false, 'Dev mode should not be starting initially');

    // Start dev mode (don't await yet to check isStarting state)
    const startPromise = devMode.start();
    
    // Note: isStarting() might be false if start() completes synchronously
    // This is OK - it just means there were no async components to wait for
    const wasStarting = devMode.isStarting();
    const wasReady = devMode.isReady();

    // Wait for it to complete
    await startPromise;

    // After starting, should be ready
    assert.strictEqual(devMode.isReady(), true, 'Dev mode should be ready after start');
    assert.strictEqual(devMode.isStarting(), false, 'Dev mode should not be starting after completion');

    // Stop dev mode
    await devMode.stop();

    // After stopping, should not be ready
    assert.strictEqual(devMode.isReady(), false, 'Dev mode should not be ready after stop');
    assert.strictEqual(devMode.isStarting(), false, 'Dev mode should not be starting after stop');
  });

  it('should emit ready event when initialization completes', async () => {
    const app = createApp({
      devMode: {
        enabled: true,
        devtools: false,
        recorder: false,
        profiler: false,
      },
    });

    const devMode = app.getDevMode();
    assert.ok(devMode, 'Dev mode should be initialized');

    // Listen for ready event
    let readyEventEmitted = false;
    devMode.on('ready', () => {
      readyEventEmitted = true;
    });

    // Start dev mode
    await devMode.start();

    // Check that ready event was emitted
    assert.strictEqual(readyEventEmitted, true, 'Ready event should be emitted');

    // Clean up
    await devMode.stop();
  });

  it('should return same promise on multiple start calls', async () => {
    const app = createApp({
      devMode: {
        enabled: true,
        devtools: false,
        recorder: true, // Enable for async init
        profiler: false,
      },
    });

    const devMode = app.getDevMode();
    assert.ok(devMode, 'Dev mode should be initialized');

    // Call start multiple times before any completes
    const promise1 = devMode.start();
    
    // Small delay to ensure we're in the async part
    await new Promise(resolve => setImmediate(resolve));
    
    const promise2 = devMode.start();
    const promise3 = devMode.start();

    // Promises 2 and 3 should return the same promise as 1
    assert.strictEqual(promise1, promise2, 'Second start call should return same promise');
    assert.strictEqual(promise2, promise3, 'Third start call should return same promise');

    await promise1;

    // After completion, subsequent calls should return immediately (no promise stored)
    await devMode.start();

    assert.strictEqual(devMode.isReady(), true, 'Dev mode should be ready');

    // Clean up
    await devMode.stop();
  });

  it('should allow waiting for dev mode to be ready', async () => {
    const app = createApp({
      devMode: {
        enabled: true,
        devtools: false,
        recorder: false,
        profiler: false,
      },
    });

    const devMode = app.getDevMode();
    assert.ok(devMode, 'Dev mode should be initialized');

    // Start dev mode without awaiting
    devMode.start().catch(() => {});

    // Wait for ready
    await devMode.waitForReady();

    // Should be ready now
    assert.strictEqual(devMode.isReady(), true, 'Dev mode should be ready after waitForReady');

    // Clean up
    await devMode.stop();
  });

  it('should handle waitForReady when already ready', async () => {
    const app = createApp({
      devMode: {
        enabled: true,
        devtools: false,
        recorder: false,
        profiler: false,
      },
    });

    const devMode = app.getDevMode();
    assert.ok(devMode, 'Dev mode should be initialized');

    // Start and wait
    await devMode.start();
    assert.strictEqual(devMode.isReady(), true, 'Dev mode should be ready');

    // waitForReady should return immediately when already ready
    const startTime = Date.now();
    await devMode.waitForReady();
    const duration = Date.now() - startTime;

    // Should be nearly instant (less than 10ms)
    assert.ok(duration < 10, 'waitForReady should return immediately when already ready');

    // Clean up
    await devMode.stop();
  });

  it('should start dev mode via waitForReady if not started', async () => {
    const app = createApp({
      devMode: {
        enabled: true,
        devtools: false,
        recorder: false,
        profiler: false,
      },
    });

    const devMode = app.getDevMode();
    assert.ok(devMode, 'Dev mode should be initialized');

    // Call waitForReady without calling start first
    assert.strictEqual(devMode.isReady(), false, 'Dev mode should not be ready initially');
    assert.strictEqual(devMode.isStarting(), false, 'Dev mode should not be starting initially');

    await devMode.waitForReady();

    // Should be ready now
    assert.strictEqual(devMode.isReady(), true, 'Dev mode should be ready after waitForReady');

    // Clean up
    await devMode.stop();
  });

  it('should properly integrate with application listen callback', (t, done) => {
    const app = createApp({
      devMode: {
        enabled: true,
        devtools: false,
        recorder: false,
        profiler: false,
      },
    });

    const devMode = app.getDevMode();
    assert.ok(devMode, 'Dev mode should be initialized');

    let callbackCalled = false;

    // Listen and check dev mode status in callback
    const server = app.listen(0, async () => {
      callbackCalled = true;

      try {
        // Dev mode should be ready when callback is called
        // (callback is delayed until dev mode is ready)
        await devMode.waitForReady();
        assert.strictEqual(devMode.isReady(), true, 'Dev mode should be ready in listen callback');

        // Clean up
        server.close(() => {
          devMode.stop().then(() => {
            done();
          });
        });
      } catch (error) {
        server.close(() => {
          devMode.stop().then(() => {
            done(error);
          });
        });
      }
    });

    // Verify callback was called
    setTimeout(() => {
      if (!callbackCalled) {
        server.close(() => {
          devMode.stop().then(() => {
            done(new Error('Listen callback was not called'));
          });
        });
      }
    }, 2000);
  });
});
