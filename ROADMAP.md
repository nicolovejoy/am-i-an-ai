# RobotOrchestra Roadmap

## ✅ Completed

### Phase 1: User System
- DynamoDB users table with persistent AI agents
- 5 AI personalities (Philosopher, Scientist, Comedian, Artist, Engineer)
- User service and schemas
- Kafka cleanup from codebase

## 🎯 Priority 1: Multi-Human Matches (2v2)

**Goal**: Enable 2 humans + 2 robots gameplay

- Implement match templates (1v3 admin, 2v2 public)
- Add "initiated" match state for waiting
- Dynamic role assignment (not fixed A=human)
- Update match creation flow
- Simple invite system (share match ID)

## 🎯 Priority 2: Admin Features

### Debug Mode
- Show AI/Human tags (admin only)
- Display model used and response time
- Mark fallback responses
- Add isAdmin flag to users

### Admin Dashboard

- User management & permissions
- AI usage tracking by model
- Match monitoring
- Content moderation tools
- Invite system

## 🎯 Priority 3: Real-time Updates

### Replace Polling with SSE/WebSockets
- Current: 4s polling interval
- Target: Real-time via API Gateway WebSockets
- State management already centralized

## 🎯 Priority 4: User Engagement

### Email/SMS Integration

**Goal**: Turn notifications and async gameplay via text/email

- AWS SES + SNS ($0.10/1k emails, $0.75/1k SMS)
- Flow: Events → SQS → Notification Lambda → SES/SNS
- Features:
  - Match turn notifications
  - SMS/email response handling for gameplay
  - User invitations
  - MFA via Cognito

### New User Experience
