require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./backend/models/User');

const fixUnverifiedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all unverified users
    const unverifiedUsers = await User.find({ 
      isEmailVerified: false,
      googleId: { $exists: false },
      microsoftId: { $exists: false }
    });

    console.log(`\n📊 Found ${unverifiedUsers.length} unverified users:\n`);

    if (unverifiedUsers.length === 0) {
      console.log('✅ No unverified users found. All users are verified!');
      process.exit(0);
    }

    // Display users
    unverifiedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.name} (Registered: ${user.createdAt})`);
    });

    // Update all unverified users to verified
    const result = await User.updateMany(
      { 
        isEmailVerified: false,
        googleId: { $exists: false },
        microsoftId: { $exists: false }
      },
      { 
        $set: { 
          isEmailVerified: true,
          emailVerificationToken: undefined,
          emailVerificationExpires: undefined
        }
      }
    );

    console.log(`\n✅ Successfully verified ${result.modifiedCount} users!`);
    console.log('🎉 All users can now sign in to the system.');

    // Display all verified users
    console.log('\n📋 Current user list:');
    const allUsers = await User.find({}).select('email name isEmailVerified role createdAt');
    allUsers.forEach((user, index) => {
      const verified = user.isEmailVerified ? '✅' : '❌';
      const role = user.role === 'admin' ? '👑 ADMIN' : '👤 User';
      console.log(`${index + 1}. ${verified} ${user.email} - ${user.name} (${role})`);
    });

    console.log(`\n📊 Total users: ${allUsers.length}`);
    console.log(`✅ Verified: ${allUsers.filter(u => u.isEmailVerified).length}`);
    console.log(`❌ Unverified: ${allUsers.filter(u => !u.isEmailVerified).length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

console.log('🔧 Fixing Unverified Users (SMTP Issue Workaround)');
console.log('═══════════════════════════════════════════════════\n');

fixUnverifiedUsers();
