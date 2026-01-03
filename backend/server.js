const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars - Try multiple locations to ensure .env is found
// Priority: 1) Project root, 2) Backend directory, 3) Parent directory
const envPath1 = path.join(__dirname, '../.env');
const envPath2 = path.join(__dirname, '.env');
const envPath3 = path.resolve(process.cwd(), '.env');

if (require('fs').existsSync(envPath1)) {
  dotenv.config({ path: envPath1 });
  console.log(`✅ Loaded .env from: ${envPath1}`);
} else if (require('fs').existsSync(envPath2)) {
  dotenv.config({ path: envPath2 });
  console.log(`✅ Loaded .env from: ${envPath2}`);
} else if (require('fs').existsSync(envPath3)) {
  dotenv.config({ path: envPath3 });
  console.log(`✅ Loaded .env from: ${envPath3}`);
} else {
  dotenv.config(); // Default behavior
  console.log(`⚠️  Using default .env loading (file may not exist)`);
}

// Initialize Passport for OAuth
const passport = require('./config/passport');
const session = require('express-session');

// Check CDN configuration on startup
const CDN_BASE = process.env.CDN_BASE || process.env.CDN_URL;
if (CDN_BASE) {
  console.log(`\n🌐 Bunny CDN configured: ${CDN_BASE}\n`);
} else {
  console.warn('\n⚠️  CDN_BASE not set in environment variables!');
  console.warn('   Videos will be served directly from B2 storage.');
  console.warn('   To enable Bunny CDN, add to your .env file:');
  console.warn('   CDN_BASE=https://Xclub.b-cdn.net\n');
}

// Route files
const auth = require('./routes/auth');
const videos = require('./routes/videos');
const users = require('./routes/users');
const comments = require('./routes/comments');
const admin = require('./routes/admin');
const adminVerify = require('./routes/adminVerify');
const uploads = require('./routes/uploads');
const health = require('./routes/health');
const playlists = require('./routes/playlists');
const channels = require('./routes/channels');
const transcode = require('./routes/transcode');
const notifications = require('./routes/notifications');
const processing = require('./routes/processing');
const hlsProxy = require('./routes/hlsProxy');
const adminMessages = require('./routes/adminMessages');
const oauth = require('./routes/oauth');
const systemNotifications = require('./routes/systemNotifications');
const adminEmail = require('./routes/adminEmail');

const app = express();
const server = http.createServer(app);

// Set server timeouts for large file uploads (4GB+)
server.timeout = 7200000; // 2 hours
server.keepAliveTimeout = 7200000; // 2 hours
server.headersTimeout = 7200000; // 2 hours

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  socket.on('authenticate', (userId) => {
    socket.userId = userId;
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} authenticated and joined their room`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Avoid 304 responses for API calls (browser axios treats 304 as error)
app.disable('etag');

// Body parser - 2500MB for video uploads and metadata
app.use(express.json({ limit: "2500mb" }));
app.use(express.urlencoded({ extended: true, limit: "2500mb" }));

// Cookie parser
app.use(cookieParser());

// Session for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File uploading - CRITICAL: Keep files in memory, NEVER write to disk
// IMPORTANT: Using in-memory uploads for large videos can OOM and crash the whole instance.
// For stability, we use temp files (OS temp dir) and stream from disk.
const maxSizeMb = parseInt(process.env.MAX_VIDEO_SIZE_MB || '5120'); // 5GB max by default

const uploadTmpDir = process.env.UPLOAD_TMP_DIR || path.join(os.tmpdir(), 'movia-upload');
try {
  fs.mkdirSync(uploadTmpDir, { recursive: true });
} catch (e) {
  // Best-effort: if this fails, express-fileupload will still try its default tmp dir
  console.warn(`⚠️ Could not create upload tmp dir: ${uploadTmpDir} (${e.message})`);
}

// Best-effort cleanup of abandoned temp upload files (e.g., crashes / aborted uploads)
// Keeps disk from filling up over time.
const UPLOAD_TMP_MAX_AGE_MS = parseInt(process.env.UPLOAD_TMP_MAX_AGE_MS || '', 10) || (6 * 60 * 60 * 1000); // 6 hours
const UPLOAD_TMP_CLEANUP_INTERVAL_MS = parseInt(process.env.UPLOAD_TMP_CLEANUP_INTERVAL_MS || '', 10) || (60 * 60 * 1000); // 1 hour

function cleanupUploadTmpDir() {
  try {
    if (!fs.existsSync(uploadTmpDir)) return;
    const now = Date.now();
    const entries = fs.readdirSync(uploadTmpDir);
    let removed = 0;

    for (const name of entries) {
      const p = path.join(uploadTmpDir, name);
      try {
        const stat = fs.statSync(p);
        if (!stat.isFile()) continue;
        if (now - stat.mtimeMs > UPLOAD_TMP_MAX_AGE_MS) {
          fs.unlinkSync(p);
          removed++;
        }
      } catch (e) {
        // Ignore per-file errors
      }
    }

    if (removed > 0) {
      console.log(`🧹 Temp upload cleanup: removed ${removed} old file(s) from ${uploadTmpDir}`);
    }
  } catch (e) {
    console.warn(`⚠️ Temp upload cleanup failed: ${e.message}`);
  }
}

cleanupUploadTmpDir();
setInterval(cleanupUploadTmpDir, UPLOAD_TMP_CLEANUP_INTERVAL_MS).unref?.();

app.use(fileUpload({
  createParentPath: false,
  useTempFiles: true, // Stream large uploads to disk to avoid OOM
  tempFileDir: uploadTmpDir,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: `File size limit exceeded. Maximum allowed: ${maxSizeMb}MB (${Math.round(maxSizeMb/1024)}GB)`,
  uploadTimeout: 7200000, // 2 hours
  debug: false
}));

console.log(`📦 File upload configured: temp files enabled (max ${maxSizeMb}MB), tmpDir=${uploadTmpDir}`);

// Enable CORS - Allow multiple origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://xclub.asia',
  'http://3.238.106.222',
  'https://3.238.106.222'
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Always allow in production to prevent login issues
    // Check if origin matches any allowed pattern
    const originHostname = origin.replace(/^https?:\/\//, '').split('/')[0];
    const isAllowed = allowedOrigins.some(allowed => {
      if (!allowed) return false;
      const allowedHostname = allowed.replace(/^https?:\/\//, '').split('/')[0];
      return originHostname === allowedHostname || originHostname.includes(allowedHostname) || allowedHostname.includes(originHostname);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // In production, allow all origins to prevent login failures
      // Log for monitoring but don't block
      console.log(`CORS: Allowing origin: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}));

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routers
app.use('/api/health', health);
app.use('/api/auth', auth);
app.use('/api/videos', videos);
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/users', users);
app.use('/api/comments', comments);
app.use('/api/admin', admin);
app.use('/api/admin', adminVerify);
app.use('/api/uploads', uploads);
app.use('/api/playlists', playlists);
app.use('/api/channels', channels);
app.use('/api/transcode', transcode);
app.use('/api/notifications', notifications);
app.use('/api/processing', processing);
app.use('/api/admin', adminMessages); // Admin-to-admin messaging
app.use('/api/auth', oauth); // OAuth routes (Google, Microsoft)
app.use('/api/system-notifications', systemNotifications); // System-wide notifications
app.use('/api/admin/email', adminEmail); // Admin email functionality
app.use('/api', hlsProxy); // HLS proxy for CORS-free streaming

// Error handler
app.use(errorHandler);

// Keep dev port aligned with client proxy/setupProxy.js (5001),
// while production remains 5000 (as used by nginx configs and PM2).
const PORT =
  process.env.PORT ||
  (process.env.NODE_ENV === 'development' ? 5001 : 5000);

// Connect to database and start server
let isShuttingDown = false;

const startListening = (attempt = 1) => {
  server.listen(PORT, () => {
    console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`✅ MongoDB connected successfully`);
    console.log(`🔗 Frontend URL: ${process.env.CLIENT_URL}`);
    console.log(`🔌 Socket.IO enabled for real-time notifications`);
    
    // Signal PM2 that server is ready
    if (process.send) {
      process.send('ready');
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const maxAttempts = 10;
      if (attempt >= maxAttempts) {
        console.error(`❌ Port ${PORT} still in use after ${maxAttempts} attempts.`);
        process.exit(1);
      }
      const delayMs = 750;
      console.warn(`⚠️ Port ${PORT} in use (TIME_WAIT). Retrying in ${delayMs}ms... (${attempt}/${maxAttempts})`);
      setTimeout(() => startListening(attempt + 1), delayMs);
      return;
    }
    console.error('❌ Server error:', err);
    // Don't exit on error - let PM2 handle restart
  });
};

// Health check endpoint that works even without MongoDB
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

(async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGO_URI ? 'Set (hidden for security)' : 'NOT SET!');

    // Try to connect to MongoDB, but don't crash if it fails
    try {
      await connectDB();
    } catch (mongoErr) {
      console.error('⚠️  MongoDB connection failed, but server will continue running');
      console.error('   Error:', mongoErr.message);
      console.error('   ⚠️  Some features may not work until MongoDB is configured');
      console.error('   💡 Update MONGO_URI in .env file with your MongoDB connection string');
    }

    console.log('Starting Express server...');
    startListening(1);
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('Full error:', err);
    // Don't exit - let PM2 handle it, or server might still be useful for static files
    process.exit(1);
  }
})();

// Handle unhandled promise rejections - log but don't crash
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error('Full error:', err);
  console.error('Stack:', err.stack);
  // Log error but don't exit - let PM2 handle crashes
  // This prevents 502 errors from unhandled rejections
});

// Handle uncaught exceptions - log and exit gracefully
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  console.error('Full error:', err);
  console.error('Stack:', err.stack);
  // Exit gracefully - PM2 will restart
  if (server && !isShuttingDown) {
    isShuttingDown = true;
    server.close(() => {
      console.log('Server closed gracefully');
      process.exit(1);
    });
    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('Forced exit after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(1);
  }
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  isShuttingDown = true;
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// PM2 graceful shutdown
process.on('message', (msg) => {
  if (msg === 'shutdown') {
    gracefulShutdown('PM2 shutdown message');
  }
});
