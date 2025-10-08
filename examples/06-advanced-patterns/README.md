# Advanced Patterns Example

Demonstrates advanced patterns and best practices for building production RaceJS applications.

## Features

- ✅ Custom error classes
- ✅ Async error handling
- ✅ Dependency injection
- ✅ Context passing
- ✅ Validation middleware
- ✅ Authentication
- ✅ Structured logging
- ✅ Clean architecture

## Running

```bash
cd examples/06-advanced-patterns
node index.js
```

## Testing

### Get all users
```bash
curl http://localhost:3000/api/users
```

### Get single user
```bash
# Success
curl http://localhost:3000/api/users/1

# Not found error
curl http://localhost:3000/api/users/999
```

### Create user
```bash
# Valid request
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}'

# Validation error - missing field
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob"}'

# Validation error - invalid email
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "email": "invalid"}'
```

### Update user
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "John Updated"}'
```

### Delete user
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

### Protected route
```bash
# Without token (fails)
curl http://localhost:3000/profile

# With token (succeeds)
curl http://localhost:3000/profile \
  -H "Authorization: Bearer valid-token"
```

### Test error handling
```bash
curl http://localhost:3000/error
```

## Patterns Explained

### 1. Custom Error Classes

```javascript
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

// Usage
throw new ValidationError('Email is required', 'email');
```

**Benefits:**
- Type-safe error handling
- Consistent error responses
- Easy to distinguish operational vs programming errors

### 2. Async Error Handler

```javascript
function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

// Usage
app.get('/users', asyncHandler(async (req, res) => {
  const users = await db.findAll();
  res.json(users);
}));
```

**Benefits:**
- No need for try/catch in every route
- Automatic error propagation
- Cleaner route handlers

### 3. Dependency Injection

```javascript
// Create services
const db = new Database();
const logger = new Logger();

// Inject into request context
app.use((req, res, next) => {
  req.context = { db, logger };
  next();
});

// Use in routes
app.get('/users', async (req, res) => {
  const { db, logger } = req.context;
  logger.info('Fetching users');
  const users = await db.findAll();
  res.json(users);
});
```

**Benefits:**
- Testable (easy to mock dependencies)
- Single source of truth
- No global state

### 4. Validation Middleware Factory

```javascript
function validateBody(schema) {
  return async (req, res, next) => {
    const body = await req.json();
    // Validate against schema
    // Throw ValidationError if invalid
    req.body = body;
    next();
  };
}

// Usage
app.post('/users',
  validateBody({
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'string', pattern: /.../ }
  }),
  async (req, res) => {
    // req.body is validated
    const user = await db.create(req.body);
    res.json(user);
  }
);
```

**Benefits:**
- Reusable validation logic
- Declarative schema
- Early validation

### 5. Structured Logging

```javascript
class Logger {
  log(level, message, meta = {}) {
    console.log(JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
}

// Usage
logger.info('User created', { 
  userId: user.id,
  requestId: req.context.requestId 
});
```

**Benefits:**
- Parseable logs
- Easy to search/filter
- Structured metadata

### 6. Error Handling Strategy

```javascript
app.use((err, req, res, next) => {
  if (err.isOperational) {
    // Safe to send details
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  } else {
    // Programming error - hide details
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});
```

**Benefits:**
- Don't leak implementation details
- Consistent error format
- Proper HTTP status codes

## Architecture Overview

```
┌─────────────────┐
│   HTTP Request  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Context DI    │  ← Inject db, logger, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Authentication │  ← Optional
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Validation    │  ← Optional
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Route Handler  │  ← Business logic
│  (async)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Error Handler  │  ← Catch all errors
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTTP Response  │
└─────────────────┘
```

## Best Practices

1. **Always use async handlers** - Wrap async routes with `asyncHandler()`
2. **Use custom error classes** - Makes error handling consistent
3. **Inject dependencies** - Don't use global state
4. **Validate early** - Check input before processing
5. **Log structured data** - Makes debugging easier
6. **Handle errors globally** - Don't catch errors in routes
7. **Compile routes** - Call `app.compile()` for performance
8. **Use TypeScript** - For type safety (see TypeScript example)

## Testing Strategy

```javascript
// Unit test
describe('Database', () => {
  it('should find user by id', async () => {
    const db = new Database();
    const user = await db.findById(1);
    expect(user).toBeDefined();
  });
});

// Integration test
describe('GET /api/users/:id', () => {
  it('should return user', async () => {
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });
  
  it('should return 404 for missing user', async () => {
    const res = await request(app).get('/api/users/999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
```

## Production Considerations

- Add rate limiting (see middleware example)
- Add request timeouts
- Add health check endpoint
- Add metrics/monitoring
- Use environment variables for config
- Add proper logging (Winston, Pino)
- Add request ID tracking
- Add CORS if needed
- Add helmet for security headers
- Add proper authentication (JWT, OAuth)
