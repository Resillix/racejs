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
export declare function runPipeline(req: IncomingMessage, res: ServerResponse, handlers: Handler[], errorHandler?: (err: any, req: IncomingMessage, res: ServerResponse) => void): Promise<void>;
/**
 * Synchronous-only pipeline for maximum performance
 * Use when all middleware is known to be synchronous
 *
 * This eliminates promise overhead entirely
 */
export declare function runPipelineSync(req: IncomingMessage, res: ServerResponse, handlers: Handler[], errorHandler?: (err: any, req: IncomingMessage, res: ServerResponse) => void): void;
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
export declare function runHooks(hooks: Array<(...args: any[]) => void> | undefined, ...args: any[]): void;
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
//# sourceMappingURL=pipeline.d.ts.map