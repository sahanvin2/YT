# 🚀 Deployment Guide - Movia Video Platform

This guide covers deploying your Movia video platform to production.

## 📋 Pre-Deployment Checklist

### Security
- [ ] Change JWT_SECRET to a strong random string
- [ ] Set NODE_ENV to 'production'
- [ ] Remove all console.logs from production code
- [ ] Enable HTTPS/SSL
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Review and update .gitignore

### Configuration
- [ ] Set up production MongoDB database
- [ ] Configure cloud storage for videos (AWS S3/Cloudinary)
- [ ] Set up email service (SendGrid/Mailgun)
- [ ] Configure CDN for video delivery
- [ ] Set up monitoring (e.g., PM2, New Relic)
- [ ] Configure backup system

### Testing
- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Test video upload/playback
- [ ] Test on multiple devices
- [ ] Performance testing
- [ ] Security testing

## 🌐 Deployment Options

### Option 1: Heroku (Easiest)

#### Backend Deployment

1. **Install Heroku CLI:**
```powershell
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

2. **Login to Heroku:**
```powershell
heroku login
```

3. **Create Heroku app:**
```powershell
heroku create movia-backend
```

4. **Set environment variables:**
```powershell
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_super_secret_jwt_key_here
heroku config:set MONGO_URI=your_mongodb_atlas_connection_string
heroku config:set CLIENT_URL=https://your-frontend-domain.com
```

5. **Add MongoDB Atlas:**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a cluster
- Get connection string
- Whitelist all IPs (0.0.0.0/0) for Heroku

6. **Deploy:**
```powershell
git init
git add .
git commit -m "Initial deployment"
git push heroku main
```

#### Frontend Deployment (Netlify/Vercel)

**Using Netlify:**

1. **Build production version:**
```powershell
cd client
npm run build
```

2. **Install Netlify CLI:**
```powershell
npm install -g netlify-cli
```

3. **Deploy:**
```powershell
netlify deploy --prod --dir=build
```

4. **Set environment variables in Netlify:**
- Go to Site Settings → Build & Deploy → Environment
- Add: REACT_APP_API_URL=https://your-backend-url.herokuapp.com/api

**Using Vercel:**

1. **Install Vercel CLI:**
```powershell
npm install -g vercel
```

2. **Deploy:**
```powershell
cd client
vercel --prod
```

### Option 2: AWS (Most Flexible)

#### Backend on AWS Elastic Beanstalk

1. **Install EB CLI:**
```powershell
pip install awsebcli
```

2. **Initialize EB:**
```powershell
eb init -p node.js movia-backend
```

3. **Create environment:**
```powershell
eb create movia-production
```

4. **Set environment variables:**
```powershell
eb setenv NODE_ENV=production JWT_SECRET=your_secret MONGO_URI=your_mongo_uri
```

5. **Deploy:**
```powershell
eb deploy
```

#### Frontend on AWS S3 + CloudFront

1. **Build production:**
```powershell
cd client
npm run build
```

2. **Create S3 bucket:**
- Go to AWS Console → S3
- Create bucket (e.g., movia-frontend)
- Enable static website hosting
- Set public read permissions

3. **Upload build files:**
```powershell
aws s3 sync build/ s3://movia-frontend
```

4. **Set up CloudFront:**
- Create CloudFront distribution
- Point to S3 bucket
- Configure SSL certificate
- Set custom domain

### Option 3: Digital Ocean (Balanced)

#### Using App Platform

1. **Create account at DigitalOcean**

2. **Create App:**
- Go to App Platform
- Connect GitHub repository
- Select branch (main)
- Configure build settings

3. **Backend Configuration:**
```yaml
name: movia-backend
services:
  - name: api
    github:
      repo: your-username/movia
      branch: main
    build_command: npm install
    run_command: npm start
    environment_slug: node-js
    envs:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        value: your_secret
        type: SECRET
      - key: MONGO_URI
        value: your_mongo_uri
        type: SECRET
```

4. **Frontend Configuration:**
```yaml
name: movia-frontend
services:
  - name: web
    github:
      repo: your-username/movia
      branch: main
    source_dir: /client
    build_command: npm run build
    environment_slug: static-site
```

### Option 4: VPS (Full Control)

#### Using Ubuntu Server

1. **Get VPS from:**
- DigitalOcean
- Linode
- Vultr
- AWS EC2

2. **Initial Server Setup:**
```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

3. **Clone and Setup Project:**
```bash
cd /var/www
git clone your-repo-url movia
cd movia
npm install
cd client
npm install
npm run build
cd ..
```

4. **Configure PM2:**
```bash
# Create ecosystem.config.js
pm2 start backend/server.js --name movia-backend
pm2 save
pm2 startup
```

5. **Configure Nginx:**
```nginx
# /etc/nginx/sites-available/movia
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/movia/client/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Video uploads
    location /uploads {
        alias /var/www/movia/uploads;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/movia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Set up SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create account:** https://www.mongodb.com/cloud/atlas
2. **Create cluster:**
   - Choose free tier (M0)
   - Select region closest to your users
   - Create cluster

3. **Database Access:**
   - Create database user
   - Save username and password

4. **Network Access:**
   - Add IP: 0.0.0.0/0 (allows all IPs)
   - Or whitelist specific IPs

5. **Get Connection String:**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

## 📦 Cloud Storage for Videos

### Option 1: AWS S3

1. **Create S3 bucket:**
```powershell
aws s3 mb s3://movia-videos
```

2. **Update backend code:**
```javascript
// Install AWS SDK
npm install aws-sdk

// backend/config/aws.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Upload function
const uploadToS3 = (file, key) => {
  return s3.upload({
    Bucket: 'movia-videos',
    Key: key,
    Body: file,
    ACL: 'public-read'
  }).promise();
};
```

### Option 2: Cloudinary

1. **Sign up:** https://cloudinary.com/
2. **Install SDK:**
```powershell
npm install cloudinary
```

3. **Configure:**
```javascript
// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload function
const uploadVideo = async (filePath) => {
  return await cloudinary.uploader.upload(filePath, {
    resource_type: 'video',
    folder: 'movia-videos'
  });
};
```

## 🔧 Production Optimizations

### Backend

1. **Enable compression:**
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Add helmet for security:**
```javascript
const helmet = require('helmet');
app.use(helmet());
```

3. **Rate limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

### Frontend

1. **Optimize build:**
```javascript
// package.json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

2. **Add service worker for PWA:**
```javascript
// src/index.js
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
serviceWorkerRegistration.register();
```

## 📊 Monitoring

### PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 monit
```

### New Relic

1. **Install:**
```powershell
npm install newrelic
```

2. **Configure:**
```javascript
// newrelic.js
exports.config = {
  app_name: ['Movia Backend'],
  license_key: 'your-license-key',
  logging: {
    level: 'info'
  }
};

// server.js - First line
require('newrelic');
```

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        npm install
        cd client && npm install
    
    - name: Run tests
      run: npm test
    
    - name: Build frontend
      run: cd client && npm run build
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "movia-backend"
        heroku_email: "your-email@example.com"
```

## 🔐 Environment Variables for Production

```bash
# Backend (.env)
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/movia
JWT_SECRET=super_secure_random_string_min_32_characters
JWT_EXPIRE=30d
CLIENT_URL=https://your-frontend-domain.com

# AWS (if using S3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=movia-videos

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend (.env.production)
REACT_APP_API_URL=https://your-backend-domain.com/api
```

## ✅ Post-Deployment

1. **Test all features:**
   - Registration/Login
   - Video upload
   - Video playback
   - Comments
   - Subscriptions
   - Search

2. **Set up monitoring:**
   - Application monitoring
   - Server monitoring
   - Database monitoring
   - Error tracking

3. **Backups:**
   - Database backups (MongoDB Atlas auto-backup)
   - File backups (S3 versioning)
   - Code backups (Git)

4. **Documentation:**
   - API documentation
   - User guide
   - Admin guide

## 🆘 Troubleshooting

### CORS Issues
```javascript
app.use(cors({
  origin: ['https://your-frontend.com', 'https://www.your-frontend.com'],
  credentials: true
}));
```

### MongoDB Connection
```javascript
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
}).catch(err => console.log(err.reason));
```

### Video Upload Timeout
```javascript
// Increase timeout
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

## 📈 Scaling

### Horizontal Scaling
- Use load balancer (AWS ELB, Nginx)
- Multiple backend instances
- Session management with Redis
- Database replication

### Vertical Scaling
- Upgrade server resources
- Optimize database queries
- Add caching (Redis)
- Use CDN for static assets

---

## 🎉 You're Live!

Your Movia platform is now deployed and ready for users!

**Don't forget to:**
- Share with friends
- Monitor performance
- Gather user feedback
- Iterate and improve

Good luck! 🚀
