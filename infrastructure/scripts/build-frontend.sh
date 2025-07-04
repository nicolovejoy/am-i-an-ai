#!/bin/bash
set -e

# Build Frontend Application
# Simple script to build the Next.js application for static export

echo "🏗️  Building Frontend Application..."

# Navigate to frontend directory
cd "$(dirname "$0")/../../frontend"

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building Next.js application..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Build failed - 'dist' directory not found!"
    exit 1
fi

echo "✅ Frontend build complete"
echo "📂 Output directory: frontend/dist/"
echo "📊 Build size:"
du -sh dist/

echo ""
echo "Next step: Run ./deploy-frontend.sh to upload to S3"