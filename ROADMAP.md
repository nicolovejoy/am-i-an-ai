# RobotOrchestra Roadmap

## ✅ Completed

### Phase 1: User System
- DynamoDB users table with persistent AI agents
- 5 AI personalities (Philosopher, Scientist, Comedian, Artist, Engineer)
- User service and schemas
- Kafka cleanup from codebase

### Phase 2: Multi-Human Matches
- Match templates (classic_1v3, duo_2v2, admin_custom)
- Waiting room with invite codes
- Dynamic identity assignment
- Join flow for authenticated/non-authenticated users
- Auto-start when all players joined
- Fixed "Unknown Player" in match history

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
