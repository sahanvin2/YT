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

// Load env vars
dotenv.config();

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

// File uploading - 12GB max for HLS folders
const maxSizeMb = parseInt(process.env.MAX_VIDEO_SIZE_MB || '12288'); // 12GB default
const tempDir = path.join(__dirname, '../tmp');
const uploadsDir = path.join(__dirname, '../tmp/uploads');
// Ensure temp directories exist with proper permissions
[tempDir, uploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

app.use(fileUpload({
  createParentPath: true,
  useTempFiles: false, // Use memory instead of temp files
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
  abortOnLimit: false,
  responseOnLimit: `File size limit exceeded. Maximum allowed: ${maxSizeMb}MB (${Math.round(maxSizeMb/1024)}GB)`,
  uploadTimeout: 1200000, // 20 minutes timeout for large HLS folders
  debug: process.env.NODE_ENV === 'development' // Enable debug in dev mode
}));

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routers
app.use('/api/health', health);
app.use('/api/auth', auth);
app.use('/api/videos', videos);
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
