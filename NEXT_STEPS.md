# Next Steps - robotorchestra.org

## 🎯 **CURRENT STATUS: WebSocket Connected, Backend Logic Broken**

### **✅ COMPLETED FIXES**
**Protocol Compatibility Fixed:**
- ✅ Backend now handles `{ action: 'join_match' }` (was expecting `{ action: 'join' }`)
- ✅ Backend now handles `{ action: 'submit_response', roundNumber, response }` (was expecting `{ content }`)
- ✅ WebSocket connection established successfully
- ✅ Lambda deployment pipeline working (`./quick-deploy.sh`)
- ✅ Frontend component name mismatch fixed (`RoundInterface`)

### **🚨 IMMEDIATE PRIORITY: Backend Connection Logic**

**Current Issue:** WebSocket connects but backend fails to:
- Assign participant identity (A/B/C/D) 
- Add 3 robot participants automatically
- Send proper match state to frontend

**Evidence:** Frontend shows "0/4 connected" and "You are participant" (empty identity)

**CloudWatch Error Found:**
```
GoneException: UnknownError at broadcastToMatch() 
-> addRobotParticipants() -> Failed to send to NQlXmfKCIAMCKxA=
```

**Root Cause Identified:** Backend tries to broadcast to disconnected WebSocket connections (the robot "connections" don't exist as real WebSocket connections)

### **Remaining Protocol Mismatches**
**Backend → Frontend:** 
- `'connected'` → needs `'match_joined'`
- `'message'` → needs `'participant_responded'`
- Missing: `'match_state'`, `'response_submitted'`

## 🛠️ **DEBUGGING STEPS**

### **Next Session Priority - SPECIFIC FIX NEEDED**
1. **Fix broadcastToMatch() function** - Don't broadcast to robot "connections" (they're fake)
2. **Fix robot participant logic** - Create robot participants without real WebSocket connections
3. **Verify identity assignment** - Ensure handleConnect() properly assigns A/B/C/D
4. **Test complete flow** - 1 human connects, 3 robots added, frontend shows 4/4

### **Key Files to Investigate**
- `lambda/handler.ts:69-120` - `handleConnect()` function
- `lambda/handler.ts:95-108` - Robot participant addition logic  
- `frontend/src/store/sessionStore.ts` - WebSocket message handling
- `frontend/src/components/ChatInterface.tsx:247-248` - Component rendering logic

### **Testing Tools Ready**
- `lambda/quick-deploy.sh` - Fast lambda deployment
- `lambda/websocket.test.ts` - Protocol tests (passing ✅)
- CloudWatch logs at `/aws/lambda/robot-orchestra-websocket`

## 🎯 **MVP Completion Path** 

### **Phase 1: Fix Backend Connection Logic**
1. ✅ WebSocket connection working
2. 🚨 **Fix identity assignment** - Backend must assign A/B/C/D identity
3. 🚨 **Fix robot participant addition** - Auto-add 3 robots when human joins
4. 🚨 **Fix match state communication** - Send proper participant list to frontend

### **Phase 2: Complete Protocol Alignment**
1. Change `'connected'` → `'match_joined'` 
2. Change `'message'` → `'participant_responded'`
3. Add missing: `'match_state'`, `'response_submitted'`

### **Phase 3: Game Flow**
1. Test 1 human + 3 robots through 5 rounds
2. Add voting phase after round 5  
3. Add reveal/results screen

## 🛠️ **Current Infrastructure**
- **Frontend**: Next.js on S3 + CloudFront (~$5/month)
- **Backend**: WebSocket Lambda + DynamoDB  
- **Auth**: Cognito user pool
- **WebSocket URL**: `wss://ckhxuef2t7.execute-api.us-east-1.amazonaws.com/prod`

## 🚀 **Development Commands**
```bash
# Frontend
cd frontend && npm run dev

# Pre-commit checks (required)
cd frontend && npm run lint && npm run build
cd lambda && npm test

# Deploy Lambda code
cd lambda && npm run build && cd dist
zip -r function.zip . && aws lambda update-function-code --function-name robot-orchestra-websocket --zip-file fileb://function.zip
```

## 📋 **Detailed Fix List**

### **WebSocket Protocol Alignment**
1. Backend `handleMessage` - add case for `action: 'join_match'` 
2. Backend - change `action: 'connected'` → `'match_joined'`
3. Backend - change `action: 'message'` → `'participant_responded'`
4. Frontend or Backend - align response submission format
5. Add missing `match_state` responses

### **Current Working Elements**
✅ Infrastructure deployed and stable  
✅ Lambda with mock robot responses  
✅ Round prompts and progression logic  
✅ Frontend UI for rounds and responses  
✅ WebSocket connection established  

### **Broken Elements**  
❌ Join flow (different action names)  
❌ Response submission (different formats)  
❌ Message type recognition  
❌ DynamoDB persistence (in-memory only)  
❌ Voting and reveal phases