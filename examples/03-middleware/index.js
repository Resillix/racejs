/**
 * Middleware Example - Global and Route-Specific Middleware
 * 
 * Demonstrates:
 * - Global middleware
 * - Route-specific middleware
 * - Multiple middleware chaining
 * - Error handling middleware
 * - Middleware order of execution
 */

import { createApp } from '@racejs/core';

const app = createApp();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Logger middleware - runs for all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Response headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'RaceJS');
  res.setHeader('X-Request-ID', Math.random().toString(36).substr(2, 9));
  next();
});

// ============================================
// MIDDLEWARE FUNCTIONS
// ============================================

// Authentication middleware
function requireAuth(req, res, next) {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authorization header required' 
    });
  }
  
  if (token !== 'Bearer secret-token') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Invalid token' 
    });
  }
  
  req.user = { id: 1, name: 'John Doe' };
  next();
}

// Rate limiting middleware (simple example)
const rateLimits = new Map();
function rateLimit(maxRequests = 10, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    
    const limit = rateLimits.get(ip);
    
    if (now > limit.resetAt) {
      limit.count = 1;
      limit.resetAt = now + windowMs;
      return next();
    }
    
    if (limit.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((limit.resetAt - now) / 1000)}s`
      });
    }
    
    limit.count++;
    next();
  };
}

// Validation middleware factory
function validateBody(schema) {
  return async (req, res, next) => {
    try {
      const body = await req.json();
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = body[field];
        
        if (rules.required && !value) {
          return res.status(400).json({
            error: 'Validation Error',
            field,
            message: `${field} is required`
          });
        }
        
        if (rules.type && value !== undefined) {
          if (typeof value !== rules.type) {
            return res.status(400).json({
              error: 'Validation Error',
              field,
              message: `${field} must be a ${rules.type}`
            });
          }
        }
        
        if (rules.minLength && value.length < rules.minLength) {
          return res.status(400).json({
            error: 'Validation Error',
            field,
            message: `${field} must be at least ${rules.minLength} characters`
          });
        }
      }
      
      req.body = body;
      next();
    } catch (err) {
      res.status(400).json({
        error: 'Invalid JSON',
        message: err.message
      });
    }
  };
}

// ============================================
// ROUTES WITH MIDDLEWARE
// ============================================

// Public route - no middleware
app.get('/', (req, res) => {
  res.json({
    message: 'RaceJS Middleware Example',
    endpoints: {
      public: ['GET /'],
      protected: ['GET /profile'],
      rateLimited: ['GET /api/data'],
      validated: ['POST /users']
    }
  });
});

// Protected route - requires authentication
app.get('/profile', requireAuth, (req, res) => {
  res.json({
    message: 'Protected profile data',
    user: req.user,
    requestTime: Date.now() - req.startTime + 'ms'
  });
});

// Rate-limited route
app.get('/api/data', rateLimit(5, 10000), (req, res) => {
  res.json({
    message: 'Rate-limited endpoint',
    data: { items: [1, 2, 3, 4, 5] },
    note: 'Maximum 5 requests per 10 seconds'
  });
});

// Route with validation middleware
app.post('/users', 
  validateBody({
    name: { required: true, type: 'string', minLength: 3 },
    email: { required: true, type: 'string' },
    age: { required: false, type: 'number' }
  }),
  (req, res) => {
    res.status(201).json({
      message: 'User created',
      user: req.body
    });
  }
);

// Multiple middleware chaining example
app.get('/admin',
  requireAuth,
  (req, res, next) => {
    if (req.user.id !== 1) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Admin access required' 
      });
    }
    next();
  },
  (req, res) => {
    res.json({
      message: 'Admin dashboard',
      user: req.user,
      stats: {
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    });
  }
);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.url,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
});

// ============================================
// START SERVER
// ============================================

app.compile();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏁 RaceJS Middleware Example running at http://localhost:${PORT}`);
  console.log('\nTry these routes:');
  console.log('  GET  /                    - Public route');
  console.log('  GET  /profile             - Protected (needs Authorization header)');
  console.log('  GET  /api/data            - Rate limited (5 req/10s)');
  console.log('  POST /users               - Body validation');
  console.log('  GET  /admin               - Multiple middleware\n');
  console.log('For protected routes, use: Authorization: Bearer secret-token\n');
});
