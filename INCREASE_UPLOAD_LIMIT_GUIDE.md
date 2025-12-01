# Guide: Increasing Video Upload Limit to 2GB

This guide explains how to increase the video upload limit to 2GB for the Movia platform. It covers the code changes (already applied) and the necessary server configuration for EC2 (Nginx).

## 1. Codebase Changes (Already Applied)

The following changes have been made to the application code to support 2GB uploads.

### Backend (`backend/server.js`)
The Express body parser limits have been increased to `2500mb` to allow large payloads.
The default `MAX_VIDEO_SIZE_MB` has been updated to `2048`.

```javascript
// backend/server.js
app.use(express.json({ limit: "2500mb" }));
app.use(express.urlencoded({ extended: true, limit: "2500mb" }));
// ...
const maxSizeMb = parseInt(process.env.MAX_VIDEO_SIZE_MB || '2048');
```

### Backend Controller (`backend/controllers/videoController.js`)
The hardcoded fallback limit has been updated to 2GB.

```javascript
// backend/controllers/videoController.js
const maxSizeBytes = parseInt(process.env.MAX_VIDEO_SIZE_MB || '2048') * 1024 * 1024;
```

### Frontend (`client/src/pages/Upload/Upload.js`)
The client-side validation has been updated to allow files up to 2GB.

```javascript
// client/src/pages/Upload/Upload.js
if (file && file.size > 2147483648) { // 2GB
  setError('Video file must be less than 2GB');
  return;
}
```

---

## 2. EC2 / Nginx Configuration (REQUIRED)

If you are deploying to EC2 using Nginx as a reverse proxy (as recommended in the deployment guide), **you MUST update the Nginx configuration** to allow large file uploads. By default, Nginx limits uploads to 1MB.

### Step 1: Edit Nginx Configuration
Connect to your EC2 instance via SSH and edit your site configuration:

```bash
sudo nano /etc/nginx/sites-available/movia
```

### Step 2: Add `client_max_body_size`
Add `client_max_body_size 2500M;` to the `server` block or specifically within the `location /api` block.

```nginx
server {
    listen 80;
    server_name MOVIA.PUBLICVM.COM;

    # ALLOW LARGE FILE UPLOADS
    client_max_body_size 2500M;  # <--- ADD THIS LINE

    # ... rest of your config
}
```

### Step 3: Restart Nginx
Save the file (Ctrl+O, Enter) and exit (Ctrl+X). Then test and restart Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 3. Environment Variables

Ensure your `.env` file on the server (and locally) has the correct limit set (or remove it to use the default 2048MB).

```env
MAX_VIDEO_SIZE_MB=2048
```

## 4. Troubleshooting

If uploads still fail with "Entity Too Large" (413) error:
1.  **Check Nginx**: Verify `client_max_body_size` is set and Nginx was restarted.
2.  **Check Cloudflare**: If you are using Cloudflare proxy (orange cloud), the free tier limits uploads to 100MB. You must bypass Cloudflare (grey cloud) or upgrade to Enterprise for larger uploads.
3.  **Check Browser**: Very large uploads might timeout. Ensure your internet connection is stable. The application supports direct uploads to B2 (presigned URLs) which bypasses the server limit, but the initial request still goes through the server.
