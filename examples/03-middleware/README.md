# Middleware Example

Comprehensive demonstration of middleware patterns in RaceJS.

## Features

- ✅ Global middleware (logger, timing, headers)
- ✅ Authentication middleware
- ✅ Rate limiting middleware
- ✅ Body validation middleware
- ✅ Multiple middleware chaining
- ✅ Error handling middleware
- ✅ 404 handler

## Running

```bash
cd examples/03-middleware
node index.js
```

## Testing

### Public route
```bash
curl http://localhost:3000/
```

### Protected route (requires auth)
```bash
# Without token (fails)
curl http://localhost:3000/profile

# With token (succeeds)
curl http://localhost:3000/profile \
  -H "Authorization: Bearer secret-token"
```

### Rate-limited route
```bash
# Call multiple times quickly to trigger rate limit
for i in {1..6}; do
  curl http://localhost:3000/api/data
  echo ""
done
```

### Validated route
```bash
# Valid request
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "age": 30}'

# Invalid request (missing required field)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'

# Invalid request (wrong type)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Jo", "email": "john@example.com", "age": "thirty"}'
```

### Multiple middleware
```bash
curl http://localhost:3000/admin \
  -H "Authorization: Bearer secret-token"
```

## Middleware Concepts

### Global Middleware
Runs for every request:
```javascript
app.use((req, res, next) => {
  // Do something for all requests
  next();
});
```

### Route-Specific Middleware
Runs only for specific routes:
```javascript
app.get('/protected', requireAuth, (req, res) => {
  // Route handler
});
```

### Multiple Middleware Chaining
```javascript
app.get('/admin',
  requireAuth,
  requireAdmin,
  (req, res) => {
    // Route handler
  }
);
```

### Error Handling
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

## Middleware Order

1. Global middleware (app.use)
2. Route-specific middleware
3. Route handler
4. 404 handler
5. Error handler
