const express = require('express');
const cors = require('cors');
const { connectDB, getLastError } = require('./config/db');
require('dotenv').config({ override: true });

const app = express();

// Connect to Database (don't crash server if DB is down)
connectDB().catch((err) => {
  console.error('Initial DB connection failed:', err?.message || err);
});

// Middleware - UPDATED CORS CONFIGURATION
const allowedOrigins = [
  process.env.CLIENT_URL,           // Production URL from environment
  'https://interview-app-eight-lac.vercel.app', // Vercel Deployment
  'http://localhost:5173',          // Local development
  'http://localhost:3001',          // Alternative local port
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    const isVercel = origin.endsWith('.vercel.app');
    const isLocal = origin.startsWith('http://localhost');

    if (allowedOrigins.includes(origin) || isVercel || isLocal) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Ensure DB connection for each request (serverless-friendly)
app.use(async (req, res, next) => {
  try {
    // Guard against rare cases where Mongoose can hang and stall requests.
    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB connection timeout')), 8000)
      ),
    ]);
    next();
  } catch (error) {
    console.error('DB Connection middleware error:', error);
    next(); // Continue anyway, let route handlers deal with it
  }
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/company-verification', require('./routes/companyVerification'));

// Serve static assets (uploaded files)
app.use('/uploads', express.static('public/uploads'));

// Health check / DB status
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    db_connected: mongoose.connection.readyState === 1,
    db_error: getLastError(),
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV,
    config: {
      has_mongo_uri: !!process.env.MONGO_URI,
      mongo_uri_preview: process.env.MONGO_URI ? `${process.env.MONGO_URI.substring(0, 15)}...` : 'NONE',
      has_jwt_secret: !!process.env.JWT_SECRET,
      client_url: process.env.CLIENT_URL
    }
  });
});

// Test route
app.get('/', (req, res) => {
  res.json({ msg: 'Interview Sharing API is running' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({
    msg: 'Server error',
    error: err.message,
    stack: err.stack
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  // Prevent nodemon hard-crashes on transient DB issues
  process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

module.exports = app;