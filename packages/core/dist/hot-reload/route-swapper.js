export class RouteSwapper {
    /**
     * Swap multiple routes atomically when router exposes update APIs; otherwise fallback to remove/add.
     */
    swapRoutes(router, updates) {
        const rAny = router;
        if (typeof rAny.updateRouteHandlers === 'function') {
            // Prefer atomic updates when available
            for (const u of updates)
                rAny.updateRouteHandlers(u.method, u.path, u.handlers);
            if (typeof rAny.compile === 'function')
                rAny.compile();
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
        if (typeof rAny.compile === 'function')
            rAny.compile();
    }
}
//# sourceMappingURL=route-swapper.js.map