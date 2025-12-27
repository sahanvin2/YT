/**
 * Test Email Service
 * This script tests if your SMTP configuration is working correctly
 */

require('dotenv').config();
const { sendVerificationEmail } = require('./backend/utils/emailService');

const testEmail = async () => {
  console.log('\n📧 Testing Email Service...\n');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.MAIL_HOST || 'NOT SET'}`);
  console.log(`  Port: ${process.env.MAIL_PORT || 'NOT SET'}`);
  console.log(`  Username: ${process.env.MAIL_USERNAME || 'NOT SET'}`);
  console.log(`  Password: ${process.env.MAIL_PASSWORD ? '***SET***' : 'NOT SET'}`);
  console.log();

  // Get test email from command line or use default
  const testEmailAddress = process.argv[2] || process.env.MAIL_USERNAME || 'test@example.com';
  
  if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
    console.error('❌ Email service not configured!');
    console.error('   Please update your .env file with valid SMTP credentials.');
    console.error('   See SMTP_SETUP_GUIDE.md for instructions.\n');
    process.exit(1);
  }

  try {
    console.log(`📤 Sending test email to: ${testEmailAddress}...`);
    
    const result = await sendVerificationEmail(
      testEmailAddress,
      'Test User',
      'test-token-12345'
    );

    if (result && result.success !== false) {
      console.log('\n✅ EMAIL SENT SUCCESSFULLY!');
      console.log('   Check your inbox (and spam folder) for the verification email.');
      console.log('   If you received it, your email service is working correctly!\n');
    } else {
      console.log('\n⚠️  Email may not have been sent.');
      console.log('   Error:', result?.message || 'Unknown error\n');
    }
  } catch (error) {
    console.error('\n❌ EMAIL TEST FAILED!');
    console.error('   Error:', error.message);
    console.error('\nCommon solutions:');
    console.error('  1. Check your SMTP credentials in .env file');
    console.error('  2. Make sure you\'re using the SMTP key, not account password');
    console.error('  3. Verify your email service account is active');
    console.error('  4. See SMTP_SETUP_GUIDE.md for detailed instructions\n');
    process.exit(1);
  }
};

// Run test
testEmail();
