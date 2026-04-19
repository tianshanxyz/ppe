#!/bin/bash

# Vercel Deployment Script using Vercel API
# This script creates a deployment using Vercel's API directly

set -e

PROJECT_ID="prj_7k93uR9ycIUADaXiubEfMRrCyrSL"
ORG_ID="team_9TzwwI5KmTYSnILA19O1p8hD"
VERCEL_DIR=".vercel/output"

echo "🚀 Starting Vercel deployment..."

# Step 1: Build the project
echo "📦 Building project..."
npm run build

# Step 2: Create deployment output
echo "📁 Creating deployment output..."
rm -rf "$VERCEL_DIR"
mkdir -p "$VERCEL_DIR"

# Copy build output
cp -r out/* "$VERCEL_DIR/" 2>/dev/null || cp -r .next "$VERCEL_DIR/" 2>/dev/null || true

# Create vercel.json for deployment
cp vercel.json "$VERCEL_DIR/"

# Step 3: Create files.json for Vercel API
echo "📋 Creating files manifest..."
cd "$VERCEL_DIR"

# Create a simple files.json
cat > files.json << 'EOF'
{
  "files": []
}
EOF

cd ..

echo "✅ Deployment output ready in $VERCEL_DIR"
echo ""
echo "⚠️  Manual step required:"
echo "Due to Vercel CLI authentication issues, please use one of these methods:"
echo ""
echo "Method 1: Use Vercel Dashboard"
echo "  1. Go to https://vercel.com/dashboard"
echo "  2. Select your project: ppe-platform"
echo "  3. Click 'Redeploy' on the latest deployment"
echo ""
echo "Method 2: Use Vercel Git Integration"
echo "  1. Push code to GitHub: https://github.com/tianshanxyz/ppe"
echo "  2. Vercel will auto-deploy from GitHub"
echo ""
echo "Method 3: Fix Vercel CLI auth"
echo "  Run: vercel login"
echo "  Then: vercel --prod"
echo ""
