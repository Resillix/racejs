/**
 * Express 4.x Compatibility Layer
 *
 * Provides a familiar Express-like API that wraps the high-performance core
 */
import { Application } from '@racejs/core';
/**
 * Express-compatible application wrapper
 */
export class ExpressCompatApp extends Application {
    locals = {};
    constructor(options) {
        super(options);
    }
    /**
     * Express-style app.locals
     */
    get appLocals() {
        return this.locals;
    }
    /**
     * Express-style settings
     * Maps to internal settings but with deprecation warnings
     */
    // Override set to add warnings for unsupported settings
    set(name, value) {
        // Warn about unsupported settings
        const unsupported = ['view engine', 'views', 'view cache'];
        if (unsupported.includes(name)) {
            console.warn(`[Express Compat] Setting "${name}" is not supported. Use external view rendering.`);
        }
        return super.set(name, value);
    }
    get(pathOrName, ...handlers) {
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
    enabled(name) {
        return this.getSetting(name) === true;
    }
    disabled(name) {
        return this.getSetting(name) === false;
    }
    enable(name) {
        return this.set(name, true);
    }
    disable(name) {
        return this.set(name, false);
    }
    /**
     * Express param() - parameter preprocessing
     * Not implemented in core, add deprecation warning
     */
    param(_name, _handler) {
        console.warn('[Express Compat] app.param() is not supported in high-performance mode. Use route-specific handlers.');
        return this;
    }
    /**
     * Express render() - template rendering
     * Not implemented in core, add deprecation warning
     */
    render(_view, _options, callback) {
        console.warn('[Express Compat] app.render() is not supported. Use external template engines.');
        if (callback) {
            callback(new Error('Rendering not supported in @express/compat'));
        }
    }
    /**
     * Express engine() - register template engine
     * Not implemented, add deprecation warning
     */
    engine(_ext, _fn) {
        console.warn('[Express Compat] app.engine() is not supported. Use external template engines.');
        return this;
    }
}
/**
 * Enhanced request wrapper with Express 4.x compatibility
 */
export function wrapRequest(req) {
    // Add Express-specific helpers
    if (!req.app) {
        req.app = null; // Set by application
    }
    // Add convenience methods
    req.accepts = function (...types) {
        // Simplified implementation
        const accept = req.get('accept') || '*/*';
        return types.find(type => accept.includes(type)) || types[0];
    };
    req.acceptsCharsets = function (...charsets) {
        return charsets[0]; // Simplified
    };
    req.acceptsEncodings = function (...encodings) {
        return encodings[0]; // Simplified
    };
    req.acceptsLanguages = function (...languages) {
        return languages[0]; // Simplified
    };
    req.range = function (_size, _options) {
        return []; // Simplified
    };
    req.is = function (...types) {
        const contentType = req.get('content-type') || '';
        return types.find(type => contentType.includes(type)) || false;
    };
    return req;
}
/**
 * Enhanced response wrapper with Express 4.x compatibility
 */
export function wrapResponse(res) {
    // Add Express-specific helpers
    if (!res.app) {
        res.app = null; // Set by application
    }
    // Add format() for content negotiation
    res.format = function (obj) {
        const accept = this.req?.get('accept') || 'application/json';
        if (accept.includes('json') && obj.json) {
            obj.json();
        }
        else if (accept.includes('html') && obj.html) {
            obj.html();
        }
        else if (obj.default) {
            obj.default();
        }
        else {
            res.status(406).send('Not Acceptable');
        }
    };
    // Add links() for Link header
    res.links = function (links) {
        const values = Object.entries(links)
            .map(([rel, url]) => `<${url}>; rel="${rel}"`)
            .join(', ');
        return res.set('link', values);
    };
    // Add location() helper
    res.location = function (url) {
        return res.set('location', url);
    };
    // Add vary() helper
    res.vary = function (field) {
        return res.append('vary', field);
    };
    // Add download() helper
    res.download = function (_path, _filename, callback) {
        console.warn('[Express Compat] res.download() not fully implemented. Use res.sendFile().');
        if (callback)
            callback(new Error('Not implemented'));
    };
    // Add attachment() helper
    res.attachment = function (filename) {
        if (filename) {
            res.set('content-disposition', `attachment; filename="${filename}"`);
        }
        else {
            res.set('content-disposition', 'attachment');
        }
        return res;
    };
    // Add sendFile() helper
    res.sendFile = function (_path, _options, callback) {
        console.warn('[Express Compat] res.sendFile() not fully implemented.');
        if (callback)
            callback(new Error('Not implemented'));
    };
    return res;
}
/**
 * Factory function that mimics express()
 */
export function express(options) {
    return new ExpressCompatApp(options);
}
/**
 * Default export for Express-style require/import
 */
export default express;
/**
 * Express static middleware (placeholder)
 */
export function staticMiddleware(_root, _options) {
    console.warn('[Express Compat] express.static() not implemented. Use serve-static package.');
    return (_req, _res, next) => {
        next();
    };
}
// Attach static to express function
express.static = staticMiddleware;
/**
 * Export types
 */
export { ExpressCompatApp as Application };
//# sourceMappingURL=index.js.map