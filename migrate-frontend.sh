#!/bin/bash
set -e

echo "🚀 Migrating from frontend/ to frontend-vite/"

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "frontend-vite" ]; then
    echo "❌ Error: Must run from project root with both frontend/ and frontend-vite/ directories"
    exit 1
fi

echo "📦 Backing up old frontend..."
mv frontend frontend-old-nextjs

echo "📁 Renaming frontend-vite to frontend..."
mv frontend-vite frontend

echo "🔧 Updating deploy script..."
sed -i '' 's|/frontend"|/frontend"|g' infrastructure/scripts/deploy-frontend.sh

echo "📝 Updating CLAUDE.md..."
sed -i '' 's|frontend-vite/|frontend/|g' CLAUDE.md

echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Update any CI/CD pipelines"
echo "2. Test the build: cd frontend && npm run build"
echo "3. Deploy: cd infrastructure && ./scripts/deploy-frontend.sh"
echo "4. Once verified, remove frontend-old-nextjs/"