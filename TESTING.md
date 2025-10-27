# Testing Guide - Pythagora AI Platform

## Overview

This document provides comprehensive testing instructions for the Pythagora AI Platform.

## Test Suite

### Running Automated Tests

```bash
# Install dependencies
npm install

# Run the comprehensive test suite
node test-suite.js

# Run tests against deployed instance
TEST_URL=https://your-app.onrender.com node test-suite.js
```

### Test Coverage

The test suite covers:

1. ✅ **Health Check Endpoint** - Verifies server is running
2. ✅ **Homepage Load** - Tests static file serving
3. ✅ **User Registration** - Creates new user accounts
4. ✅ **User Login** - Authentication flow
5. ✅ **Protected Routes** - JWT token validation
6. ✅ **Invalid Token Rejection** - Security validation
7. ✅ **Rate Limiting** - Performance under load
8. ✅ **404 Error Handling** - Proper error responses
9. ✅ **CORS Headers** - Cross-origin configuration
10. ✅ **Security Headers** - Helmet.js configuration

## Manual Testing

### 1. Health Check

```bash
curl https://your-app.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-10-27T...",
  "version": "2.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "websocket": "active"
  }
}
```

### 2. User Registration

```bash
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "name": "New User"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "newuser@example.com",
    "name": "New User"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 3. User Login

```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "email": "newuser@example.com",
    "name": "New User"
  }
}
```

### 4. Access Protected Route

```bash
curl https://your-app.onrender.com/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "projects": [],
  "count": 0
}
```

### 5. Create Project

```bash
curl -X POST https://your-app.onrender.com/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Project",
    "description": "Test project",
    "type": "web",
    "framework": "react",
    "language": "javascript"
  }'
```

### 6. AI Code Generation

```bash
curl -X POST https://your-app.onrender.com/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a React component for a user profile card",
    "language": "javascript",
    "framework": "react"
  }'
```

## Browser Testing

### 1. Homepage Test

1. Open browser to: `https://your-app.onrender.com`
2. Verify homepage loads correctly
3. Check for:
   - Header navigation
   - Hero section
   - Feature descriptions
   - Footer

### 2. Registration Flow

1. Click "Sign Up" or navigate to registration
2. Fill in:
   - Email: `test@example.com`
   - Password: `SecurePass123!`
   - Name: `Test User`
3. Submit form
4. Verify redirect to dashboard or confirmation

### 3. Login Flow

1. Click "Login"
2. Enter credentials
3. Verify successful authentication
4. Check that user is redirected to dashboard

### 4. Dashboard Features

1. **Projects Section**
   - Create new project
   - View project list
   - Edit project
   - Delete project

2. **AI Studio**
   - Access AI code generation
   - Test different prompts
   - Copy/save generated code

3. **Settings**
   - Update profile
   - Change password
   - Configure AI providers

### 5. Real-time Features

1. Open application in two browser tabs
2. Make changes in one tab
3. Verify updates appear in other tab (if collaboration enabled)

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 https://your-app.onrender.com/api/health

# Test with authentication
ab -n 100 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-app.onrender.com/api/projects
```

### Expected Results

- **Response Time:** < 500ms (average)
- **Success Rate:** 100%
- **Concurrent Users:** Handle 10+ concurrent users
- **Memory Usage:** < 512MB

## Database Testing

### MongoDB Connection

```javascript
// Test MongoDB connection
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB error:', err));
```

### Redis Connection (Optional)

```javascript
// Test Redis connection
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect()
  .then(() => console.log('✓ Redis connected'))
  .catch(err => console.log('⚠ Redis unavailable (using fallback)'));
```

## Security Testing

### 1. SQL Injection Prevention

Try malicious inputs:
```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com OR 1=1",
    "password": "anything"
  }'
```

**Expected:** Request should be rejected or safely handled

### 2. XSS Prevention

Try script injection:
```bash
curl -X POST https://your-app.onrender.com/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "description": "Test"
  }'
```

**Expected:** Script tags should be sanitized

### 3. Rate Limiting

```bash
# Send rapid requests
for i in {1..150}; do
  curl -s https://your-app.onrender.com/api/health &
done
wait
```

**Expected:** Some requests should be rate-limited (429 status)

## Error Scenarios

### 1. Invalid Credentials

```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@example.com",
    "password": "wrongpassword"
  }'
```

**Expected:** 401 Unauthorized

### 2. Missing Required Fields

```bash
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Expected:** 400 Bad Request with validation errors

### 3. Expired Token

```bash
curl https://your-app.onrender.com/api/projects \
  -H "Authorization: Bearer expired_token_here"
```

**Expected:** 401 Unauthorized

## Deployment Verification

After deploying to production:

### Checklist

- [ ] Health endpoint responds correctly
- [ ] Homepage loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Protected routes require authentication
- [ ] Database connection is stable
- [ ] Redis connection (or fallback) works
- [ ] AI features work (if API keys configured)
- [ ] WebSocket connections establish
- [ ] Static files load correctly
- [ ] HTTPS is enabled
- [ ] Security headers present
- [ ] Rate limiting works
- [ ] Error pages display correctly
- [ ] Logging is functional

## Continuous Testing

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm test
      
      - name: Run integration tests
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          JWT_SECRET: test-secret
        run: node test-suite.js
```

## Monitoring

### Production Monitoring

1. **Uptime Monitoring:** UptimeRobot, Pingdom
2. **Error Tracking:** Sentry, Rollbar
3. **Performance:** New Relic, DataDog
4. **Logs:** Papertrail, Loggly

### Health Check Automation

```bash
# Cron job to check health every 5 minutes
*/5 * * * * curl -f https://your-app.onrender.com/api/health || echo "Health check failed"
```

## Test Results Documentation

After testing, document results:

```markdown
## Test Results - [Date]

**Environment:** Production
**URL:** https://your-app.onrender.com

### Passed Tests: 10/10 ✅

1. Health Check - PASS
2. User Registration - PASS
3. User Login - PASS
4. Protected Routes - PASS
5. AI Generation - PASS
6. Database Connection - PASS
7. Security Headers - PASS
8. Rate Limiting - PASS
9. Error Handling - PASS
10. Performance - PASS

### Performance Metrics

- Average Response Time: 245ms
- 95th Percentile: 450ms
- Uptime: 99.9%
- Error Rate: 0.01%

### Issues Found

None

### Recommendations

- Monitor database performance
- Consider CDN for static assets
- Enable database backups
```

---

**Last Updated:** October 27, 2025
**Version:** 2.0.0
