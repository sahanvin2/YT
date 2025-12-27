# SMTP Email Service Setup Guide 📧

## Current Issue
Your SMTP credentials in `.env` are placeholder values, causing authentication errors:
```
❌ Email service configuration error: Error: Invalid login: 535 5.7.8 Authentication failed
```

## Quick Fix - Setup Brevo (Recommended - FREE)

### Step 1: Create Brevo Account
1. Go to https://www.brevo.com/
2. Sign up for a **FREE account** (300 emails/day limit)
3. Verify your email address

### Step 2: Get SMTP Credentials
1. Login to Brevo dashboard
2. Go to: **Settings** → **SMTP & API**
3. Click **"SMTP"** tab
4. Click **"Create a new SMTP key"** or use existing one
5. Copy your credentials:
   - **Login (Username)**: your email used for Brevo
   - **SMTP Key (Password)**: the generated key (looks like: `xsmtpsib-xxx...`)

### Step 3: Update .env File
Replace these lines in your `.env` file:

```env
# Email Configuration (Brevo/SendinBlue SMTP - Free Tier)
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your-actual-email@gmail.com
MAIL_PASSWORD=xsmtpsib-your-actual-smtp-key-here
MAIL_FROM_NAME=Movia
MAIL_FROM_ADDRESS=noreply@movia.com
```

**Important:**
- `MAIL_USERNAME` = Your Brevo login email
- `MAIL_PASSWORD` = The SMTP key from Brevo (NOT your Brevo password)
- `MAIL_FROM_ADDRESS` can be any email, doesn't need to exist

### Step 4: Restart Server
After updating `.env`:
```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

You should see:
```
✅ Email service is ready to send messages
```

## Alternative - Gmail SMTP (Free but requires App Password)

### If you prefer Gmail:

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select **Mail** and your device
   - Copy the 16-character password

3. **Update .env**:
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=youremail@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM_NAME=Movia
MAIL_FROM_ADDRESS=youremail@gmail.com
```

## Troubleshooting

### Error: "Invalid login"
- Double-check your SMTP credentials
- Make sure you're using the SMTP key, not your account password
- Verify your Brevo account is active

### Error: "Connection timeout"
- Check your firewall/antivirus
- Ensure port 587 is not blocked
- Try port 465 with `MAIL_PORT=465`

### Emails going to spam
- Add SPF record to your domain (if using custom domain)
- Use Brevo's verified sender address
- Avoid spam trigger words in subject/body

## Testing Email Service

Run this script to test:
```bash
node test-email.js
```

(Script will be created in next step)

## Email Templates Available

The system includes these email templates:
- ✉️ **Email Verification** - Welcome new users
- 🔐 **Password Reset** - Secure password recovery
- 🎉 **Welcome Email** - After successful verification
- 📊 **Video Processed** - Notify when video encoding completes
- 👥 **New Follower** - Social notifications
- 💬 **New Comment** - Engagement alerts

## Free Tier Limits

### Brevo (Recommended)
- ✅ 300 emails per day
- ✅ Unlimited contacts
- ✅ SMTP + API access
- ✅ Email templates
- ✅ No credit card required

### Gmail
- ✅ 100-500 emails per day
- ⚠️ Requires 2FA + App Password
- ⚠️ May flag as suspicious activity

## Production Recommendations

For production use with high email volume:
1. **Upgrade Brevo** - $25/mo for 20K emails
2. **Amazon SES** - $0.10 per 1,000 emails
3. **SendGrid** - 100 emails/day free, then paid
4. **Mailgun** - 5,000 emails/mo free for 3 months

## Status Check

After configuration, you'll see on server start:
```
✅ Email service is ready to send messages
```

If you see:
```
⚠️ Email service not configured
```
Check your `.env` file has all MAIL_* variables set correctly.
