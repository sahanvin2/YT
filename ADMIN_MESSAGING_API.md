# Admin Messaging API - Quick Reference

## Base URL
```
http://localhost:5000/api/admin
```

## Authentication
All requests require authentication. Include JWT token in headers:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Get List of All Admins

```http
GET /api/admin/admins
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "admin_id_1",
      "username": "Admin1",
      "email": "admin1@example.com",
      "avatar": "avatar_url",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "_id": "admin_id_2",
      "username": "Admin2",
      "email": "admin2@example.com",
      "avatar": "avatar_url",
      "createdAt": "2025-01-02T00:00:00.000Z"
    }
  ]
}
```

---

## 2. Send Message to Admin

```http
POST /api/admin/messages
Content-Type: application/json
```

**Request Body:**
```json
{
  "toUserId": "admin_id_2",
  "subject": "Urgent: Server Maintenance",
  "message": "We need to schedule server maintenance for tomorrow at 3 AM. Please confirm if this works for you."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin message sent successfully",
  "data": {
    "_id": "message_id",
    "from": {
      "_id": "your_admin_id",
      "username": "Admin1",
      "email": "admin1@example.com"
    },
    "to": {
      "_id": "admin_id_2",
      "username": "Admin2",
      "email": "admin2@example.com"
    },
    "subject": "Urgent: Server Maintenance",
    "message": "We need to schedule...",
    "isRead": false,
    "emailSent": true,
    "sentAt": "2025-12-27T10:30:00.000Z",
    "createdAt": "2025-12-27T10:30:00.000Z"
  }
}
```

---

## 3. Get Messages (Inbox/Sent/Unread)

```http
GET /api/admin/messages?type=inbox&page=1&limit=20
```

**Query Parameters:**
- `type`: `inbox` | `sent` | `unread` (default: `inbox`)
- `page`: Page number (default: 1)
- `limit`: Messages per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "from": {
          "username": "Admin1",
          "email": "admin1@example.com",
          "avatar": "avatar_url"
        },
        "to": {
          "username": "Admin2",
          "email": "admin2@example.com"
        },
        "subject": "Urgent: Server Maintenance",
        "message": "We need to schedule...",
        "isRead": false,
        "emailSent": true,
        "sentAt": "2025-12-27T10:30:00.000Z",
        "createdAt": "2025-12-27T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    },
    "unreadCount": 3
  }
}
```

---

## 4. Get Single Message

```http
GET /api/admin/messages/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "message_id",
    "from": {
      "username": "Admin1",
      "email": "admin1@example.com",
      "avatar": "avatar_url"
    },
    "to": {
      "username": "Admin2",
      "email": "admin2@example.com"
    },
    "subject": "Urgent: Server Maintenance",
    "message": "We need to schedule server maintenance...",
    "isRead": true,
    "readAt": "2025-12-27T11:00:00.000Z",
    "emailSent": true,
    "sentAt": "2025-12-27T10:30:00.000Z",
    "createdAt": "2025-12-27T10:30:00.000Z"
  }
}
```

**Note:** Message automatically marked as read when recipient views it.

---

## 5. Mark Message as Read

```http
PATCH /api/admin/messages/:id/read
```

**Response:**
```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {
    "_id": "message_id",
    "isRead": true,
    "readAt": "2025-12-27T11:00:00.000Z"
  }
}
```

---

## 6. Delete Message

```http
DELETE /api/admin/messages/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

**Note:** This is a soft delete. Message is hidden for you but still visible to the other admin.

---

## Email Notification

When you send a message, the recipient automatically receives an email:

**Subject:** `[ADMIN MESSAGE] Your Subject`

**Email Content:**
```
🔒 Private Admin Message

From: YourUsername (your@email.com)

Subject Line Here

Message content here...

⚠️ This is a private admin-only message.
Please do not share this content with non-admin users.

[📬 View Message in Dashboard]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: toUserId, subject, message"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Only admins can send admin messages"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Recipient not found"
}
```

---

## Testing with cURL

### Get Admin List
```bash
curl -X GET http://localhost:5000/api/admin/admins \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Send Message
```bash
curl -X POST http://localhost:5000/api/admin/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "toUserId": "admin_id_here",
    "subject": "Test Message",
    "message": "This is a test admin message."
  }'
```

### Get Inbox
```bash
curl -X GET "http://localhost:5000/api/admin/messages?type=inbox&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Frontend Integration Example

```javascript
// Get list of admins
const getAdmins = async () => {
  const response = await fetch('http://localhost:5000/api/admin/admins', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data; // Array of admin users
};

// Send message
const sendMessage = async (toUserId, subject, message) => {
  const response = await fetch('http://localhost:5000/api/admin/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ toUserId, subject, message })
  });
  const data = await response.json();
  return data;
};

// Get inbox
const getInbox = async (page = 1) => {
  const response = await fetch(`http://localhost:5000/api/admin/messages?type=inbox&page=${page}&limit=20`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data;
};

// Get unread count
const getUnreadCount = async () => {
  const response = await fetch('http://localhost:5000/api/admin/messages?type=unread&limit=1', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data.unreadCount;
};
```

---

## Security Features

✅ **Admin-only access** - Only users with `role: 'admin'` can access
✅ **Can only message admins** - Cannot send to regular users
✅ **Private messages** - No public API to view all messages
✅ **Soft delete** - Each user controls their own view
✅ **Email privacy** - Only sender and recipient can see

---

## Database Indexes

Optimized queries with indexes on:
- `from` + `to` + `createdAt`
- `to` + `isRead`
- `from`, `to` (individual)

Performance: Fast queries even with thousands of messages.

---

**🎉 Admin Messaging System Ready to Use!**
