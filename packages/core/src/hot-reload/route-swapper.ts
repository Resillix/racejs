import type { Router, Handler } from '../router.js';

export interface RouteUpdate {
  method: string;
  path: string;
  handlers: Handler[];
}

export class RouteSwapper {
  /**
   * Swap multiple routes atomically when router exposes update APIs; otherwise fallback to remove/add.
   */
  swapRoutes(router: Router, updates: RouteUpdate[]): void {
    const rAny = router as any;
    if (typeof rAny.updateRouteHandlers === 'function') {
      // Prefer atomic updates when available
      for (const u of updates) rAny.updateRouteHandlers(u.method, u.path, u.handlers);
      if (typeof rAny.compile === 'function') rAny.compile();
      return;
    }

    // Fallback: remove and re-add (may throw if router is compiled)
    if (typeof (router as any).addRoute !== 'function') return;
    for (const u of updates) {
      if (typeof rAny.removeRoute === 'function') rAny.removeRoute(u.method, u.path);
      (router as any).addRoute(u.method, u.path, u.handlers);
    }
    if (typeof rAny.compile === 'function') rAny.compile();
  }
}
