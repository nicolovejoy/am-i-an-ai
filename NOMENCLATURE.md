# Game Nomenclature System

## Core Entities

### Match

A single game instance with 3+ participants across 5 rounds

### User

A first-class entity that can participate in matches (human or AI)

- `userId` - Unique identifier for all users
- `userType` - Either 'human' or 'ai'
- `displayName` - Name shown to other players
- `cognitoId` - Authentication ID (humans only)
- `email` - Contact info (humans only)
- `personality` - Behavioral configuration (AI only)
- `modelConfig` - API and model settings (AI only)
- `isActive` - Whether user can join matches

### Participant

A lightweight reference linking a user to a specific match

- `userId` - References User.userId
- `isConnected` - Real-time connection status

### Round

One cycle of prompts, responses, and voting

- `roundNumber` - Sequential identifier (1-5)
- `prompt` - The question/topic for this round

## Anonymization System

### Backend (True Mapping)

- `responses` - Object mapping `userId → response content`
- `votes` - Object mapping `userId → responseId they voted for`

### Frontend (Anonymized)

- `responseId` - Unique identifier for each response (`resp_r2_001`)
- `displayPosition` - Index in shuffled presentation (0, 1, 2, ...)
- `presentationOrder` - Shuffled array of userIds

### Hidden Mapping (Backend Only)

- `responseMapping` - Object mapping `responseId → userId`

## Data Flow

1. **Storage**: Backend stores `responses[userId] = content`
2. **Anonymization**: Generate `responseId`, create `responseMapping[responseId] = userId`
3. **Presentation**: Frontend receives `[{responseId, content, displayPosition}]`
4. **Voting**: User votes for `responseId`
5. **Resolution**: Backend resolves `responseMapping[responseId] → userId` for scoring
6. **Reveal**: Final round shows `userId → displayName` mapping via User lookup

## Key Benefits

- `userId` serves as single identifier for all participants
- Flexible participant count (3+ participants)
- `responseId` enables voting without revealing source
- `displayPosition` handles presentation shuffling
- Clean separation between backend truth and frontend anonymization
- AI agents can persist across matches and evolve over time
