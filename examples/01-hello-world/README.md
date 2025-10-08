# Hello World Example

The simplest RaceJS application to get you started.

## Features

- Basic routing
- JSON responses
- Health check endpoint
- Route compilation for performance

## Running

```bash
cd examples/01-hello-world
node index.js
```

## Testing

Open your browser or use curl:

```bash
# Hello message
curl http://localhost:3000/

# Health check
curl http://localhost:3000/health
```

## Expected Output

```json
{
  "message": "Hello from RaceJS!",
  "framework": "RaceJS",
  "version": "1.0.0"
}
```
