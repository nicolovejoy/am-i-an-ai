#!/bin/bash
set -e

# Update Frontend Environment Variables
# Reads terraform outputs and updates frontend .env.local file

echo "🔧 Updating Frontend Environment Variables..."

cd "$(dirname "$0")/../"

# Get terraform outputs
echo "📊 Reading Terraform outputs..."
MATCH_HISTORY_API=$(terraform output -raw match_history_endpoint 2>/dev/null || echo "")
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null || echo "")
COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id 2>/dev/null || echo "")
WEBSITE_URL=$(terraform output -raw website_url 2>/dev/null || echo "")

# Validate outputs
if [ -z "$MATCH_HISTORY_API" ] || [ -z "$COGNITO_USER_POOL_ID" ] || [ -z "$COGNITO_CLIENT_ID" ] || [ -z "$WEBSITE_URL" ]; then
    echo "❌ Error: Missing terraform outputs. Run 'terraform apply' first."
    exit 1
fi

# Create .env.local file
ENV_FILE="../frontend/.env.local"
echo "📝 Writing environment file: $ENV_FILE"

cat > "$ENV_FILE" << EOF
NEXT_PUBLIC_MATCH_HISTORY_API=${MATCH_HISTORY_API}
NEXT_PUBLIC_COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
NEXT_PUBLIC_COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
NEXT_PUBLIC_DOMAIN_NAME=${WEBSITE_URL}
EOF

echo "✅ Environment variables updated!"
echo ""
echo "📋 Current configuration:"
cat "$ENV_FILE"
echo ""
echo "Next step: Run ./build-frontend.sh to rebuild with new environment"