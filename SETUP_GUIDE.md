# Movia - Complete Setup & Usage Guide

## 🎯 Project Overview

**Movia** is a fully functional video hosting platform built with the MERN stack (MongoDB, Express.js, React, Node.js). It replicates core features of YouTube, VK, and Vimeo with a modern, responsive design.

## ✨ Key Features Implemented

### 1. **User Authentication & Authorization**
- User registration and login with JWT tokens
- Secure password hashing with bcrypt
- Protected routes requiring authentication
- Persistent login sessions

### 2. **Video Management**
- Video upload with file validation (max 500MB)
- Custom thumbnail support
- Video metadata (title, description, tags, category)
- Visibility settings (public, private, unlisted)
- Video deletion and editing for owners

### 3. **Video Streaming & Playback**
- Responsive video player using React Player
- View count tracking
- Video duration display
- Quality adaptive streaming

### 4. **Social Features**
- Like/Dislike videos
- Comment system with replies
- Like comments
- Delete own comments
- Real-time comment updates

### 5. **Channel System**
- User channels with custom names
- Channel descriptions and avatars
- Subscribe/Unsubscribe functionality
- Subscriber count display
- View channel videos and stats

### 6. **Discovery & Navigation**
- Home feed with latest videos
- Trending videos page
- Category-based filtering
- Search functionality with text indexing
- Suggested videos (framework ready)

### 7. **User Dashboard**
- Watch history tracking
- Liked videos collection
- Subscription feed
- User profile management

### 8. **Responsive Design**
- Mobile-first approach
- Tablet and desktop optimization
- Collapsible sidebar navigation
- Touch-friendly interfaces
- Adaptive grid layouts

## 📁 Project Structure Explained

```
Movia/
├── backend/                    # Node.js/Express Backend
│   ├── config/
│   │   └── db.js              # MongoDB connection configuration
│   ├── controllers/            # Business logic for routes
│   │   ├── authController.js  # Authentication logic
│   │   ├── videoController.js # Video operations
│   │   ├── commentController.js # Comment operations
│   │   └── userController.js  # User profile operations
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   └── error.js           # Error handling middleware
│   ├── models/                # MongoDB Schemas
│   │   ├── User.js            # User model with subscriptions
│   │   ├── Video.js           # Video model with metadata
│   │   └── Comment.js         # Comment model with replies
│   ├── routes/                # API route definitions
│   │   ├── auth.js            # /api/auth routes
│   │   ├── videos.js          # /api/videos routes
│   │   ├── comments.js        # /api/comments routes
│   │   └── users.js           # /api/users routes
│   └── server.js              # Express app entry point
│
├── client/                    # React Frontend
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── Navbar/        # Top navigation bar
│   │   │   ├── Sidebar/       # Left sidebar navigation
│   │   │   ├── VideoCard/     # Video thumbnail card
│   │   │   ├── CommentSection/ # Comments display/input
│   │   │   └── SubscribeButton/ # Subscribe toggle button
│   │   ├── pages/             # Main page components
│   │   │   ├── Home/          # Homepage video grid
│   │   │   ├── Watch/         # Video player page
│   │   │   ├── Auth/          # Login/Register pages
│   │   │   ├── Upload/        # Video upload form
│   │   │   └── Channel/       # Channel profile page
│   │   ├── context/
│   │   │   └── AuthContext.js # Global authentication state
│   │   ├── utils/
│   │   │   ├── api.js         # API call functions
│   │   │   └── helpers.js     # Utility functions
│   │   ├── App.js             # Main app component with routing
│   │   └── index.js           # React app entry point
│   └── package.json           # Frontend dependencies
│
├── uploads/                   # Video file storage (created automatically)
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Backend dependencies & scripts
└── README.md                  # Project documentation
```

## 🚀 Installation Instructions

### Prerequisites
1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
3. **Git** (optional) - [Download](https://git-scm.com/)

### Step 1: Install Backend Dependencies

Open PowerShell in the project root directory:

```powershell
cd d:\MERN\Movia
npm install
```

This installs:
- express (web framework)
- mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT tokens)
- multer (file uploads)
- cors (cross-origin requests)
- And other dependencies...

### Step 2: Install Frontend Dependencies

```powershell
cd client
npm install
cd ..
```

This installs:
- react & react-dom (UI framework)
- react-router-dom (routing)
- axios (HTTP client)
- react-player (video player)
- react-icons (icon library)
- date-fns (date formatting)

### Step 3: Configure MongoDB

1. **Start MongoDB Service:**

```powershell
# If MongoDB is installed as a service (default):
# It should already be running

# To check if MongoDB is running:
mongosh

# If connection successful, MongoDB is running
# Type 'exit' to close mongosh
```

2. **Database Configuration:**
- The app will create a database named `movia` automatically
- Connection string is in `.env`: `mongodb://localhost:27017/movia`
- No additional setup needed!

### Step 4: Environment Variables

The `.env` file is already created with default values:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/movia
JWT_SECRET=movia_secret_key_change_this_in_production_2024
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
FILE_UPLOAD_PATH=./uploads
```

⚠️ **Important**: Change `JWT_SECRET` to a secure random string for production!

## 🎮 Running the Application

### Option 1: Run Both Frontend & Backend Together (Recommended)

```powershell
npm run dev
```

This command:
- Starts the backend server on `http://localhost:5000`
- Starts the frontend dev server on `http://localhost:3000`
- Both run concurrently

### Option 2: Run Separately

**Terminal 1 - Backend:**
```powershell
npm run server
```

**Terminal 2 - Frontend:**
```powershell
npm run client
```

### Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## 📖 How to Use the Platform

### 1. Register a New Account

1. Click "Sign In" in the navbar
2. Click "Sign Up" link
3. Fill in:
   - Username (min 3 characters)
   - Email address
   - Password (min 6 characters)
4. Click "Sign Up"

### 2. Upload a Video

1. Log in to your account
2. Click the red "Upload" button in navbar
3. Fill in the form:
   - **Video File**: Select a video (max 500MB)
   - **Thumbnail**: Optional custom thumbnail image
   - **Title**: Video title (required)
   - **Description**: Detailed description (required)
   - **Category**: Choose from dropdown
   - **Visibility**: Public, Private, or Unlisted
   - **Tags**: Comma-separated keywords
4. Click "Upload Video"

### 3. Watch Videos

1. Browse videos on the home page
2. Click any video thumbnail
3. Video starts playing automatically
4. You can:
   - Like/Dislike the video
   - Share the video
   - Subscribe to the channel
   - Leave comments
   - View video description

### 4. Interact with Content

**Commenting:**
1. Scroll to comments section
2. Type your comment in the input box
3. Click "Comment"
4. Like other comments
5. Delete your own comments

**Subscribing:**
1. Go to any channel or video
2. Click "Subscribe" button
3. Button changes to "Subscribed"
4. Click again to unsubscribe

### 5. Manage Your Channel

1. Click your avatar → "Your Channel"
2. View your uploaded videos
3. See subscriber count
4. Check channel statistics

### 6. Search for Videos

1. Use the search bar in the navbar
2. Type your query
3. Press Enter or click search icon
4. Browse search results

### 7. Browse Categories

1. Use the sidebar to select categories:
   - Music
   - Gaming
   - Education
   - Entertainment
   - News
   - Sports
   - Technology

### 8. View Your Activity

- **History**: Click "History" in sidebar to see watched videos
- **Liked Videos**: View all videos you've liked
- **Subscriptions**: See channels you subscribe to

## 🔧 Backend API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `GET /api/auth/logout` - Logout user

### Videos
- `GET /api/videos` - Get all videos (with pagination)
- `GET /api/videos/:id` - Get single video
- `POST /api/videos` - Upload video (protected)
- `PUT /api/videos/:id` - Update video (protected, owner only)
- `DELETE /api/videos/:id` - Delete video (protected, owner only)
- `PUT /api/videos/:id/like` - Like/unlike video (protected)
- `PUT /api/videos/:id/dislike` - Dislike video (protected)
- `PUT /api/videos/:id/view` - Increment view count
- `GET /api/videos/search?q=query` - Search videos
- `GET /api/videos/trending` - Get trending videos

### Comments
- `GET /api/videos/:videoId/comments` - Get video comments
- `POST /api/videos/:videoId/comments` - Add comment (protected)
- `DELETE /api/comments/:id` - Delete comment (protected, owner only)
- `PUT /api/comments/:id/like` - Like comment (protected)
- `POST /api/comments/:id/reply` - Reply to comment (protected)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile (protected, owner only)
- `PUT /api/users/:id/subscribe` - Subscribe/unsubscribe (protected)
- `GET /api/users/:id/videos` - Get user's videos
- `GET /api/users/subscriptions` - Get subscriptions (protected)
- `GET /api/users/history` - Get watch history (protected)
- `POST /api/users/history/:videoId` - Add to history (protected)

## 🎨 Design Features

### Color Scheme
- **Primary Red**: #ff0000 (YouTube-inspired)
- **Dark Background**: #0f0f0f
- **Card Background**: #1a1a1a
- **Sidebar**: #212121
- **Text Primary**: #ffffff
- **Text Secondary**: #aaaaaa

### Responsive Breakpoints
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: 320px - 767px

### UI Components
- **Material Design inspired** buttons and inputs
- **Smooth animations** on hover and transitions
- **Card-based layouts** for content
- **Collapsible sidebar** for better mobile experience
- **Sticky navigation** for easy access

## 🔐 Security Features

1. **Password Hashing**: Bcrypt with salt rounds
2. **JWT Tokens**: Secure authentication tokens
3. **Protected Routes**: Middleware authentication
4. **Input Validation**: Server-side validation
5. **CORS Configuration**: Restricted cross-origin requests
6. **File Upload Limits**: Max file size restrictions

## 📊 Database Schema

### User Collection
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  avatar: String (URL),
  channelName: String,
  channelDescription: String,
  subscribers: [ObjectId],
  subscribedTo: [ObjectId],
  videos: [ObjectId],
  likedVideos: [ObjectId],
  watchHistory: [{video: ObjectId, watchedAt: Date}],
  createdAt: Date
}
```

### Video Collection
```javascript
{
  title: String,
  description: String,
  videoUrl: String,
  thumbnailUrl: String,
  duration: Number,
  views: Number,
  likes: [ObjectId],
  dislikes: [ObjectId],
  tags: [String],
  category: String,
  visibility: String (public/private/unlisted),
  user: ObjectId,
  comments: [ObjectId],
  createdAt: Date
}
```

### Comment Collection
```javascript
{
  text: String,
  user: ObjectId,
  video: ObjectId,
  likes: [ObjectId],
  replies: [{text: String, user: ObjectId, createdAt: Date}],
  createdAt: Date
}
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
```powershell
# Check if MongoDB is running
mongosh

# If not running, start MongoDB service:
net start MongoDB
```

### Port Already in Use
```powershell
# Find and kill process using port 5000:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Or change PORT in .env file to a different number
```

### Module Not Found Errors
```powershell
# Reinstall dependencies
rm -r node_modules
npm install

cd client
rm -r node_modules
npm install
```

### File Upload Issues
- Check that `uploads/` directory exists (created automatically)
- Verify file size is under 500MB
- Ensure video format is supported (MP4, WebM, etc.)

## 🚀 Future Enhancements (Not Implemented Yet)

1. **Video Processing**: Transcode videos to multiple qualities
2. **Live Streaming**: WebRTC integration
3. **Notifications**: Real-time push notifications
4. **Playlists**: Create and manage video playlists
5. **Advanced Search**: Filters by date, duration, etc.
6. **Video Analytics**: Detailed view statistics
7. **Admin Panel**: Content moderation
8. **Email Verification**: Account verification via email
9. **Social Login**: OAuth with Google, Facebook
10. **Video Recommendations**: AI-powered suggestions

## 📝 Testing the Application

### Test Flow:
1. **Register** 2-3 test accounts
2. **Upload** videos from different accounts
3. **Subscribe** between accounts
4. **Like and comment** on videos
5. **Search** for videos
6. **Browse** different categories
7. **Test** on mobile devices (responsive)

## 💡 Tips for Customization

### Change Colors:
Edit `client/src/index.css` CSS variables:
```css
:root {
  --primary-color: #your-color;
  --bg-color: #your-color;
  /* etc... */
}
```

### Add More Categories:
Edit `backend/models/Video.js` enum:
```javascript
category: {
  type: String,
  enum: ['Music', 'Gaming', 'YourCategory', ...],
}
```

### Modify Video Size Limit:
Edit `backend/controllers/videoController.js`:
```javascript
if (videoFile.size > 500000000) { // Change this value
```

## 📞 Support & Resources

- **MongoDB Docs**: https://docs.mongodb.com/
- **Express.js Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **Node.js Docs**: https://nodejs.org/docs/

## ✅ Checklist Before Deployment

- [ ] Change JWT_SECRET to secure random string
- [ ] Set NODE_ENV to 'production'
- [ ] Configure production MongoDB URI
- [ ] Set up file storage (AWS S3, Cloudinary)
- [ ] Enable HTTPS
- [ ] Set up CDN for video delivery
- [ ] Implement rate limiting
- [ ] Add email service
- [ ] Set up backup system
- [ ] Configure monitoring and logging

---

## 🎉 Congratulations!

You now have a fully functional video hosting platform! The application includes all major features of YouTube including video uploads, streaming, comments, likes, subscriptions, channels, and responsive design.

**Happy Coding! 🚀**
