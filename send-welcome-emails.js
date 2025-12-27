/**
 * Send Welcome & Apology Emails to All Users
 * Special message apologizing for system issues and welcoming users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Import User model
const User = require('./backend/models/User');

const sendWelcomeAndApologyEmails = async () => {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('   XCLUB - WELCOME & APOLOGY EMAIL CAMPAIGN');
    console.log('='.repeat(70) + '\n');

    // Check email configuration
    if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
      console.error('❌ Email service not configured!\n');
      process.exit(1);
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    console.log('📧 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users (excluding admin)
    console.log('👥 Fetching registered users...');
    const users = await User.find({ role: { $ne: 'admin' } }).select('name email isEmailVerified role createdAt');
    
    console.log(`   Found ${users.length} users\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found in database.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Statistics
    let sent = 0;
    let failed = 0;
    let errors = [];

    console.log('📧 Sending welcome & apology emails...\n');
    console.log('─'.repeat(70));

    // Send emails to each user
    for (const user of users) {
      try {
        const mailOptions = {
          from: `"${process.env.MAIL_FROM_NAME || 'Xclub'}" <${process.env.MAIL_FROM_ADDRESS || 'noreply@xclub.asia'}>`,
          to: user.email,
          subject: '🎬 Welcome Back to Xclub - We Missed You!',
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Xclub</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      padding: 0;
      margin: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    .header {
      text-align: center;
      padding: 40px 20px 30px;
      color: white;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      background: white;
      color: #333;
      padding: 40px 30px;
      margin: 0;
    }
    .greeting {
      font-size: 24px;
      color: #667eea;
      margin-bottom: 20px;
      font-weight: bold;
    }
    .message {
      font-size: 16px;
      margin: 15px 0;
      line-height: 1.8;
    }
    .highlight-box {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .apology-box {
      background: #f8f9fa;
      border-left: 4px solid #ff6b6b;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .feature-list {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .feature-item {
      margin: 12px 0;
      padding-left: 25px;
      position: relative;
    }
    .feature-item:before {
      content: "✨";
      position: absolute;
      left: 0;
    }
    .button {
      display: inline-block;
      padding: 18px 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 18px;
      margin: 25px 0;
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
      text-align: center;
    }
    .stat-item {
      flex: 1;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    .footer {
      text-align: center;
      padding: 30px 20px;
      color: white;
      font-size: 14px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-link {
      display: inline-block;
      margin: 0 10px;
      color: white;
      text-decoration: none;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎬</div>
      <h1 class="title">XCLUB</h1>
      <p style="font-size: 18px; margin: 10px 0 0; opacity: 0.9;">Your Premium Video Platform</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${user.name}! 👋</div>
      
      <p class="message">
        We're reaching out with both an <strong>apology</strong> and <strong>exciting news</strong> to share with you.
      </p>

      <div class="apology-box">
        <h3 style="color: #ff6b6b; margin-top: 0;">🙏 Our Sincere Apologies</h3>
        <p style="margin-bottom: 0;">
          We recently experienced some technical difficulties that may have affected your experience on Xclub. 
          Our system underwent maintenance and updates, and we deeply apologize for any inconvenience this may have caused. 
          Your patience and understanding mean the world to us.
        </p>
      </div>

      <div class="highlight-box">
        <h3 style="color: #667eea; margin-top: 0;">✨ Great News - We're Better Than Ever!</h3>
        <p style="margin-bottom: 0;">
          We've completely rebuilt and optimized our platform with cutting-edge technology. 
          Xclub is now faster, more reliable, and packed with amazing features just for you!
        </p>
      </div>

      <div class="feature-list">
        <h3 style="color: #667eea; margin-top: 0;">🚀 What's New & Improved:</h3>
        <div class="feature-item"><strong>GPU-Accelerated Processing</strong> - Lightning-fast video uploads</div>
        <div class="feature-item"><strong>HLS Streaming</strong> - Smooth playback in any quality (144p-1080p)</div>
        <div class="feature-item"><strong>Enhanced Security</strong> - Your data is safer than ever</div>
        <div class="feature-item"><strong>Better Performance</strong> - 3x faster loading times</div>
        <div class="feature-item"><strong>Improved UI</strong> - Beautiful new design</div>
        <div class="feature-item"><strong>Email Notifications</strong> - Stay updated on everything</div>
      </div>

      <div class="stats">
        <div class="stat-item">
          <div class="stat-number">∞</div>
          <div class="stat-label">Videos</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">HD</div>
          <div class="stat-label">Quality</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">24/7</div>
          <div class="stat-label">Access</div>
        </div>
      </div>

      <p class="message">
        We're committed to providing you with the <strong>best video streaming experience</strong> possible. 
        Your feedback helped us identify areas for improvement, and we've listened!
      </p>

      <p class="message" style="font-size: 18px; color: #667eea; font-weight: bold;">
        🎉 Everything is now running perfectly and ready for you!
      </p>

      <center>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="button">
          🚀 Explore Xclub Now
        </a>
      </center>

      <div class="divider"></div>

      <p class="message">
        <strong>What You Can Do Right Now:</strong>
      </p>
      <ul style="line-height: 2;">
        <li>📤 Upload your videos (up to 5GB!)</li>
        <li>🎬 Watch unlimited content in HD</li>
        <li>💬 Comment and interact with creators</li>
        <li>❤️ Like and save your favorites</li>
        <li>📱 Access from any device</li>
      </ul>

      <p class="message">
        Thank you for being part of the Xclub family. We're honored to have you with us, 
        and we promise to continue improving and delivering the best service possible.
      </p>

      <p class="message" style="margin-top: 30px;">
        <strong>With gratitude and excitement,</strong><br>
        The Xclub Team 💜
      </p>

      <p style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        P.S. - If you experience any issues or have suggestions, we're here to listen. 
        Your satisfaction is our top priority! 🌟
      </p>
    </div>
    
    <div class="footer">
      <p style="font-size: 16px; margin-bottom: 15px;">Join us on our journey!</p>
      
      <div class="divider"></div>
      
      <p style="margin: 15px 0;">© ${new Date().getFullYear()} Xclub. All rights reserved.</p>
      <p style="font-size: 12px; opacity: 0.8;">
        You're receiving this email because you're a valued member of Xclub.<br>
        ${process.env.CLIENT_URL || 'http://localhost:3000'}
      </p>
    </div>
  </div>
</body>
</html>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`   ✅ ${user.email.padEnd(35)} - Sent successfully`);
        sent++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`   ❌ ${user.email.padEnd(35)} - Error: ${error.message}`);
        failed++;
        errors.push({ email: user.email, error: error.message });
      }
    }

    console.log('─'.repeat(70));
    console.log('\n📊 CAMPAIGN SUMMARY:');
    console.log(`   Total users:          ${users.length}`);
    console.log(`   ✅ Sent successfully:  ${sent}`);
    console.log(`   ❌ Failed:             ${failed}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(err => {
        console.log(`   ${err.email}: ${err.error}`);
      });
    }

    console.log('\n✅ Email campaign completed!\n');
    console.log('💜 Your users have been notified and welcomed back!\n');

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

// Run the script
sendWelcomeAndApologyEmails();
