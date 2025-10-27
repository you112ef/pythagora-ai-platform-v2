# 🌐 API Endpoints Guide - Complete Reference

## Available Endpoints in Pythagora AI Platform

**Base URL:** `https://your-app.onrender.com` or `http://localhost:3000`

---

## ✅ Public Endpoints (No Authentication Required)

### 1. Health Check
```
GET /api/health
```

**Example:**
```bash
curl https://your-app.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-27T...",
  "version": "2.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "websocket": "active"
  }
}
```

---

### 2. Homepage
```
GET /
```

**Example:**
```bash
curl https://your-app.onrender.com/
```

**Expected:** HTML page

---

### 3. AI Providers Page
```
GET /ai-providers.html
```

**Example:**
```bash
curl https://your-app.onrender.com/ai-providers.html
```

**Expected:** HTML page

---

## 🔐 Authentication Endpoints

### 1. Register New User
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "Test123!",
  "firstName": "Test",
  "lastName": "User"
}
```

**Example:**
```bash
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "subscription": {...}
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 2. Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@pythagora.ai",
  "password": "Admin123!"
}
```

**Example:**
```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pythagora.ai",
    "password": "Admin123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Save the token for authenticated requests!**

---

### 3. Get Current User
```
GET /api/auth/me
```

**Headers Required:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example:**
```bash
curl https://your-app.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Logout
```
POST /api/auth/logout
```

**Headers Required:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example:**
```bash
curl -X POST https://your-app.onrender.com/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Refresh Token
```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

---

## 📁 Projects Endpoints (Authentication Required)

**All project endpoints require:**
```
Authorization: Bearer YOUR_TOKEN
```

### 1. Get All Projects
```
GET /api/projects
GET /api/projects?page=1&limit=10
GET /api/projects?status=active
GET /api/projects?type=web-app
GET /api/projects?search=ecommerce
```

**Example:**
```bash
curl https://your-app.onrender.com/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "...",
        "name": "E-Commerce Platform",
        "description": "...",
        "type": "web-app",
        "framework": "react",
        "status": "active",
        "owner": {...},
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalProjects": 5,
      "projectsPerPage": 10
    }
  }
}
```

---

### 2. Get Single Project
```
GET /api/projects/:id
```

**Example:**
```bash
curl https://your-app.onrender.com/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Create New Project
```
POST /api/projects
```

**Request Body:**
```json
{
  "name": "My New Project",
  "description": "Project description",
  "type": "web-app",
  "framework": "react",
  "language": "javascript",
  "techStack": ["React", "Node.js", "MongoDB"]
}
```

**Example:**
```bash
curl -X POST https://your-app.onrender.com/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Project",
    "description": "A real project!",
    "type": "web-app",
    "framework": "react",
    "language": "javascript"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "_id": "...",
      "name": "My New Project",
      ...
    }
  }
}
```

---

### 4. Update Project
```
PUT /api/projects/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "testing"
}
```

**Example:**
```bash
curl -X PUT https://your-app.onrender.com/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Project Name",
    "status": "testing"
  }'
```

---

### 5. Delete Project
```
DELETE /api/projects/:id
```

**Example:**
```bash
curl -X DELETE https://your-app.onrender.com/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Add Collaborator
```
POST /api/projects/:id/collaborators
```

**Request Body:**
```json
{
  "userId": "USER_ID",
  "role": "editor"
}
```

---

### 7. Get Project Stats
```
GET /api/projects/:id/stats
```

**Example:**
```bash
curl https://your-app.onrender.com/api/projects/PROJECT_ID/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🤖 AI Providers Endpoints (Authentication Required)

### 1. Get All AI Providers
```
GET /api/ai-providers
```

**Example:**
```bash
curl https://your-app.onrender.com/api/ai-providers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "_id": "...",
        "name": "openai",
        "displayName": "OpenAI",
        "models": ["gpt-4", "gpt-3.5-turbo"],
        "enabled": true,
        "usage": {...}
      }
    ]
  }
}
```

---

### 2. Get All AI Models
```
GET /api/ai-providers/models/all
```

**Example:**
```bash
curl https://your-app.onrender.com/api/ai-providers/models/all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "gpt-4-turbo-preview",
        "name": "GPT-4 Turbo",
        "provider": "openai",
        "category": "Premium",
        "pricing": {...}
      }
      // ... 60+ models
    ],
    "totalModels": 65
  }
}
```

---

### 3. Add New AI Provider
```
POST /api/ai-providers
```

**Request Body:**
```json
{
  "name": "openai",
  "displayName": "My OpenAI",
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "models": ["gpt-4", "gpt-3.5-turbo"]
}
```

**Example:**
```bash
curl -X POST https://your-app.onrender.com/api/ai-providers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "openai",
    "displayName": "My OpenAI Provider",
    "apiKey": "sk-your-api-key",
    "models": ["gpt-4", "gpt-3.5-turbo"]
  }'
```

---

### 4. Update AI Provider
```
PUT /api/ai-providers/:id
```

**Request Body:**
```json
{
  "displayName": "Updated Name",
  "enabled": true
}
```

---

### 5. Delete AI Provider
```
DELETE /api/ai-providers/:id
```

**Example:**
```bash
curl -X DELETE https://your-app.onrender.com/api/ai-providers/PROVIDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Test AI Provider Connection
```
POST /api/ai-providers/:id/test
```

**Example:**
```bash
curl -X POST https://your-app.onrender.com/api/ai-providers/PROVIDER_ID/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔄 Complete Workflow Example

### Step 1: Register & Login
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "John123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login (save the token from response)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "John123!"
  }'

# Save token
TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

---

### Step 2: Create Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Real App",
    "description": "Building a real application!",
    "type": "web-app",
    "framework": "react",
    "language": "javascript"
  }'

# Save project ID from response
PROJECT_ID="..."
```

---

### Step 3: Get Projects
```bash
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

---

### Step 4: Add AI Provider
```bash
curl -X POST http://localhost:3000/api/ai-providers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "openrouter",
    "displayName": "My OpenRouter",
    "apiKey": "sk-or-v1-your-key",
    "models": ["gpt-4", "claude-3-opus"]
  }'
```

---

### Step 5: Get All AI Models
```bash
curl http://localhost:3000/api/ai-providers/models/all \
  -H "Authorization: Bearer $TOKEN"
```

---

## ❌ Common Errors

### 1. Route Not Found (404)
```json
{
  "error": "Route not found",
  "message": "The requested endpoint does not exist"
}
```

**Causes:**
- Incorrect URL
- Typo in endpoint
- Missing `/api/` prefix
- Server not running

**Solutions:**
- Check URL spelling
- Ensure server is running
- Use correct endpoint from this guide

---

### 2. Unauthorized (401)
```json
{
  "success": false,
  "error": "Token required"
}
```

**Causes:**
- Missing Authorization header
- Invalid token
- Expired token

**Solutions:**
- Add header: `Authorization: Bearer YOUR_TOKEN`
- Login again to get new token
- Use refresh token endpoint

---

### 3. Validation Error (400)
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Invalid email",
      "param": "email"
    }
  ]
}
```

**Causes:**
- Missing required fields
- Invalid data format

**Solutions:**
- Check required fields
- Verify data types
- Follow examples in this guide

---

## 🧪 Testing Tools

### 1. Using cURL
```bash
# Health check
curl https://your-app.onrender.com/api/health

# With authentication
curl https://your-app.onrender.com/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# POST request
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pythagora.ai","password":"Admin123!"}'
```

---

### 2. Using Postman
1. Import collection
2. Set base URL variable
3. Set authorization token
4. Test endpoints

---

### 3. Using Browser
For GET endpoints:
```
https://your-app.onrender.com/api/health
https://your-app.onrender.com/
https://your-app.onrender.com/ai-providers.html
```

---

## 📝 Quick Reference

### Public Endpoints:
```
✅ GET  /                     Homepage
✅ GET  /ai-providers.html    AI Providers page
✅ GET  /api/health           Health check
```

### Auth Endpoints:
```
✅ POST /api/auth/register    Register
✅ POST /api/auth/login       Login
✅ GET  /api/auth/me          Get user
✅ POST /api/auth/logout      Logout
```

### Projects (Auth Required):
```
✅ GET    /api/projects           Get all
✅ GET    /api/projects/:id       Get one
✅ POST   /api/projects           Create
✅ PUT    /api/projects/:id       Update
✅ DELETE /api/projects/:id       Delete
```

### AI Providers (Auth Required):
```
✅ GET    /api/ai-providers              Get all
✅ GET    /api/ai-providers/models/all   Get models
✅ POST   /api/ai-providers              Create
✅ PUT    /api/ai-providers/:id          Update
✅ DELETE /api/ai-providers/:id          Delete
✅ POST   /api/ai-providers/:id/test     Test
```

---

## 🔍 Debugging Tips

**If you get 404 errors:**

1. Check server is running:
   ```bash
   npm start
   ```

2. Verify URL:
   ```bash
   # ✅ Correct
   http://localhost:3000/api/health
   
   # ❌ Wrong
   http://localhost:3000/health
   http://localhost:3000/api/api/health
   ```

3. Check endpoint exists:
   - Review `server.js` for registered routes
   - Look at route files in `/routes` folder

4. Test health endpoint first:
   ```bash
   curl http://localhost:3000/api/health
   ```

---

**Last Updated:** October 27, 2025  
**Version:** 2.0.0  
**Status:** ✅ Complete Reference
