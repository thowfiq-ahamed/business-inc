const client = require('prom-client');
const mongoose = require('mongoose');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, event loop, garbage collection, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'business_inc_',
});

// Custom HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'business_inc_http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Custom HTTP request duration histogram
const httpRequestDurationSeconds = new client.Histogram({
  name: 'business_inc_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Custom MongoDB connection status gauge
const mongoStatus = new client.Gauge({
  name: 'business_inc_mongodb_status',
  help: 'Status of MongoDB connection (1 = connected, 0 = disconnected)',
  registers: [register],
  collect() {
    this.set(mongoose.connection && mongoose.connection.readyState === 1 ? 1 : 0);
  },
});

// Express middleware for metrics collection
const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const elapsed = process.hrtime(start);
    const durationInSeconds = elapsed[0] + elapsed[1] / 1e9;
    const route = req.baseUrl || req.path;

    const labels = {
      method: req.method,
      route: req.route ? `${req.baseUrl || ''}${req.route.path}` : route,
      status_code: res.statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationInSeconds);
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  mongoStatus,
};
