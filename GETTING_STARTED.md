# 🚀 COMPLETE SETUP & TESTING GUIDE - Movia Platform

## ✅ Current Status: App is Running!

Your app is successfully running:
- ✅ Backend: http://localhost:5000
- ✅ Frontend: http://localhost:3000
- ✅ MongoDB: Connected to localhost

## 📋 Step-by-Step Guide to Get Everything Working

### STEP 1: Open the Application

1. Open your browser (Chrome, Edge, Firefox)
2. Go to: **http://localhost:3000**
3. You should see the Movia homepage

---

### STEP 2: Create Your First Account (Admin Account)

Since there's no existing account, let's create one:

1. **Click "Sign In"** button (top right)
2. **Click "Sign Up"** link at the bottom
3. **Fill in the registration form:**
   ```
   Username: admin
   Email: admin@movia.com
   Password: admin123
   Confirm Password: admin123
   ```
4. **Click "Sign Up"**
5. You'll be automatically logged in!

**🎉 You are now the first user (admin) of your platform!**

---

### STEP 3: Upload Your First Video

Now that you're logged in, let's test video upload:

1. **Click the red "Upload" button** in the navbar
2. **Fill in the upload form:**

   **Video File:**
   - Click "Choose video file"
   - Select any video from your computer (MP4, WebM, etc.)
   - Max size: 500MB
   - For testing, use a small video (under 50MB is best)

   **Thumbnail (Optional):**
   - Click "Choose thumbnail image"
   - Select a JPG/PNG image
   - Or skip this - a default thumbnail will be used

   **Title:**
   ```
   My First Test Video
   ```

   **Description:**
   ```
   This is my first video upload on Movia platform! Testing all features.
   ```

   **Category:**
   - Select "Entertainment" (or any category)

   **Visibility:**
   - Keep as "Public"

   **Tags:**
   ```
   test, first video, movia
   ```

3. **Click "Upload Video"**
4. Wait for upload to complete
5. You'll be redirected to the video player page!

---

### STEP 4: Test All Features

Now let's test everything:

#### A. Watch Your Video
- The video should play automatically
- Try play/pause, volume controls
- Check if view count increases

#### B. Like the Video
- Click the "Like" button (👍)
- Count should increase to 1

#### C. Add a Comment
- Scroll to the comments section
- Type: "This is my first comment! 🎉"
- Click "Comment"
- Your comment should appear

#### D. Subscribe to Yourself (Create Another Account)
Open a new **Incognito/Private window**:
1. Go to http://localhost:3000
2. Sign up with different account:
   ```
   Username: testuser
   Email: test@movia.com
   Password: test123
   ```
3. Find your admin's video
4. Click "Subscribe"
5. Add a comment
6. Like the video

#### E. Test Search
- Use the search bar at the top
- Type: "test"
- Press Enter
- Your video should appear in results

#### F. View Your Channel
- Click your avatar (top right)
- Click "Your Channel"
- You should see:
  - Your uploaded videos
  - Subscriber count
  - Channel statistics

---

### STEP 5: Create Sample Data (Optional)

To make it look like a real platform, create 2-3 more accounts and upload more videos:

**Account 2:**
```
Username: johndoe
Email: john@test.com
Password: john123
```

**Account 3:**
```
Username: janedoe
Email: jane@test.com
Password: jane123
```

Upload 2-3 videos from each account to populate your platform!

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Can't Login After Registration

**Problem:** Registration works but login fails

**Solution:**
1. Clear browser cookies/cache
2. Try registering with a different email
3. Check terminal for error messages

### Issue 2: Video Upload Fails

**Problem:** Video upload shows error

**Possible Causes:**
- File too large (max 500MB)
- Unsupported format
- No disk space

**Solution:**
1. Use smaller video file (under 100MB for testing)
2. Use MP4 format (most compatible)
3. Check `d:\MERN\Movia\uploads` folder exists

### Issue 3: Videos Don't Play

**Problem:** Video player shows error

**Solution:**
1. Make sure video file is in `uploads` folder
2. Check video format is supported by browser
3. Try MP4 format videos

### Issue 4: MongoDB Connection Error

**Problem:** Backend shows "MongoDB connection failed"

**Solution:**
```powershell
# Check if MongoDB is running:
Get-Service MongoDB

# If stopped, start it:
net start MongoDB
```

---

## 📂 Where Files Are Stored

### Uploaded Videos Location:
```
d:\MERN\Movia\uploads\
```

All uploaded videos and thumbnails are stored here. You can:
- View files directly
- Delete old test files
- Backup important files

### Database Location:
MongoDB stores data in its default location:
```
C:\Program Files\MongoDB\Server\[version]\data\
```

**Database name:** `movia`

---

## 🗄️ Database Management

### View Database Using MongoDB Compass (Recommended)

1. **Download MongoDB Compass:** https://www.mongodb.com/products/compass
2. **Install and open** MongoDB Compass
3. **Connect using:**
   ```
   mongodb://localhost:27017
   ```
4. **Find your database:** `movia`
5. **View collections:**
   - `users` - All user accounts
   - `videos` - All uploaded videos
   - `comments` - All comments

### OR Use Command Line (mongosh)

```powershell
# Open MongoDB shell
mongosh

# Switch to movia database
use movia

# View all users
db.users.find().pretty()

# View all videos
db.videos.find().pretty()

# Count documents
db.users.countDocuments()
db.videos.countDocuments()
db.comments.countDocuments()

# Delete all data (if you want to start fresh)
db.users.deleteMany({})
db.videos.deleteMany({})
db.comments.deleteMany({})
```

---

## 🎯 Testing Checklist

Use this checklist to verify everything works:

### User Management
- [ ] Register new account
- [ ] Login with account
- [ ] Logout
- [ ] Login again
- [ ] View user profile
- [ ] Edit profile (if implemented)

### Video Features
- [ ] Upload video
- [ ] View uploaded video
- [ ] Edit video details
- [ ] Delete video
- [ ] Video plays correctly
- [ ] View count increases

### Social Features
- [ ] Like video
- [ ] Unlike video
- [ ] Dislike video
- [ ] Add comment
- [ ] Delete own comment
- [ ] Like comment
- [ ] Subscribe to channel
- [ ] Unsubscribe from channel

### Navigation
- [ ] Browse home page
- [ ] Use search
- [ ] Filter by category
- [ ] View trending (if implemented)
- [ ] View history
- [ ] View subscriptions

### Responsive Design
- [ ] Test on browser (full screen)
- [ ] Resize window (tablet size)
- [ ] Use browser dev tools mobile view
- [ ] All features work on mobile

---

## 🔑 Default Test Accounts (Create These)

### Admin Account
```
Username: admin
Email: admin@movia.com
Password: admin123
```

### Test User 1
```
Username: testuser
Email: test@movia.com
Password: test123
```

### Test User 2
```
Username: demo
Email: demo@movia.com
Password: demo123
```

---

## 📊 Quick Commands Reference

### Start Application
```powershell
cd d:\MERN\Movia
npm run dev
```

### Stop Application
Press `Ctrl + C` in the terminal

### Restart Application
1. Stop with `Ctrl + C`
2. Run `npm run dev` again

### Check MongoDB Status
```powershell
Get-Service MongoDB
```

### View Backend Logs
Check the terminal where you ran `npm run dev`
- `[0]` lines = Backend logs
- `[1]` lines = Frontend logs

### Clear Browser Data
1. Press `Ctrl + Shift + Delete`
2. Select "Cookies" and "Cached images"
3. Click "Clear data"

---

## 🎬 Sample Videos for Testing

Need test videos? Here are some options:

1. **Use your own videos:**
   - Any MP4, WebM, or OGG file
   - Keep under 100MB for fast testing

2. **Download sample videos:**
   - https://sample-videos.com/
   - https://file-examples.com/

3. **Create test videos:**
   - Use your phone to record short clips
   - Use screen recording software

---

## 💡 Pro Tips

### Tip 1: Quick Testing
Open 2 browser windows side-by-side:
- Window 1: Admin account (normal browser)
- Window 2: Test user (incognito mode)

This way you can test subscriptions, comments, etc. between users!

### Tip 2: Fast Video Uploads
For testing, use very small video files (5-10 seconds, under 10MB) to save time.

### Tip 3: Monitor Uploads
Watch the `uploads` folder while testing:
```powershell
explorer d:\MERN\Movia\uploads
```

### Tip 4: Check for Errors
Always keep the terminal visible to see any errors in real-time.

### Tip 5: Browser DevTools
Press `F12` to open DevTools:
- **Console tab:** See JavaScript errors
- **Network tab:** See API calls
- **Application tab:** Check localStorage (token)

---

## 🔥 Common First-Time Issues & Solutions

### "Invalid credentials" when logging in
**Cause:** Email/password mismatch or account doesn't exist

**Fix:**
1. Make sure you registered first
2. Use exact email and password
3. Try creating a new account

### "Please upload a video file"
**Cause:** No video selected or wrong file type

**Fix:**
1. Click the file input again
2. Select a video file (MP4 recommended)
3. Make sure file is under 500MB

### Videos don't appear on home page
**Cause:** No videos uploaded yet or visibility set to "private"

**Fix:**
1. Upload at least one video with visibility "public"
2. Refresh the home page
3. Check backend terminal for errors

### Can't see upload button
**Cause:** Not logged in

**Fix:**
1. Click "Sign In"
2. Login or register
3. Upload button will appear

---

## 🎉 Success Indicators

You'll know everything is working when you can:

1. ✅ Register and login successfully
2. ✅ Upload a video and see it on your channel
3. ✅ Play the video in the video player
4. ✅ Like, comment, and share
5. ✅ Subscribe to channels
6. ✅ Search and find videos
7. ✅ Browse categories
8. ✅ See view counts increase
9. ✅ Access watch history
10. ✅ View channel pages

---

## 📞 Need Help?

If something doesn't work:

1. **Check the terminal** for error messages
2. **Check browser console** (F12) for errors
3. **Verify MongoDB is running**
4. **Restart the application**
5. **Clear browser cache**
6. **Try in incognito mode**

---

## 🎓 What's Next?

Once everything works:

1. **Customize the design** - Edit CSS files
2. **Add more features** - Playlists, notifications
3. **Deploy to production** - See DEPLOYMENT_GUIDE.md
4. **Add more users** - Invite friends to test
5. **Create content** - Build your video library

---

## 📝 Quick Start Commands

```powershell
# Navigate to project
cd d:\MERN\Movia

# Start the app
npm run dev

# Open in browser
start http://localhost:3000

# Stop the app
Ctrl + C
```

---

**🚀 Your platform is ready to use! Start by creating your admin account and uploading your first video!**

**URL: http://localhost:3000**

---

**Last Updated:** November 13, 2025
**Status:** ✅ Fully Functional
**Database:** ✅ Connected
**Servers:** ✅ Running

**ENJOY YOUR VIDEO PLATFORM! 🎬✨**
