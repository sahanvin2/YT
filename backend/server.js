const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

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

const app = express();

// Body parser
app.use(express.json({ limit: "3000mb" }));
app.use(express.urlencoded({ extended: true, limit: "3000mb" }));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File uploading
const maxSizeMb = parseInt(process.env.MAX_VIDEO_SIZE_MB || '5120'); // 5GB default
const tempDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
app.use(fileUpload({
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: tempDir,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
  abortOnLimit: false,
  responseOnLimit: 'File size limit exceeded. Maximum allowed: 5GB',
  uploadTimeout: 600000 // 10 minutes timeout
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

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to database and start server
let server;

(async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGO_URI ? 'Set (hidden for security)' : 'NOT SET!');

    await connectDB();

    console.log('Starting Express server...');
    server = app.listen(PORT, () => {
      console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`✅ MongoDB connected successfully`);
      console.log(`🔗 Frontend URL: ${process.env.CLIENT_URL}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} already in use. Kill the process or change PORT in .env`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
      }
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
