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
