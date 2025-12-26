# Email Service Setup Guide for Movia

## 🚨 CRITICAL: Email Not Working - Missing Configuration

Your `.env` file is missing email credentials. Follow this guide to set up email verification.

---

## Option 1: Brevo (SendinBlue) - **RECOMMENDED** (300 emails/day free)

### Step 1: Create Brevo Account
1. Go to [Brevo.com](https://www.brevo.com/) (formerly SendinBlue)
2. Sign up for a **FREE account**
3. Verify your email address

### Step 2: Get SMTP Credentials
1. Login to Brevo dashboard
2. Go to **Settings** → **SMTP & API**
3. Click **SMTP** tab
4. You'll see:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: Your Brevo email
   - **SMTP Key**: Click "Generate new SMTP key"

### Step 3: Update `.env` File
```env
# Email Configuration (Brevo SMTP)
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your-brevo-email@example.com
MAIL_PASSWORD=your-smtp-key-here
MAIL_FROM_NAME=Movia
MAIL_FROM_ADDRESS=noreply@movia.com
```

**Example:**
```env
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=john@example.com
MAIL_PASSWORD=xkeysib-abc123def456...
MAIL_FROM_NAME=Movia Video Platform
MAIL_FROM_ADDRESS=noreply@movia.com
```

---

## Option 2: Gmail SMTP (Simple but less reliable)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**

### Step 2: Create App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter: **Movia Video Platform**
5. Click **Generate**
6. Copy the 16-character password

### Step 3: Update `.env` File
```env
# Email Configuration (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM_NAME=Movia
MAIL_FROM_ADDRESS=your-gmail@gmail.com
```

**Example:**
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=moviaplatform@gmail.com
MAIL_PASSWORD=abcd efgh ijkl mnop
MAIL_FROM_NAME=Movia Video Platform
MAIL_FROM_ADDRESS=moviaplatform@gmail.com
```

---

## Option 3: Mailgun (Developer friendly)

### Step 1: Create Mailgun Account
1. Go to [Mailgun.com](https://www.mailgun.com/)
2. Sign up for free (100 emails/day)
3. Verify your email

### Step 2: Get SMTP Credentials
1. Go to **Sending** → **Domain settings** → **SMTP credentials**
2. Create new SMTP credentials
3. Copy the username and password

### Step 3: Update `.env` File
```env
# Email Configuration (Mailgun SMTP)
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=postmaster@your-sandbox-domain.mailgun.org
MAIL_PASSWORD=your-mailgun-password
MAIL_FROM_NAME=Movia
MAIL_FROM_ADDRESS=noreply@your-sandbox-domain.mailgun.org
```

---

## After Configuration

### 1. Restart Your Backend
```bash
# If running locally
npm run dev

# If running with PM2
pm2 restart backend
```

### 2. Test Email Sending
```bash
# Register a new user and check if email is received
# Check backend logs for:
✅ Email service is ready to send messages
Verification email sent to: user@example.com
```

### 3. Check Backend Logs
Look for these messages:
```
✅ Email service is ready to send messages  ← Good!
⚠️  Email service not configured             ← Bad! Check credentials
❌ Email service configuration error          ← Bad! Wrong credentials
```

---

## Troubleshooting

### Email Not Sending?

**1. Check `.env` file**
- Make sure MAIL_USERNAME and MAIL_PASSWORD are set
- No spaces before/after the `=` sign
- No quotes around values (unless they contain spaces)

**2. Check backend logs**
```bash
# Localhost
npm run dev

# EC2
pm2 logs backend --lines 100
```

**3. Verify email credentials**
- Test SMTP credentials with an email client
- Make sure you copied the correct password
- Check if the SMTP service is not blocking your server IP

**4. Check spam folder**
- Verification emails might land in spam
- Mark as "Not Spam" to whitelist

---

## Email Templates Available

Your app already has these email templates:

1. **Verification Email** - Sent on signup
   - Contains verification link
   - Expires in 24 hours
   - Beautiful HTML template with gradient design

2. **Welcome Email** - Sent after verification
   - Welcomes user to the platform
   - Includes getting started tips

3. **Password Reset Email** - Sent on forgot password
   - Contains reset link
   - Expires in 10 minutes

---

## Free Tier Limits

| Service | Free Emails/Day | Free Emails/Month |
|---------|----------------|-------------------|
| **Brevo** | 300 | 9,000 |
| **Gmail** | 500 | 15,000 |
| **Mailgun** | 100 | 3,000 |
| **SendGrid** | N/A | 100 |

**Recommendation:** Use **Brevo** - best free tier and reliable delivery.

---

## Current Status

❌ **Email service is NOT configured**
- Missing `MAIL_USERNAME` in `.env`
- Missing `MAIL_PASSWORD` in `.env`
- Users can sign up but won't receive verification emails

✅ **After configuration:**
- Users will receive verification emails
- Email verification required to access full features
- Password reset emails will work

---

## Quick Setup (Copy & Paste)

**1. Sign up at Brevo:**
```
https://www.brevo.com/
```

**2. Get SMTP key:**
```
Dashboard → Settings → SMTP & API → Generate SMTP key
```

**3. Update .env (replace with your values):**
```env
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-smtp-key
MAIL_FROM_NAME=Movia
MAIL_FROM_ADDRESS=noreply@movia.com
```

**4. Restart backend:**
```bash
pm2 restart backend
```

**5. Test:**
- Register a new user
- Check email (and spam folder)
- Verify account

---

## Need Help?

If emails still not working:
1. Check PM2 logs: `pm2 logs backend`
2. Verify SMTP credentials are correct
3. Make sure server IP is not blacklisted
4. Try different email service (Brevo → Gmail → Mailgun)

---

**Last Updated:** December 26, 2025
**Status:** ⚠️ Needs configuration
