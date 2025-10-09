import { strict as assert } from 'node:assert';
import { Router, RouteSwapper } from '../../packages/core/dist/index.js';

describe('RouteSwapper and Router hot-swap', function () {
  it('updates handlers in-place', () => {
    const router = new Router();
    const h1 = (req, res, next) => {
      (res.__seen ||= []).push('h1');
      next && next();
    };
    const h2 = (req, res, next) => {
      (res.__seen ||= []).push('h2');
      next && next();
    };
    router.addRoute('GET', '/x', [h1]);
    router.compile();

    // Update via new API
    router.updateRouteHandlers('GET', '/x', [h2]);
    router.compile();

    const match = router.find('GET', '/x');
    assert.ok(match);
    const res = {};
    for (const h of match.handlers) h({}, res, () => {});
    assert.deepEqual(res.__seen, ['h2']);
  });

  it('RouteSwapper.swapRoutes applies batch updates', () => {
    const router = new Router();
    const s = new RouteSwapper();
    const h1 = (req, res, next) => {
      (res.__seen ||= []).push('A');
      next && next();
    };
    const h2 = (req, res, next) => {
      (res.__seen ||= []).push('B');
      next && next();
    };
    router.addRoute('GET', '/a', [h1]);
    router.compile();

    s.swapRoutes(router, [{ method: 'GET', path: '/a', handlers: [h2] }]);
    const match = router.find('GET', '/a');
    const res = {};
    for (const h of match.handlers) h({}, res, () => {});
    assert.deepEqual(res.__seen, ['B']);
  });
});
