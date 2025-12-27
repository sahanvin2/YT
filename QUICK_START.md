# 🎯 Quick Start Guide - Get Running in 5 Minutes!

## For Users Who Just Want It Working NOW! 🚀

### Prerequisites (What You Need)
- ✅ Node.js installed (v18 or later)
- ✅ MongoDB running (local or Atlas cloud)
- ✅ Redis running (for video queue)
- ✅ Git (to clone the project)

### 1. Download & Install

```bash
# Clone or download the project
cd Movia

# Install dependencies
npm install
cd client && npm install && cd ..
```

### 2. Configure Environment

Create `.env` file in the root folder:

```env
# Basic Setup
PORT=5000
MONGO_URI=mongodb://localhost:27017/movia
CLIENT_URL=http://localhost:3000
JWT_SECRET=change_this_secret_key_12345

# Email (optional - see SMTP_SETUP_GUIDE.md)
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-smtp-key

# Storage (optional - can skip for local testing)
B2_ACCESS_KEY_ID=your_key
B2_SECRET_ACCESS_KEY=your_secret
B2_BUCKET=your-bucket
```

### 3. Start Everything

**Windows:**
```bash
START-ALL.bat
```

**Linux/Mac:**
```bash
npm run dev
```

### 4. Open Browser

Go to: http://localhost:3000

**That's it! You're running!** 🎉

---

## Common Issues & Quick Fixes

### Port 5000 Already in Use
```powershell
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Linux/Mac
sudo lsof -ti:5000 | xargs kill -9
```

### MongoDB Not Connected
```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand({ ping: 1 })"

# Start MongoDB
# Windows: Net start MongoDB
# Linux: sudo systemctl start mongod
```

### Redis Not Connected
```bash
# Check Redis
redis-cli ping

# Start Redis
# Windows: redis-server (in separate terminal)
# Linux: sudo systemctl start redis
```

### Email Not Working
- Update `.env` with real SMTP credentials
- See: [SMTP_SETUP_GUIDE.md](SMTP_SETUP_GUIDE.md)
- Test with: `node test-email.js`

---

## What's Next?

- 📧 **Setup Email**: [SMTP_SETUP_GUIDE.md](SMTP_SETUP_GUIDE.md)
- 🐧 **Ubuntu Setup**: [UBUNTU_SETUP_GUIDE.md](UBUNTU_SETUP_GUIDE.md)
- 🛠️ **Maintenance**: [MAINTENANCE_GUIDE.md](MAINTENANCE_GUIDE.md)
- 🎬 **Upload Videos**: Go to http://localhost:3000/upload

---

## Need Detailed Setup?

See full guides:
- [Complete README](README.md) - Full documentation
- [Getting Started](GETTING_STARTED.md) - Step-by-step walkthrough
- [Ubuntu Setup](UBUNTU_SETUP_GUIDE.md) - For Linux users with GPU

---

**🎯 Goal: Get you up and running with minimum hassle!**

If something doesn't work, check the specific guide for your issue or run:
```bash
node check-services.js
```
