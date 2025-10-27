#!/bin/bash

# Automatic Deployment Script for Render
# This script automates the entire deployment process

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         🚀 Automatic Deployment - Pythagora AI Platform         ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
RENDER_API_KEY="rnd_eEMVBQIhFZHILokK4RGPnOVUUIKs"
RENDER_OWNER_ID="tea-d3qth8mr433s73e11nag"
GITHUB_REPO="https://github.com/you112ef/pythagora-ai-platform-v2"

# Generated secrets
JWT_SECRET="6fac7f4e59897035385a2b08d07bb202f3f670b157a77c398f67d609c1690fa45a4bf9f1aeb19b7500fb36054dfaaef956f687e0219a322ffd232e0275d93c21"
JWT_REFRESH_SECRET="c319ce00f38d3fb323ea27fc1f6cc11216b17e60e32bb9c16daec18904c8dfe05b7bfde76b9031179324fee8ecbaf6ca19d21628554a829248392439a4b383e7"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Repository: $GITHUB_REPO"
echo "   Owner ID: $RENDER_OWNER_ID"
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}🔍 Step 1: Checking prerequisites...${NC}"

if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not installed. Please install curl first.${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed. JSON parsing will be limited.${NC}"
    HAS_JQ=false
else
    HAS_JQ=true
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"
echo ""

# Step 2: Get MongoDB URI from user
echo -e "${BLUE}🗄️  Step 2: MongoDB Configuration${NC}"
echo ""
echo "Please provide your MongoDB Atlas connection string."
echo "If you don't have one yet, follow these steps:"
echo ""
echo "1. Go to: https://cloud.mongodb.com/"
echo "2. Create a free M0 cluster (512MB)"
echo "3. Create a database user"
echo "4. Whitelist IP: 0.0.0.0/0"
echo "5. Get connection string"
echo ""
echo -e "${YELLOW}Example:${NC}"
echo "mongodb+srv://username:password@cluster.mongodb.net/pythagora-ai?retryWrites=true&w=majority"
echo ""
read -p "Enter MongoDB URI (or press Enter to skip for now): " MONGODB_URI

if [ -z "$MONGODB_URI" ]; then
    echo -e "${YELLOW}⚠️  No MongoDB URI provided. Using placeholder.${NC}"
    echo -e "${YELLOW}⚠️  You'll need to update this in Render dashboard later.${NC}"
    MONGODB_URI="mongodb://localhost:27017/pythagora-ai"
fi

echo -e "${GREEN}✅ MongoDB configured${NC}"
echo ""

# Step 3: Deploy to Render
echo -e "${BLUE}🚀 Step 3: Deploying to Render...${NC}"
echo ""

# Create the service
echo "Creating web service on Render..."

RESPONSE=$(curl -s -X POST "https://api.render.com/v1/services" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web",
    "name": "pythagora-ai-platform",
    "ownerId": "'"$RENDER_OWNER_ID"'",
    "repo": "'"$GITHUB_REPO"'",
    "autoDeploy": true,
    "branch": "main",
    "rootDir": "",
    "buildCommand": "npm install",
    "startCommand": "npm start",
    "envVars": [
      {
        "key": "NODE_ENV",
        "value": "production"
      },
      {
        "key": "PORT",
        "value": "10000"
      },
      {
        "key": "MONGODB_URI",
        "value": "'"$MONGODB_URI"'"
      },
      {
        "key": "JWT_SECRET",
        "value": "'"$JWT_SECRET"'"
      },
      {
        "key": "JWT_REFRESH_SECRET",
        "value": "'"$JWT_REFRESH_SECRET"'"
      }
    ],
    "serviceDetails": {
      "env": "node",
      "plan": "free",
      "region": "oregon",
      "healthCheckPath": "/api/health"
    }
  }')

echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "error"; then
    echo -e "${RED}❌ Deployment failed. Error response:${NC}"
    echo "$RESPONSE"
    echo ""
    echo -e "${YELLOW}💡 This might be because:${NC}"
    echo "   1. Service already exists (check Render dashboard)"
    echo "   2. Invalid API key"
    echo "   3. Invalid repository URL"
    echo ""
    echo -e "${BLUE}📋 Manual Deployment Steps:${NC}"
    echo "   1. Go to: https://dashboard.render.com/"
    echo "   2. Login with: assnew276@gmail.com"
    echo "   3. New + → Web Service"
    echo "   4. Connect: you112ef/pythagora-ai-platform-v2"
    echo "   5. Use render.yaml (click Apply)"
    echo "   6. Add environment variables from above"
    echo ""
    exit 1
fi

if [ "$HAS_JQ" = true ]; then
    SERVICE_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
    SERVICE_URL=$(echo "$RESPONSE" | jq -r '.serviceDetails.url // empty')
    
    if [ -n "$SERVICE_ID" ]; then
        echo -e "${GREEN}✅ Service created successfully!${NC}"
        echo "   Service ID: $SERVICE_ID"
        if [ -n "$SERVICE_URL" ]; then
            echo "   URL: $SERVICE_URL"
        fi
    fi
fi

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""

# Step 4: Wait for deployment
echo -e "${BLUE}⏳ Step 4: Waiting for deployment to complete...${NC}"
echo ""
echo "This usually takes 5-10 minutes."
echo "You can check progress at: https://dashboard.render.com/"
echo ""

# Step 5: Instructions for seeding database
echo -e "${BLUE}📊 Step 5: Next Steps${NC}"
echo ""
echo -e "${YELLOW}After deployment completes (5-10 minutes):${NC}"
echo ""
echo "1. Seed the database with sample data:"
echo "   export MONGODB_URI=\"$MONGODB_URI\""
echo "   npm run seed"
echo ""
echo "2. Verify deployment:"
echo "   npm run verify-deployment https://pythagora-ai-platform.onrender.com"
echo ""
echo "3. Test the application:"
echo "   curl https://pythagora-ai-platform.onrender.com/api/health"
echo ""
echo "4. Login with test credentials:"
echo "   Email: admin@pythagora.ai"
echo "   Password: Admin123!"
echo ""

# Save deployment info
cat > deployment-info.txt << EOF
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║              🎉 Deployment Information                           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

Deployment Date: $(date)

Service Details:
- Name: pythagora-ai-platform
- Repository: $GITHUB_REPO
- Branch: main
- Region: Oregon

Expected URLs:
- https://pythagora-ai-platform.onrender.com
- https://pythagora-ai-platform.onrender.com/api/health
- https://pythagora-ai-platform.onrender.com/ai-providers.html

Environment Variables:
- NODE_ENV: production
- PORT: 10000
- MONGODB_URI: [configured]
- JWT_SECRET: [configured]
- JWT_REFRESH_SECRET: [configured]

Test Credentials:
- Admin: admin@pythagora.ai / Admin123!
- Demo: demo@pythagora.ai / Demo123!
- Developer: developer@pythagora.ai / Dev123!

Next Steps:
1. Wait 5-10 minutes for deployment
2. Seed database: npm run seed
3. Verify: npm run verify-deployment <URL>
4. Test: curl <URL>/api/health

Dashboard: https://dashboard.render.com/
Repository: https://github.com/you112ef/pythagora-ai-platform-v2

═══════════════════════════════════════════════════════════════════
EOF

echo -e "${GREEN}✅ Deployment info saved to: deployment-info.txt${NC}"
echo ""

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║              🎉 Deployment Process Started!                      ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Your application is being deployed to Render!${NC}"
echo ""
echo -e "${BLUE}What's happening now:${NC}"
echo "   1. ✅ Code pulled from GitHub"
echo "   2. ⏳ Installing dependencies (npm install)"
echo "   3. ⏳ Starting application (npm start)"
echo "   4. ⏳ Health check validation"
echo "   5. ⏳ Going live!"
echo ""
echo -e "${YELLOW}Monitor deployment:${NC}"
echo "   https://dashboard.render.com/"
echo ""
echo -e "${BLUE}Check this file for complete info:${NC}"
echo "   cat deployment-info.txt"
echo ""
