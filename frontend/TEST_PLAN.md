# Testing Plan for New State Architecture

## Phase 1: Update Import Paths (Low Risk)

First, let's update ONE component at a time to use the v2 version and test:

### Step 1: Update ParticipantBar (Safest)

```bash
# In the file that imports ParticipantBar, change:
import ParticipantBar from "./ParticipantBar";
# To:
import ParticipantBar from "./ParticipantBar.v2";
```

**Test**:

- Start dev server: `npm run dev`
- Create a match
- Verify participant bar shows all 4 slots correctly

### Step 2: Update ResponseInput

Similar process - update import, test response submission

### Step 3: Update HumanOrRobot

Update import, test voting functionality
discuss renaming the component with user

### Step 4: Update RoundInterface

Update import, test round transitions

### Step 5: Update ChatInterface (Highest Risk)

This is the main component - update last

## Phase 2: Integration Testing

### Local Development Testing

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Watch logs
aws logs tail -f /aws/lambda/robot-orchestra-match-service
```

### Test Scenarios:

#### 1. Basic Flow Test

- [ ] Create new match
- [ ] Submit response for round 1
- [ ] Wait for robot responses
- [ ] Vote on responses
- [ ] Verify transition to round 2
- [ ] **Critical**: Test round 4 → 5 transition

#### 2. Round 5 Bug Test

- [ ] Play through to round 4
- [ ] Submit vote in round 4
- [ ] **Verify**: Round 5 loads with new prompt
- [ ] **Verify**: Can submit response in round 5
- [ ] **Verify**: All 4 responses appear in voting

#### 3. Error Handling Test

- [ ] Disconnect network briefly
- [ ] Verify reconnection works
- [ ] Submit response with network off
- [ ] Verify optimistic update rolls back

#### 4. Edge Cases

- [ ] Rapid clicking (double submit prevention)
- [ ] Long responses (character limit)
- [ ] Special characters in responses
- [ ] Browser refresh mid-game

## Phase 3: Backend Schema Migration

### Update Lambda functions to use shared schemas:

1. **match-service.ts**:

```typescript
import { MatchSchema, SubmitResponseRequestSchema } from "@shared/schemas";

// In handler:
const body = SubmitResponseRequestSchema.parse(JSON.parse(event.body));
```

2. **Test each endpoint**:

```bash
# Test match creation
curl -X POST https://your-api.com/matches \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Test User"}'

# Test response submission
curl -X POST https://your-api.com/matches/{matchId}/responses \
  -H "Content-Type: application/json" \
  -d '{"identity": "A", "response": "Test response", "round": 1}'
```

## Phase 4: Production Testing

### Pre-deployment Checklist:

- [ ] All TypeScript compiles: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Lambda tests pass: `cd lambda && npm test`

### Deployment:

```bash
# Deploy frontend first
cd infrastructure
./scripts/deploy-frontend.sh

# Test in production
# Then deploy lambdas
./scripts/deploy-lambdas.sh
```

### Production Smoke Test:

1. Create match at https://robotorchestra.org
2. Play one complete game
3. Specifically test round 5
4. Check CloudWatch logs for errors

## Rollback Plan

If issues are found:

### Quick Rollback (Frontend Only):

1. Revert component imports back to non-v2 versions
2. Redeploy frontend

### Full Rollback:

1. Git revert to previous commit
2. Redeploy both frontend and backend

## Success Criteria

✅ Round 5 bug is fixed (can submit responses in round 5)
✅ All existing functionality works
✅ No console errors
✅ Performance is same or better
✅ Type safety catches errors at build time

## Monitoring

After deployment, monitor:

- CloudWatch Lambda errors
- Browser console for client errors
- User reports of issues

## Timeline

- Phase 1: 30 minutes (careful testing after each component)
- Phase 2: 1 hour (thorough local testing)
- Phase 3: 30 minutes (backend updates)
- Phase 4: 30 minutes (production deployment and testing)

Total: ~2.5 hours for complete migration and testing
