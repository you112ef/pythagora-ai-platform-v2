# 🔧 FIXING THE 502 ERROR

## Problem Found

The application is deployed at: **https://pythagora-ai-platform.onrender.com**

But it's showing **502 Bad Gateway** error because:
1. ✅ Service exists on Render
2. ❌ Application is crashing (likely MongoDB connection issue)
3. ❌ Environment variables need to be updated

---

## Solution: Update Environment Variables

The MongoDB URI and other env vars need to be set correctly.

### Step 1: Go to Render Dashboard

**URL:** https://dashboard.render.com/web/srv-d3viuhfdiees73f18ceg

### Step 2: Update Environment Variables

Click "Environment" tab and update these:

**MONGODB_URI:**
```
mongodb+srv://pythagora-admin:7mhLPpLeDsf9nujrsmSu@YOUR-CLUSTER.mongodb.net/pythagora-ai?retryWrites=true&w=majority
```

**Note:** Replace `YOUR-CLUSTER` with your actual MongoDB Atlas cluster address.

If you haven't created MongoDB cluster yet:

1. Go to: https://cloud.mongodb.com/
2. Create M0 Free Cluster
3. Username: `pythagora-admin`
4. Password: `7mhLPpLeDsf9nujrsmSu`
5. Network: `0.0.0.0/0`
6. Get connection string

### Step 3: Manual Redeploy

After updating MONGODB_URI:
1. Click "Manual Deploy" → "Deploy latest commit"
2. Wait 5-10 minutes
3. Application should be live!

---

## Quick Fix (If you have MongoDB ready)

Just update the MONGODB_URI in Render dashboard, then redeploy.

---

## Expected Result

✅ **Live URL:** https://pythagora-ai-platform.onrender.com  
✅ **Health Check:** https://pythagora-ai-platform.onrender.com/api/health  
✅ **Working Application**

---

## Test After Fix

```bash
curl https://pythagora-ai-platform.onrender.com/api/health
# Should return: {"status":"healthy","timestamp":"..."}
```

Then seed the database:
```bash
export MONGODB_URI="your-connection-string"
npm run seed
```

---

**Next:** Read `COMPLETE_DEPLOYMENT_GUIDE.md` for full details.
