#!/bin/bash
set -e

# Update Frontend Environment Variables
# Reads terraform outputs and updates frontend .env file for Vite

echo "🔧 Updating Frontend Environment Variables..."

cd "$(dirname "$0")/../"

# Get terraform outputs
echo "📊 Reading Terraform outputs..."
MATCH_API_ENDPOINT=$(terraform output -raw match_api_endpoint 2>/dev/null || echo "")
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null || echo "")
COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id 2>/dev/null || echo "")
WEBSITE_URL=$(terraform output -raw website_url 2>/dev/null || echo "")

# Validate outputs
if [ -z "$MATCH_API_ENDPOINT" ] || [ -z "$COGNITO_USER_POOL_ID" ] || [ -z "$COGNITO_CLIENT_ID" ] || [ -z "$WEBSITE_URL" ]; then
    echo "❌ Error: Missing terraform outputs. Available outputs:"
    terraform output
    exit 1
fi

# Extract endpoints from terraform
HISTORY_ENDPOINT="${MATCH_API_ENDPOINT}/matches/history"

# Create .env file for Vite
ENV_FILE="../frontend/.env"
echo "📝 Writing environment file: $ENV_FILE"

cat > "$ENV_FILE" << EOF
# Unified Match API Endpoints
VITE_MATCH_SERVICE_API=${MATCH_API_ENDPOINT}
VITE_MATCH_HISTORY_API=${HISTORY_ENDPOINT}

# Cognito Configuration
VITE_COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
VITE_COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}

# Domain Configuration
VITE_DOMAIN_NAME=${WEBSITE_URL}
EOF

echo "✅ Environment variables updated!"
echo ""
echo "📋 Current configuration:"
cat "$ENV_FILE"
echo ""
echo "🔗 API Endpoints configured:"
echo "  Match Service: ${MATCH_API_ENDPOINT}"
echo "  Match History: ${HISTORY_ENDPOINT}"
echo ""
echo "Next steps:"
echo "1. Run 'npm run build' in frontend/ to rebuild with new environment"
echo "2. Run 'DOMAIN_NAME=robotorchestra.org ./deploy-frontend.sh' to deploy"