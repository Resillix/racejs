/**
 * Advanced Patterns Example
 * 
 * Demonstrates advanced RaceJS patterns:
 * - Custom error classes
 * - Async error handling
 * - Route prefixes/grouping
 * - Custom request/response methods
 * - Dependency injection
 * - Context passing
 */

import { createApp } from '@racejs/core';

const app = createApp();

// ============================================
// CUSTOM ERROR CLASSES
// ============================================

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
    this.id = id;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// ============================================
// DEPENDENCY INJECTION
// ============================================

class Database {
  constructor() {
    this.data = new Map();
    this.data.set(1, { id: 1, name: 'John Doe', email: 'john@example.com' });
    this.data.set(2, { id: 2, name: 'Jane Smith', email: 'jane@example.com' });
  }
  
  async findById(id) {
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB delay
    return this.data.get(id);
  }
  
  async findAll() {
    await new Promise(resolve => setTimeout(resolve, 10));
    return Array.from(this.data.values());
  }
  
  async create(data) {
    await new Promise(resolve => setTimeout(resolve, 10));
    const id = this.data.size + 1;
    const record = { id, ...data };
    this.data.set(id, record);
    return record;
  }
  
  async update(id, data) {
    await new Promise(resolve => setTimeout(resolve, 10));
    const existing = this.data.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    this.data.set(id, updated);
    return updated;
  }
  
  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 10));
    return this.data.delete(id);
  }
}

class Logger {
  log(level, message, meta = {}) {
    console.log(JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
  
  info(message, meta) { this.log('info', message, meta); }
  error(message, meta) { this.log('error', message, meta); }
  warn(message, meta) { this.log('warn', message, meta); }
}

// Create singletons
const db = new Database();
const logger = new Logger();

// ============================================
// CONTEXT MIDDLEWARE (Dependency Injection)
// ============================================

app.use((req, res, next) => {
  // Inject dependencies into request context
  req.context = {
    db,
    logger,
    user: null, // Will be set by auth middleware
    requestId: Math.random().toString(36).substr(2, 9)
  };
  next();
});

// ============================================
// ASYNC ERROR WRAPPER
// ============================================

function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

function authenticate(req, res, next) {
  const token = req.headers['authorization'];
  
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }
  
  if (token !== 'Bearer valid-token') {
    throw new UnauthorizedError('Invalid token');
  }
  
  req.context.user = { id: 1, name: 'John Doe', role: 'admin' };
  next();
}

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

function validateBody(schema) {
  return async (req, res, next) => {
    const body = await req.json();
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      
      if (rules.required && !value) {
        throw new ValidationError(`${field} is required`, field);
      }
      
      if (rules.type && value !== undefined && typeof value !== rules.type) {
        throw new ValidationError(`${field} must be a ${rules.type}`, field);
      }
      
      if (rules.minLength && value.length < rules.minLength) {
        throw new ValidationError(
          `${field} must be at least ${rules.minLength} characters`,
          field
        );
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        throw new ValidationError(
          `${field} format is invalid`,
          field
        );
      }
    }
    
    req.body = body;
    next();
  };
}

// ============================================
// ROUTES
// ============================================

// Public route
app.get('/', (req, res) => {
  res.json({
    message: 'RaceJS Advanced Patterns',
    endpoints: {
      public: ['GET /'],
      protected: ['GET /profile'],
      users: ['GET /api/users', 'GET /api/users/:id', 'POST /api/users', 'PUT /api/users/:id', 'DELETE /api/users/:id']
    }
  });
});

// Protected profile route
app.get('/profile', authenticate, (req, res) => {
  const { user, requestId } = req.context;
  res.json({ user, requestId });
});

// Users API - Using async handlers
app.get('/api/users', asyncHandler(async (req, res) => {
  const { db, logger, requestId } = req.context;
  
  logger.info('Fetching all users', { requestId });
  
  const users = await db.findAll();
  res.json({ users, count: users.length });
}));

app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const { db, logger, requestId } = req.context;
  const id = parseInt(req.params.id);
  
  logger.info('Fetching user', { requestId, userId: id });
  
  const user = await db.findById(id);
  if (!user) {
    throw new NotFoundError('User', id);
  }
  
  res.json(user);
}));

app.post('/api/users',
  validateBody({
    name: { required: true, type: 'string', minLength: 2 },
    email: { 
      required: true, 
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  }),
  asyncHandler(async (req, res) => {
    const { db, logger, requestId } = req.context;
    
    logger.info('Creating user', { requestId, data: req.body });
    
    const user = await db.create(req.body);
    res.status(201).json(user);
  })
);

app.put('/api/users/:id',
  validateBody({
    name: { required: false, type: 'string', minLength: 2 },
    email: { 
      required: false, 
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  }),
  asyncHandler(async (req, res) => {
    const { db, logger, requestId } = req.context;
    const id = parseInt(req.params.id);
    
    logger.info('Updating user', { requestId, userId: id, data: req.body });
    
    const user = await db.update(id, req.body);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    
    res.json(user);
  })
);

app.delete('/api/users/:id', asyncHandler(async (req, res) => {
  const { db, logger, requestId } = req.context;
  const id = parseInt(req.params.id);
  
  logger.info('Deleting user', { requestId, userId: id });
  
  const deleted = await db.delete(id);
  if (!deleted) {
    throw new NotFoundError('User', id);
  }
  
  res.status(204).send();
}));

// Trigger error for testing
app.get('/error', () => {
  throw new Error('This is a test error');
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  throw new NotFoundError('Route', req.url);
});

// Global error handler
app.use((err, req, res, next) => {
  const { logger, requestId } = req.context || {};
  
  // Log error
  if (logger) {
    logger.error(err.message, {
      requestId,
      error: err.stack,
      code: err.code,
      statusCode: err.statusCode
    });
  } else {
    console.error(err);
  }
  
  // Send response
  if (err.isOperational) {
    // Operational error - safe to send details
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.field && { field: err.field }),
        ...(err.resource && { resource: err.resource }),
        ...(err.id && { id: err.id })
      }
    });
  } else {
    // Programming error - send generic message
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// ============================================
// START SERVER
// ============================================

app.compile();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏁 RaceJS Advanced Patterns running at http://localhost:${PORT}`);
  console.log('\nFeatures demonstrated:');
  console.log('  ✅ Custom error classes');
  console.log('  ✅ Async error handling');
  console.log('  ✅ Dependency injection');
  console.log('  ✅ Context passing');
  console.log('  ✅ Validation middleware');
  console.log('  ✅ Authentication');
  console.log('  ✅ Structured logging\n');
});
