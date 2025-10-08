/**
 * Express 4.x Compatibility Layer
 *
 * Provides a familiar Express-like API that wraps the high-performance core
 */
import { Application, type AppOptions } from '@racejs/core';
import type { Handler } from '@racejs/core';
/**
 * Express-compatible application wrapper
 */
export declare class ExpressCompatApp extends Application {
    private locals;
    constructor(options?: AppOptions);
    /**
     * Express-style app.locals
     */
    get appLocals(): Record<string, any>;
    /**
     * Express-style settings
     * Maps to internal settings but with deprecation warnings
     */
    set(name: string, value: any): this;
    get(path: string, ...handlers: Handler[]): this;
    get(name: string): any;
    /**
     * Express enabled/disabled helpers
     */
    enabled(name: string): boolean;
    disabled(name: string): boolean;
    enable(name: string): this;
    disable(name: string): this;
    /**
     * Express param() - parameter preprocessing
     * Not implemented in core, add deprecation warning
     */
    param(_name: string, _handler: (req: any, res: any, next: any, value: any) => void): this;
    /**
     * Express render() - template rendering
     * Not implemented in core, add deprecation warning
     */
    render(_view: string, _options?: any, callback?: (err: Error | null, html?: string) => void): void;
    /**
     * Express engine() - register template engine
     * Not implemented, add deprecation warning
     */
    engine(_ext: string, _fn: any): this;
}
/**
 * Enhanced request wrapper with Express 4.x compatibility
 */
export declare function wrapRequest(req: any): any;
/**
 * Enhanced response wrapper with Express 4.x compatibility
 */
export declare function wrapResponse(res: any): any;
/**
 * Factory function that mimics express()
 */
export declare function express(options?: AppOptions): ExpressCompatApp;
/**
 * Default export for Express-style require/import
 */
export default express;
/**
 * Express static middleware (placeholder)
 */
export declare function staticMiddleware(_root: string, _options?: any): Handler;
/**
 * Export types
 */
export { ExpressCompatApp as Application };
export type { Handler };
//# sourceMappingURL=index.d.ts.map