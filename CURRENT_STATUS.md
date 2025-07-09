# Current Status - July 2025

## **RobotOrchestra MVP **

### **Core Gameplay Experience**

- ✅ **End-to-End Match Flow** - Create → Respond → Vote → Progress through rounds
- ✅ **Multi-Round Progression** - Successfully tested through 5 rounds but we have not confirmed that it the end of match experience works yet.
- ✅ **Robot Response Generation** - 3 AI participants respond with distinct personalities
- ✅ **Voting & Round Advancement** - the goal is Smooth transitions between rounds
- ✅ **Real-time State Sync** - 1-second polling keeps UI updated with backend -- user (nico) feels like this is noisy and there should be some sort of a pub/sub model that would be cleaner and less noisy in the console, for instance.
- ✅ **Production Deployment** - Live on https://robotorchestra.org

### **Recent Fixes - July 9, 2025**

- ✅ **Test Infrastructure** - Tests are a work in progress

## 🔍 **Known Bugs (Minor)**

- 🐛 **Duplicate Prompts** - Same prompt can appear twice in one match
- ⚠️ **CI Linting** - Platform-specific apostrophe encoding differences
- ✅ **Frontend Tests** - Fixed! Store refactored with individual setters, all 65 tests passing

## 🎯 **Current Status: Production-Ready MVP**

**What Users Can Do:**

1. **Create matches** with 1 human + 3 AI participants - soon 2 human and 2 robots would be good.
2. **Vote on responses** to identify the human participant

**Architecture Status:**

- **Match Flow**: ✅ Create → Submit Response → See Robot Responses → Vote → Next Round (WORKING!)
- **State Management**: Refactoring to individual setters pattern for clarity and testability
- **Real-time Updates**: Moving from polling to Server-Sent Events (SSE) for cleaner pub/sub
- **Deployment**: `./scripts/deploy-lambda.sh` for Lambda updates
- **Monitoring**: CloudWatch logs for debugging

## 🏗️ **Architecture: DynamoDB + SQS**

```
Frontend → API Gateway → Match Service → DynamoDB (match state)
                              ↓
                            SQS Queue → Robot Worker → DynamoDB
```

### **What's Deployed**

- ✅ **DynamoDB Table**: `robot-orchestra-matches` storing all match data
- ✅ **SQS Queue**: Async robot response generation with DLQ
- ✅ **Lambda Functions**:
  - `match-service`: Creates matches, handles responses/votes
  - `robot-worker`: Processes SQS messages, generates AI responses
  - `match-history`: Retrieves match history from DynamoDB

### **Technical Implementation**

- **Backend**: Lambda functions handle all game logic, status transitions, and data persistence
- **Storage**: DynamoDB for match state with automatic TTL (30 days)
- **Async Processing**: SQS queue for robot response generation
- **Frontend**: Next.js with 1-second polling for real-time updates
- **Infrastructure**: Fully serverless on AWS (Lambda, DynamoDB, SQS, API Gateway)

---- Future enhancements---

Admin console tha allow Nico to see other users, adjust permissions, invite new users by email or text. to do the communication, we will need:

**Email/SMS Implementation for Robot Orchestra**

**Objective:** Add flexible email/SMS capabilities for MFA authentication and game notifications using AWS SES + SNS.

**Implementation:**

1. Set up AWS SES with robotorchestra.org domain verification
2. Configure AWS SNS for SMS delivery
3. Create Lambda functions: `sendEmail` and `sendSMS`
4. Add SQS queues: `email-queue` and `sms-queue` for async processing
5. Store email/SMS templates in DynamoDB
6. Integrate with existing Cognito auth flow for MFA
7. Add notification triggers for game events (match progress, suggestions)

**Architecture:**

```
Game Events → SQS Queue → Lambda (sendEmail/sendSMS) → SES/SNS
```

**Cost:** SES $0.10/1000 emails, SNS $0.75/1000 SMS - fits current $5-10/month budget.

**Files to modify:** Lambda handlers, Terraform infrastructure, DynamoDB schema for templates.
