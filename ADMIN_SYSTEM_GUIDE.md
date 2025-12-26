# Admin System Implementation - Complete Guide

## Overview
This document describes the admin/client system implemented for Movia, where only designated administrators can upload videos while regular users can only watch videos.

## System Architecture

### User Roles
- **Regular User (Client)**: Can browse, watch, like, comment, and save videos
- **Upload Admin**: Has all user permissions PLUS can upload, edit, and delete videos
- **Site Admin (role='admin')**: Has upload admin privileges PLUS access to admin dashboard

### Admin Users
The following users have been designated as upload admins:
1. sahannawarathne2004@gmail.com
2. snawarathne60@gmail.com
3. snawarathne33@gmail.com

## Implementation Details

### Backend Changes

#### 1. User Model (`backend/models/User.js`)
Added new field to User schema:
```javascript
isUploadAdmin: {
  type: Boolean,
  default: false,
  description: 'Can upload and manage videos'
}
```

#### 2. Auth Middleware (`backend/middleware/auth.js`)
Added new middleware function:
```javascript
exports.requireUploadAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (!req.user.isUploadAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only upload admins can upload videos. Contact site administrator.'
    });
  }

  next();
};
```

#### 3. Protected Routes
Updated the following routes to require upload admin:

**`backend/routes/uploads.js`:**
- `POST /api/uploads/presign` - Requires `requireUploadAdmin`

**`backend/routes/videos.js`:**
- `POST /api/videos` - Create video (requires `requireUploadAdmin`)
- `POST /api/videos/create` - Create from URL (requires `requireUploadAdmin`)
- `PUT /api/videos/:id` - Update video (requires `requireUploadAdmin`)
- `DELETE /api/videos/:id` - Delete video (requires `requireUploadAdmin`)

#### 4. Admin Setup Script (`backend/scripts/set_upload_admins.js`)
Created a script to set upload admin flags for designated users:
```javascript
const emails = [
  'sahannawarathne2004@gmail.com',
  'snawarathne60@gmail.com',
  'snawarathne33@gmail.com'
];

// Sets role='admin' and isUploadAdmin=true for each user
```

**To run the script:**
```bash
cd /home/ubuntu/YT
node backend/scripts/set_upload_admins.js
```

### Frontend Changes

#### 1. AuthContext (`client/src/context/AuthContext.js`)
Exposed admin status in auth context:
```javascript
const value = {
  user,
  loading,
  register,
  login,
  logout,
  isAuthenticated: !!user,
  isUploadAdmin: user?.isUploadAdmin || false,
  isAdmin: user?.role === 'admin',
  refreshUser: loadUser
};
```

#### 2. Navbar (`client/src/components/Navbar/Navbar.js`)
Hidden the "+ Create" button for non-admin users:
```javascript
const { user, isAuthenticated, logout, isUploadAdmin } = useAuth();

{isAuthenticated && isUploadAdmin && (
  <Link to="/upload" className="create-btn">
    <FiPlus size={16} />
    <span>Create</span>
  </Link>
)}
```

#### 3. Sidebar (`client/src/components/Sidebar/Sidebar.js`)
Hidden the "Channel" section (Your Channel, Video Manager) for non-admin users:
```javascript
const { isAuthenticated, user, isUploadAdmin } = useAuth();

{isAuthenticated && user && isUploadAdmin && (
  <>
    <div className="sidebar-section">
      <div className="sidebar-title">Channel</div>
      {/* Your Channel, Video Manager links */}
    </div>
  </>
)}
```

#### 4. Upload Page (`client/src/pages/Upload/Upload.js`)
Added access restriction with friendly error message:
```javascript
const { isAuthenticated, user, isUploadAdmin } = useAuth();

if (!isUploadAdmin) {
  return (
    <div className="upload-page">
      <div className="upload-container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <FiAlertCircle size={64} style={{ color: '#ff4444' }} />
          <h2>Access Restricted</h2>
          <p>Only administrators can upload videos.</p>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </div>
    </div>
  );
}
```

## Testing the System

### As a Regular User (Non-Admin)
1. Register/Login with any email (not one of the 3 admin emails)
2. You should NOT see:
   - "+ Create" button in navbar
   - "Channel" section in sidebar
   - "Your Channel" link
   - "Video Manager" link
3. If you try to access `/upload` directly, you'll see access restricted message
4. API calls to upload endpoints will return 403 Forbidden

### As an Admin User
1. Login with one of the admin emails:
   - sahannawarathne2004@gmail.com
   - snawarathne60@gmail.com
   - snawarathne33@gmail.com
2. You SHOULD see:
   - "+ Create" button in navbar
   - "Channel" section in sidebar
   - "Your Channel" link
   - "Video Manager" link
3. You can upload, edit, and delete videos
4. Full access to all video management features

## Adding New Admins

### Option 1: Using the Script (Recommended)
1. SSH into the EC2 server:
   ```bash
   ssh -i "movia.pem" ubuntu@3.238.106.222
   ```

2. Edit the script to add new email:
   ```bash
   cd /home/ubuntu/YT
   nano backend/scripts/set_upload_admins.js
   ```

3. Add the new email to the array:
   ```javascript
   const emails = [
     'sahannawarathne2004@gmail.com',
     'snawarathne60@gmail.com',
     'snawarathne33@gmail.com',
     'newemail@example.com'  // Add here
   ];
   ```

4. Run the script:
   ```bash
   node backend/scripts/set_upload_admins.js
   ```

### Option 2: Manual Database Update
1. Connect to MongoDB:
   ```bash
   mongosh "mongodb+srv://movia.ytwtfrc.mongodb.net/movia" --username <username>
   ```

2. Update user:
   ```javascript
   db.users.updateOne(
     { email: "newemail@example.com" },
     { 
       $set: { 
         role: "admin",
         isUploadAdmin: true 
       }
     }
   )
   ```

### Option 3: Admin Dashboard (Future Enhancement)
Create an admin panel where site admins can manage upload permissions through UI.

## Security Considerations

1. **Backend Validation**: Upload restrictions are enforced on the backend with JWT authentication
2. **Frontend Hiding**: UI elements are hidden but backend still validates all requests
3. **Token-based Auth**: JWT tokens contain user info including admin status
4. **Middleware Chaining**: Routes use both `protect` (auth check) and `requireUploadAdmin` (permission check)

## Troubleshooting

### User Can't Upload After Being Made Admin
1. User needs to logout and login again to get fresh token with admin flag
2. Check database to confirm `isUploadAdmin: true` is set:
   ```javascript
   db.users.findOne({ email: "user@example.com" })
   ```

### UI Not Showing Upload Button for Admin
1. Check browser console for user object - should have `isUploadAdmin: true`
2. Clear browser cache and hard refresh (Ctrl+Shift+R)
3. Check if client build was deployed after changes

### API Returns 403 for Admin User
1. Verify user has `isUploadAdmin: true` in database
2. Check backend logs for authentication errors
3. Verify backend was restarted after middleware changes
4. Test JWT token contains correct user data

## Deployment Checklist

✅ User model updated with `isUploadAdmin` field
✅ Auth middleware created (`requireUploadAdmin`)
✅ Upload routes protected with new middleware
✅ Admin setup script created and run
✅ Backend restarted on EC2
✅ AuthContext updated to expose `isUploadAdmin`
✅ Navbar updated to hide "+ Create" for non-admins
✅ Sidebar updated to hide "Channel" section for non-admins
✅ Upload page updated with access restriction
✅ Client built and deployed to EC2

## API Endpoints

### Protected Endpoints (Upload Admin Only)
```
POST   /api/uploads/presign        - Get presigned URL for upload
POST   /api/videos                 - Create video
POST   /api/videos/create          - Create video from URL
PUT    /api/videos/:id             - Update video
DELETE /api/videos/:id             - Delete video
```

### Public Endpoints (All Users)
```
GET    /api/videos                 - List videos
GET    /api/videos/:id             - Get video details
PUT    /api/videos/:id/like        - Like video
PUT    /api/videos/:id/dislike     - Dislike video
POST   /api/videos/:id/comments    - Comment on video
```

## Future Enhancements

1. **Admin Dashboard**: Create UI for managing upload admins
2. **Role Hierarchy**: Add more granular permissions (moderator, editor, etc.)
3. **Upload Quotas**: Limit uploads per admin (daily/monthly)
4. **Audit Logs**: Track who uploaded/modified/deleted what
5. **Approval Workflow**: Require approval before videos go live
6. **Content Moderation**: Flag inappropriate content for review

## Support

For issues or questions:
- Check backend logs: `ssh -i "movia.pem" ubuntu@3.238.106.222 "pm2 logs backend"`
- Check MongoDB: Use MongoDB Compass or mongosh
- Contact site administrator: sahannawarathne2004@gmail.com

---
**Last Updated**: January 2025
**Version**: 1.0
