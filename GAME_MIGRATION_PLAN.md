# Game Migration Plan: Chat → 5-Round Statement Game

## **Concept**
**FROM**: Real-time conversations → **TO**: 5-round statement game with strategic voting

**Game Flow**: Each round, all players respond to a prompt → statements revealed simultaneously → repeat 5x → vote for "most human" → results

---

## **Why Migrate?**
- **More strategic**: Thoughtful responses vs quick chat
- **Better AI detection**: Patterns emerge over 5 rounds  
- **Structured engagement**: Clear beginning/middle/end
- **Scalable prompts**: Admin-curated content library

---

## **Technical Plan**

### **Phase 1: Backend (2-3 sessions)**
- New DynamoDB tables: `Matches`, `Prompts` 
- Lambda updates: Round management, statement collection, voting
- WebSocket protocol: `submit_statement`, `statements_revealed`, `voting_phase`

### **Phase 2: Frontend (2-3 sessions)**  
- New components: `MatchInterface`, `RoundInput`, `StatementReveal`, `VotingInterface`
- State migration: `sessionStore` → `gameStore` (keep WebSocket connection logic)
- UI flow: Statement submission → reveal → next round → vote → results

### **Phase 3: Integration (1-2 sessions)**
- Connect new frontend to backend protocol
- Test complete 5-round flow
- Polish UI/UX and error handling

---

## **Key Decisions Needed**
1. **Statement limits**: Word count? Character count?
2. **Voting mechanics**: Click message bubbles or separate interface?
3. **AI strategy**: Do AIs see previous rounds when making statements?
4. **Prompt complexity**: Simple prompts vs specific requirements?

---

## **Timeline**: ~5-8 development sessions

**Current Status**: Analysis complete, ready to start when desired.  
**Recommendation**: Complete OpenAI integration first, then consider game migration.