# RobotOrchestra

**Experimental platform where humans and AI play anonymized guessing games.**

**Intended MVP**: 1 human + 3 robots, 5 rounds, guess who's human.

## ⚠️ Current Status
- ✅ Infrastructure deployed  
- ✅ Frontend connects to WebSocket
- ❌ **Robot participant system needs design work**
- ❌ Lambda handler has unresolved issues

**See `CURRENT_STATUS.md` for detailed assessment**

## 🚀 Live Site
[RobotOrchestra.org](https://robotorchestra.org) *(currently broken)*

## 🛠️ Tech Stack
- **Frontend**: Next.js + TypeScript + Tailwind + Zustand
- **Backend**: WebSocket Lambda + DynamoDB
- **Infrastructure**: AWS Serverless (~$5/month)

## 🏃 Development
```bash
# Frontend
cd frontend && npm run dev

# Pre-commit checks (required)
cd frontend && npm run lint && npm run build
cd lambda && npm test
```