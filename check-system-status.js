/**
 * System Status Check
 * Checks all services and configurations
 */

require('dotenv').config();
const mongoose = require('mongoose');
const IORedis = require('ioredis');

const checkStatus = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('   MOVIA PLATFORM - SYSTEM STATUS CHECK');
  console.log('='.repeat(70) + '\n');

  let allGood = true;

  // 1. Check MongoDB
  console.log('📊 MONGODB:');
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const users = await db.collection('users').countDocuments();
    const videos = await db.collection('videos').countDocuments();
    
    console.log('   ✅ Connected to MongoDB Atlas');
    console.log(`   📁 Database: ${mongoose.connection.name}`);
    console.log(`   👥 Users: ${users}`);
    console.log(`   🎬 Videos: ${videos}`);
    console.log();
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:', error.message);
    console.log();
    allGood = false;
  }

  // 2. Check Redis
  console.log('📊 REDIS:');
  try {
    const redis = new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      lazyConnect: true,
    });
    
    await redis.connect();
    await redis.ping();
    
    const queueLength = await redis.llen('hls_queue');
    const info = await redis.info('server');
    const version = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';
    
    console.log('   ✅ Connected to Redis');
    console.log(`   📦 Version: ${version}`);
    console.log(`   📊 HLS Queue: ${queueLength} jobs`);
    console.log();
    
    redis.disconnect();
  } catch (error) {
    console.log('   ❌ Redis connection failed:', error.message);
    console.log();
    allGood = false;
  }

  // 3. Check B2 Storage
  console.log('📊 BACKBLAZE B2:');
  if (process.env.B2_ACCESS_KEY_ID && process.env.B2_SECRET_ACCESS_KEY && process.env.B2_BUCKET) {
    console.log('   ✅ B2 credentials configured');
    console.log(`   📦 Bucket: ${process.env.B2_BUCKET}`);
    console.log(`   🌐 Endpoint: ${process.env.B2_ENDPOINT}`);
    console.log(`   📁 Public URL: ${process.env.B2_PUBLIC_BASE}`);
    console.log();
  } else {
    console.log('   ❌ B2 credentials not configured');
    console.log();
    allGood = false;
  }

  // 4. Check CDN
  console.log('📊 CDN:');
  if (process.env.CDN_BASE) {
    console.log('   ✅ CDN configured');
    console.log(`   🌐 URL: ${process.env.CDN_BASE}`);
    console.log();
  } else {
    console.log('   ⚠️  CDN not configured (optional)');
    console.log('   Videos will be served directly from B2');
    console.log();
  }

  // 5. Check Email Service
  console.log('📊 EMAIL SERVICE (SMTP):');
  if (process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD && 
      !process.env.MAIL_USERNAME.includes('example.com') && 
      !process.env.MAIL_PASSWORD.includes('smtp-key-here')) {
    console.log('   ✅ SMTP credentials configured');
    console.log(`   📧 Host: ${process.env.MAIL_HOST}`);
    console.log(`   👤 Username: ${process.env.MAIL_USERNAME}`);
    console.log(`   📤 From: ${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`);
    console.log();
    console.log('   ℹ️  Test email with: node test-email.js your@email.com');
    console.log('   ℹ️  Send to all users: node send-verification-emails.js');
    console.log();
  } else {
    console.log('   ❌ SMTP not configured (placeholder values detected)');
    console.log();
    console.log('   📧 TO SETUP SMTP (5 minutes):');
    console.log('   1. Go to: https://www.brevo.com/ (free signup)');
    console.log('   2. Get SMTP credentials from: Settings > SMTP & API');
    console.log('   3. Update .env file with real credentials');
    console.log('   4. Test with: node test-email.js');
    console.log();
    console.log('   📄 OR run: SETUP-SMTP.bat for step-by-step guide');
    console.log('   📚 See: SMTP_SETUP_GUIDE.md for complete documentation');
    console.log();
    allGood = false;
  }

  // 6. Check Environment
  console.log('📊 ENVIRONMENT:');
  console.log(`   🖥️  Node.js: ${process.version}`);
  console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Missing'}`);
  console.log(`   🌐 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`   🚪 Server Port: ${process.env.PORT || 5000}`);
  console.log();

  // Summary
  console.log('='.repeat(70));
  if (allGood) {
    console.log('✅ ALL SYSTEMS OPERATIONAL');
    console.log('   Your platform is ready to use!');
  } else {
    console.log('⚠️  SOME SERVICES NEED CONFIGURATION');
    console.log('   Review the issues above and fix them.');
  }
  console.log('='.repeat(70) + '\n');

  // Disconnect
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
};

// Run check
checkStatus().catch(error => {
  console.error('\n❌ Status check failed:', error.message);
  process.exit(1);
});
