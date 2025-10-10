export class RouteSwapper {
    /**
     * Swap multiple routes atomically when router exposes update APIs; otherwise fallback to remove/add.
     *
     * Note: Does NOT call compile() - hot reload requires mutable routes
     */
    swapRoutes(router, updates) {
        const rAny = router;
        if (typeof rAny.updateRouteHandlers === 'function') {
            // Prefer atomic updates when available
            for (const u of updates)
                rAny.updateRouteHandlers(u.method, u.path, u.handlers);
            // Don't compile - hot reload needs mutable routes
            return;
        }
        // Fallback: remove and re-add (may throw if router is compiled)
        if (typeof router.addRoute !== 'function')
            return;
        for (const u of updates) {
            if (typeof rAny.removeRoute === 'function')
                rAny.removeRoute(u.method, u.path);
            router.addRoute(u.method, u.path, u.handlers);
        }
        // Don't compile - hot reload needs mutable routes
    }
}
//# sourceMappingURL=route-swapper.js.map