const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  
  if (!uri) {
    throw new Error('❌ MONGO_URI is not defined in .env file');
  }

  try {
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
    
    // Monitor connection events
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
