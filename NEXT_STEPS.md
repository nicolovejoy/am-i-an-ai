# Next Steps

**🚀 Live at:** https://robotorchestra.org

## 🎯 **Current Priorities**

### **1. Navigation Improvements (Option B)**

**Immediate TDD Steps:**
1. **Create `/match` page** - Move `WelcomeDashboard` + auto-connect logic from home
   - Test: Visiting `/match` should auto-connect to WebSocket
   - Test: `/match` shows match-finding interface when disconnected
2. **Build home dashboard** - Replace auto-connect with welcome/overview content  
   - Test: Home page shows "Welcome to Robot Orchestra" without connecting
   - Test: "Start Playing" button navigates to `/match`
3. **Update Leave Match navigation** - Change destination from `/` to `/match`
   - Test: Leave Match button calls `router.push('/match')`

**Full Goal:**
- Home (`/`) → Dashboard with overview, stats, quick actions
- Find Match (`/match`) → Join/create matches + game interface  
- Tests in `NavigationStructure.test.tsx` define complete behavior

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