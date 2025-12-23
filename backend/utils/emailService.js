const nodemailer = require('nodemailer');

// Create transporter with Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email service configuration error:', error);
  } else {
    console.log('✅ Email service is ready to send messages');
  }
});

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} verificationToken - Verification token
 */
const sendVerificationEmail = async (email, name, verificationToken) => {
  const verificationUrl = `${process.env.CLIENT_URL || 'https://xclub.asia'}/verify-email/${verificationToken}`;
  
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME || 'Xclub'}" <${process.env.MAIL_FROM_ADDRESS || 'noreply@xclub.asia'}>`,
    to: email,
    subject: 'Verify Your Xclub Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 40px;
            color: white;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 30px;
          }
          .content {
            background: white;
            color: #333;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 20px;
            opacity: 0.8;
          }
          .token {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            word-break: break-all;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎬 Xclub</div>
          
          <div class="content">
            <h2>Welcome to Xclub, ${name}! 🎉</h2>
            <p>Thank you for signing up! We're excited to have you join our community.</p>
            
            <p>To complete your registration and start enjoying unlimited videos, please verify your email address by clicking the button below:</p>
            
            <center>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </center>
            
            <p>Or copy and paste this link in your browser:</p>
            <div class="token">${verificationUrl}</div>
            
            <p><strong>⏰ This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with Xclub, please ignore this email.</p>
            
            <p>Best regards,<br>The Xclub Team</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Xclub. All rights reserved.</p>
            <p>You're receiving this email because you signed up for Xclub.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || 'https://xclub.asia'}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME || 'Xclub'}" <${process.env.MAIL_FROM_ADDRESS || 'noreply@xclub.asia'}>`,
    to: email,
    subject: 'Reset Your Xclub Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 40px;
            color: white;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 30px;
          }
          .content {
            background: white;
            color: #333;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 20px;
            opacity: 0.8;
          }
          .token {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            word-break: break-all;
            margin: 15px 0;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎬 Xclub</div>
          
          <div class="content">
            <h2>Password Reset Request 🔐</h2>
            <p>Hello ${name},</p>
            
            <p>We received a request to reset your password for your Xclub account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            
            <p>Or copy and paste this link in your browser:</p>
            <div class="token">${resetUrl}</div>
            
            <p><strong>⏰ This link will expire in 1 hour.</strong></p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> If you didn't request a password reset, please ignore this email or contact our support team if you're concerned about your account security.
            </div>
            
            <p>Best regards,<br>The Xclub Team</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Xclub. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send welcome email (after verification)
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 */
const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME || 'Xclub'}" <${process.env.MAIL_FROM_ADDRESS || 'noreply@xclub.asia'}>`,
    to: email,
    subject: 'Welcome to Xclub! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Xclub</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 40px;
            color: white;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 30px;
          }
          .content {
            background: white;
            color: #333;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 20px;
            opacity: 0.8;
          }
          .feature {
            margin: 15px 0;
            padding: 10px;
          }
          .feature-icon {
            font-size: 24px;
            margin-right: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎬 Xclub</div>
          
          <div class="content">
            <h2>Your Account is Ready! 🚀</h2>
            <p>Hi ${name},</p>
            
            <p>Congratulations! Your email has been verified and your Xclub account is now active.</p>
            
            <h3>What you can do now:</h3>
            
            <div class="feature">
              <span class="feature-icon">📺</span>
              <strong>Watch unlimited videos</strong> - Explore thousands of videos
            </div>
            
            <div class="feature">
              <span class="feature-icon">⬆️</span>
              <strong>Upload your content</strong> - Share your videos with the world
            </div>
            
            <div class="feature">
              <span class="feature-icon">👥</span>
              <strong>Subscribe to channels</strong> - Stay updated with your favorite creators
            </div>
            
            <div class="feature">
              <span class="feature-icon">💬</span>
              <strong>Comment and engage</strong> - Join the conversation
            </div>
            
            <center>
              <a href="${process.env.CLIENT_URL || 'https://xclub.asia'}" class="button">Start Exploring</a>
            </center>
            
            <p>We're thrilled to have you as part of our community!</p>
            
            <p>Best regards,<br>The Xclub Team</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Xclub. All rights reserved.</p>
            <p>Need help? Contact us at support@xclub.asia</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  transporter
};
