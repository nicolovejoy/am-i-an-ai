# Phase 3: Centralize State Logic in match-service

## Executive Summary

This document outlines the plan to centralize all state management logic in match-service, eliminating race conditions and distributed state issues currently caused by robot-worker also managing state transitions.

## Current Architecture Analysis

### State Management Distribution

#### match-service.ts currently handles:
- Match creation and initialization
- Storing human responses
- Triggering robot responses via SQS
- Vote submission and robot vote generation
- Round progression after voting complete
- Match completion detection

#### robot-worker.ts currently handles:
- Generating robot responses
- Storing robot responses to DynamoDB
- **PROBLEM**: Checking response count and transitioning to voting
- **PROBLEM**: Generating presentationOrder when all responses collected

### Current Flow Issues

```
Human Response → match-service → DynamoDB
                      ↓
                 SQS (3 messages) → 3x robot-worker (parallel)
                                           ↓
                                    Each worker:
                                    1. Generate response
                                    2. Save to DynamoDB
                                    3. Check total count ← RACE CONDITION
                                    4. Maybe update status ← DISTRIBUTED STATE
```

### Race Conditions Identified

1. **Response Count Check**: Multiple workers checking count simultaneously
2. **Status Updates**: Multiple workers may try to update status
3. **Timing Issues**: All workers might check before any have saved
4. **No Coordination**: Workers operate independently with no communication

## Proposed Architecture

### Design Principles

1. **Single Source of Truth**: match-service owns ALL state transitions
2. **Event-Driven**: Clear events trigger specific actions
3. **No Distributed Logic**: Workers only generate responses
4. **Explicit Coordination**: Workers notify match-service of completion

### New Flow

```
Human Response → match-service → DynamoDB
                      ↓
                 Robot Request Queue → 3x robot-worker (parallel)
                                              ↓
                                       Generate + Save
                                              ↓
                                    State Update Queue
                                              ↓
                                       match-service
                                    (coordinate & transition)
```

## Detailed Implementation Plan

### 1. Infrastructure Changes

#### New SQS Queue
```terraform
# In infrastructure/sqs.tf

resource "aws_sqs_queue" "state_updates" {
  name                       = "${local.project_name}-state-updates"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 86400  # 1 day
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.state_updates_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "state_updates_dlq" {
  name                      = "${local.project_name}-state-updates-dlq"
  message_retention_seconds = 604800  # 7 days
}
```

#### Lambda Event Source Mapping
```terraform
# In infrastructure/match-api.tf

resource "aws_lambda_event_source_mapping" "state_updates_to_match_service" {
  event_source_arn = aws_sqs_queue.state_updates.arn
  function_name    = aws_lambda_function.match_service.arn
  batch_size       = 10
}
```

#### IAM Permissions
```terraform
# Add to robot-worker IAM policy
{
  "Effect": "Allow",
  "Action": [
    "sqs:SendMessage"
  ],
  "Resource": aws_sqs_queue.state_updates.arn
}

# Add to match-service IAM policy
{
  "Effect": "Allow",
  "Action": [
    "sqs:ReceiveMessage",
    "sqs:DeleteMessage",
    "sqs:GetQueueAttributes"
  ],
  "Resource": aws_sqs_queue.state_updates.arn
}
```

### 2. Code Changes

#### robot-worker.ts Changes

**Remove state checking logic:**
```typescript
// DELETE this entire section:
// const updatedResult = await docClient.send(new GetCommand({...}));
// if (updatedResult.Item) { ... check count and update status ... }

// REPLACE with notification:
async function notifyStateUpdate(matchId: string, roundNumber: number, robotId: string) {
  const message = {
    type: 'ROBOT_RESPONSE_COMPLETE',
    matchId,
    roundNumber,
    robotId,
    timestamp: new Date().toISOString()
  };
  
  await sqsClient.send(new SendMessageCommand({
    QueueUrl: process.env.STATE_UPDATE_QUEUE_URL,
    MessageBody: JSON.stringify(message)
  }));
  
  console.log(`Notified match-service of ${robotId} completion for match ${matchId}`);
}
```

#### match-service.ts Changes

**Add state update handler:**
```typescript
async function handleStateUpdate(event: SQSEvent): Promise<SQSBatchResponse> {
  const results: SQSBatchItemFailure[] = [];
  
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      
      if (message.type === 'ROBOT_RESPONSE_COMPLETE') {
        await checkAndTransitionRound(
          message.matchId, 
          message.roundNumber
        );
      }
      
    } catch (error) {
      console.error('Failed to process state update:', error);
      results.push({ itemIdentifier: record.messageId });
    }
  }
  
  return { batchItemFailures: results };
}

async function checkAndTransitionRound(matchId: string, roundNumber: number) {
  // Get current match state
  const match = await getMatchFromDB(matchId);
  const round = match.rounds.find(r => r.roundNumber === roundNumber);
  
  if (!round || round.status !== 'responding') {
    return; // Already transitioned
  }
  
  const responseCount = Object.keys(round.responses || {}).length;
  console.log(`Match ${matchId} round ${roundNumber}: ${responseCount}/4 responses`);
  
  if (responseCount === 4) {
    // Generate presentation order
    const presentationOrder = shuffleArray(['A', 'B', 'C', 'D'], `${matchId}-${roundNumber}`);
    
    // Update status to voting
    await updateRoundStatus(matchId, roundNumber, {
      status: 'voting',
      presentationOrder
    });
    
    console.log(`Transitioned match ${matchId} round ${roundNumber} to voting`);
  }
}
```

**Update Lambda handler routing:**
```typescript
export const handler = async (event: APIGatewayProxyEvent | SQSEvent): Promise<any> => {
  // Check if this is an SQS event
  if ('Records' in event && event.Records[0]?.eventSource === 'aws:sqs') {
    return handleStateUpdate(event as SQSEvent);
  }
  
  // Otherwise handle as API Gateway event
  return handleAPIRequest(event as APIGatewayProxyEvent);
};
```

### 3. Testing Strategy

#### Unit Tests
- Test state update message handling
- Test round transition logic
- Test idempotency (multiple notifications for same robot)
- Test error handling and retries

#### Integration Tests
1. Submit human response
2. Verify 3 SQS messages sent to robot queue
3. Mock robot responses
4. Verify 3 state update messages sent
5. Verify match transitions to voting
6. Verify presentationOrder generated

### 4. Migration Steps

#### Phase 1: Add New Infrastructure (Backward Compatible)
1. Deploy new SQS queues
2. Update IAM policies
3. No code changes yet

#### Phase 2: Dual Write (Safe Testing)
1. Update robot-worker to send notifications AND keep existing logic
2. Update match-service to handle state updates
3. Monitor both paths work correctly

#### Phase 3: Switch Over
1. Remove state transition logic from robot-worker
2. Rely only on match-service coordination
3. Monitor for issues

#### Phase 4: Cleanup
1. Remove old code paths
2. Update documentation
3. Remove unnecessary IAM permissions

### 5. Rollback Plan

Each phase can be rolled back independently:

- **Phase 1**: Remove infrastructure (no impact)
- **Phase 2**: Deploy previous Lambda versions
- **Phase 3**: Re-enable robot-worker state logic
- **Phase 4**: Restore removed code

### 6. Monitoring & Alerts

Add CloudWatch alarms for:
- State update queue depth > 100
- State update DLQ messages > 0
- Lambda errors on state update handler
- Matches stuck in "responding" > 5 minutes

### 7. Benefits

1. **Eliminates Race Conditions**: Single coordinator for state
2. **Improved Debugging**: All state transitions in one place
3. **Better Observability**: Clear event trail
4. **Foundation for Future**: Enables removal of polling
5. **Scalability**: Can handle more concurrent matches

### 8. Timeline Estimate

- Infrastructure changes: 1-2 hours
- Code changes: 3-4 hours  
- Testing: 2-3 hours
- Gradual rollout: 1 hour
- **Total: 7-9 hours**

### 9. Success Criteria

1. No race conditions in voting transitions
2. All matches progress smoothly through rounds
3. No increase in error rates
4. State update queue processes quickly (< 1s)
5. No messages in DLQ during normal operation

## Appendix: Message Formats

### Robot Completion Message
```json
{
  "type": "ROBOT_RESPONSE_COMPLETE",
  "matchId": "match-uuid",
  "roundNumber": 1,
  "robotId": "B",
  "timestamp": "2025-07-16T03:00:00Z"
}
```

### Future Message Types
```json
{
  "type": "VOTE_SUBMITTED",
  "matchId": "match-uuid",
  "roundNumber": 1,
  "voterId": "A",
  "timestamp": "2025-07-16T03:01:00Z"
}
```

This architecture sets us up for eventually removing polling entirely by having match-service push updates to clients via WebSockets or SSE.