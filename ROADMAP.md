# RobotOrchestra Roadmap

## ✅ Completed

### Phase 1: User System

### Phase 2: Multi-Human Matches

- Match templates (classic_1v3, duo_2v2, admin_custom)
- Waiting room with invite codes
- Dynamic identity assignment
- Join flow for authenticated/non-authenticated users
- Auto-start when all players joined
- Fixed "Unknown Player" in match history

### Phase 3: Enhanced Gameplay (Jan 2025)

- Reduced character limit to 150 for concise responses
- AI personalities: competitive gaming archetypes (Sundown, Bandit, Maverick)
- AI style mimicry - each AI adopts a human's writing style while maintaining personality
- AI response uniqueness - prevents repetition across rounds
- Grammar/spelling correction with preview for human players
- Mobile responsiveness with iPhone scrolling fixes
- Full identity reveal on match complete (names, personalities, models)
- Admin debug mode showing AI metadata during matches

### TODO List: From Max so prioritize these:

- consider a new title (Max and Owen to provide)
- ✅ Remove emoji in the title (robot emoji) - DONE
- adding some color or designs to the screen will help.
- ✅ Don't mention "Player A B C" keep it completely anonymous - DONE
- ✅ Let the user know immediately for each round if they picked the correct answer, and give the user a point at that point. rewards at each step keep the user engaged. add a scoreboard to the match page. consider rebuilding the match page so as an accordion where each round can expand to fill most of the page but you stay on the main match page - DONE
- ✅ add a 30 second countdown timer for each response. make that value (30s) part of the match template - DONE

### TODO List: not necessarily in any order:

- discuss with Nico our approach to managing ai personalities.
- review existing user records and user management approach and ensure it's compatible with our intention of architecting trust relationships between both human users and evenutally AI users.

### ASSUMPTIONS:

1. stick with MVP 4 player format for a little while, then generalize
2. we will have tenets and user agreements that expect civility and authentic representation by human participants, unless the context specificly relaxes those assumptions.
3. Users onboarding initially don't need to make too many agreements with the ecosystem, but to transition to a more engaged user permission they start to engage with the agreements governing the community to ensure sarfety and productive interaction.

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
