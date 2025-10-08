/**
 * Performance Optimization Example
 * 
 * Demonstrates RaceJS performance features:
 * - Route compilation with app.compile()
 * - Lazy parsing optimization
 * - Streaming responses
 * - Compression
 * - Performance monitoring
 */

import { createApp } from '@racejs/core';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import zlib from 'node:zlib';

const app = createApp();

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.raw.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationNs = end - start;
    const durationMs = Number(durationNs) / 1_000_000;
    
    console.log(`${req.method} ${req.url} - ${durationMs.toFixed(2)}ms`);
  });
  
  next();
});

// ============================================
// OPTIMIZED ROUTES
// ============================================

// Minimal route - fastest possible
app.get('/fast', (req, res) => {
  res.json({ ok: true });
});

// Route without parsing request body (lazy parsing)
app.get('/lazy', (req, res) => {
  // RaceJS doesn't parse req.body unless you call req.json() or req.text()
  // This makes routes that don't need the body extremely fast
  res.json({
    message: 'This route is fast because it never parses the request body',
    timestamp: Date.now()
  });
});

// Streaming large response
app.get('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  res.raw.write('{"items":[');
  
  for (let i = 0; i < 10000; i++) {
    if (i > 0) res.raw.write(',');
    res.raw.write(JSON.stringify({ id: i, value: Math.random() }));
    
    // Yield every 1000 items
    if (i % 1000 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  
  res.raw.write(']}');
  res.raw.end();
});

// File streaming (zero-copy when possible)
app.get('/file', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Content-Disposition', 'inline; filename="example.js"');
    
    const stream = createReadStream('./index.js');
    await pipeline(stream, res.raw);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Compressed response
app.get('/compressed', (req, res) => {
  const data = {
    message: 'This response is compressed with gzip',
    data: Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
    }))
  };
  
  const json = JSON.stringify(data);
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  if (acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Type', 'application/json');
    
    const gzip = zlib.createGzip();
    gzip.pipe(res.raw);
    gzip.end(json);
  } else {
    res.json(data);
  }
});

// Batch operations
app.post('/batch', async (req, res) => {
  const start = Date.now();
  const body = await req.json();
  
  if (!Array.isArray(body.operations)) {
    return res.status(400).json({ 
      error: 'Expected operations array' 
    });
  }
  
  const results = body.operations.map((op, index) => ({
    index,
    operation: op,
    result: `Processed: ${op.type}`,
    timestamp: Date.now()
  }));
  
  res.json({
    processed: results.length,
    duration: Date.now() - start,
    results
  });
});

// ============================================
// PERFORMANCE MONITORING
// ============================================

let requestCount = 0;
let totalDuration = 0;
const routeStats = new Map();

app.use((req, res, next) => {
  const start = Date.now();
  
  res.raw.on('finish', () => {
    const duration = Date.now() - start;
    requestCount++;
    totalDuration += duration;
    
    const path = req.url.split('?')[0];
    const stats = routeStats.get(path) || { count: 0, totalTime: 0 };
    stats.count++;
    stats.totalTime += duration;
    routeStats.set(path, stats);
  });
  
  next();
});

// Get performance stats
app.get('/stats', (req, res) => {
  const stats = {};
  
  for (const [path, data] of routeStats.entries()) {
    stats[path] = {
      requests: data.count,
      avgTime: (data.totalTime / data.count).toFixed(2) + 'ms',
      totalTime: data.totalTime + 'ms'
    };
  }
  
  res.json({
    uptime: process.uptime() + 's',
    totalRequests: requestCount,
    avgResponseTime: requestCount > 0 
      ? (totalDuration / requestCount).toFixed(2) + 'ms' 
      : '0ms',
    memory: {
      rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB'
    },
    routes: stats
  });
});

// Load test endpoint
app.get('/benchmark', (req, res) => {
  // Minimal overhead route for benchmarking
  res.json({ timestamp: Date.now() });
});

// ============================================
// COMPILE AND START
// ============================================

console.log('\n⚡ Compiling routes for optimal performance...');
const compileStart = Date.now();
app.compile();
console.log(`✅ Routes compiled in ${Date.now() - compileStart}ms\n`);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏁 RaceJS Performance Example running at http://localhost:${PORT}`);
  console.log('\nEndpoints:');
  console.log('  GET  /fast        - Minimal overhead route');
  console.log('  GET  /lazy        - Lazy parsing demonstration');
  console.log('  GET  /stream      - Streaming large dataset');
  console.log('  GET  /file        - File streaming');
  console.log('  GET  /compressed  - Gzip compression');
  console.log('  POST /batch       - Batch processing');
  console.log('  GET  /stats       - Performance statistics');
  console.log('  GET  /benchmark   - Benchmarking endpoint\n');
  console.log('Benchmark with: wrk -t4 -c100 -d30s http://localhost:3000/benchmark');
  console.log('             or: autocannon -c 100 -d 30 http://localhost:3000/benchmark\n');
});
