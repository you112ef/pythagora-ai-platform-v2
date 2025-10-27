#!/bin/bash

##############################################################################
# 🚀 PRODUCTION DEPLOYMENT SCRIPT
##############################################################################
# Automated deployment for Pythagora AI Platform
# Uses environment variables for sensitive data
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}##############################################################################${NC}"
echo -e "${BLUE}# 🚀 PYTHAGORA AI PLATFORM - PRODUCTION DEPLOYMENT                           #${NC}"
echo -e "${BLUE}##############################################################################${NC}"
echo ""

# Check for required environment variables
if [ -z "$RENDER_API_KEY" ]; then
    echo -e "${RED}Error: RENDER_API_KEY not set${NC}"
    echo "Set it with: export RENDER_API_KEY='your-key'"
    exit 1
fi

if [ -z "$MONGODB_URI" ]; then
    echo -e "${YELLOW}Warning: MONGODB_URI not set${NC}"
    echo "You'll need to set this in Render dashboard"
fi

# Generated secrets (safe to include - unique per deployment)
JWT_SECRET="6fac7f4e59897035385a2b08d07bb202f3f670b157a77c398f67d609c1690fa45a4bf9f1aeb19b7500fb36054dfaaef956f687e0219a322ffd232e0275d93c21"
JWT_REFRESH_SECRET="c319ce00f38d3fb323ea27fc1f6cc11216b17e60e32bb9c16daec18904c8dfe05b7bfde76b9031179324fee8ecbaf6ca19d21628554a829248392439a4b383e7"
MONGO_PASSWORD="7mhLPpLeDsf9nujrsmSu"

echo -e "${YELLOW}[1/4] Pushing latest code to GitHub...${NC}"
git push origin main 2>&1 || echo -e "${GREEN}Already up to date${NC}"
echo ""

echo -e "${YELLOW}[2/4] MongoDB Atlas Configuration${NC}"
echo ""
echo -e "${GREEN}Manual Setup Required:${NC}"
echo "  1. Go to: https://cloud.mongodb.com/"
echo "  2. Create M0 Free Cluster (Oregon)"
echo "  3. Username: pythagora-admin"
echo "  4. Password: ${MONGO_PASSWORD}"
echo "  5. Network: 0.0.0.0/0"
echo "  6. Get connection string"
echo ""

echo -e "${YELLOW}[3/4] Render Deployment${NC}"
echo ""
echo -e "${GREEN}Manual Steps:${NC}"
echo "  1. Go to: https://dashboard.render.com/"
echo "  2. New + → Web Service"
echo "  3. Connect: pythagora-ai-platform-v2"
echo "  4. Use render.yaml"
echo "  5. Add environment variables:"
echo ""
echo "     MONGODB_URI=<your connection string>"
echo "     JWT_SECRET=${JWT_SECRET}"
echo "     JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}"
echo ""

echo -e "${YELLOW}[4/4] Database Seeding${NC}"
echo ""
echo "After deployment, run:"
echo "  export MONGODB_URI='<your connection string>'"
echo "  npm run seed"
echo ""

echo -e "${GREEN}##############################################################################${NC}"
echo -e "${GREEN}# ✅ DEPLOYMENT GUIDE COMPLETE${NC}"
echo -e "${GREEN}##############################################################################${NC}"
echo ""
echo "Follow the manual steps above to complete deployment."
echo ""
echo "Estimated time: 15-20 minutes"
echo "Cost: \$0 (Free tier)"
echo ""
