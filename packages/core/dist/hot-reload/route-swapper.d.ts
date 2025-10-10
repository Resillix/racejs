import type { Router, Handler } from '../router.js';
export interface RouteUpdate {
    method: string;
    path: string;
    handlers: Handler[];
}
export declare class RouteSwapper {
    /**
     * Swap multiple routes atomically when router exposes update APIs; otherwise fallback to remove/add.
     *
     * Note: Does NOT call compile() - hot reload requires mutable routes
     */
    swapRoutes(router: Router, updates: RouteUpdate[]): void;
}
//# sourceMappingURL=route-swapper.d.ts.map