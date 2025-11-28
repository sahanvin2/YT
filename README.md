# Movia - Video Hosting Platform

A full-featured video hosting platform built with MERN stack (MongoDB, Express, React, Node.js).

## Features

- 🎥 **Video Upload & Streaming**: Upload and stream videos with quality options
- 👤 **User Authentication**: Register, login, and manage user profiles
- 💬 **Comments & Likes**: Engage with content through comments and likes
- 🔔 **Subscriptions**: Subscribe to channels and get notifications
- 🔍 **Search & Discovery**: Advanced search and video recommendations
- 📊 **Analytics Dashboard**: Track views, likes, and engagement
- 📱 **Responsive Design**: Works seamlessly on all devices
- 🎨 **Modern UI**: Clean and intuitive interface similar to YouTube

## Tech Stack

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- GridFS for video storage

### Frontend
- React 18
- React Router v6
- Context API for state management
- Axios for API calls
- CSS3 with responsive design
- Video.js for video player

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone <your-repo-url>
cd Movia
```

2. Install backend dependencies
```bash
npm install
```

3. Install frontend dependencies
```bash
cd client
npm install
cd ..
```

4. Create .env file
```bash
cp .env.example .env
```

5. Update .env with your configurations

6. Start MongoDB service

7. Run the application
```bash
# Run both frontend and backend
npm run dev

# Or run separately
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Videos
- GET `/api/videos` - Get all videos
- GET `/api/videos/:id` - Get single video
- POST `/api/videos` - Upload video (protected)
- PUT `/api/videos/:id` - Update video (protected)
- DELETE `/api/videos/:id` - Delete video (protected)
- PUT `/api/videos/:id/like` - Like/unlike video (protected)
- PUT `/api/videos/:id/view` - Increment view count

### Comments
- GET `/api/videos/:id/comments` - Get video comments
- POST `/api/videos/:id/comments` - Add comment (protected)
- DELETE `/api/comments/:id` - Delete comment (protected)

### Users
- GET `/api/users/:id` - Get user profile
- PUT `/api/users/:id` - Update user profile (protected)
- PUT `/api/users/:id/subscribe` - Subscribe/unsubscribe (protected)

### Search
- GET `/api/search?q=query` - Search videos

## Project Structure

```
Movia/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── error.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Video.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── videos.js
│   │   ├── comments.js
│   │   └── users.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── videoController.js
│   │   ├── commentController.js
│   │   └── userController.js
│   └── server.js
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── uploads/
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

MIT

# Movia

Full-stack MERN video sharing application.

## Tech Stack
- Backend: Node.js, Express, MongoDB (Mongoose)
- Frontend: React (react-router, context for auth)
- Video Processing: ffmpeg (static binaries)
- Storage: Migrating from Cloudflare R2 to Backblaze B2
- Auth: JWT (protect middleware)

## Directory Structure
```
d:\MERN\Movia
├─ backend
│  ├─ controllers
│  │  ├─ videoController.js        # Video CRUD, likes, dislikes, views, search, trending
│  │  └─ uploadController.js       # (presign / upload logic - not shown)
│  ├─ routes
│  │  ├─ uploads.js                # /api/uploads (presign, status)
│  │  └─ videoRoutes.js            # (expected: maps videoController endpoints)
│  ├─ models
│  │  ├─ Video.js                  # (Video schema: title, urls, likes, dislikes, views, sources)
│  │  ├─ User.js                   # (User schema: videos, likedVideos, subscribers)
│  │  └─ View.js                   # (Individual view events)
│  ├─ utils
│  │  ├─ r2.js                     # Legacy R2 upload/delete helpers
│  │  ├─ b2.js                     # New B2 helpers (deleteFile etc.)
│  │  └─ ffmpeg/ (optional)        # If separated
│  └─ middleware
│     ├─ auth.js                   # protect (JWT)
│     └─ error.js                  # (optional global handler)
├─ client
│  ├─ src
│  │  ├─ pages
│  │  │  ├─ Watch
│  │  │  │  └─ Watch.js            # Video playback, quality selection, actions
│  │  │  └─ ...other pages...
│  │  ├─ components
│  │  │  ├─ CommentSection/        # Comments UI
│  │  │  ├─ SubscribeButton/       # Subscription UI
│  │  │  └─ ...shared components...
│  │  ├─ context
│  │  │  └─ AuthContext.js         # Auth state (isAuthenticated)
│  │  ├─ utils
│  │  │  ├─ api.js                 # API wrappers (getVideo, likeVideo, etc.)
│  │  │  └─ helpers.js             # formatViews, formatDate
│  │  └─ styles / assets ...
│  └─ public
│     └─ index.html
└─ package.json
```

## Backend Endpoints (Video)
- GET /api/videos                      Public list (pagination, category, sort)
- GET /api/videos/:id                  Single video (+comments populated)
- POST /api/videos                     Auth upload (multipart)
- POST /api/videos/create              Auth create from existing URL (presigned workflow)
- PUT  /api/videos/:id                 Auth update
- DELETE /api/videos/:id               Auth delete (removes storage objects)
- PUT  /api/videos/:id/like            Auth like/unlike toggle
- PUT  /api/videos/:id/dislike         Auth dislike/remove toggle
- PUT  /api/videos/:id/view            Public increment + view event log
- GET  /api/videos/search?q=...        Public text search
- GET  /api/videos/trending            Public trending
- GET  /api/uploads/status             Storage provider status (added for B2)

(Streaming endpoint /api/videos/:id/stream expected in videoRoutes.js or another controller.)

## Storage Migration (R2 -> B2)
- Legacy code still imports ../utils/r2 (uploadFilePath, deleteObject).
- New delete logic introduces b2 deleteFile helper.
- Frontend previously assumed provider 'r2' via env variables.
- Add generic provider detection (status route returning provider: 'b2').
- Replace upload & presign flows with B2 once b2.js exposes:
  - presign (or direct authorization)
  - file upload/delete
  - public URL construction

## Watch Page (client/src/pages/Watch/Watch.js)
Features:
- Loads video metadata and sets primary playback URL from /api/videos/:id/stream.
- Increments views and records history (if authenticated).
- Like / dislike actions update local state counts.
- Quality selector chooses among video.sources (prefers highest).
- CommentSection rendered with populated comments.
- SubscribeButton for channel subscription.
- Clipboard share action.

## Models (Inferred Fields)
Video:
- title, description, videoUrl, thumbnailUrl
- duration, category, tags
- visibility (public/private/unlisted)
- user (ref User)
- likes [], dislikes []
- views (number), comments (refs), sources [] (variants)
User:
- username, avatar, channelName
- videos [], likedVideos []
- subscribers []
View:
- video ref, user (optional), ip, timestamp

## ffmpeg Usage
- Static binaries (ffmpeg-static, ffprobe-static).
- Probes duration before saving video record.

## Next Steps
1. Complete B2 integration (replace r2 utils imports).
2. Frontend: abstract storage provider (avoid hard-coded R2 strings).
3. Implement stream endpoint if not present (range requests / transcoded sources).
4. Add error handling middleware for consistent API responses.
5. Harden view logging (rate-limit or deduplicate if needed).

## Scripts (expected)
- start / dev scripts for backend and client (not shown).

## Environment Variables (expected)
- MONGO_URI
- JWT_SECRET
- MAX_VIDEO_SIZE_MB
- B2 credentials (keyId, applicationKey, bucket, base URL)
- (Legacy) R2 variables to be removed.

## License
Add license section as needed.
