# RobotOrchestra Roadmap

## 🔥 Immediate Issues

### AI Prompt Generation

- **Problem**: Falling back to hardcoded prompts
- **Fix**: Check CloudWatch logs and Bedrock permissions
- **Debug**: `aws logs tail /aws/lambda/robot-orchestra-ai-service --since 10m`

## 🎯 Priority 1:

### Admin Dashboard

- User management & permissions
- AI usage tracking by model
- Match monitoring
- Content moderation tools
- Invite system

## 🎯 Priority 2:

### Replace Polling with SSE/WebSockets

- review how our front end talks to the backend and discuss with Nico the best approch

### Multi-human Matches

- Current: 1 human + 3 robots only
- Need: Dynamic participant allocation
- Matchmaking logic
- Waiting rooms

## 🎯 Priority 3: User engagement

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

- Onboarding flow with tutorial
- Better error states
- Guest mode (no signup)
- Social sharing
