# 🗄️ MongoDB Atlas Setup Guide - Real Database

## Creating Your FREE MongoDB Database

This guide will help you set up a **real, production-ready MongoDB database** for the Pythagora AI Platform.

---

## 📋 Prerequisites

- Email address for MongoDB Atlas account
- 5 minutes of your time

---

## 🚀 Step-by-Step Setup

### Step 1: Create MongoDB Atlas Account

1. Visit: **https://www.mongodb.com/cloud/atlas/register**
2. Sign up with:
   - Google account (fastest), OR
   - Email + password
3. Verify your email address
4. Login to Atlas dashboard

---

### Step 2: Create a FREE Cluster

1. Click **"Build a Database"** or **"Create"** button
2. Choose **"Shared"** (Free tier)
3. Select **M0 Sandbox** - FOREVER FREE!
   - Storage: 512MB
   - RAM: Shared
   - Perfect for development and small production apps

4. Choose Cloud Provider & Region:
   - **Provider:** AWS (recommended for Render)
   - **Region:** Oregon (us-west-2) - Same as Render
   - ✅ This ensures low latency

5. Cluster Name:
   - Name: `pythagora-cluster` (or any name you like)
   - Click **"Create Cluster"**

6. Wait 1-3 minutes for cluster creation ⏳

---

### Step 3: Create Database User

1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter credentials:
   ```
   Username: pythagora-admin
   Password: [Click "Autogenerate Secure Password" or create your own]
   ```
   **⚠️ SAVE THIS PASSWORD!** You'll need it later.

5. Database User Privileges:
   - Select: **"Read and write to any database"**
   - Or: **"Atlas admin"** (for full access)

6. Click **"Add User"**

---

### Step 4: Allow Network Access

1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Choose one option:

   **Option A: Allow from Anywhere (Development)**
   - Click **"Allow Access from Anywhere"**
   - IP: `0.0.0.0/0`
   - ✅ Quick and easy for development
   - ⚠️ Less secure for production

   **Option B: Specific IPs (Production)**
   - Add Render's IP ranges
   - More secure
   - See Render docs for IP list

4. Add description: `Render App` or `Dev Access`
5. Click **"Confirm"**

---

### Step 5: Get Connection String

1. Go back to **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. **Driver:** Node.js
5. **Version:** 4.1 or later
6. **Copy the connection string:**
   ```
   mongodb+srv://pythagora-admin:<password>@pythagora-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

7. **Replace `<password>`** with your actual password:
   ```
   mongodb+srv://pythagora-admin:YOUR_ACTUAL_PASSWORD@pythagora-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

8. **Add database name** before `?`:
   ```
   mongodb+srv://pythagora-admin:YOUR_PASSWORD@pythagora-cluster.xxxxx.mongodb.net/pythagora-ai?retryWrites=true&w=majority
   ```

---

## 🔧 Configure Your Application

### Local Development (.env file)

```bash
# Open /workspace/.env
MONGODB_URI=mongodb+srv://pythagora-admin:YOUR_PASSWORD@pythagora-cluster.xxxxx.mongodb.net/pythagora-ai?retryWrites=true&w=majority
```

### Render Deployment

1. Go to Render Dashboard
2. Select your web service
3. Go to **"Environment"** tab
4. Add environment variable:
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://pythagora-admin:...` (your connection string)
5. Click **"Save Changes"**
6. Service will automatically redeploy

---

## ✅ Test Your Database Connection

### Method 1: Use Seed Script

```bash
cd /workspace
npm run seed
```

Expected output:
```
🌱 Starting database seeding...
📡 Connecting to MongoDB: mongodb+srv://***:***@...
✅ Connected to MongoDB
🗑️  Clearing existing data...
✅ Existing data cleared
👤 Creating users...
✅ Created 3 users
📁 Creating projects...
✅ Created 5 projects
🤖 Creating AI providers...
✅ Created 2 AI providers
🎉 Database seeding completed successfully!
```

### Method 2: Test Connection Script

```javascript
// test-connection.js
const mongoose = require('mongoose');
const MONGODB_URI = 'your-connection-string';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
```

Run: `node test-connection.js`

---

## 🗂️ Database Structure

After seeding, your database will contain:

### Collections:

1. **users** (3 documents)
   - admin@pythagora.ai
   - demo@pythagora.ai
   - developer@pythagora.ai

2. **projects** (5 documents)
   - E-Commerce Platform
   - AI Chatbot Service
   - Mobile Banking App
   - Analytics Dashboard API
   - Task Automation Framework

3. **aiproviders** (2 documents)
   - OpenAI
   - Anthropic

---

## 📊 Monitor Your Database

### View Data in Atlas

1. Go to **"Browse Collections"** in your cluster
2. Select database: `pythagora-ai`
3. Browse collections: `users`, `projects`, `aiproviders`
4. View, edit, delete documents

### Database Statistics

- **Storage Used:** Visible in dashboard
- **Connections:** Monitor active connections
- **Operations:** View read/write operations

---

## 🔒 Security Best Practices

### ✅ DO:
- Use strong passwords
- Rotate passwords regularly
- Use environment variables (never hardcode)
- Limit IP access in production
- Use separate databases for dev/staging/production
- Enable backup (available in paid tiers)

### ❌ DON'T:
- Commit connection strings to Git
- Share database credentials publicly
- Use weak passwords
- Allow 0.0.0.0/0 in production (if possible)
- Use same database for dev and production

---

## 💰 Pricing (M0 Free Tier)

| Feature | Free (M0) | Paid Tiers |
|---------|-----------|------------|
| Storage | 512MB | 2GB - 4TB+ |
| RAM | Shared | Dedicated |
| Connections | 500 | Unlimited |
| Backups | ❌ | ✅ |
| Advanced Security | ❌ | ✅ |
| Cost | **$0/month** | From $9/month |

**✅ 512MB is enough for:**
- 10,000+ users
- 50,000+ projects
- Development & testing
- Small production apps

---

## 🆙 Upgrade Options

When you need more:

### M10 Basic - $9/month
- 2GB storage
- 2GB RAM
- Backups
- Point-in-time recovery

### M20 General - $25/month
- 5GB storage
- 4GB RAM
- All M10 features

### M30+ Production - $57+/month
- 10GB+ storage
- 8GB+ RAM
- Enterprise features

---

## 🐛 Troubleshooting

### Connection Timeout
**Problem:** Can't connect to database  
**Solutions:**
- Check IP whitelist (Network Access)
- Verify username/password
- Check connection string format
- Ensure database name is correct

### Authentication Failed
**Problem:** Wrong username or password  
**Solutions:**
- Verify credentials in Database Access
- Check password doesn't have special characters
- URL encode password if it contains special chars
- Create new database user

### Database Not Found
**Problem:** Database doesn't exist  
**Solutions:**
- Database is created automatically on first write
- Run seed script: `npm run seed`
- Check database name in connection string

### IP Not Whitelisted
**Problem:** IP address blocked  
**Solutions:**
- Add 0.0.0.0/0 in Network Access
- Add your specific IP
- Add Render's IPs for production

---

## 📞 Support

- **Atlas Docs:** https://docs.atlas.mongodb.com/
- **Community:** https://community.mongodb.com/
- **Support:** https://support.mongodb.com/

---

## ✅ Checklist

Before deploying:

- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster created
- [ ] Database user created and password saved
- [ ] Network access configured (0.0.0.0/0 or specific IPs)
- [ ] Connection string obtained
- [ ] Connection string tested locally
- [ ] Database seeded with sample data
- [ ] Connection string added to Render environment
- [ ] Application connected successfully
- [ ] Data persists after restart

---

## 🎉 You're Ready!

Your real MongoDB database is now set up and ready to use!

**Next Steps:**
1. Update `.env` with connection string
2. Run `npm run seed` to add sample data
3. Start your server: `npm start`
4. Deploy to Render with MongoDB connection
5. Test on live deployment!

---

**MongoDB Atlas Setup Complete!** ✅  
**Real Database:** READY ✅  
**Production Ready:** YES ✅
