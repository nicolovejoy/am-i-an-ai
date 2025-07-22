# 2v2 Match Flow Documentation

## Overview

The 2v2 (Duo) match type allows two human players to compete alongside two AI players in a game where everyone tries to identify who is human. All four participants are anonymized with identities A, B, C, and D.

## Player 1 (Host) Experience

### 1. Creating a Match
- Alice navigates to the dashboard and clicks "New Match"
- Selects "Duo Match (2v2)" from the template options
- System creates match with status `waiting_for_players`
- Alice receives a 6-character invite code (e.g., "ABC123")

### 2. Waiting Room
- Alice sees:
  - Match title: "Duo Match - Waiting for Players"
  - Invite code prominently displayed with copy button
  - Shareable link: `robotorchestra.org/join/ABC123`
  - Player list showing "Alice (Host) ✓" and "Waiting for 1 more player..."
  - No AI players shown (they haven't been assigned yet)

### 3. When Player 2 Joins
- Alice sees Bob appear in the player list
- Brief "Starting match..." message
- Automatic redirect to match page

### 4. Match Play
- Alice is assigned a random identity (A, B, C, or D)
- Sees 4 anonymous participants
- Cannot tell which participants are Bob, AI #1, or AI #2
- Plays through 5 rounds of prompts and voting

### 5. Results
- Identities revealed showing who was human vs AI
- Can see Bob's actual responses and compare strategies

## Player 2 (Joiner) Experience

### 1. Receiving Invite
- Bob receives invite code from Alice (via text, chat, etc.)
- Navigates to robotorchestra.org
- Clicks "Join Match" on dashboard

### 2. Entering Code
- Enters the 6-character code "ABC123"
- System validates code and checks match status
- If valid, joins the match

### 3. Brief Waiting Room
- Sees match is full (2/2 humans)
- Shows "Alice (Host)" and "Bob" in player list
- Almost immediately sees "Starting match..."
- Automatic redirect to match page

### 4. Match Play
- Bob is assigned a random identity (A, B, C, or D)
- Same anonymous experience as Alice
- Cannot identify Alice among the 4 participants

### 5. Results
- Sees the same reveal as Alice
- Can compare performance with Alice

## Complete Call Flow: Alice Invites Bob

```
┌─────────────────────────────────────────────────────────────────────┐
│                        2v2 Match Complete Flow                       │
└─────────────────────────────────────────────────────────────────────┘

1. MATCH CREATION
   Alice                          System                           Bob
     │                              │                              │
     ├──[Create Duo Match]─────────>│                              │
     │                              ├─> Create match record        │
     │                              ├─> Status: waiting_for_players│
     │                              ├─> Generate code: ABC123      │
     │<────[Match created]──────────┤                              │
     │      Invite: ABC123          │                              │
     │                              │                              │
     
2. INVITATION
     ├──[Send code to Bob]─────────────────────────────────────────>│
     │  "Join me: ABC123"          │                              │
     │                              │                              │
     
3. WAITING ROOM
     ├──[View waiting room]────────>│                              │
     │<───[1/2 players joined]──────┤                              │
     │                              │                              │
     
4. BOB JOINS
     │                              │<──────[Enter code: ABC123]───┤
     │                              ├─> Validate code              │
     │                              ├─> Add Bob to match           │
     │                              ├─> Check if ready (2/2 humans)│
     │                              ├─> Assign 2 AI players        │
     │                              ├─> Shuffle identities A,B,C,D │
     │                              ├─> Status: round_active       │
     │<────[Match starting]─────────┤──────[Match starting]───────>│
     │                              │                              │
     
5. ROUND 1: RESPONDING
     │<────[You are Player C]───────┤─────[You are Player A]──────>│
     │<────[Prompt displayed]───────┤─────[Prompt displayed]──────>│
     │                              │                              │
     ├──[Submit response]──────────>│<─────[Submit response]───────┤
     │                              ├─> Store responses            │
     │                              ├─> Trigger AI responses       │
     │                              ├─> Check if all 4 responded   │
     │                              ├─> Status: voting             │
     │<────[Show 4 responses]───────┤─────[Show 4 responses]──────>│
     │     (anonymized)             │      (anonymized)            │
     │                              │                              │
     
6. ROUND 1: VOTING
     ├──[Vote for Player B]────────>│<────[Vote for Player C]──────┤
     │                              ├─> Store votes                │
     │                              ├─> AI players auto-vote       │
     │                              ├─> Calculate scores           │
     │                              ├─> Start Round 2              │
     │                              │                              │
     
7. ROUNDS 2-5
     │<═══[Repeat steps 5-6 for each round]═══════════════════════>│
     │                              │                              │
     
8. MATCH COMPLETION
     │                              ├─> Status: completed          │
     │                              ├─> Calculate final scores     │
     │<────[Identity Reveal]────────┤─────[Identity Reveal]───────>│
     │   Player A: Bob (Human)      │   Player A: Bob (Human)     │
     │   Player B: Claude (AI)      │   Player B: Claude (AI)     │
     │   Player C: Alice (Human)    │   Player C: Alice (Human)   │
     │   Player D: GPT-4 (AI)       │   Player D: GPT-4 (AI)      │
     │                              │                              │
     │<────[Final Scores]───────────┤──────[Final Scores]─────────>│
     │   1st: Player B (12 pts)     │   1st: Player B (12 pts)    │
     │   2nd: Player C (8 pts)      │   2nd: Player C (8 pts)     │
     │   3rd: Player A (5 pts)      │   3rd: Player A (5 pts)     │
     │   4th: Player D (3 pts)      │   4th: Player D (3 pts)     │
     └──────────────────────────────┴──────────────────────────────┘
```

## Key Technical Details

### Match States
1. `waiting_for_players` - Waiting for all humans to join
2. `waiting` - All players assigned, preparing first round
3. `round_active` - Current round in progress
4. `round_voting` - Voting phase
5. `completed` - Match finished

### Participant Assignment
- Humans join with their display names during waiting phase
- When all humans join, system:
  1. Fetches 2 random AI players from the users table
  2. Creates array of all 4 participants
  3. Randomly assigns identities A, B, C, D
  4. No one knows who has which identity

### Data Structure During Waiting
```json
{
  "matchId": "match-123",
  "status": "waiting_for_players",
  "templateType": "duo_2v2",
  "inviteCode": "ABC123",
  "participants": [
    {
      "userId": "alice-id",
      "displayName": "Alice",
      "isAI": false,
      "isReady": true
    }
  ],
  "waitingFor": {
    "humans": 1,
    "ai": 2
  }
}
```

### Data Structure After Start
```json
{
  "matchId": "match-123",
  "status": "round_active",
  "participants": [
    {
      "identity": "C",
      "isAI": false,
      "playerName": "Alice",
      "userId": "alice-id"
    },
    {
      "identity": "A", 
      "isAI": false,
      "playerName": "Bob",
      "userId": "bob-id"
    },
    {
      "identity": "B",
      "isAI": true,
      "playerName": "Claude",
      "personality": "philosopher"
    },
    {
      "identity": "D",
      "isAI": true,
      "playerName": "GPT-4",
      "personality": "comedian"
    }
  ],
  "rounds": [...]
}
```

## The Waiting Room Concept

The waiting room serves as a transitional space between match creation and gameplay. It exists to:

1. **Coordinate Multiple Humans**: Unlike 1v3 matches that start instantly, 2v2 matches need both humans present
2. **Provide Invite Mechanism**: Give the host time to share the invite code
3. **Show Join Progress**: Let players see who has joined and who we're waiting for
4. **Maintain Fairness**: Ensure all humans start simultaneously (no advantage to early joiners)

### Why Alice Doesn't See Bob's Name During Gameplay

Once the match starts, **total anonymity is enforced**. Alice has no idea which of the 4 anonymous players (A, B, C, D) is Bob. This is crucial because:
- Knowing Bob's identity would let Alice vote strategically ("I know B is Bob, so B is human")
- Alice might write responses differently if she knew Bob would see them attributed to her
- The AI players need to blend in with humans who don't know each other's identities

## Alice's Experience Timeline

### Phase 1: After Creating Match (Waiting Alone)
```
Waiting Room - Duo Match
━━━━━━━━━━━━━━━━━━━━━━━
Invite Code: ABC123 [Copy Link]

Players Joined:
• Alice (Host) ✓
• Waiting for 1 more player...

Status: Share the invite code with your friend!
```

Alice can:
- Copy the invite code or link
- See she's the only one in the match
- Leave and cancel the match

### Phase 2: After Bob Joins (Match Starting)
```
Waiting Room - Duo Match
━━━━━━━━━━━━━━━━━━━━━━━
Invite Code: ABC123

Players Joined:
• Alice (Host) ✓
• Bob ✓

Status: All players joined! Starting match...
[Redirecting in 3...2...1...]
```

Brief transition showing:
- Bob has joined
- Match is starting
- AI players being assigned (happens in backend)

### Phase 3: During Round 1 (Before Bob Responds)
```
Round 1 of 5
━━━━━━━━━━━━
Prompt: What's a simple pleasure that brings you unexpected joy?

You are: Player C

Waiting for responses:
• Player A - Waiting...
• Player B - Waiting...  
• Player C - ✓ (You)
• Player D - Waiting...

[Your response: "The first sip of coffee on a cold morning"]
```

Alice sees:
- Her assigned identity (Player C)
- Her own response
- 3 other players waiting (one is Bob, two are AI)
- No indication of who is who

### Phase 4: After Bob Responds
```
Round 1 of 5
━━━━━━━━━━━━
Prompt: What's a simple pleasure that brings you unexpected joy?

You are: Player C

Waiting for responses:
• Player A - ✓
• Player B - Waiting...  
• Player C - ✓ (You)
• Player D - Waiting...
```

Alice notices:
- Player A has now responded (could be Bob or AI)
- Still waiting for B and D (one is Bob, one is AI)
- No way to know which response is Bob's

**Critical**: Alice never knows during the game:
- Which player is Bob
- Which responses are Bob's
- Whether Bob has responded yet specifically

### Phase 5: All Responses In (Voting Time)
```
Round 1 of 5 - Vote for the Human!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Player A: "Finding a forgotten $20 in my pocket"
Player B: "The smell of rain on hot pavement"
Player C: "The first sip of coffee on a cold morning" (You)
Player D: "When my cat does that little chirp sound"

Who do you think is the human? [A] [B] [D]
```

Alice must guess who is human based solely on responses, not knowing:
- Which one is Bob
- Which two are AI
- How Bob typically writes

### Phase 6: End of Match (Identity Reveal)
```
Match Complete! - Identity Reveal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Player A: Bob (Human) - 8 points
Player B: Sophia-AI (Philosopher) - 12 points  
Player C: Alice (Human) - 5 points [You]
Player D: Max-AI (Comedian) - 10 points

Surprise! Player A was Bob all along!
```

Only NOW does Alice discover:
- Bob was Player A the whole time
- Those creative responses about finding $20 were Bob's
- She voted for Bob twice without knowing it

## Why This Design Matters

1. **True Blind Testing**: Alice can't help Bob or target Bob because she doesn't know who Bob is
2. **Natural Responses**: Both humans write naturally, not trying to signal each other
3. **Fair AI Competition**: The AI players compete on equal footing
4. **Genuine Surprise**: The reveal moment is meaningful because players truly didn't know

The waiting room is the last time Alice knows Bob is Bob. Once the match starts, he becomes just another anonymous player until the final reveal.

## Frontend Considerations

### Waiting Room Display
- Show human players by name during waiting phase
- Never reveal AI players until match starts
- Once match starts, only show anonymous identities

### Match Page Display
- Never show `isAI` field during active play
- Only reveal identities after match completes
- Ensure voting UI doesn't hint at player types

### Polling Behavior
- Poll every 4 seconds during `waiting_for_players`
- Continue polling during active match for real-time updates
- Stop polling when match is `completed`

## TDD Implementation Plan

### Overview
We need to fix three main issues:
1. **Schema Validation**: Match schema expects exactly 4 participants, but during waiting phase we have 1-2
2. **Anonymous Display**: WaitingRoom shows "AI Player" labels breaking anonymity
3. **Match State**: Ensure proper transitions from `waiting_for_players` → `waiting` → `round_active`

### Phase 1: Schema & Validation (Backend)

#### Test 1: Template-Based Participant Count
```typescript
// shared/schemas/match.schema.test.ts
describe('Match Schema Validation', () => {
  it('should allow variable participants based on template during waiting', () => {
    // Classic 1v3 template
    const waitingClassic = {
      matchId: 'test-123',
      status: 'waiting_for_players',
      templateType: 'classic_1v3',
      participants: [{ /* 1 participant */ }],
      totalParticipants: 4, // from template
      // ... other required fields
    };
    
    expect(() => MatchSchema.parse(waitingClassic)).not.toThrow();
    
    // Hypothetical 3v3 template  
    const waiting3v3 = {
      matchId: 'test-456',
      status: 'waiting_for_players',
      templateType: 'trio_3v3',
      participants: [/* 2 participants */],
      totalParticipants: 6, // from template
      // ... other required fields
    };
    
    expect(() => MatchSchema.parse(waiting3v3)).not.toThrow();
  });
  
  it('should require exact participant count for active matches', () => {
    const activeMatch = {
      matchId: 'test-123',
      status: 'round_active',
      templateType: 'duo_2v2',
      participants: [/* 3 participants */], // Wrong count!
      totalParticipants: 4,
      // ... other required fields
    };
    
    expect(() => MatchSchema.parse(activeMatch)).toThrow();
  });
});
```

**Implementation**:
1. Add `totalParticipants` field to MatchSchema:
   ```typescript
   export const MatchSchema = z.object({
     // ... existing fields
     totalParticipants: z.number().int().positive().optional(), // from template
     participants: z.array(ParticipantSchema),
     // ... rest
   }).superRefine((data, ctx) => {
     // Get expected total from template or default to 4
     const expectedTotal = data.totalParticipants || 4;
     
     if (data.status === 'waiting_for_players') {
       // During waiting, allow 1 to expectedTotal participants
       if (data.participants.length < 1 || data.participants.length > expectedTotal) {
         ctx.addIssue({
           code: z.ZodIssueCode.custom,
           message: `Waiting matches must have 1-${expectedTotal} participants`,
           path: ['participants']
         });
       }
     } else {
       // Active matches must have exact count
       if (data.participants.length !== expectedTotal) {
         ctx.addIssue({
           code: z.ZodIssueCode.custom,
           message: `Active matches must have exactly ${expectedTotal} participants`,
           path: ['participants']
         });
       }
     }
   });
   ```

### Phase 2: Frontend Anonymity

#### Test 2: WaitingRoom Anonymity
```typescript
// frontend/src/components/__tests__/WaitingRoom.test.tsx
describe('WaitingRoom', () => {
  it('should show human players by name during waiting phase', () => {
    const match = {
      status: 'waiting_for_players',
      participants: [
        { displayName: 'Alice', isAI: false },
        { displayName: 'Bob', isAI: false }
      ],
      waitingFor: { humans: 0, ai: 2 }
    };
    
    const { getByText, queryByText } = render(<WaitingRoom match={match} />);
    
    expect(getByText('Alice')).toBeInTheDocument();
    expect(getByText('Bob')).toBeInTheDocument();
    expect(queryByText('AI Player')).not.toBeInTheDocument();
  });
  
  it('should not show AI players during waiting phase', () => {
    // AI players aren't added until match starts
    const match = {
      status: 'waiting_for_players',
      participants: [{ displayName: 'Alice', isAI: false }],
      waitingFor: { humans: 1, ai: 2 }
    };
    
    const { container } = render(<WaitingRoom match={match} />);
    const participantCount = container.querySelectorAll('[data-testid="participant"]');
    
    expect(participantCount).toHaveLength(1); // Only show humans
  });
});
```

**Implementation**:
1. Update `WaitingRoom.tsx` line 58:
   ```typescript
   // Remove AI/Human distinction
   <p className="text-xs text-slate-500">
     {index === 0 ? 'Host' : 'Player'}
   </p>
   ```

2. Filter participants to only show humans during waiting:
   ```typescript
   const humanParticipants = match.participants.filter(p => !p.isAI);
   ```

### Phase 3: Match State Transitions

#### Test 3: State Transition Logic
```typescript
// lambda/match-service.test.ts
describe('Match State Transitions', () => {
  it('should transition from waiting_for_players to waiting when all humans join', async () => {
    // Create 2v2 match
    const match = await createMatchWithTemplate({
      templateType: 'duo_2v2',
      creatorUserId: 'alice-id',
      creatorName: 'Alice'
    });
    
    // Join second human
    const result = await joinMatch({
      inviteCode: match.inviteCode,
      userId: 'bob-id',
      displayName: 'Bob'
    });
    
    expect(result.match.status).toBe('waiting');
    expect(result.match.participants).toHaveLength(4); // 2 humans + 2 AI
  });
  
  it('should set totalParticipants from template', async () => {
    const match = await createMatchWithTemplate({
      templateType: 'duo_2v2',
      creatorUserId: 'alice-id',
      creatorName: 'Alice'
    });
    
    expect(match.totalParticipants).toBe(4); // From template
  });
});
```

**Implementation**:
1. Update `createMatchWithTemplate` to include totalParticipants:
   ```typescript
   const match: Match = {
     matchId,
     status: template.requiredHumans > 1 ? 'waiting_for_players' : 'waiting',
     currentRound: 1,
     totalRounds: 5,
     totalParticipants: template.totalParticipants, // Add this!
     participants: [creatorParticipant],
     // ... rest
   };
   ```

2. Update match service to pass through totalParticipants
3. Consider immediate transition to `round_active` for better UX

### Phase 4: Integration Tests

#### Test 4: Full 2v2 Flow
```typescript
// lambda/integration/2v2-flow.test.ts
describe('2v2 Match Complete Flow', () => {
  it('should handle complete 2v2 match flow', async () => {
    // 1. Alice creates match
    const match = await createMatchWithTemplate({
      templateType: 'duo_2v2',
      creatorUserId: 'alice-id',
      creatorName: 'Alice'
    });
    
    expect(match.status).toBe('waiting_for_players');
    expect(match.participants).toHaveLength(1);
    
    // 2. Bob joins
    const joined = await joinMatch({
      inviteCode: match.inviteCode,
      userId: 'bob-id',
      displayName: 'Bob'
    });
    
    expect(joined.match.status).toBe('waiting');
    expect(joined.match.participants).toHaveLength(4);
    
    // 3. Verify identities are shuffled
    const identities = joined.match.participants.map(p => p.identity);
    expect(identities).toContain('A');
    expect(identities).toContain('B');
    expect(identities).toContain('C');
    expect(identities).toContain('D');
    
    // 4. Verify AI players added
    const aiCount = joined.match.participants.filter(p => p.isAI).length;
    expect(aiCount).toBe(2);
  });
});
```

### Phase 5: Frontend Integration

#### Test 5: Match Page Behavior
```typescript
// frontend/src/pages/__tests__/MatchPage.test.tsx
describe('MatchPage 2v2 Support', () => {
  it('should show anonymous players during active match', () => {
    const match = {
      status: 'round_active',
      participants: [
        { identity: 'A', isAI: false, playerName: 'Alice' },
        { identity: 'B', isAI: true, playerName: 'Claude' },
        { identity: 'C', isAI: false, playerName: 'Bob' },
        { identity: 'D', isAI: true, playerName: 'GPT' }
      ]
    };
    
    const { queryByText } = render(<MatchPage match={match} />);
    
    // Should not show real names
    expect(queryByText('Alice')).not.toBeInTheDocument();
    expect(queryByText('Bob')).not.toBeInTheDocument();
    
    // Should show identities
    expect(queryByText('Player A')).toBeInTheDocument();
    expect(queryByText('Player B')).toBeInTheDocument();
  });
});
```

### Implementation Order

1. **Fix Schema** (Backend)
   - Update match.schema.ts with conditional validation
   - Run schema tests
   - Update any TypeScript types

2. **Fix WaitingRoom** (Frontend)
   - Remove AI/Human labels
   - Filter to show only human participants
   - Test with mock data

3. **Fix State Transitions** (Backend)
   - Ensure proper status flow
   - Test with integration tests

4. **End-to-End Testing**
   - Manual test with two browsers
   - Verify full flow works

### Key Testing Principles

1. **Write tests first** - Each test should fail initially
2. **Test behavior, not implementation** - Focus on user experience
3. **Test edge cases** - What if someone leaves? Rejoins?
4. **Mock external dependencies** - AI service, DynamoDB
5. **Use real data structures** - Match actual API responses

### Deployment Strategy

1. Deploy backend fixes first (schema, state transitions)
2. Deploy frontend fixes
3. Monitor for validation errors
4. Roll back if issues arise