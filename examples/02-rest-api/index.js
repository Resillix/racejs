/**
 * REST API Example - CRUD Operations with RaceJS
 * 
 * Demonstrates building a complete REST API with:
 * - Route parameters
 * - Request body parsing
 * - All HTTP methods (GET, POST, PUT, DELETE)
 * - Middleware
 * - Error handling
 */

import { createApp } from '@racejs/core';

const app = createApp();

// In-memory database
const todos = new Map();
let nextId = 1;

// Seed data
todos.set(1, { id: 1, title: 'Learn RaceJS', completed: false });
todos.set(2, { id: 2, title: 'Build an API', completed: false });
nextId = 3;

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`→ ${req.method} ${req.url}`);
  
  res.raw.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`← ${req.method} ${req.url} ${res.raw.statusCode} (${duration}ms)`);
  });
  
  next();
});

// GET /todos - List all todos
app.get('/todos', (req, res) => {
  const todoList = Array.from(todos.values());
  res.json({
    count: todoList.length,
    todos: todoList
  });
});

// GET /todos/:id - Get single todo
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.get(id);
  
  if (!todo) {
    return res.status(404).json({ 
      error: 'Todo not found',
      id 
    });
  }
  
  res.json(todo);
});

// POST /todos - Create new todo
app.post('/todos', async (req, res) => {
  const body = await req.json();
  
  if (!body.title) {
    return res.status(400).json({ 
      error: 'Title is required' 
    });
  }
  
  const todo = {
    id: nextId++,
    title: body.title,
    completed: body.completed || false,
    createdAt: new Date().toISOString()
  };
  
  todos.set(todo.id, todo);
  
  res.status(201).json(todo);
});

// PUT /todos/:id - Update todo
app.put('/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.get(id);
  
  if (!todo) {
    return res.status(404).json({ 
      error: 'Todo not found',
      id 
    });
  }
  
  const body = await req.json();
  
  const updated = {
    ...todo,
    title: body.title !== undefined ? body.title : todo.title,
    completed: body.completed !== undefined ? body.completed : todo.completed,
    updatedAt: new Date().toISOString()
  };
  
  todos.set(id, updated);
  
  res.json(updated);
});

// DELETE /todos/:id - Delete todo
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!todos.has(id)) {
    return res.status(404).json({ 
      error: 'Todo not found',
      id 
    });
  }
  
  todos.delete(id);
  
  res.status(204).send();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.url 
  });
});

// Compile routes for optimal performance
app.compile();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏁 RaceJS Todo API running at http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET    /todos       - List all todos');
  console.log('  GET    /todos/:id   - Get single todo');
  console.log('  POST   /todos       - Create new todo');
  console.log('  PUT    /todos/:id   - Update todo');
  console.log('  DELETE /todos/:id   - Delete todo\n');
});
