# Development Tips & Best Practices

## 🎯 Quick Commands Reference

### Development
```powershell
# Start both frontend and backend
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Install all dependencies
npm install
cd client; npm install; cd ..

# Quick start (after initial setup)
.\start.ps1
```

### Testing API Endpoints

You can test the API using PowerShell:

```powershell
# Test server is running
Invoke-RestMethod -Uri "http://localhost:5000/api/videos" -Method Get

# Register a new user
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

## 🏗️ Project Architecture Explained

### Backend Architecture (MVC Pattern)

**Models** (`backend/models/`)
- Define data structure and relationships
- Handle data validation
- Include instance methods (e.g., password matching)

**Controllers** (`backend/controllers/`)
- Business logic for each feature
- Handle request/response
- Call model methods and send responses

**Routes** (`backend/routes/`)
- Define API endpoints
- Connect URLs to controllers
- Apply middleware (auth, validation)

**Middleware** (`backend/middleware/`)
- Authentication checks
- Error handling
- Request preprocessing

### Frontend Architecture (Component-Based)

**Context** (`client/src/context/`)
- Global state management
- Authentication state
- Shared data across components

**Pages** (`client/src/pages/`)
- Full page components
- Route components
- Handle page-level logic

**Components** (`client/src/components/`)
- Reusable UI pieces
- Self-contained functionality
- Props-based customization

**Utils** (`client/src/utils/`)
- Helper functions
- API calls
- Formatting utilities

## 💾 MongoDB Operations

### Useful MongoDB Commands

```javascript
// Connect to MongoDB shell
mongosh

// Switch to movia database
use movia

// View all collections
show collections

// Find all users
db.users.find().pretty()

// Find all videos
db.videos.find().pretty()

// Count documents
db.users.countDocuments()
db.videos.countDocuments()

// Delete all videos (careful!)
db.videos.deleteMany({})

// Find videos by user
db.videos.find({ user: ObjectId("user_id_here") })

// Update video views
db.videos.updateOne(
  { _id: ObjectId("video_id") },
  { $inc: { views: 1 } }
)

// Create text index for search (already done automatically)
db.videos.createIndex({ title: "text", description: "text", tags: "text" })
```

## 🎨 Customization Guide

### Adding a New Page

1. **Create page component:**
```javascript
// client/src/pages/NewPage/NewPage.js
import React from 'react';
import './NewPage.css';

const NewPage = () => {
  return (
    <div className="new-page">
      <h1>New Page</h1>
    </div>
  );
};

export default NewPage;
```

2. **Create CSS file:**
```css
/* client/src/pages/NewPage/NewPage.css */
.new-page {
  padding: 24px;
}
```

3. **Add route in App.js:**
```javascript
import NewPage from './pages/NewPage/NewPage';

// In Routes component:
<Route path="/new-page" element={<NewPage />} />
```

4. **Add to sidebar (optional):**
```javascript
// client/src/components/Sidebar/Sidebar.js
const mainLinks = [
  { path: '/new-page', icon: FiStar, label: 'New Page' }
];
```

### Adding a New API Endpoint

1. **Create controller function:**
```javascript
// backend/controllers/videoController.js
exports.newFunction = async (req, res) => {
  try {
    // Your logic here
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

2. **Add route:**
```javascript
// backend/routes/videos.js
router.get('/new-endpoint', newFunction);
```

3. **Create API call in frontend:**
```javascript
// client/src/utils/api.js
export const newApiCall = () => axios.get(`${API_URL}/videos/new-endpoint`);
```

### Modifying the Color Scheme

Edit `client/src/index.css`:
```css
:root {
  --primary-color: #your-new-color;
  --secondary-color: #your-new-color;
  /* Update other colors */
}
```

### Adding New Video Categories

1. **Update model:**
```javascript
// backend/models/Video.js
category: {
  type: String,
  enum: ['Music', 'Gaming', 'YourNewCategory', ...],
}
```

2. **Update upload form:**
```javascript
// client/src/pages/Upload/Upload.js
<option value="YourNewCategory">Your New Category</option>
```

3. **Update sidebar:**
```javascript
// client/src/components/Sidebar/Sidebar.js
{ path: '/category/YourNewCategory', icon: FiIcon, label: 'Your New Category' }
```

## 🔧 Common Development Tasks

### Reset Database

```powershell
# In mongosh
use movia
db.dropDatabase()
```

### Clear All Videos

```javascript
// In mongosh
use movia
db.videos.deleteMany({})
db.users.updateMany({}, { $set: { videos: [] } })
```

### Change Admin User

```javascript
// In mongosh
use movia
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### View All Errors

Check console logs in:
- Browser DevTools (F12)
- Backend terminal output
- MongoDB logs

## 🐛 Debugging Tips

### Backend Debugging

1. **Add console logs:**
```javascript
console.log('Request body:', req.body);
console.log('User:', req.user);
```

2. **Check MongoDB queries:**
```javascript
const result = await Video.find(query);
console.log('Query result:', result);
```

3. **Use Postman or Thunder Client:**
- Test API endpoints directly
- Check request/response headers
- Verify authentication tokens

### Frontend Debugging

1. **Use React DevTools:**
- Install React DevTools browser extension
- Inspect component state and props
- Track re-renders

2. **Console logging:**
```javascript
console.log('State:', state);
console.log('Props:', props);
console.log('API response:', response.data);
```

3. **Network tab:**
- Check API calls in browser DevTools
- Verify request/response data
- Check for CORS issues

## 📱 Testing Responsive Design

### Browser DevTools

1. Press F12 to open DevTools
2. Click device toolbar icon (Ctrl+Shift+M)
3. Test different screen sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

### Common Breakpoints

```css
/* Mobile: 320px - 767px */
@media (max-width: 767px) { }

/* Tablet: 768px - 1199px */
@media (max-width: 1199px) { }

/* Desktop: 1200px+ */
@media (min-width: 1200px) { }
```

## 🚀 Performance Optimization

### Backend

1. **Add indexes to MongoDB:**
```javascript
// In model schema
VideoSchema.index({ user: 1, createdAt: -1 });
VideoSchema.index({ views: -1 });
```

2. **Implement pagination:**
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

const videos = await Video.find()
  .limit(limit)
  .skip(skip);
```

3. **Use select() to limit fields:**
```javascript
const users = await User.find().select('username avatar -_id');
```

### Frontend

1. **Lazy load components:**
```javascript
const Upload = React.lazy(() => import('./pages/Upload/Upload'));
```

2. **Optimize images:**
- Use WebP format
- Compress thumbnails
- Implement lazy loading

3. **Memoize expensive computations:**
```javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

## 🔐 Security Best Practices

### Backend Security

1. **Never log sensitive data:**
```javascript
// ❌ Bad
console.log('Password:', password);

// ✓ Good
console.log('User authenticated');
```

2. **Validate all inputs:**
```javascript
const { title, description } = req.body;
if (!title || !description) {
  return res.status(400).json({ message: 'Missing required fields' });
}
```

3. **Rate limiting (future implementation):**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

### Frontend Security

1. **Never store sensitive data in localStorage:**
```javascript
// ❌ Bad
localStorage.setItem('password', password);

// ✓ Good
localStorage.setItem('token', token); // Only JWT token
```

2. **Sanitize user inputs:**
```javascript
const sanitizedText = text.trim().replace(/<script>/g, '');
```

3. **Use environment variables:**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

## 📊 Useful VS Code Extensions

- **ES7+ React/Redux/React-Native snippets**: Fast React component creation
- **Prettier**: Code formatting
- **ESLint**: Code linting
- **MongoDB for VS Code**: MongoDB management
- **Thunder Client**: API testing
- **GitLens**: Git integration
- **Auto Rename Tag**: HTML/JSX tag renaming
- **Path Intellisense**: File path autocomplete

## 🎓 Learning Resources

### MERN Stack
- MongoDB University: https://university.mongodb.com/
- React Documentation: https://react.dev/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices

### Video Streaming
- HLS Streaming: https://developer.apple.com/streaming/
- WebRTC: https://webrtc.org/
- Video.js: https://videojs.com/

### Design
- Material Design: https://material.io/
- Responsive Design: https://web.dev/responsive-web-design-basics/
- CSS Tricks: https://css-tricks.com/

## 💡 Pro Tips

1. **Use Git for version control:**
```powershell
git init
git add .
git commit -m "Initial commit"
```

2. **Keep dependencies updated:**
```powershell
npm outdated
npm update
```

3. **Write meaningful commit messages:**
```powershell
git commit -m "Add video upload functionality"
git commit -m "Fix comment delete bug"
```

4. **Comment complex code:**
```javascript
// Calculate trending score based on views, likes, and recency
const trendingScore = (views * 0.5) + (likes * 2) - (daysSinceUpload * 0.1);
```

5. **Use async/await over callbacks:**
```javascript
// ✓ Good
const data = await fetchData();

// ❌ Avoid
fetchData((err, data) => {});
```

## 📝 Code Snippets

### Quick User Creation (for testing)

```javascript
// In mongosh
use movia

db.users.insertOne({
  username: "testuser",
  email: "test@test.com",
  password: "$2a$10$...", // Use bcrypt to hash
  avatar: "https://via.placeholder.com/150",
  channelName: "Test Channel",
  subscribers: [],
  subscribedTo: [],
  videos: [],
  likedVideos: [],
  watchHistory: [],
  createdAt: new Date()
})
```

### Quick API Test

```javascript
// In browser console or Node.js
fetch('http://localhost:5000/api/videos')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

**Remember:** Always test your changes in development before deploying to production!

Happy Coding! 🚀
