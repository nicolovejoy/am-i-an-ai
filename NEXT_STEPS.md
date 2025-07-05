# Next Steps

**🚀 Live at:** https://robotorchestra.org

## 🎯 **Current Priorities**

### **1. Navigation Improvements (Option B)**
- Create `/match` page (move current match-finding logic from home)
- Update home page (`/`) to show dashboard/overview  
- Update "Leave Match" button to return to `/match`
- Tests already written in `NavigationStructure.test.tsx`

### **2. Core Features**
- **Session Persistence** - Store completed games in DynamoDB
- **OpenAI Integration** - Connect Lambda to real AI responses
- **Real Multi-User Sessions** - Move beyond testing mode

### **3. Future**
- Admin dashboard for monitoring
- User rankings and leaderboards

## 🏗️ **Tech Stack**
- **Frontend**: Next.js → S3 + CloudFront (~$5/month)
- **Backend**: WebSocket Lambda + DynamoDB  
- **Auth**: Cognito user pool

## 🚀 **Development**
```bash
# Frontend (localhost:3001)
cd frontend && npm run dev

# Pre-commit checks
cd frontend && npm run lint && npm run build
cd lambda && npm test

# Deploy (user handles)
cd infrastructure && terraform apply
./scripts/build-frontend.sh && DOMAIN_NAME=robotorchestra.org ./scripts/deploy-frontend.sh
```