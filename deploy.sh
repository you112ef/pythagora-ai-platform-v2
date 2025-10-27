#!/bin/bash

# 🚀 Pythagora AI Platform v2.0 - Deployment Script
# This script helps deploy the platform to various hosting services

echo "🚀 Pythagora AI Platform v2.0 - Deployment Script"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Project structure verified"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your actual values before deploying"
fi

echo "🔧 Environment setup complete"

# Display deployment options
echo ""
echo "🌐 Available Deployment Options:"
echo "1. Vercel (Recommended - Free tier available)"
echo "2. Netlify (Free tier available)"
echo "3. Railway (Free tier available)"
echo "4. Render (Free tier available)"
echo "5. Manual deployment instructions"

read -p "Choose deployment option (1-5): " choice

case $choice in
    1)
        echo "🚀 Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "📦 Installing Vercel CLI..."
            npm i -g vercel
            vercel --prod
        fi
        ;;
    2)
        echo "🚀 Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod
        else
            echo "📦 Installing Netlify CLI..."
            npm i -g netlify-cli
            netlify deploy --prod
        fi
        ;;
    3)
        echo "🚀 Deploying to Railway..."
        if command -v railway &> /dev/null; then
            railway login
            railway deploy
        else
            echo "📦 Installing Railway CLI..."
            npm i -g @railway/cli
            railway login
            railway deploy
        fi
        ;;
    4)
        echo "🚀 Deploying to Render..."
        echo "Please follow these steps:"
        echo "1. Go to https://render.com"
        echo "2. Connect your GitHub repository"
        echo "3. Select this project"
        echo "4. Configure environment variables"
        echo "5. Deploy!"
        ;;
    5)
        echo "📋 Manual Deployment Instructions:"
        echo ""
        echo "1. Choose a hosting provider (Vercel, Netlify, Railway, Render)"
        echo "2. Connect your GitHub repository: https://github.com/you112ef/pythagora-ai-platform"
        echo "3. Configure environment variables (see .env.example)"
        echo "4. Set up database (MongoDB Atlas recommended)"
        echo "5. Set up Redis (Upstash or Redis Cloud recommended)"
        echo "6. Deploy!"
        echo ""
        echo "📚 For detailed instructions, see DEPLOYMENT.md"
        ;;
    *)
        echo "❌ Invalid option. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo "📚 For troubleshooting, see DEPLOYMENT.md"
echo "🐛 For issues, visit: https://github.com/you112ef/pythagora-ai-platform/issues"