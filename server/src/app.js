require('dotenv').config();
const express = require('express');
const cors = require('cors');
const promClient = require('prom-client');
const authRoutes = require('./routes/auth');
const authenticateToken = require('./middleware/auth');

const app = express();

// ─── Prometheus Metrics Setup ───────────────────────────
// Collect default Node.js metrics (CPU, memory, event loop, GC, etc.)
const register = promClient.register;
promClient.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  labels: { app: 'metrogo' },
});

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const otpRequestsTotal = new promClient.Counter({
  name: 'otp_requests_total',
  help: 'Total number of OTP requests (send/verify)',
  labelNames: ['type', 'status'],
});

const activeSessionsGauge = new promClient.Gauge({
  name: 'active_sessions_total',
  help: 'Current number of active JWT sessions',
});

// Make metrics accessible to route handlers
app.locals.metrics = {
  otpRequestsTotal,
  activeSessionsGauge,
};

// ─── Middleware ──────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://metro-booking-service.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    // In production, allow any vercel.app or cloudfront.net subdomain
    if (origin.endsWith('.vercel.app') || origin.endsWith('.cloudfront.net')) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

// Prometheus metrics middleware — track every request
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;

    // Normalize route to avoid high-cardinality labels
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      durationSec
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
});

// ─── Prometheus Metrics Endpoint ────────────────────────
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public auth routes
app.use('/api/auth', authRoutes);

// Protected route example — requires valid JWT
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Access granted.', 
    user: req.user 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error. Please try again later.' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Metro Booking Auth Server running on port ${PORT}`);
  console.log(`📱 Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Missing'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
});
