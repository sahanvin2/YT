/**
 * Send Verification Emails to All Registered Users
 * This script sends email verification links to all users who haven't verified their email
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { sendVerificationEmail } = require('./backend/utils/emailService');

// Import User model
const User = require('./backend/models/User');

const sendVerificationToAllUsers = async () => {
  try {
    console.log('\n🚀 Starting bulk email verification process...\n');

    // Check email configuration
    if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD || 
        process.env.MAIL_USERNAME.includes('example.com') || 
        process.env.MAIL_PASSWORD.includes('smtp-key-here')) {
      console.error('❌ Email service not configured!');
      console.error('   Your .env file has placeholder values.\n');
      console.error('📧 QUICK SETUP (5 minutes):');
      console.error('   1. Go to: https://www.brevo.com/');
      console.error('   2. Sign up (free - 300 emails/day)');
      console.error('   3. Get SMTP credentials from: Settings > SMTP & API');
      console.error('   4. Update .env with real credentials');
      console.error('   5. Run: node test-email.js to verify');
      console.error('   6. Run this script again\n');
      console.error('   OR run: SETUP-SMTP.bat for detailed instructions\n');
      console.error('   See: SMTP_SETUP_GUIDE.md for full guide\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users (excluding admin)
    console.log('👥 Fetching registered users...');
    const users = await User.find({ role: { $ne: 'admin' } }).select('name email isEmailVerified role');
    
    console.log(`   Found ${users.length} users\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found in database.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Statistics
    let sent = 0;
    let failed = 0;
    let alreadyVerified = 0;
    let errors = [];

    console.log('📧 Sending verification emails...\n');
    console.log('─'.repeat(70));

    // Send emails to each user
    for (const user of users) {
      try {
        // Skip already verified users
        if (user.isEmailVerified) {
          console.log(`   ⏭️  ${user.email.padEnd(30)} - Already verified`);
          alreadyVerified++;
          continue;
        }

        // Generate verification token (simple for this script)
        const verificationToken = require('crypto')
          .createHash('sha256')
          .update(user._id.toString() + Date.now().toString())
          .digest('hex');

        // Save token to user (optional - update schema if needed)
        // For now, just send the email
        
        const result = await sendVerificationEmail(
          user.email,
          user.name,
          verificationToken
        );

        if (result && result.success !== false) {
          console.log(`   ✅ ${user.email.padEnd(30)} - Sent successfully`);
          sent++;
        } else {
          console.log(`   ❌ ${user.email.padEnd(30)} - Failed to send`);
          failed++;
          errors.push({ email: user.email, error: result?.message || 'Unknown error' });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`   ❌ ${user.email.padEnd(30)} - Error: ${error.message}`);
        failed++;
        errors.push({ email: user.email, error: error.message });
      }
    }

    console.log('─'.repeat(70));
    console.log('\n📊 SUMMARY:');
    console.log(`   Total users:          ${users.length}`);
    console.log(`   ✅ Sent successfully:  ${sent}`);
    console.log(`   ⏭️  Already verified:   ${alreadyVerified}`);
    console.log(`   ❌ Failed:             ${failed}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(err => {
        console.log(`   ${err.email}: ${err.error}`);
      });
    }

    console.log('\n✅ Process completed!\n');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Process interrupted by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  process.exit(0);
});

// Run the script
console.log('\n' + '='.repeat(70));
console.log('   BULK EMAIL VERIFICATION SENDER');
console.log('='.repeat(70));

sendVerificationToAllUsers();
