const mongoose = require('mongoose');

const connectDB = async () => {
  // Use default local MongoDB if not set (for local development)
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGO_URI is not defined in .env file');
    console.error('   Current working directory:', process.cwd());
    console.error('   NODE_ENV:', process.env.NODE_ENV);
    console.error('   Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')).join(', ') || 'none');
    throw new Error('❌ MONGO_URI is not defined in .env file');
  }
  
  // Log MongoDB URI (hide password)
  const uriForLog = uri.replace(/:[^:@]+@/, ':****@');
  console.log(`MongoDB URI: ${uriForLog}`);

  try {
    mongoose.set('strictQuery', false);  // Prevent strict query errors in mongoose
    console.log('🌐 Attempting to connect to MongoDB...');

    // Connect to MongoDB
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Set connection timeout
      socketTimeoutMS: 45000,          // Set socket timeout
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);

    // Monitor connection events for better troubleshooting
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Failed');
    console.error('Error:', err.message);

    // Provide helpful error messages
    if (err.message.includes('ENOTFOUND')) {
      console.error('💡 Check your internet connection and MongoDB cluster address');
    } else if (err.message.includes('authentication failed')) {
      console.error('💡 Check your MongoDB username and password in MONGO_URI');
    } else if (err.message.includes('timed out')) {
      console.error('💡 Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for testing)');
    }
    
    throw err;
  }
};

module.exports = connectDB;
