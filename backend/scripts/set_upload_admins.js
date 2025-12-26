const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://MoviaAdmin:bbfX196Wv8dm7LlJ@movia.ytwtfrc.mongodb.net/movia?retryWrites=true&w=majority&appName=movia';

// Admin emails who can upload videos
const UPLOAD_ADMIN_EMAILS = [
  'sahannawarathne2004@gmail.com',
  'snawarathne60@gmail.com',
  'snawarathne33@gmail.com'
];

async function setUploadAdmins() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    
    console.log('✅ Connected to MongoDB\n');

    // Access users collection directly
    const usersCollection = mongoose.connection.db.collection('users');
    
    for (const email of UPLOAD_ADMIN_EMAILS) {
      const result = await usersCollection.updateOne(
        { email: email },
        {
          $set: {
            role: 'admin',
            isUploadAdmin: true
          }
        }
      );

      if (result.modifiedCount > 0 || result.matchedCount > 0) {
        console.log(`✅ Set ${email} as upload admin`);
      } else {
        console.log(`⚠️  User ${email} not found`);
      }
    }

    console.log('\n✅ Upload admins updated!');
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
setUploadAdmins();
