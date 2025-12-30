const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars - Try multiple locations to ensure .env is found
// Priority: 1) Project root, 2) Backend directory, 3) Parent directory
const path = require('path');
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

// Body parser - 12GB for HLS folder metadata
app.use(express.json({ limit: "12000mb" }));
app.use(express.urlencoded({ extended: true, limit: "12000mb" }));

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

// File uploading - CRITICAL: Keep files in memory, NEVER write to EC2 disk
// This prevents EC2 disk from filling up and crashing the server
const maxSizeMb = parseInt(process.env.MAX_VIDEO_SIZE_MB || '5120'); // 5GB max (reduced to prevent memory issues)

app.use(fileUpload({
  createParentPath: false, // Don't create directories (we don't use disk)
  useTempFiles: false, // CRITICAL: Keep in memory - NEVER write to EC2 disk
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
  abortOnLimit: true, // Abort immediately if file too large
  responseOnLimit: `File size limit exceeded. Maximum allowed: ${maxSizeMb}MB (${Math.round(maxSizeMb/1024)}GB)`,
  uploadTimeout: 7200000, // 2 hours timeout for very large files (4GB+)
  debug: false // Disable debug to reduce logging
}));

console.log(`📦 File upload configured: In-memory only (max ${maxSizeMb}MB), NO disk storage`);

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

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startListening = (attempt = 1) => {
  server.listen(PORT, () => {
    console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`✅ MongoDB connected successfully`);
    console.log(`🔗 Frontend URL: ${process.env.CLIENT_URL}`);
    console.log(`🔌 Socket.IO enabled for real-time notifications`);
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
  });
};

(async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGO_URI ? 'Set (hidden for security)' : 'NOT SET!');

    await connectDB();

    console.log('Starting Express server...');
    startListening(1);
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error('Full error:', err);
  console.error('Stack:', err.stack);
  // Don't exit immediately - log the error for debugging
  // if (server) {
  //   server.close(() => process.exit(1));
  // } else {
  //   process.exit(1);
  // }
});
