const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI in environment (.env).');
  process.exit(1);
}

// Admin emails who can upload videos
// Provide as comma-separated list: UPLOAD_ADMIN_EMAILS=a@b.com,c@d.com
const UPLOAD_ADMIN_EMAILS = (process.env.UPLOAD_ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (UPLOAD_ADMIN_EMAILS.length === 0) {
  console.error('❌ Missing UPLOAD_ADMIN_EMAILS (comma-separated list) in environment.');
  process.exit(1);
}

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
