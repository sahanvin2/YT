# Email Service Setup Guide

## ✅ Email Features Implemented

The following email features have been added to Xclub:

### 1. **Email Verification** 📧
- New users receive a verification email upon registration
- Verification link expires in 24 hours
- Users can resend verification emails
- Welcome email sent after successful verification

### 2. **Password Reset** 🔐
- Users can request password reset via email
- Reset link expires in 1 hour
- Secure token-based reset process

### 3. **Email Templates** 🎨
- Beautiful branded HTML email templates
- Responsive design for all devices
- Xclub branding and styling

---

## 🚀 Brevo Email Service Configuration

The system is configured to use **Brevo (Sendinblue)** SMTP service.

### Environment Variables Required

Add these to your `.env` file on the EC2 server:

```bash
# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your_brevo_smtp_username
MAIL_PASSWORD=your_brevo_smtp_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@xclub.asia
MAIL_FROM_NAME="Xclub"

# Client URL (for email links)
CLIENT_URL=https://xclub.asia
```

**Note**: Replace `your_brevo_smtp_username` and `your_brevo_smtp_password` with your actual Brevo SMTP credentials.

---

## 📝 API Endpoints

### Registration (with email verification)
```
POST /api/auth/register
Body: { "name": "John Doe", "email": "user@example.com", "password": "password123" }
Response: User gets verification email
```

### Email Verification
```
GET /api/auth/verify-email/:token
Response: Marks email as verified, sends welcome email
```

### Resend Verification Email
```
POST /api/auth/resend-verification
Headers: Authorization: Bearer <token>
Response: Sends new verification email
```

### Forgot Password
```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
Response: Sends password reset email
```

### Reset Password
```
PUT /api/auth/reset-password/:token
Body: { "password": "newpassword123" }
Response: Resets password and returns new token
```

---

## 🔧 Setup Instructions for EC2

### Step 1: Add Environment Variables

SSH into your EC2 server:
```bash
ssh -i "movia.pem" ubuntu@3.238.106.222
```

Edit the .env file:
```bash
cd /home/ubuntu/YT
nano .env
```

Add the email configuration (see above).

### Step 2: Pull Latest Code

```bash
cd /home/ubuntu/YT
git pull
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Restart Server

```bash
pm2 restart all
# or
pm2 restart backend
```

### Step 5: Test Email Service

Check logs to confirm email service is ready:
```bash
pm2 logs backend
```

You should see: `✅ Email service is ready to send messages`

---

## 🧪 Testing

### Test Registration with Email:
1. Register a new user on xclub.asia
2. Check email inbox for verification email
3. Click verification link
4. Receive welcome email

### Test Password Reset:
1. Go to forgot password page
2. Enter your email
3. Check inbox for reset email
4. Click reset link and set new password

---

## 📊 Email Templates Included

1. **Verification Email** - Sent on registration
   - Professional design with Xclub branding
   - Clear call-to-action button
   - 24-hour expiry warning

2. **Welcome Email** - Sent after email verification
   - Welcomes user to platform
   - Lists key features
   - Encourages exploration

3. **Password Reset Email** - Sent on forgot password
   - Security-focused design
   - Clear reset button
   - 1-hour expiry warning
   - Security notice if not requested

---

## 🔍 Monitoring

### Check Email Logs
```bash
pm2 logs backend | grep "email"
```

### Email Send Status
- ✅ Success: `Verification email sent: <messageId>`
- ❌ Error: `Error sending verification email: <error>`

---

## 🐛 Troubleshooting

### Email Not Sending
1. Check Brevo credentials in .env
2. Verify MAIL_HOST and MAIL_PORT
3. Check server logs: `pm2 logs backend`
4. Ensure port 587 is open in security group

### Verification Link Not Working
1. Check CLIENT_URL is set correctly
2. Verify token hasn't expired (24 hours)
3. Check browser console for errors

### SMTP Connection Error
1. Verify Brevo account is active
2. Check SMTP credentials
3. Ensure server can connect to smtp-relay.brevo.com:587
4. Test with: `telnet smtp-relay.brevo.com 587`

---

## 📧 Email Service Features

- **Nodemailer**: Industry-standard email sending
- **Brevo SMTP**: Reliable email delivery
- **Token-based verification**: Secure crypto tokens
- **HTML Templates**: Beautiful responsive emails
- **Error Handling**: Graceful failures, doesn't block registration
- **Logging**: Comprehensive email activity logs

---

## 🎯 User Flow

### Registration Flow:
1. User registers → Account created
2. Verification email sent (non-blocking)
3. User clicks link → Email verified
4. Welcome email sent
5. User can access all features

### Password Reset Flow:
1. User requests reset → Email sent
2. User clicks link → Reset page opens
3. User enters new password
4. Password updated → Auto login

---

## ✨ Benefits

- **Trust**: Email verification builds user trust
- **Security**: Password reset via email is secure
- **Communication**: Direct channel to users
- **Professional**: Branded emails enhance credibility
- **Recovery**: Users can recover forgotten passwords

---

## 📈 Future Enhancements

Possible additions:
- Email notifications for new videos from subscribed channels
- Comment reply notifications
- Weekly digest emails
- Channel milestone emails
- Admin notification emails

---

## 🆘 Support

For issues or questions:
- Check logs: `pm2 logs backend`
- Review Brevo dashboard for send statistics
- Verify environment variables are set correctly

---

**Setup Date**: December 23, 2025  
**Email Provider**: Brevo (Sendinblue)  
**Status**: ✅ Ready to deploy
