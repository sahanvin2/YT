# 🔐 OAuth Setup Guide - Google & Microsoft Login

Complete guide to setting up social login for your XCLUB video platform.

---

## 📋 Prerequisites

- Google Account (for Google OAuth)
- Microsoft Account (for Microsoft OAuth)
- Your application running on a domain or localhost

---

## 🔵 GOOGLE OAUTH SETUP

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Xclub Video Platform"
4. Click "Create"

### Step 2: Enable Google+ API

1. In the sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: Xclub
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
   - Click "Save and Continue"
   - Scopes: Add `userinfo.email` and `userinfo.profile`
   - Test users: Add your email
   - Click "Save and Continue"

4. Create OAuth Client ID:
   - Application type: Web application
   - Name: Xclub Web Client
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     http://localhost:5000
     https://yourdomain.com
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:5000/api/auth/google/callback
     https://yourdomain.com/api/auth/google/callback
     ```
   - Click "Create"

5. Copy the Client ID and Client Secret

### Step 4: Update .env File

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## 🔷 MICROSOFT OAUTH SETUP

### Step 1: Register Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Fill in:
   - Name: Xclub Video Platform
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI:
     - Platform: Web
     - URI: `http://localhost:5000/api/auth/microsoft/callback`
   - Click "Register"

### Step 2: Add Additional Redirect URIs

1. In your app, go to "Authentication"
2. Under "Platform configurations" → "Web" → "Redirect URIs", add:
   ```
   http://localhost:5000/api/auth/microsoft/callback
   https://yourdomain.com/api/auth/microsoft/callback
   ```
3. Enable "Access tokens" and "ID tokens" under Implicit grant
4. Click "Save"

### Step 3: Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: "Xclub OAuth Secret"
4. Expires: 24 months
5. Click "Add"
6. **IMPORTANT:** Copy the secret value immediately (you won't see it again!)

### Step 4: Get Application (Client) ID

1. Go to "Overview"
2. Copy the "Application (client) ID"

### Step 5: Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Select "Delegated permissions"
5. Add these permissions:
   - `User.Read`
   - `email`
   - `profile`
6. Click "Add permissions"
7. Click "Grant admin consent for [Your Organization]"

### Step 6: Update .env File

```env
MICROSOFT_CLIENT_ID=your_application_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
```

---

## 🧪 TESTING OAUTH

### Test Google Login:

1. Start your server: `npm run server`
2. Start your client: `npm run client`
3. Go to: http://localhost:3000/login
4. Click "Continue with Google"
5. Select your Google account
6. Grant permissions
7. You should be redirected to homepage, logged in

### Test Microsoft Login:

1. On login page, click "Continue with Microsoft"
2. Enter your Microsoft email
3. Enter password
4. Grant permissions
5. You should be redirected to homepage, logged in

---

## 🚨 TROUBLESHOOTING

### Error: "redirect_uri_mismatch"

**Solution:** Make sure your redirect URI in Google/Microsoft console exactly matches the one in your backend:
- Google: `/api/auth/google/callback`
- Microsoft: `/api/auth/microsoft/callback`

### Error: "invalid_client"

**Solution:** 
- Check that Client ID and Client Secret are correctly copied to `.env`
- No extra spaces or quotes
- Restart your server after updating `.env`

### Error: "unauthorized_client"

**Google:** Make sure Google+ API is enabled  
**Microsoft:** Make sure app registration status is "Available to users"

### User Can't Complete OAuth Flow

**Solution:**
- Check that API_URL or CLIENT_URL in `.env` matches your actual URLs
- For localhost: `http://localhost:5000` and `http://localhost:3000`
- For production: Your actual domain URLs

---

## 🔒 SECURITY BEST PRACTICES

1. **Never commit `.env` to GitHub**
   - Already in `.gitignore`
   - Use environment variables on production server

2. **Use HTTPS in Production**
   - OAuth redirect URIs must use HTTPS in production
   - Get SSL certificate (Let's Encrypt is free)

3. **Rotate Secrets Regularly**
   - Change OAuth secrets every 6-12 months
   - Especially if exposed or compromised

4. **Limit OAuth Scopes**
   - Only request permissions you actually need
   - Current: email, profile (minimal)

5. **Validate Tokens Server-Side**
   - Already implemented in backend
   - Never trust client-side token validation

---

## 📝 USER EXPERIENCE

### First-Time OAuth Users:

1. Click OAuth button
2. Redirected to Google/Microsoft
3. Grant permissions
4. Redirected back to Xclub
5. **New account created automatically**
6. Logged in immediately

### Existing Users (Same Email):

1. Click OAuth button
2. Redirected to Google/Microsoft
3. Grant permissions
4. **OAuth account linked to existing account**
5. Can now log in with either method

### Multiple Logins:

Users can:
- Log in with email/password
- Log in with Google
- Log in with Microsoft
- All linked to same account (via email)

---

## 🎨 CUSTOMIZATION

### Change OAuth Button Text:

Edit `client/src/pages/Auth/Login.js`:

```javascript
<button onClick={handleGoogleLogin} className="btn-oauth btn-google">
  <FcGoogle size={20} />
  <span>Your Custom Text Here</span>
</button>
```

### Change OAuth Button Colors:

Edit `client/src/pages/Auth/Auth.css`:

```css
.btn-google {
  background-color: #your-color;
  border-color: #your-border;
}
```

### Add More OAuth Providers:

1. Install strategy: `npm install passport-facebook`
2. Add to `backend/config/passport.js`
3. Create routes in `backend/routes/oauth.js`
4. Add button in `Login.js`

---

## 📊 PRODUCTION CHECKLIST

Before deploying to production:

- [ ] OAuth credentials created for production domain
- [ ] Redirect URIs updated to production URLs
- [ ] HTTPS enabled on production server
- [ ] Environment variables set on production server
- [ ] OAuth consent screen published (Google)
- [ ] App registration verified (Microsoft)
- [ ] Test OAuth flow on production
- [ ] Monitor OAuth errors in logs

---

## 🔗 USEFUL LINKS

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft OAuth Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [OAuth 2.0 Spec](https://oauth.net/2/)

---

## 💡 TIPS

1. **Test with Multiple Accounts**
   - Test with different Google/Microsoft accounts
   - Test account linking (same email, different OAuth)
   - Test first-time vs returning users

2. **Monitor OAuth Usage**
   - Google: [API Console Quotas](https://console.cloud.google.com/apis/dashboard)
   - Microsoft: [Azure Portal Metrics](https://portal.azure.com/)

3. **Handle Errors Gracefully**
   - User cancels OAuth: Redirect to login with message
   - OAuth fails: Show error message, log details
   - Network error: Retry or show offline message

---

## ✅ SETUP COMPLETE!

Your Xclub platform now supports:
- ✅ Email/Password login
- ✅ Google OAuth login
- ✅ Microsoft OAuth login
- ✅ Account linking
- ✅ Automatic account creation

**Users can now sign up and log in with just 2 clicks!** 🎉
