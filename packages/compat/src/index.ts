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
export class ExpressCompatApp extends Application {
  private locals: Record<string, any> = {};

  constructor(options?: AppOptions) {
    super(options);
  }

  /**
   * Express-style app.locals
   */
  get appLocals(): Record<string, any> {
    return this.locals;
  }

  /**
   * Express-style settings
   * Maps to internal settings but with deprecation warnings
   */
  // Override set to add warnings for unsupported settings
  set(name: string, value: any): this {
    // Warn about unsupported settings
    const unsupported = ['view engine', 'views', 'view cache'];
    if (unsupported.includes(name)) {
      console.warn(`[Express Compat] Setting "${name}" is not supported. Use external view rendering.`);
    }

    return super.set(name, value);
  }

  // Method overloading for get() - supports both routing and settings
  get(path: string, ...handlers: Handler[]): this;
  get(name: string): any;
  get(pathOrName: string, ...handlers: Handler[]): any {
    // If handlers provided, it's a route registration
    if (handlers.length > 0) {
      return super.get(pathOrName, ...handlers);
    }
    // Otherwise it's a setting getter
    return this.getSetting(pathOrName);
  }

  /**
   * Express enabled/disabled helpers
   */
  enabled(name: string): boolean {
    return this.getSetting(name) === true;
  }

  disabled(name: string): boolean {
    return this.getSetting(name) === false;
  }

  enable(name: string): this {
    return this.set(name, true);
  }

  disable(name: string): this {
    return this.set(name, false);
  }

  /**
   * Express param() - parameter preprocessing
   * Not implemented in core, add deprecation warning
   */
  param(_name: string, _handler: (req: any, res: any, next: any, value: any) => void): this {
    console.warn('[Express Compat] app.param() is not supported in high-performance mode. Use route-specific handlers.');
    return this;
  }

  /**
   * Express render() - template rendering
   * Not implemented in core, add deprecation warning
   */
  render(_view: string, _options?: any, callback?: (err: Error | null, html?: string) => void): void {
    console.warn('[Express Compat] app.render() is not supported. Use external template engines.');
    if (callback) {
      callback(new Error('Rendering not supported in @express/compat'));
    }
  }

  /**
   * Express engine() - register template engine
   * Not implemented, add deprecation warning
   */
  engine(_ext: string, _fn: any): this {
    console.warn('[Express Compat] app.engine() is not supported. Use external template engines.');
    return this;
  }
}

/**
 * Enhanced request wrapper with Express 4.x compatibility
 */
export function wrapRequest(req: any): any {
  // Add Express-specific helpers
  if (!req.app) {
    req.app = null; // Set by application
  }

  // Add convenience methods
  req.accepts = function(...types: string[]) {
    // Simplified implementation
    const accept = req.get('accept') || '*/*';
    return types.find(type => accept.includes(type)) || types[0];
  };

  req.acceptsCharsets = function(...charsets: string[]) {
    return charsets[0]; // Simplified
  };

  req.acceptsEncodings = function(...encodings: string[]) {
    return encodings[0]; // Simplified
  };

  req.acceptsLanguages = function(...languages: string[]) {
    return languages[0]; // Simplified
  };

  req.range = function(_size: number, _options?: any) {
    return []; // Simplified
  };

  req.is = function(...types: string[]) {
    const contentType = req.get('content-type') || '';
    return types.find(type => contentType.includes(type)) || false;
  };

  return req;
}

/**
 * Enhanced response wrapper with Express 4.x compatibility
 */
export function wrapResponse(res: any): any {
  // Add Express-specific helpers
  if (!res.app) {
    res.app = null; // Set by application
  }

  // Add format() for content negotiation
  res.format = function(obj: Record<string, () => void>) {
    const accept = this.req?.get('accept') || 'application/json';

    if (accept.includes('json') && obj.json) {
      obj.json();
    } else if (accept.includes('html') && obj.html) {
      obj.html();
    } else if (obj.default) {
      obj.default();
    } else {
      res.status(406).send('Not Acceptable');
    }
  };

  // Add links() for Link header
  res.links = function(links: Record<string, string>) {
    const values = Object.entries(links)
      .map(([rel, url]) => `<${url}>; rel="${rel}"`)
      .join(', ');
    return res.set('link', values);
  };

  // Add location() helper
  res.location = function(url: string) {
    return res.set('location', url);
  };

  // Add vary() helper
  res.vary = function(field: string) {
    return res.append('vary', field);
  };

  // Add download() helper
  res.download = function(_path: string, _filename?: string, callback?: (err?: Error) => void) {
    console.warn('[Express Compat] res.download() not fully implemented. Use res.sendFile().');
    if (callback) callback(new Error('Not implemented'));
  };

  // Add attachment() helper
  res.attachment = function(filename?: string) {
    if (filename) {
      res.set('content-disposition', `attachment; filename="${filename}"`);
    } else {
      res.set('content-disposition', 'attachment');
    }
    return res;
  };

  // Add sendFile() helper
  res.sendFile = function(_path: string, _options?: any, callback?: (err?: Error) => void) {
    console.warn('[Express Compat] res.sendFile() not fully implemented.');
    if (callback) callback(new Error('Not implemented'));
  };

  return res;
}

/**
 * Factory function that mimics express()
 */
export function express(options?: AppOptions): ExpressCompatApp {
  return new ExpressCompatApp(options);
}

/**
 * Default export for Express-style require/import
 */
export default express;

/**
 * Express static middleware (placeholder)
 */
export function staticMiddleware(_root: string, _options?: any): Handler {
  console.warn('[Express Compat] express.static() not implemented. Use serve-static package.');
  return (_req, _res, next) => {
    next();
  };
}

// Attach static to express function
(express as any).static = staticMiddleware;

/**
 * Export types
 */
export { ExpressCompatApp as Application };
export type { Handler };
