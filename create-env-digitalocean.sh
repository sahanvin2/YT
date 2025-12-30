#!/bin/bash
# Create .env file on Digital Ocean with proper configuration

echo "🔧 Creating .env file..."

cd /root/YT

# Create .env file with all required variables
cat > /root/YT/.env << 'ENVEOF'
NODE_ENV=production
PORT=5000
MONGO_URI=YOUR_MONGODB_URI_HERE
JWT_SECRET=movia_super_secret_jwt_key_change_in_production_12345
JWT_EXPIRE=30d
SESSION_SECRET=movia_session_secret_change_in_production_67890
ADMIN_USER_ID=691a0827d949652f622e8596
CLIENT_URL=http://134.209.105.201

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here

# Email Configuration (Brevo/SendinBlue SMTP)
MAIL_HOST=smtp-relay.sendinblue.com
MAIL_PORT=587
MAIL_USERNAME=YOUR_EMAIL_HERE
MAIL_PASSWORD=YOUR_SENDINBLUE_SMTP_KEY_HERE
MAIL_FROM_NAME=Xclub
MAIL_FROM_ADDRESS=noreply@xclub.asia

# Backblaze B2 Storage
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_ACCESS_KEY_ID=YOUR_B2_ACCESS_KEY_ID
B2_SECRET_ACCESS_KEY=YOUR_B2_SECRET_ACCESS_KEY
B2_BUCKET=movia-prod
B2_PUBLIC_BASE=https://f005.backblazeb2.com/file/movia-prod

# CDN Configuration
CDN_BASE=https://Xclub.b-cdn.net
CDN_URL=https://Xclub.b-cdn.net

# File Upload
MAX_VIDEO_SIZE_MB=5120
ENVEOF

echo "✅ .env file created at /root/YT/.env"

# Create symlink in backend directory
ln -sf /root/YT/.env /root/YT/backend/.env
echo "✅ Created symlink: /root/YT/backend/.env -> /root/YT/.env"

# Verify file exists
if [ -f /root/YT/.env ]; then
    echo ""
    echo "✅ Verification: .env file exists"
    echo ""
    echo "📋 Key variables:"
    echo "   MONGO_URI: $(grep MONGO_URI /root/YT/.env | head -1 | sed 's/\(.*:.*@\).*/\1****/')"
    echo "   B2_BUCKET: $(grep B2_BUCKET /root/YT/.env | head -1)"
    echo "   CLIENT_URL: $(grep CLIENT_URL /root/YT/.env | head -1)"
    echo "   CDN_BASE: $(grep CDN_BASE /root/YT/.env | head -1)"
else
    echo "❌ ERROR: .env file was not created!"
    exit 1
fi

echo ""
echo "✅ .env file ready!"
echo ""
echo "Next steps:"
echo "1. Restart backend: pm2 restart backend"
echo "2. Check logs: pm2 logs backend --lines 20"

