# Pythagora AI Platform - Complete Deployment Guide

## 🚀 Repository Information

**GitHub Repository:** https://github.com/you112ef/pythagora-ai-platform-v2

This comprehensive guide will help you deploy the Pythagora AI Platform to production with all necessary services configured.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
3. [Redis Setup](#redis-setup)
4. [Deployment Options](#deployment-options)
5. [Environment Configuration](#environment-configuration)
6. [Testing & Verification](#testing--verification)

## Prerequisites

Before deploying, ensure you have:

- GitHub account (already set up)
- MongoDB Atlas account (free tier available)
- Deployment platform account (Render/Railway/Heroku - free tier available)
- OpenAI API key (optional, for AI features)
- Anthropic API key (optional, for AI features)

## Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create a Free Cluster

1. Click "Build a Database"
2. Select "M0 Free" tier
3. Choose a cloud provider (AWS, Google Cloud, or Azure)
4. Select a region closest to your users
5. Click "Create Cluster"

### Step 3: Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username: `pythagora-admin`
5. Set a secure password (save this!)
6. Grant "Read and write to any database" permissions
7. Click "Add User"

### Step 4: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - Or add specific IP addresses for production
4. Click "Confirm"

### Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `<dbname>` with `pythagora-ai`

Example connection string:
```
mongodb+srv://pythagora-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pythagora-ai?retryWrites=true&w=majority
```

## Redis Setup

### Option 1: Upstash Redis (Free Tier)

1. Go to [Upstash](https://upstash.com/)
2. Sign up for free account
3. Create a new Redis database
4. Select "Global" for best performance
5. Copy the connection URL (format: `rediss://...`)

### Option 2: Redis Labs (Free Tier)

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up for free account
3. Create a new database
4. Copy the connection string

### Option 3: No Redis (In-Memory Fallback)

The application has built-in fallback to in-memory storage if Redis is not available. Simply leave `REDIS_URL` blank or use a dummy value.

## Deployment Options

### Option 1: Deploy to Render (Recommended - Free Tier Available)

#### Step 1: Create Render Account

1. Go to [Render](https://render.com/)
2. Sign up with GitHub
3. Authorize Render to access your repositories

#### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `you112ef/pythagora-ai-platform-v2`
3. Configure the service:
   - **Name:** `pythagora-ai-platform`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

#### Step 3: Add Environment Variables

Add these environment variables in Render dashboard:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://pythagora-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pythagora-ai
REDIS_URL=your-redis-url-here (or leave blank for in-memory fallback)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GITHUB_TOKEN=your-github-token-here
```

#### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete (5-10 minutes)
3. Your app will be available at: `https://pythagora-ai-platform.onrender.com`

### Option 2: Deploy to Railway

#### Step 1: Create Railway Account

1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub
3. Authorize Railway

#### Step 2: Deploy from GitHub

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `you112ef/pythagora-ai-platform-v2`
4. Railway will auto-detect Node.js and deploy

#### Step 3: Add Environment Variables

1. Go to your project
2. Click "Variables" tab
3. Add all environment variables from above

#### Step 4: Configure Settings

1. Set start command: `npm start`
2. Enable public networking
3. Note your Railway URL

### Option 3: Deploy to Heroku

#### Step 1: Install Heroku CLI

```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

#### Step 2: Login to Heroku

```bash
heroku login
```

#### Step 3: Create Heroku App

```bash
heroku create pythagora-ai-platform
```

#### Step 4: Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-jwt-secret"
# ... add all other environment variables
```

#### Step 5: Deploy

```bash
git push heroku main
```

## Environment Configuration

### Complete Environment Variables List

Create a `.env` file with these variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-deployment-url.com

# Database Configuration
MONGODB_URI=mongodb+srv://pythagora-admin:password@cluster0.xxxxx.mongodb.net/pythagora-ai

# Redis Configuration (optional)
REDIS_URL=rediss://default:password@redis-xxxxx.upstash.io:6379

# JWT Configuration
JWT_SECRET=generate-a-super-secure-random-string-here
JWT_REFRESH_SECRET=generate-another-super-secure-random-string-here

# AI Service Configuration
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_TOKEN=your-github-token-here

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring Configuration
LOG_LEVEL=info
```

### Generating Secure Secrets

For JWT_SECRET and JWT_REFRESH_SECRET, generate secure random strings:

```bash
# Generate secure random strings
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Testing & Verification

### 1. Health Check

After deployment, test the health endpoint:

```bash
curl https://your-app-url.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-...",
  "version": "2.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "websocket": "active"
  }
}
```

### 2. Test User Registration

```bash
curl -X POST https://your-app-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'
```

### 3. Test User Login

```bash
curl -X POST https://your-app-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

### 4. Access Web Interface

1. Open browser and navigate to your deployment URL
2. You should see the Pythagora AI Platform homepage
3. Try registering a new account
4. Test the AI Studio features

## Common Issues & Solutions

### Issue 1: Database Connection Failed

**Solution:**
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0` (allow from anywhere)
- Check connection string format
- Ensure password doesn't contain special characters that need URL encoding

### Issue 2: Application Crashes on Start

**Solution:**
- Check logs: `heroku logs --tail` or view in Render/Railway dashboard
- Verify all required environment variables are set
- Check Node.js version compatibility (requires Node 18+)

### Issue 3: AI Features Not Working

**Solution:**
- Verify OpenAI/Anthropic API keys are valid
- Check API key has sufficient credits
- Review API rate limits

### Issue 4: WebSocket Connection Failed

**Solution:**
- Ensure deployment platform supports WebSocket
- Check firewall/network settings
- Verify CLIENT_URL is set correctly

## Performance Optimization

### 1. Enable Compression

Already enabled in the application via `compression` middleware.

### 2. Configure CDN

For static assets, consider using:
- Cloudflare (free tier)
- AWS CloudFront
- Netlify CDN

### 3. Database Indexing

Connect to MongoDB and create indexes:

```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.projects.createIndex({ userId: 1 })
db.projects.createIndex({ createdAt: -1 })
```

### 4. Monitoring

Set up monitoring with:
- **Render:** Built-in metrics
- **Railway:** Built-in monitoring
- **External:** New Relic, DataDog, or Sentry

## Scaling & Upgrades

### Free Tier Limitations

- **Render Free:** Sleeps after 15 min of inactivity
- **Railway Free:** 500 hours/month, $5 credit
- **Heroku Free:** Deprecated (use Hobby tier)

### Upgrade Paths

When you need more resources:

1. **Render:**
   - Starter: $7/month
   - Standard: $25/month

2. **Railway:**
   - Pay as you go: $0.000463/GB-hour
   - Pro plan: $20/month

3. **MongoDB Atlas:**
   - M10: $0.08/hour (~$57/month)
   - M20: $0.20/hour (~$145/month)

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Enable HTTPS (automatic on Render/Railway)
- [ ] Configure CORS for specific domains
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for all secrets
- [ ] Regular security updates (`npm audit fix`)
- [ ] Enable database backup
- [ ] Implement logging and monitoring
- [ ] Set up error tracking (Sentry)

## Support & Resources

- **GitHub Repository:** https://github.com/you112ef/pythagora-ai-platform-v2
- **Issues:** https://github.com/you112ef/pythagora-ai-platform-v2/issues
- **Documentation:** See README.md

## Next Steps

1. Complete deployment to your chosen platform
2. Set up custom domain (optional)
3. Configure email notifications
4. Set up monitoring and alerts
5. Create backup strategy
6. Plan for scaling

---

**Deployment Completed!** 🎉

Your Pythagora AI Platform is now ready for production use!
