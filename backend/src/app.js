const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// ─── Security & CORS ────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(null, true); // In production, tighten this
  },
  credentials: true,
}));

// ─── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Security Headers ──────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ─── Request Logging (dev only) ─────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000) {
        console.warn(`⚠️  Slow request: ${req.method} ${req.originalUrl} ${duration}ms`);
      }
    });
    next();
  });
}

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', require('./routes/product.routes'));
app.use('/api', require('./routes/floor.routes'));
app.use('/api/sessions', require('./routes/session.routes'));
app.use('/api/terminals', require('./routes/terminal.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/kitchen', require('./routes/kitchen.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/coupons', require('./routes/coupon.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/promotions', require('./routes/promotion.routes'));
app.use('/api/customers', require('./routes/customer.routes'));

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  const timestampIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  res.json({ status: 'ok', timestamp: timestampIST, uptime: process.uptime() });
});

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

module.exports = app;
