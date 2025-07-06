# Kafka Migration Strategy

## Overview
Migrate RobotOrchestra from in-memory state to Kafka-based event streaming architecture, starting with read-only match history to validate the approach.

## Why Kafka?
- **Permanent event storage** - Complete match history preserved
- **Decoupled architecture** - Robots process events independently
- **Natural async handling** - Perfect for multi-participant rounds
- **Built-in replay** - Debug or reprocess any match
- **KSQL analytics** - Real-time metrics and aggregations

## Phase 1: Read-Only Validation (Current Focus)

### Goals
- Set up MSK Serverless infrastructure
- Design and validate event schemas
- Display match history from Kafka in UI
- Prove the architecture before migrating transactions

### Implementation Steps
1. **Infrastructure Setup**
   - Deploy MSK Serverless cluster
   - Create topics: match-events, robot-commands, robot-events
   - Configure infinite retention for match-events

2. **Sample Data Generation**
   - Create Lambda to generate realistic match events
   - Populate 10-20 complete matches
   - Include variety of scenarios (timeouts, errors, etc.)

3. **Read Path Implementation**
   - Lambda consumer for match-events topic
   - Build match history materialized view
   - API: GET /matches/history from Kafka
   - Update frontend to display Kafka-sourced data

4. **Validation**
   - Verify match reconstruction from events
   - Test KSQL queries for analytics
   - Ensure proper event ordering

### Success Criteria
- Match history displays correctly from Kafka events
- Can query match statistics via KSQL
- Event replay produces identical results

## Phase 2: WebSocket Integration

### Goals
- Route live match events through Kafka
- Maintain WebSocket for real-time updates
- Keep fallback to current system

### Implementation
1. Dual-write events to Kafka and current system
2. Add Kafka producer to WebSocket handler
3. Gradually move consumers to Kafka
4. Remove in-memory state once stable

## Phase 3: Service Separation

### Goals
- Separate Match Service from Robot Orchestration Service
- Clean service boundaries via Kafka events
- Independent scaling and deployment

### Implementation
1. **Match Service**
   - Owns match lifecycle and state
   - Publishes robot needs to Kafka
   - Consumes robot assignments
   
2. **Robot Orchestration Service**
   - Manages robot pool and lifecycle
   - Assigns robots to matches
   - Handles scaling decisions
   
3. **Robot Workers**
   - Independent consumers by type
   - Process commands from orchestrator
   - Submit responses via Kafka

## Phase 4: Complete Migration

### Goals
- Remove DynamoDB table
- Kafka as single source of truth
- Full event-sourced architecture

### Cleanup
1. Remove in-memory Maps from handler
2. Delete DynamoDB infrastructure
3. Update monitoring to Kafka metrics

## Technical Decisions

### MSK Serverless vs Kinesis
Chose MSK Serverless for:
- True Kafka API compatibility
- Consumer groups for robot coordination
- KSQL for real-time analytics
- Infinite retention capability

### Event Schema Design
- JSON events with schema registry later
- Event type in header for routing
- Participant/match IDs as partition keys
- Timestamp for event ordering

### Cost Estimates
- MSK Serverless: ~$50-80/month for low volume
- Storage: ~$0.10/GB/month (negligible for events)
- Data transfer: Minimal for internal AWS

## Risks and Mitigations

### Risk: Complexity
**Mitigation**: Start with read-only to validate

### Risk: Costs
**Mitigation**: MSK Serverless scales to zero, monitor usage

### Risk: Learning Curve
**Mitigation**: Start simple, evolve gradually

## Next Steps
1. Create Terraform for MSK Serverless
2. Write sample data generator
3. Build match history consumer
4. Update frontend to use new API