# Phase 3 Implementation Plan: State Centralization

## Current Situation

### Infrastructure Status ✅
- State updates SQS queue (`robot-orchestra-state-updates`) is deployed
- Event source mapping connects the queue to match-service Lambda
- IAM policies are configured for both sending and receiving
- Environment variable `STATE_UPDATE_QUEUE_URL` is set in robot-worker

### Existing SQS Implementation

#### Current Flow
1. **match-service** → Sends messages to `robot-responses` queue
   - Triggers 3 messages (one per robot: B, C, D)
   - Message format: `{ matchId, roundNumber, prompt, robotId, timestamp }`
   
2. **robot-worker** → Processes messages from `robot-responses` queue
   - Generates AI responses
   - Saves to DynamoDB
   - **PROBLEM**: Also manages state transitions (checking if all 4 responses collected)
   - **PROBLEM**: Updates round status and generates presentation order

#### What We're Adding
1. **New message flow**: robot-worker → `state-updates` queue → match-service
   - After saving response, robot-worker sends notification
   - Message format: `{ type: 'ROBOT_RESPONSE_COMPLETE', matchId, roundNumber, robotId, timestamp }`
   
2. **Centralized state management**: match-service handles ALL state transitions
   - Receives notifications via state-updates queue
   - Checks response counts
   - Transitions rounds from 'responding' to 'voting'
   - Generates presentation order

### Code Analysis
- **match-service.ts**: 
  - Missing handler export (needs to be added)
  - Already has `checkAndTransitionRound` function that handles state transitions
  - Compiled version shows handler checks for SQS events but `handleStateUpdate` is missing
- **robot-worker.ts**: 
  - Currently manages state transitions after saving responses
  - Needs to send notifications to state updates queue

## Implementation Steps

### 1. Fix match-service.ts Handler Structure
**File**: `lambda/match-service.ts`

Add the missing handler export and imports:
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent, SQSBatchResponse, SQSBatchItemFailure } from 'aws-lambda';

// Add CORS headers constant
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Main handler function
export const handler = async (event: APIGatewayProxyEvent | SQSEvent): Promise<APIGatewayProxyResult | SQSBatchResponse> => {
  console.log('Match Service received event:', JSON.stringify(event, null, 2));
  
  // Check if this is an SQS event
  if ('Records' in event && event.Records[0]?.eventSource === 'aws:sqs') {
    return handleStateUpdate(event as SQSEvent);
  }
  
  // Otherwise handle as API Gateway event
  return handleAPIRequest(event as APIGatewayProxyEvent);
};
```

### 2. Add State Update Handler
**File**: `lambda/match-service.ts`

Add the new function to handle state update messages:
```typescript
interface StateUpdateMessage {
  type: 'ROBOT_RESPONSE_COMPLETE';
  matchId: string;
  roundNumber: number;
  robotId: string;
  timestamp: string;
}

async function handleStateUpdate(event: SQSEvent): Promise<SQSBatchResponse> {
  const results: SQSBatchItemFailure[] = [];
  
  for (const record of event.Records) {
    try {
      const message: StateUpdateMessage = JSON.parse(record.body);
      console.log('Processing state update:', message);
      
      if (message.type === 'ROBOT_RESPONSE_COMPLETE') {
        // Use existing checkAndTransitionRound function
        await checkAndTransitionRound(message.matchId, message.roundNumber);
      }
      
    } catch (error) {
      console.error('Failed to process state update:', error);
      results.push({ itemIdentifier: record.messageId });
    }
  }
  
  return { batchItemFailures: results };
}
```

### 3. Refactor Existing API Logic
**File**: `lambda/match-service.ts`

Move existing request handling logic into a separate function:
```typescript
async function handleAPIRequest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const path = event.path;
    const method = event.httpMethod;
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: '',
      };
    }
    
    // Existing routing logic goes here...
    // (Move all the current request handling code)
    
  } catch (error) {
    console.error('Request failed:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
```

### 4. Add Notification to robot-worker.ts
**File**: `lambda/robot-worker.ts`

Add the state update notification after saving robot response:
```typescript
// Add at the top
const STATE_UPDATE_QUEUE_URL = process.env.STATE_UPDATE_QUEUE_URL || '';

// Add after successfully saving robot response to DynamoDB
async function notifyStateUpdate(matchId: string, roundNumber: number, robotId: string): Promise<void> {
  if (!STATE_UPDATE_QUEUE_URL) {
    console.error('STATE_UPDATE_QUEUE_URL not configured');
    return;
  }

  const message: StateUpdateMessage = {
    type: 'ROBOT_RESPONSE_COMPLETE',
    matchId,
    roundNumber,
    robotId,
    timestamp: new Date().toISOString()
  };
  
  try {
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: STATE_UPDATE_QUEUE_URL,
      MessageBody: JSON.stringify(message)
    }));
    
    console.log(`Notified match-service of ${robotId} completion for match ${matchId}, round ${roundNumber}`);
  } catch (error) {
    console.error('Failed to send state update notification:', error);
    // Don't throw - this is non-critical for now (dual write mode)
  }
}

// Call this after saving the response (around line that saves to DynamoDB)
await notifyStateUpdate(matchId, round, robotId);
```

### 5. Testing Plan

#### Local Testing
1. Run TypeScript compilation: `npx tsc --noEmit`
2. Check for any type errors
3. Run existing unit tests: `npm test`

#### Deployment Testing
1. Deploy using: `./scripts/deploy-lambdas.sh`
2. Monitor CloudWatch logs for both functions
3. Start a new match and verify:
   - Robot-worker sends notifications (check logs)
   - Match-service receives and processes them (check logs)
   - State transitions happen correctly
   - Presentation order is generated with 4 items

#### Verification Checklist
- [ ] Robot responses are saved to DynamoDB
- [ ] State update messages appear in SQS queue metrics
- [ ] Match-service processes state updates
- [ ] Round transitions from 'responding' to 'voting'
- [ ] Presentation order has all 4 participants
- [ ] No duplicate state transitions
- [ ] Old path still works (dual write)

### 6. Rollback Plan
If issues arise:
1. The old state transition logic remains in robot-worker (dual write mode)
2. Can disable notifications by removing STATE_UPDATE_QUEUE_URL env var
3. Can revert Lambda code using previous version in AWS Console

### 7. Phase 3 Completion
Once verified working:
1. Remove state transition logic from robot-worker.ts
2. Remove the check for response count and status updates
3. Keep only the response saving and notification
4. This completes the centralization

## Risk Assessment
- **Low Risk**: Infrastructure already deployed, dual write mode preserves existing functionality
- **Main Risk**: Missing handler export in match-service.ts needs careful implementation
- **Mitigation**: Thorough testing in production with debug mode enabled in admin panel

## Documentation Status
- **PHASE3_CENTRALIZE_STATE_PLAN.md**: Can be archived after implementation
  - Contains the original architectural analysis and design
  - This implementation plan supersedes it with concrete steps
  - Keep for historical reference but mark as completed