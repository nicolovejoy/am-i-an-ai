# am I an AI? - Next Steps

## 🎉 **Current Status**

✅ **Platform Live & Functional**: https://amianai.com with full AWS infrastructure  
✅ **Real-time 4-Player Platform**: WebSocket + Lambda + DynamoDB infrastructure  
✅ **Player UI System**: Proper names (Ashley/Brianna/Chloe/David), colors, user differentiation  
✅ **Mock AI Testing**: TestingModeToggle working with 3 AI personas  
⚠️ **Identity Assignment**: Not randomizing yet - user always gets same identity
✅ **Comprehensive Test Coverage**: TDD approach with 18+ MessageBubble tests
✅ **CloudTrail Integration**: AWS resource tracking and audit trail active
✅ **MVP User Journey Planning**: Complete user flow documentation with refined round structure
✅ **BACKEND REDESIGN COMPLETE**: New Match/Round architecture deployed and live
✅ **Match/Round System**: 30+ tests passing, clean WebSocket actions (`join_match`, `submit_response`, `submit_vote`)
✅ **TypeScript Foundation**: `match-handler.ts`, `MatchManager.ts`, `types.ts` with full test coverage

## 🎯 **MVP Priorities** (Based on User Journey)

### **Phase 1: Welcome Dashboard (1-2 sessions)**
1. **Replace Landing Page** - Create WelcomeDashboard component with match options
2. **Mock Match Browser** - Show "available matches to join" with sample data + "not fully implemented" badges
3. **Quick Actions** - "Start Test Match" (active) + "Create Live Match" (inactive)
4. **Recent Match History** - Display last 3-5 matches with accuracy scores (placeholder)
5. **About Page** - Link from dashboard explaining the game

### **~~Phase 1.5: Backend Redesign~~ ✅ COMPLETED**
6. ✅ **Match-Focused Data Model** - Lambda rebuilt with Match/Round terminology
7. ✅ **Round State Management** - Full round transitions, timers, and vote collection implemented
8. ✅ **Hardcoded Prompts** - 6 predefined prompts rotating through rounds
9. ✅ **WebSocket Actions** - `join_match`, `submit_response`, `submit_vote` all implemented and tested
10. ✅ **Live Deployment** - New backend deployed and running at production WebSocket endpoint

### **Phase 2: 5-Round Frontend (2-3 sessions)**
11. **New Round Components** - RoundInterface, PromptDisplay, ResponseInput, RoundVoting
12. **Match Store** - Rename sessionStore → matchStore with round state management
13. **Real-Time Round Flow** - Connect to redesigned backend WebSocket actions
14. **Random Identity Assignment** - Fix so user isn't always Ashley
15. **Timer Display** - Show individual response time + cumulative round time (5min max)

### **Phase 3: Match History Enhancement (1-2 sessions)**
16. **Real Match History** - Replace mock data with DynamoDB queries
17. **Match Detail View** - Full round-by-round transcript and voting patterns
18. **User Profile Stats** - Total matches, average accuracy, streaks

### **Future Features**
- **OpenAI Integration** - Replace mock AI with real OpenAI responses and dynamic prompt generation
- **Live Matches** - Join matches with other humans (2H+2AI)
- **Admin Console** - Monitor active matches and user analytics
- **Advanced Scoring** - More sophisticated voting mechanics and accuracy tracking

## 📊 **Architecture**

- **Frontend:** https://amianai.com (Next.js + S3 + CloudFront)
- **Backend:** WebSocket API Gateway + Lambda (Node.js 20.x) - **NEEDS REDESIGN**
- **Database:** DynamoDB matches table (redesign from sessions schema)
- **Monitoring:** CloudTrail + CloudWatch for resource tracking
- **Cost:** ~$5-7/month (including CloudTrail)

---

## 🔄 **Terminology Migration**

### **Frontend Updates Needed** (Phase 2)
```typescript
// FRONTEND UPDATES
sessionStore.ts → matchStore.ts
getConversations() → getMatches()
ConversationInterface → MatchInterface

// BACKEND REDESIGN (Match/Round focused)
interface Match {
  matchId: string;
  status: 'waiting' | 'round_active' | 'round_voting' | 'completed';
  currentRound: number;
  participants: Participant[];
  rounds: Round[];
  settings: MatchSettings;
}

interface Round {
  roundNumber: number;
  prompt: string;
  responses: Record<Identity, string>;
  votes: Record<Identity, Identity>;
  scores: Record<Identity, number>;
}

// WebSocket Actions (Renamed)
'join' → 'join_match'
'message' → 'submit_response'
'vote' → 'submit_vote'
```

### **Infrastructure Changes**
- DynamoDB: `sessions` table → `matches` table with round structure
- Lambda: Complete rewrite with Match/Round terminology
- WebSocket: New action names aligned with round-based gameplay

**Rationale**: Early enough to fix architecture. Clean terminology prevents technical debt and enables proper round-based features.

---

## ✅ **Success Metrics for MVP**

1. **User logs in → starts test match in <30 seconds**
2. **Completes full 5-round match (prompt → response → vote x5 → results) in <8 minutes**
   - 90 seconds max per response, 5 minute round limit
   - 30 seconds per vote
   - Quick round transitions with AI summaries
3. **Returns to dashboard and starts another match** (engagement)
4. **Browses match history** (retention indicator)

**MAJOR MILESTONE**: Backend redesign complete! Clean Match/Round architecture deployed.
**Current Priority**: Frontend integration with new WebSocket actions
**Next Action**: 
1. ✅ Backend redesign complete (Match/Round architecture deployed)
2. **Update Frontend** - Replace old WebSocket actions with new `join_match`, `submit_response`, `submit_vote`
3. **Build Round Components** - `RoundInterface`, `PromptDisplay`, `ResponseInput`, `RoundVoting`
4. **Implement 5-Round Flow** - Complete prompt → response → vote → results cycle
