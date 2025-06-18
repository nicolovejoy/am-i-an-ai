# Authentication and Permissions Design Document

## Overview

This document outlines the current authentication model and proposes enhancements for persona-based permissions, conversation state management, commenting systems, and rating mechanisms in the AmIAnAI platform.

## Current Architecture Analysis

### Existing User Role System

```mermaid
graph TD
    A[User] --> B{Role Check}
    B -->|Level 1| C[User]
    B -->|Level 2| D[Moderator]
    B -->|Level 3| E[Admin]
    
    C --> F[Basic Access]
    D --> G[Content Moderation]
    E --> H[Full System Access]
```

**Current Roles:**
- **User (Level 1)**: Basic platform access, can create conversations and personas
- **Moderator (Level 2)**: Can moderate content, access moderation tools
- **Admin (Level 3)**: Full system access, user management, platform configuration

### Current Data Model

```mermaid
erDiagram
    USER {
        string id PK
        string email
        string role "user|moderator|admin"
        string subscription_tier "free|basic|premium|enterprise"
        json privacy_settings
        datetime created_at
    }
    
    PERSONA {
        string id PK
        string owner_id FK
        string name
        string type "human_persona|ai_agent|ai_ambiguous"
        boolean is_public
        array allowed_interactions
        float average_rating
        datetime created_at
    }
    
    CONVERSATION {
        string id PK
        string created_by FK
        string status "active|paused|completed|terminated"
        float quality_score
        datetime created_at
    }
    
    MESSAGE {
        string id PK
        string conversation_id FK
        string author_persona_id FK
        string moderation_status "pending|approved|flagged|rejected"
        float quality_rating
        json reactions
        boolean is_visible
        datetime created_at
    }
    
    USER ||--o{ PERSONA : owns
    USER ||--o{ CONVERSATION : creates
    CONVERSATION ||--o{ MESSAGE : contains
    PERSONA ||--o{ MESSAGE : authors
```

## Proposed Enhancements

### 1. Enhanced Persona Permission System

#### Current Limitations
- Binary public/private personas
- No granular permission control
- Limited interaction type restrictions

#### Proposed Persona Permission Matrix

```mermaid
graph LR
    subgraph "Persona Permissions"
        A[Persona Owner] --> B[Full Control]
        C[Trusted Users] --> D[Interaction Allowed]
        E[General Users] --> F[View Only / Restricted]
        G[Blocked Users] --> H[No Access]
    end
    
    B --> I[Edit, Delete, Configure]
    D --> J[Start Conversations, Rate]
    F --> K[View Profile, Limited Interaction]
    H --> L[Hidden from Search]
```

**New Permission Types:**

```typescript
type PersonaPermissionLevel = 
  | 'private'      // Owner only
  | 'trusted'      // Owner + trusted user list
  | 'followers'    // Users who follow this persona
  | 'public'       // Anyone can interact
  | 'restricted'   // Public view, limited interaction

interface PersonaPermissions {
  viewProfile: PersonaPermissionLevel;
  startConversation: PersonaPermissionLevel;
  ratePersona: PersonaPermissionLevel;
  commentOnPersona: PersonaPermissionLevel;
  viewConversationHistory: PersonaPermissionLevel;
  inviteToConversation: PersonaPermissionLevel;
}

interface PersonaAccessControl {
  permissions: PersonaPermissions;
  trustedUsers: string[];           // User IDs with trusted access
  blockedUsers: string[];           // User IDs with blocked access
  followerRequiresApproval: boolean; // Must approve followers
  maxConcurrentConversations: number;
  allowRating: boolean;
  allowComments: boolean;
}
```

### 2. Conversation State Management

#### Enhanced Conversation States

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> active : Start Conversation
    active --> paused : Participant Pauses
    active --> completed : Natural End / Goal Reached
    active --> closed : Manual Close
    active --> terminated : Violation / Force Close
    paused --> active : Resume
    paused --> closed : Close While Paused
    closed --> [*]
    completed --> [*]
    terminated --> [*]
    
    note right of closed : No new messages allowed
    note right of terminated : Violation occurred
    note right of completed : Goals achieved
```

**Enhanced Conversation Model:**

```typescript
type ConversationStatus = 
  | 'draft'       // Being set up
  | 'active'      // Ongoing conversation
  | 'paused'      // Temporarily stopped
  | 'completed'   // Finished successfully
  | 'closed'      // Manually ended (no new messages)
  | 'terminated'  // Force-closed due to violations

interface ConversationControl {
  status: ConversationStatus;
  canAddMessages: boolean;          // False when closed/completed/terminated
  closeReason?: string;             // Why conversation was closed
  closedBy?: string;                // User ID who closed it
  closedAt?: Date;
  allowComments: boolean;           // Can users comment on this conversation
  allowRating: boolean;             // Can users rate this conversation
  isPubliclyViewable: boolean;      // Can others view this conversation
  moderationLevel: 'none' | 'light' | 'strict';
}
```

### 3. Universal Comment System

#### Comment Architecture

```mermaid
erDiagram
    COMMENT {
        string id PK
        string author_id FK
        string target_type "conversation|persona|message"
        string target_id FK
        string content
        string status "active|hidden|flagged|deleted"
        float rating
        datetime created_at
        datetime updated_at
    }
    
    COMMENT_THREAD {
        string id PK
        string parent_comment_id FK
        int depth_level
        int sort_order
    }
    
    COMMENT_REACTION {
        string id PK
        string comment_id FK
        string user_id FK
        string reaction_type "like|dislike|helpful|funny"
        datetime created_at
    }
    
    USER ||--o{ COMMENT : authors
    COMMENT ||--o{ COMMENT_THREAD : has_replies
    COMMENT ||--o{ COMMENT_REACTION : receives
```

**Comment Model:**

```typescript
interface Comment {
  id: string;
  authorId: string;
  targetType: 'conversation' | 'persona' | 'message';
  targetId: string;
  content: string;
  status: 'active' | 'hidden' | 'flagged' | 'deleted';
  rating?: number;              // Optional rating with comment
  parentCommentId?: string;     // For threaded replies
  depth: number;                // Nesting level
  reactions: CommentReaction[];
  moderationFlags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CommentReaction {
  id: string;
  userId: string;
  type: 'like' | 'dislike' | 'helpful' | 'funny' | 'insightful';
  createdAt: Date;
}
```

### 4. Comprehensive Rating System

#### Multi-Level Rating Architecture

```mermaid
graph TD
    subgraph "Rating Targets"
        A[Personas] --> D[Overall Quality]
        B[Conversations] --> E[Engagement & Value]
        C[Messages] --> F[Individual Quality]
    end
    
    subgraph "Rating Types"
        D --> G[Personality Accuracy]
        D --> H[Response Quality]
        D --> I[Engagement Level]
        
        E --> J[Conversation Flow]
        E --> K[Goal Achievement]
        E --> L[Educational Value]
        
        F --> M[Helpfulness]
        F --> N[Accuracy]
        F --> O[Creativity]
    end
```

**Enhanced Rating System:**

```typescript
interface PersonaRating {
  id: string;
  personaId: string;
  raterId: string;
  conversationId?: string;        // Context of the rating
  
  // Multi-dimensional ratings
  personalityAccuracy: number;    // 1-5: How well persona stayed in character
  responseQuality: number;        // 1-5: Quality of responses
  engagementLevel: number;        // 1-5: How engaging the persona was
  overallRating: number;          // 1-5: Overall experience
  
  // Optional detailed feedback
  strengths: string[];            // What worked well
  improvements: string[];         // What could be better
  wouldUseAgain: boolean;
  
  // Metadata
  conversationLength: number;     // Number of messages in context
  createdAt: Date;
}

interface ConversationRating {
  id: string;
  conversationId: string;
  raterId: string;
  
  // Experience ratings
  conversationFlow: number;       // 1-5: How natural the flow was
  goalAchievement: number;        // 1-5: Were goals met
  educationalValue: number;       // 1-5: Did you learn something
  entertainment: number;          // 1-5: Was it enjoyable
  overallSatisfaction: number;    // 1-5: Overall rating
  
  // Recommendation
  wouldRecommend: boolean;
  difficulty: 'easy' | 'moderate' | 'challenging';
  
  // Open feedback
  highlights: string;             // Best parts
  suggestions: string;            // Improvements
  
  createdAt: Date;
}

interface MessageRating {
  id: string;
  messageId: string;
  raterId: string;
  
  // Quick ratings
  helpfulness: number;            // 1-5
  accuracy: number;               // 1-5
  creativity: number;             // 1-5
  
  // Reactions (lightweight alternative to full rating)
  reaction?: 'helpful' | 'insightful' | 'funny' | 'confusing' | 'inappropriate';
  
  createdAt: Date;
}
```

### 5. Permission Integration Points

#### API Endpoint Security

```mermaid
sequenceDiagram
    participant U as User
    participant A as API Gateway
    participant P as Permission Service
    participant D as Database
    
    U->>A: Request Action
    A->>P: Check Permissions
    P->>D: Get User Roles & Permissions
    D-->>P: Return Permission Data
    P-->>A: Permission Result
    
    alt Permission Granted
        A->>D: Execute Action
        D-->>A: Return Data
        A-->>U: Success Response
    else Permission Denied
        A-->>U: 403 Forbidden
    end
```

**Permission Check Examples:**

```typescript
// Persona access control
async function canUserInteractWithPersona(
  userId: string, 
  personaId: string, 
  action: 'view' | 'startConversation' | 'rate' | 'comment'
): Promise<boolean> {
  const persona = await getPersona(personaId);
  const user = await getUser(userId);
  
  // Check if user is blocked
  if (persona.accessControl.blockedUsers.includes(userId)) {
    return false;
  }
  
  // Check permission level for action
  const requiredLevel = persona.permissions[action];
  
  switch (requiredLevel) {
    case 'private':
      return persona.ownerId === userId;
    case 'trusted':
      return persona.ownerId === userId || 
             persona.accessControl.trustedUsers.includes(userId);
    case 'followers':
      return await isUserFollowingPersona(userId, personaId);
    case 'public':
      return true;
    case 'restricted':
      return action === 'view' || user.subscription !== 'free';
    default:
      return false;
  }
}

// Conversation state checks
async function canAddMessageToConversation(
  userId: string, 
  conversationId: string
): Promise<boolean> {
  const conversation = await getConversation(conversationId);
  
  // Check if conversation allows new messages
  if (!conversation.control.canAddMessages) {
    return false;
  }
  
  // Check if user is a participant
  const isParticipant = await isUserParticipantInConversation(userId, conversationId);
  return isParticipant;
}
```

## Implementation Roadmap

### Phase 1: Conversation State Management
1. Add conversation state controls
2. Implement message blocking for closed conversations
3. Add conversation closing UI

### Phase 2: Enhanced Persona Permissions
1. Extend persona permission model
2. Implement permission checking middleware
3. Update persona management UI

### Phase 3: Comment System
1. Create comment database tables
2. Implement comment API endpoints
3. Build comment UI components

### Phase 4: Rating System Enhancement
1. Expand rating data models
2. Create rating collection interfaces
3. Build rating display and analytics

### Phase 5: Integration and Polish
1. Integrate all permission systems
2. Add comprehensive testing
3. Performance optimization
4. Admin tools for managing permissions

## Security Considerations

### Data Privacy
- Users should control visibility of their ratings and comments
- Anonymous rating options for sensitive feedback
- Right to delete/edit comments and ratings

### Anti-Gaming Measures
- Rate limiting on ratings and comments
- Prevent self-rating
- Flag suspicious rating patterns
- Minimum interaction time before allowing ratings

### Moderation Tools
- Automated content filtering
- Human moderation queues
- Community reporting mechanisms
- Appeals process for moderated content

## Conclusion

This enhanced permission and rating system will provide:

1. **Granular Control**: Persona owners can precisely control access
2. **Rich Feedback**: Multi-dimensional ratings provide valuable insights
3. **Community Building**: Comments and ratings foster engagement
4. **Quality Assurance**: Better ratings help users find quality content
5. **Scalable Moderation**: Automated and human moderation working together

The phased approach ensures we can deliver value incrementally while maintaining system stability and user experience.