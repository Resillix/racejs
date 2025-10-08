/**
 * Zero-cost middleware pipeline executor
 *
 * Key optimizations:
 * - No try/catch inside hot loop (centralized error boundary)
 * - Pre-bound next function to avoid re-wrapping
 * - Synchronous fast path with minimal branching
 * - Promise handling only when needed
 * - Early exit on response end
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Handler } from './router.js';

/**
 * Pipeline context - preallocated and reused
 */
export interface PipelineContext {
  req: IncomingMessage;
  res: ServerResponse;
  handlers: Handler[];
  index: number;
  error: any;
  finished: boolean;
}

/**
 * Execute middleware pipeline with centralized error handling
 *
 * This is the hot path - every optimization matters
 *
 * @param req Incoming HTTP request
 * @param res Server response
 * @param handlers Flat array of middleware functions
 * @param errorHandler Optional error handler
 */
export async function runPipeline(
  req: IncomingMessage,
  res: ServerResponse,
  handlers: Handler[],
  errorHandler?: (err: any, req: IncomingMessage, res: ServerResponse) => void
): Promise<void> {
  // Preallocate context to avoid allocation in loop
  const ctx: PipelineContext = {
    req,
    res,
    handlers,
    index: 0,
    error: null,
    finished: false,
  };

  // Pre-bind next to avoid closure allocation
  const next = createNext(ctx);

  try {
    // Tight loop with minimal branching
    while (ctx.index < handlers.length && !ctx.finished) {
      // Check if response already ended
      if (res.writableEnded) {
        ctx.finished = true;
        break;
      }

      const handler = handlers[ctx.index++]!;

      // Call handler - no try/catch here for fast path
      const result = handler(req, res, next);

      // Handle async middleware
      if (result && typeof result === 'object' && typeof result.then === 'function') {
        await result;
      }

      // Check for errors passed to next(err)
      if (ctx.error) {
        if (errorHandler) {
          errorHandler(ctx.error, req, res);
        } else {
          // Default error handling
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
          }
          if (!res.writableEnded) {
            res.end('Internal Server Error');
          }
        }
        break;
      }
    }
  } catch (err) {
    // Centralized error boundary
    ctx.error = err;
    if (errorHandler) {
      errorHandler(err, req, res);
    } else {
      // Default error handling
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
      }
      if (!res.writableEnded) {
        res.end('Internal Server Error');
      }
    }
  }
}

/**
 * Create a pre-bound next function
 * Avoids closure allocation on every middleware call
 */
function createNext(ctx: PipelineContext): (err?: any) => void {
  return function next(err?: any): void {
    if (err) {
      ctx.error = err;
      ctx.finished = true;
    }
    // No-op otherwise - loop continues naturally
  };
}

/**
 * Synchronous-only pipeline for maximum performance
 * Use when all middleware is known to be synchronous
 *
 * This eliminates promise overhead entirely
 */
export function runPipelineSync(
  req: IncomingMessage,
  res: ServerResponse,
  handlers: Handler[],
  errorHandler?: (err: any, req: IncomingMessage, res: ServerResponse) => void
): void {
  const ctx: PipelineContext = {
    req,
    res,
    handlers,
    index: 0,
    error: null,
    finished: false,
  };

  const next = createNext(ctx);

  try {
    while (ctx.index < handlers.length && !ctx.finished) {
      if (res.writableEnded) {
        ctx.finished = true;
        break;
      }

      const handler = handlers[ctx.index++]!;
      handler(req, res, next);

      if (ctx.error) {
        if (errorHandler) {
          errorHandler(ctx.error, req, res);
        } else {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
          }
          if (!res.writableEnded) {
            res.end('Internal Server Error');
          }
        }
        break;
      }
    }
  } catch (err) {
    ctx.error = err;
    if (errorHandler) {
      errorHandler(err, req, res);
    } else {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
      }
      if (!res.writableEnded) {
        res.end('Internal Server Error');
      }
    }
  }
}

/**
 * Optional lifecycle hooks for request/response interception
 * Implemented as simple array iteration for minimal overhead
 */
export interface LifecycleHooks {
  onRequest?: Array<(req: IncomingMessage) => void>;
  onResponse?: Array<(res: ServerResponse) => void>;
  onError?: Array<(err: any, req: IncomingMessage, res: ServerResponse) => void>;
}

/**
 * Run lifecycle hooks with minimal overhead
 */
export function runHooks(
  hooks: Array<(...args: any[]) => void> | undefined,
  ...args: any[]
): void {
  if (!hooks || hooks.length === 0) return;

  for (let i = 0; i < hooks.length; i++) {
    hooks[i]!(...args);
  }
}

/**
 * Micro-optimizations explained:
 *
 * 1. No try/catch in loop: V8 cannot optimize functions with try/catch in hot path
 *    - Move error boundary outside tight loop
 *
 * 2. Pre-bound next: Creating new function on each call causes allocation
 *    - Bind once, reuse for all middleware in chain
 *
 * 3. Context object: Avoids closure over multiple variables
 *    - Single object reference is faster than multiple closure slots
 *
 * 4. Early exit checks: res.writableEnded check prevents calling ended handlers
 *    - Reduces wasted cycles and potential errors
 *
 * 5. Synchronous fast path: Promise detection adds overhead
 *    - Separate sync-only variant for use cases with no async middleware
 *
 * 6. Minimal branching: Each if statement in hot path costs CPU cycles
 *    - Keep conditional logic to absolute minimum
 *
 * 7. Array iteration over forEach: Direct index access is faster
 *    - No function call overhead per iteration
 *
 * 8. Type checks on result: typeof checks are very fast
 *    - Duck typing for promises avoids instanceof overhead
 */
