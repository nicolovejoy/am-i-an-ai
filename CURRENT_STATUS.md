# Current Status - January 2025

## 🎮 **RobotOrchestra Production MVP**

### **✅ What's Working**

- **Complete Match Flow** - Create → Respond → Vote → Progress through 5 rounds → Match completion with results
- **End-of-Match Experience** - Full identity reveal, final scores, voting accuracy, and play again functionality
- **Robot Personalities** - 3 distinct AI participants with unique response styles
- **Real-time Updates** - 1-second polling keeps UI in sync (SSE planned for cleaner implementation)
- **Production Ready** - Live at https://robotorchestra.org
- **Admin Console** - Debug panel at /admin (restricted to nlovejoy@me.com)
- **Match Persistence** - Matches survive page refreshes via sessionStorage
- **Modular Store Architecture** - Zustand store refactored into clean modules
- **Vite Migration Complete** - Frontend migrated from Next.js to Vite, fixing RSC errors
- **Server-Side Response Ordering** - Voting responses now have stable positions determined by backend
- **HumanOrRobot Terminology** - All musical references removed, clear human vs robot gameplay
- **Match History Page** - Working history page shows all matches, progress, and scores
- **Enhanced Lambda Deployment** - New script with parallel uploads, type checking, and validation
- **AI Service Implemented** - Generic AI service with AWS Bedrock integration for dynamic prompts and contextual robot responses

### **🐛 Known Issues**

- **~~Voting Interface Bug~~** - FIXED: Frontend now shows all 4 participants with "..." placeholder for loading responses
- **Match History Error** - NEW ERROR: `Cannot read properties of undefined (reading 'filter')` at getMatchStats - likely due to incomplete match data structure
- **~~Duplicate Prompts~~** - READY TO FIX: AI service can generate unique prompts per round
- **~~Robot Responses Ignore Prompts~~** - READY TO FIX: AI service can generate contextual responses
- **Polling Noise** - Console logs every second (will be fixed with SSE implementation)
- **~~Missing Health Endpoint~~** - FIXED: Added /health endpoint to match-service
- **~~AI Service Handler Import~~** - FIXED: Updated Lambda handler path in Terraform

### **🏗️ Architecture**

```
Frontend (Vite/React) → API Gateway → Lambda Functions → DynamoDB
                                            ↓
                                      SQS Queue → Robot Worker → DynamoDB
```

**Infrastructure:**

- DynamoDB table with 30-day TTL
- SQS queue for async robot responses
- Lambda functions: match-service, robot-worker, match-history
- CloudFront + S3 for frontend hosting

## 🧪 **TDD Approaches for Current Issues**

### **Option 1: Fix-First Approach (Recommended for Match History)**
Write tests that expect the current broken behavior, fix the code, then update tests:

```typescript
// 1. Test current broken state
test('matchService.getMatchHistory returns object with matches array', async () => {
  const result = await matchService.getMatchHistory();
  expect(result).toHaveProperty('matches');
  expect(result).toHaveProperty('count');
});

// 2. Fix the service to extract matches array
// 3. Update component test to expect array
```

### **Option 2: Spec-First Approach (Recommended for Prompt System)**
Write ideal behavior tests first, then implement to pass:

```typescript
// 1. Spec out ideal prompt behavior
test('should not repeat prompts within a match', () => {
  const match = createMatch();
  const usedPrompts = new Set();
  
  for (let i = 0; i < 5; i++) {
    const prompt = selectPromptForRound(match, i);
    expect(usedPrompts.has(prompt)).toBe(false);
    usedPrompts.add(prompt);
  }
});

test('robot responses should relate to the prompt', () => {
  const prompt = "What does silence mean to you?";
  const response = generateRobotResponse('philosopher', prompt);
  
  // Response should contain keywords from prompt
  expect(response.toLowerCase()).toMatch(/silence|quiet|sound|noise/);
});
```

### **Option 3: Integration-First Approach (Recommended for Response Loading)**
Test the full flow to ensure no flickering:

```typescript
test('voting interface should show stable placeholders until all responses load', async () => {
  const { rerender } = render(<RoundInterface />);
  
  // Initially shows placeholders
  expect(screen.getAllByText('...')).toHaveLength(3); // 3 robots
  
  // Simulate responses loading one by one
  mockStore.setState({ roundResponses: { A: 'Human response' } });
  rerender(<RoundInterface />);
  expect(screen.getAllByText('...')).toHaveLength(3); // Still 3 placeholders
  
  // All responses loaded
  mockStore.setState({ roundResponses: allResponses });
  rerender(<RoundInterface />);
  expect(screen.queryByText('...')).not.toBeInTheDocument();
});
```

## 🤖 **AI Service Implementation - COMPLETED**

### **What's Implemented**

1. **Generic AI Service API** (`POST /ai/generate`)
   - Supports multiple tasks: `generate_prompt`, `robot_response`, `analyze_match`, `summarize`, `custom`
   - AWS Bedrock integration with Claude models (Opus, Sonnet, Haiku)
   - Request validation with Zod
   - Smart model selection based on task complexity

2. **Dynamic Prompt Generation**
   - Round 1: Uses curated starter prompts
   - Rounds 2-5: AI analyzes previous responses and generates contextual follow-ups
   - Ensures thematic coherence across the match

3. **Contextual Robot Responses**
   - Robots now generate responses based on the actual prompt
   - Each personality (philosopher, comedian, scientist) has unique response style
   - Higher temperature for more personality variation

4. **Frontend AI Service Client** (`aiService.ts`)
   - Type-safe API client with convenience methods
   - Error handling with user-friendly messages
   - Support for all AI tasks

### **Completed in This Session**

1. **Implemented Generic AI Service**
   - Created Lambda function with AWS Bedrock integration
   - Supports prompt generation, robot responses, match analysis
   - Frontend client with type-safe API calls
   - Terraform infrastructure with proper IAM permissions

2. **Fixed Voting Interface Bug**
   - All 4 participants now show during voting phase
   - "..." placeholder for loading responses

3. **Updated Documentation**
   - Clarified deployment restrictions in CLAUDE.md
   - Renamed deploy-lambda.sh to deploy-lambdas.sh (plural)

4. **Added Health Endpoint**
   - match-service now responds to /health requests

### **Next Steps (for fresh context)**

1. **Fix Match History Error**
   - Debug why match data is missing expected fields
   - Ensure match history API returns complete match objects

2. **Integrate AI Service with Match Flow**
   - Replace static prompts with AI generation
   - Replace pre-written robot responses with contextual AI responses
   - Test end-to-end with dynamic content

3. **Add Match Analysis Feature**
   - Post-match AI analysis available to players
   - Insights on themes, difficulty, and interesting moments

## 🤖 **Smarter Prompt System - Design Options** (ARCHIVED - Now Implemented)

### **Current Issues:**
- Only 10 abstract prompts, high chance of repeats
- Robots don't actually respond to prompts (pre-written responses)
- No thematic variety or difficulty progression

### **Option 1: Dynamic Prompt Generation with AI Context**
```typescript
interface SmartPrompt {
  template: string;
  category: 'philosophical' | 'creative' | 'analytical' | 'emotional';
  difficulty: 1 | 2 | 3;
  contextualizers: string[]; // Words/phrases to ensure robots reference
}

// Example implementation
const generateSmartPrompt = (round: number, previousPrompts: string[]): string => {
  // Increase difficulty as rounds progress
  const difficulty = Math.ceil(round / 2);
  
  // Rotate categories to ensure variety
  const category = CATEGORIES[round % CATEGORIES.length];
  
  // Generate unique prompt with context
  return promptGenerator.create({
    category,
    difficulty,
    avoid: previousPrompts, // Ensure uniqueness
    mustInclude: getContextWords(category) // Ensure robot responses can reference
  });
};
```

### **Option 2: Curated Prompt Banks with Smart Selection**
```typescript
interface PromptBank {
  beginner: Prompt[];    // 20+ prompts - rounds 1-2
  intermediate: Prompt[]; // 20+ prompts - rounds 3-4  
  advanced: Prompt[];    // 20+ prompts - round 5
  themes: {
    philosophical: Prompt[];
    storytelling: Prompt[];
    hypothetical: Prompt[];
    observational: Prompt[];
  };
}

// Ensure variety and progression
const selectPrompt = (match: Match): Prompt => {
  const round = match.currentRound;
  const usedCategories = match.rounds.map(r => r.prompt.category);
  
  // Pick difficulty based on round
  const pool = round <= 2 ? bank.beginner : 
               round <= 4 ? bank.intermediate : 
               bank.advanced;
  
  // Pick unused category
  const category = pickUnusedCategory(usedCategories);
  
  // Select prompt not used in this match
  return pickUnusedPrompt(pool, category, match.usedPromptIds);
};
```

### **Option 3: Prompt + Response Framework**
```typescript
interface PromptResponseFramework {
  prompt: {
    text: string;
    keywords: string[]; // Words robots should consider using
    tone: 'serious' | 'playful' | 'thoughtful';
    expectedLength: 'short' | 'medium' | 'long';
  };
  
  robotGuidance: {
    mustMention: string[]; // At least one of these
    avoidCliches: string[]; // Don't use these obvious responses
    personality: {
      philosopher: { approach: string; vocabulary: string[] };
      comedian: { approach: string; vocabulary: string[] };
      scientist: { approach: string; vocabulary: string[] };
    };
  };
}

// Robots generate contextual responses
const generateResponse = (framework: PromptResponseFramework, personality: string): string => {
  const guidance = framework.robotGuidance.personality[personality];
  
  return responseGenerator.create({
    prompt: framework.prompt.text,
    approach: guidance.approach,
    includeKeywords: pickRandom(framework.prompt.keywords, 2),
    vocabulary: guidance.vocabulary,
    tone: framework.prompt.tone,
    length: framework.prompt.expectedLength
  });
};
```

## 📋 **Next Steps (Priority Order)**

### 1. **Quick Fix - Match History API**
- **Issue**: Frontend expects array but gets `{matches: [], count: n}`
- **Fix**: Update `matchService.getMatchHistory()` to return `response.matches`
- **Test First**: Write test expecting array, fix service, verify

### 2. **Prompt System Overhaul**
- **Fix Duplicate Prompts**: Track used prompts per match in DynamoDB
- **Make Robots Contextual**: Pass prompt to robot response generator
- **Expand Prompt Bank**: Add 50+ prompts with categories and difficulty
- **Test First**: Write tests for non-repeating prompts and contextual responses

### 3. **Other Quick Fixes**
- **Add Health Endpoint**: Add /health endpoint to match-service Lambda
- **Clean Console**: Remove or reduce polling logs
- **Fix Lambda Tests**: Remove references to deleted modules

### 4. **Server-Sent Events (SSE) Implementation**

Replace noisy 1-second polling with clean real-time updates:

- Add SSE endpoint to Lambda
- Update frontend to use EventSource
- Maintain polling as fallback
- Cleaner console, better performance

### 3. **Multi-Human Matches (2 humans + 2 robots)**

Enable more social gameplay:

- Update match creation logic
- Add matchmaking/lobby system
- Handle multiple human participants
- Adjust voting/scoring logic

## 🛠️ **Development Notes**

- **Frontend Migration**: Successfully migrated from Next.js to Vite ✅
- **Response Ordering**: Implemented server-side randomization for stable voting UI ✅
- **Lambda Updates**: Added `presentationOrder` field to rounds when transitioning to voting ✅
- **DynamoDB Fix**: Configured DocumentClient with `removeUndefinedValues: true` ✅
- **Frontend Tests**: Need to be reconfigured for Vite/Vitest
- **State Management**: Refactored to modular architecture with separate api, actions, and types ✅
- **CI/CD**: Enhanced with proper cache headers and comprehensive CloudFront invalidation ✅
- **Deployment**: Use `./scripts/deploy-lambdas.sh` for Lambda updates
- **Store Architecture**: Reduced from 439 lines to 56 lines with better separation of concerns ✅
- **Error Handling**: Consistent API error handling with custom MatchServiceError class ✅
- **Build Timestamps**: Now show PST timezone explicitly ✅
- **Terminology Cleanup**: All musical references replaced with human/robot terminology ✅

## 💰 **Cost Status**

Current: ~$5-10/month (within budget)

- Lambda invocations
- DynamoDB storage/requests
- CloudFront/S3 hosting

## 🚀 **Future Enhancements**

- Email/SMS notifications (AWS SES + SNS)
- Match history analytics
- Tournament mode
- Custom AI personalities
- Mobile app

## 📊 **Data Flow Architecture**

### Current Flow (Polling-based)

```mermaid
sequenceDiagram
    participant U as User Browser
    participant CF as CloudFront/S3
    participant AG as API Gateway
    participant LS as Lambda Service
    participant DB as DynamoDB
    participant SQ as SQS Queue
    participant LW as Lambda Worker

    U->>CF: Load App
    CF-->>U: Static Assets

    rect rgb(200, 200, 200)
        Note over U: Create Match Flow
        U->>AG: POST /matches
        AG->>LS: Invoke
        LS->>DB: Create Match
        LS->>SQ: Queue Robot Tasks
        LS-->>U: Match Created

        SQ->>LW: Process Robot Response
        LW->>DB: Update Match
    end

    rect rgb(255, 200, 200)
        Note over U: Current Polling (1s interval)
        loop Every 1 second
            U->>AG: GET /matches/{id}
            AG->>LS: Invoke
            LS->>DB: Read Match
            LS-->>U: Match State
        end
    end

    rect rgb(200, 200, 200)
        Note over U: Submit Response/Vote
        U->>AG: POST /matches/{id}/responses
        AG->>LS: Invoke
        LS->>DB: Update Match
        LS-->>U: Success
    end
```

### Proposed SSE Flow (Real-time updates)

```mermaid
sequenceDiagram
    participant U as User Browser
    participant CF as CloudFront/S3
    participant AG as API Gateway
    participant LS as Lambda Service
    participant DB as DynamoDB
    participant DS as DynamoDB Streams
    participant LH as Lambda Handler (SSE)
    participant SQ as SQS Queue
    participant LW as Lambda Worker

    U->>CF: Load App
    CF-->>U: Static Assets

    rect rgb(200, 200, 200)
        Note over U: Create Match Flow (unchanged)
        U->>AG: POST /matches
        AG->>LS: Invoke
        LS->>DB: Create Match
        LS->>SQ: Queue Robot Tasks
        LS-->>U: Match Created
    end

    rect rgb(200, 255, 200)
        Note over U: New SSE Connection
        U->>AG: GET /matches/{id}/events (SSE)
        AG->>LH: Open Connection
        Note over LH,U: Keep connection alive

        par DynamoDB Streams Integration
            DB-->>DS: Change Events
            DS->>LH: Match Updates
            LH-->>U: SSE: data: {match state}
        and Robot Updates
            SQ->>LW: Process Robot Response
            LW->>DB: Update Match
            DB-->>DS: Change Event
            DS->>LH: Update Notification
            LH-->>U: SSE: data: {new response}
        end
    end

    rect rgb(200, 200, 200)
        Note over U: Submit Response/Vote (unchanged)
        U->>AG: POST /matches/{id}/responses
        AG->>LS: Invoke
        LS->>DB: Update Match
        LS-->>U: Success
        Note over DB,U: Update flows through SSE automatically
    end
```

### Key Benefits of SSE Implementation

1. **Real-time Updates** - No more 1-second polling
2. **Reduced Lambda Invocations** - Cost savings
3. **Better UX** - Instant feedback when others respond
4. **Cleaner Console** - No polling noise
5. **Scalable** - DynamoDB Streams handle the pub/sub pattern
