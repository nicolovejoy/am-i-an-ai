# Kafka Service Architecture

## Overview

Clean microservices architecture with two primary services coordinating through Kafka events.

## Core Services

### 1. Match Service

**Responsibilities:**

- Match lifecycle (create, start, complete)
- Round management
- Score tracking
- State materialization

**Publishes:**

- `match.created`
- `match.robots_needed`
- `round.started`
- `round.voting_started`
- `match.completed`

**Consumes:**

- `robots.assigned`
- `response.submitted`
- `vote.submitted`

### 2. Robot Orchestration Service

**Responsibilities:**

- Robot pool management
- Robot instance lifecycle
- Assignment to matches
- Scaling decisions
- Health monitoring

**Publishes:**

- `robots.assigned`
- `robot.instantiated`
- `robot.released`
- `robot.health_check`

**Consumes:**

- `match.robots_needed`
- `match.completed`
- `robot.response_complete`

### 3. Robot Instances (Workers)

**Responsibilities:**

- Generate responses via OpenAI
- Generate votes
- Maintain personality consistency

**Publishes:**

- `response.submitted`
- `vote.submitted`
- `robot.response_complete`

**Consumes:**

- `robot.commands` (filtered by robot ID)

## Event Flow Example

### Match Creation Flow

```
1. Human joins → App → Match Service
2. Match Service → publishes "match.created"
3. Match Service → starts first round
```

### Per-Round Robot Assignment Flow

```
1. Match Service → publishes "round.starting" {matchId: "abc", round: 1}
2. Match Service → publishes "round.robots_needed" {
     matchId: "abc",
     round: 1,
     count: 3,
     excludeRobots: []  // Can exclude robots from previous rounds
   }
3. Robot Orchestration → consumes "round.robots_needed"
4. Robot Orchestration → assigns 3 robots (potentially different each round)
5. Robot Orchestration → publishes "round.robots_assigned" {
     matchId: "abc",
     round: 1,
     robots: [{id: "r1", identity: "B"}, {id: "r2", identity: "C"}, {id: "r3", identity: "D"}]
   }
6. Match Service → consumes "round.robots_assigned"
7. Match Service → publishes "round.started" with participants
```

### Benefits of Per-Round Assignment

- Different robot personalities each round
- More dynamic gameplay
- Prevents players from identifying robot patterns
- Robots can be reused across matches between rounds

### Robot Pool Management

```yaml
# Robot Orchestration Service maintains:
robot_pool:
  available:
    - { id: "robot-1", type: "curious-student", status: "idle" }
    - { id: "robot-2", type: "skeptical-scientist", status: "idle" }
  assigned:
    - { id: "robot-3", type: "creative-artist", status: "busy", matchId: "xyz" }

scaling_rules:
  - min_idle_per_type: 2
  - max_total_instances: 20
  - scale_up_threshold: 80% busy
  - scale_down_after: 5 minutes idle
```

## Kafka Topics Structure

### Service Communication Topics

```yaml
# Match Service Domain
match-events:
  - match.created
  - round.starting
  - round.robots_needed # NEW: Request robots per round
  - round.started
  - round.voting_started
  - round.completed
  - match.completed

# Robot Orchestration Domain
robot-orchestration-events:
  - round.robots_assigned # NEW: Assigns robots per round
  - robot.instantiated
  - robot.released
  - robot.pool_scaled

# Robot Worker Domain
robot-commands: # Commands TO robots
  - generate.response
  - generate.vote

robot-responses: # Responses FROM robots
  - response.submitted
  - vote.submitted
```

### State Topics (Compacted)

```yaml
match-state: # Current state per match
robot-pool-state: # Current robot pool status
```

## Benefits of This Architecture

### 1. Clear Boundaries

- Match Service doesn't know HOW robots are managed
- Robot Orchestration doesn't know match rules
- Clean APIs between services

### 2. Independent Scaling

- Scale Match Service based on active matches
- Scale Robot Orchestration based on pool needs
- Scale Robot Workers based on response load

### 3. Fault Isolation

- Robot service issues don't crash matches
- Match service can queue robot requests
- Graceful degradation possible

### 4. Flexibility

- Easy to add different robot providers
- Can implement robot "personalities" as plugins
- A/B test different orchestration strategies

## Implementation Phases

### Phase 1: Basic Services

- Match Service with simple state management
- Robot Orchestration with fixed pool
- Manual robot assignment

### Phase 2: Dynamic Scaling

- Auto-scale robot pool based on demand
- Implement health checks
- Add circuit breakers

### Phase 3: Advanced Features

- Multiple robot providers (OpenAI, Claude, etc.)
- Robot performance tracking
- Intelligent robot selection

## Service Communication Patterns

### Request-Reply via Events

```javascript
// Match Service requests robots
publisher.send('match-events', {
  eventType: 'match.robots_needed',
  matchId: 'abc',
  requiredCount: 3,
  correlationId: 'req-123'
});

// Robot Orchestration responds
publisher.send('robot-orchestration-events', {
  eventType: 'robots.assigned',
  matchId: 'abc',
  robots: [{id: 'r1', type: 'curious'}, ...],
  correlationId: 'req-123'
});
```

### Async Command Pattern

```javascript
// Orchestration sends command to specific robot
publisher.send("robot-commands", {
  commandId: "cmd-456",
  robotId: "robot-1",
  action: "generate_response",
  matchId: "abc",
  data: { prompt: "...", round: 1 },
});
```

## Monitoring and Observability

### Key Metrics

- **Match Service**: Active matches, round duration, completion rate
- **Robot Orchestration**: Pool utilization, assignment latency, scaling events
- **Robot Workers**: Response time, error rate, API costs

### Event Tracing

- Correlation IDs link events across services
- Full audit trail in Kafka
- Can replay any match or robot assignment
