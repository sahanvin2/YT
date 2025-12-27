# URGENT: How to Get Correct Brevo SMTP Credentials

## The Problem
The SMTP key you provided is an **API key**, not SMTP login credentials.

## Solution - Get SMTP Login (2 Minutes!)

### Step 1: Login to Brevo Dashboard
Go to: https://app.brevo.com/

### Step 2: Navigate to SMTP & API
1. Click your name/profile (top right)
2. Click **"Settings"**
3. Click **"SMTP & API"** from left menu

### Step 3: Get SMTP Credentials
Look for a section that says **"SMTP"** tab

You should see:
```
SMTP Server: smtp-relay.sendinblue.com (or smtp-relay.brevo.com)
Port: 587
Login: YOUR_LOGIN_HERE  (This is what we need!)
Password/Key: xsmtpsib-xxx... (This is what we need!)
```

### What You Need to Copy:
1. **Login**: Usually looks like your email OR a generated login
2. **SMTP Key**: The long key starting with `xsmtpsib-`

### Alternative: Create New SMTP Credentials
If you can't find existing credentials:

1. In Brevo Dashboard → **SMTP & API**
2. Look for **"Generate a new SMTP key"** button
3. Click it
4. Copy the:
   - **Login** (username)
   - **SMTP Key** (password)

### Then Update .env:
```env
MAIL_USERNAME=THE_LOGIN_YOU_COPIED
MAIL_PASSWORD=xsmtpsib-YOUR-KEY-HERE
```

## Quick Alternative - Gmail SMTP (Works Immediately!)

If Brevo is confusing, use Gmail instead:

### Step 1: Enable 2-Factor Auth on Gmail
Go to: https://myaccount.google.com/security

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Click "Generate"
4. Copy the 16-character password

### Step 3: Update .env:
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=snawarathne33@gmail.com
MAIL_PASSWORD=your-16-char-app-password-here
MAIL_FROM_NAME=Xclub
MAIL_FROM_ADDRESS=snawarathne33@gmail.com
```

---

## After Fixing:

Test with:
```bash
node test-email.js snawarathne33@gmail.com
```

Should see:
```
✅ EMAIL SENT SUCCESSFULLY!
```

Then send to all users:
```bash
node send-welcome-emails.js
```

---

**Choose whichever is easier for you! Gmail is usually faster to set up.** 🚀
