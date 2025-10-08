# REST API Example

A complete TODO API demonstrating CRUD operations with RaceJS.

## Features

- ✅ GET all todos
- ✅ GET single todo by ID
- ✅ POST create new todo
- ✅ PUT update todo
- ✅ DELETE todo
- ✅ Route parameters
- ✅ Request body parsing
- ✅ Logging middleware
- ✅ Error handling
- ✅ 404 handler

## Running

```bash
cd examples/02-rest-api
node index.js
```

## Testing

### List all todos
```bash
curl http://localhost:3000/todos
```

### Get single todo
```bash
curl http://localhost:3000/todos/1
```

### Create new todo
```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "My new todo", "completed": false}'
```

### Update todo
```bash
curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Delete todo
```bash
curl -X DELETE http://localhost:3000/todos/1
```

## API Response Examples

**GET /todos**
```json
{
  "count": 2,
  "todos": [
    {
      "id": 1,
      "title": "Learn RaceJS",
      "completed": false
    },
    {
      "id": 2,
      "title": "Build an API",
      "completed": false
    }
  ]
}
```

**POST /todos**
```json
{
  "id": 3,
  "title": "My new todo",
  "completed": false,
  "createdAt": "2025-10-08T12:00:00.000Z"
}
```
