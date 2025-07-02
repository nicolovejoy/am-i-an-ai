# am I an AI? - MVP Implementation Specification

## Project Overview

A 4-participant conversation game where users try to identify which participants are AI and which are human. The goal is to create an engaging experience that explores the boundaries between human and AI communication.

## Core UX Concept

- **4-participant chat room** (1 human user + 3 AI, or 2 humans + 2 AI)
- **Simple conversation flow** with natural topics
- **Voting mechanism** to identify suspected AIs
- **Results reveal** showing accuracy

## Target User Journeys

1. **Quick Play** - Join conversation → Chat 3-5 minutes → Vote → See results
2. **First-Time User** - Learn concept → Engage naturally → Vote → Discover accuracy
3. **Repeat User** - Return for new conversation → Try to improve detection skills
4. **Curious Observer** - Test AI capabilities → Be surprised by quality → Vote and learn
5. **Social Sharer** - Play game → Share anonymized results

## UI/UX Design Requirements

### Layout Structure

```
Header (compact)
├── Title: "am I an AI?"
├── Subtitle: "Figure out who's human and who's AI"
└── Game info: Round, Timer, Message count

Main Chat Area (80% of screen)
├── Scrollable conversation
├── Color-coded message bubbles
├── Participant labels: "Participant 1", "Participant 2", "Participant 3", "You"
└── Clear sender identification

Voting Panel (compact, appears when needed)
├── "Who do you think are the AIs?"
├── Select 2 participants
└── Submit button

Input Area
├── Text input field
└── Send button
```

### Visual Design

- **Clean, minimal aesthetic** with white backgrounds
- **Color-coded message bubbles** for each participant:
  - Participant 1: Light red background (#fef2f2)
  - Participant 2: Light gray background (#f3f4f6)
  - Participant 3: Light blue background (#eff6ff)
  - You: Light green background (#f0fdf4)
- **Responsive design** for mobile and desktop
- **No avatars or decorative elements** - focus on conversation

## Technical Requirements

### Frontend Architecture

- **Next.js with TypeScript** (existing codebase)
- **Tailwind CSS** for styling (existing)
- **Real-time messaging** (WebSocket or similar)
- **Session-based state management** (no user accounts for MVP)

### Core Components

#### 1. Conversation Engine

```typescript
interface Message {
  id: string;
  senderId: string;
  senderType: "human" | "ai";
  content: string;
  timestamp: Date;
}

interface ConversationSession {
  id: string;
  participants: Participant[];
  messages: Message[];
  topic: string;
  startTime: Date;
  status: "active" | "voting" | "completed";
}
```

#### 2. Participant Management

```typescript
interface Participant {
  id: string;
  type: "human" | "ai";
  displayName: string; // "Participant 1", "Participant 2", etc.
  isCurrentUser: boolean;
}
```

#### 3. Voting System

```typescript
interface Vote {
  sessionId: string;
  voterId: string;
  suspectedAIs: string[]; // Array of participant IDs
  timestamp: Date;
}

interface GameResult {
  sessionId: string;
  correctGuesses: number;
  totalAIParticipants: number;
  accuracy: number;
  actualAIs: string[];
}
```

### Backend Requirements

#### API Endpoints

```
POST /api/sessions/join
- Join or create a conversation session
- Return session details and participant assignment

GET /api/sessions/:id
- Get current session state
- Return messages and participant info

POST /api/sessions/:id/messages
- Send a message to the conversation
- Trigger AI responses

POST /api/sessions/:id/vote
- Submit voting selections
- Return game results

GET /api/sessions/:id/results
- Get final results after voting
```

#### AI Integration

- **Simple LLM integration** (OpenAI API or similar)
- **Distinct AI personalities** to make detection challenging
- **Natural response timing** (1-3 second delays)
- **Topic-guided responses** to maintain conversation flow

### Conversation Topics (MVP Set)

1. "What's your favorite childhood memory?"
2. "Describe a place that makes you feel peaceful"
3. "What's something you've learned recently?"
4. "Tell us about a book or movie that impacted you"
5. "What would you do with a free weekend?"

### Game Logic

#### Session Flow

1. **Join Session** - User enters conversation (3 others already present)
2. **Conversation Phase** (5-8 minutes)
   - Topic presented to all participants
   - Natural conversation flow
   - AI participants respond with realistic timing
3. **Voting Phase** (2 minutes)
   - Conversation stops
   - Users select 2 suspected AIs
   - Submit votes
4. **Results Phase**
   - Reveal actual AIs
   - Show accuracy score
   - Option to play again

#### AI Behavior Guidelines

- **Vary response length** (some short, some detailed)
- **Include minor "imperfections"** to seem human
- **Reference previous messages** in conversation
- **Ask follow-up questions** naturally
- **Avoid overly perfect grammar** or encyclopedic knowledge

## MVP Feature Scope

### Include for MVP

- ✅ 4-participant conversations
- ✅ Real-time chat interface
- ✅ Basic AI participants
- ✅ Voting mechanism
- ✅ Results display
- ✅ 5-8 conversation topics
- ✅ Session-based gameplay
- ✅ Mobile responsive design

### Exclude from MVP

- ❌ User accounts/registration
- ❌ Conversation history
- ❌ Advanced scoring/leaderboards
- ❌ Spectator mode
- ❌ Custom topics
- ❌ Multiple rounds per session
- ❌ Social features/sharing

## Implementation Phases

### Phase 1: Core Chat Interface

- Build conversation UI matching the provided design
- Implement message sending/receiving
- Add participant identification system

### Phase 2: AI Integration

- Connect LLM API for AI responses
- Create distinct AI personalities
- Implement natural response timing

### Phase 3: Game Logic

- Add voting interface
- Implement results calculation
- Create session management

### Phase 4: Polish & Testing

- Responsive design refinements
- Performance optimization
- User testing and iteration

## Success Metrics

- **Engagement**: Average conversation length > 5 minutes
- **Challenge**: AI detection accuracy between 40-70%
- **Retention**: Users complete full voting cycle
- **Performance**: < 2 second response times

## Technical Considerations

- **Scalability**: Design for multiple concurrent sessions
- **Cost**: Monitor AI API usage for response generation
- **Moderation**: Basic content filtering for inappropriate messages
- **Privacy**: No persistent user data storage for MVP

## File Structure

```
frontend/
├── components/
│   ├── ConversationView.tsx
│   ├── MessageBubble.tsx
│   ├── VotingPanel.tsx
│   └── GameHeader.tsx
├── hooks/
│   ├── useConversation.ts
│   ├── useVoting.ts
│   └── useSession.ts
├── types/
│   └── game.ts
└── pages/
    ├── index.tsx
    └── api/
        ├── sessions/
        └── messages/
```

This specification provides the foundation for implementing the MVP version of "am I an AI?" based on the UX design we developed.
