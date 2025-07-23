# RobotOrchestra Roadmap

## ✅ Completed

### Phase 1: User System

- DynamoDB users table with persistent AI agents
- 5 AI personalities (Philosopher, Scientist, Comedian, Artist, Engineer)
- User service and schemas

### Phase 2: Multi-Human Matches

- Match templates (classic_1v3, duo_2v2, admin_custom)
- Waiting room with invite codes
- Dynamic identity assignment
- Join flow for authenticated/non-authenticated users
- Auto-start when all players joined
- Fixed "Unknown Player" in match history

### Phase 3: Enhanced Gameplay (Jan 2025)

- Reduced character limit to 150 for concise responses
- AI personalities replaced with family archetypes (Little Sister, Wise Grandpa, Practical Mom)
- AI style mimicry - each AI adopts a human's writing style while maintaining personality
- AI response uniqueness - prevents repetition across rounds
- Grammar/spelling correction with preview for human players
- Mobile responsiveness with iPhone scrolling fixes
- Full identity reveal on match complete (names, personalities, models)
- Admin debug mode showing AI metadata during matches

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
