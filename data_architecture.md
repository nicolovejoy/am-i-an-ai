# AmIAnAI Data Architecture & Call Flow

This document provides a comprehensive overview of the AmIAnAI platform's data architecture, API call flow, and authorization model.

## 🏗️ System Overview

The AmIAnAI platform is a serverless, multi-persona conversation system built on AWS with a Next.js frontend. It features role-based access control, PostgreSQL persistence, and AI-powered conversation capabilities.

## 📊 High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js React App]
        Auth[Cognito Auth Context]
        Store[Zustand State Store]
    end
    
    subgraph "CDN Layer"
        CF[CloudFront CDN]
        S3[S3 Static Hosting]
    end
    
    subgraph "API Layer"
        APIGW[API Gateway]
        Lambda[Lambda Functions]
    end
    
    subgraph "Authentication"
        Cognito[AWS Cognito]
        JWT[JWT Tokens]
    end
    
    subgraph "Data Layer"
        RDS[(PostgreSQL RDS)]
        Secrets[AWS Secrets Manager]
    end
    
    subgraph "AI Integration"
        OpenAI[OpenAI API]
        AIOrch[AI Orchestrator]
    end
    
    UI --> CF
    CF --> S3
    UI --> Auth
    Auth --> Cognito
    UI --> APIGW
    APIGW --> Lambda
    Lambda --> RDS
    Lambda --> Secrets
    Lambda --> OpenAI
    AIOrch --> OpenAI
    
    style UI fill:#e1f5fe
    style RDS fill:#f3e5f5
    style Lambda fill:#fff3e0
    style Cognito fill:#e8f5e8
```

## 🔐 Authorization Model

```mermaid
graph TD
    subgraph "Authentication Flow"
        User[User Login]
        CognitoAuth[Cognito Authentication]
        JWT[JWT ID Token]
        Frontend[Frontend Store]
    end
    
    subgraph "Authorization Middleware"
        Request[API Request]
        AuthCheck{Auth Required?}
        TokenValid{Valid Token?}
        RoleCheck{Role Check?}
        AdminCheck{Admin Access?}
    end
    
    subgraph "Access Levels"
        Public[Public Access]
        User_Access[User Access]
        Admin_Access[Admin Access]
        Denied[Access Denied]
    end
    
    User --> CognitoAuth
    CognitoAuth --> JWT
    JWT --> Frontend
    Frontend --> Request
    
    Request --> AuthCheck
    AuthCheck -->|No| Public
    AuthCheck -->|Yes| TokenValid
    TokenValid -->|No| Denied
    TokenValid -->|Yes| RoleCheck
    RoleCheck -->|User| User_Access
    RoleCheck -->|Admin Check| AdminCheck
    AdminCheck -->|Admin Email| Admin_Access
    AdminCheck -->|Not Admin| User_Access
    
    style User_Access fill:#e8f5e8
    style Admin_Access fill:#fff3e0
    style Denied fill:#ffebee
    style Public fill:#f3e5f5
```

## 🔄 API Call Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant CF as CloudFront
    participant CG as Cognito
    participant AG as API Gateway
    participant LF as Lambda Function
    participant DB as PostgreSQL
    participant SM as Secrets Manager
    participant AI as OpenAI API
    
    Note over U,AI: Authentication Flow
    U->>+CG: Login Request
    CG->>-U: JWT ID Token
    
    Note over U,AI: Authenticated API Call
    U->>+CF: Page Request
    CF->>-U: React App + Static Assets
    
    U->>+AG: API Request + Bearer Token
    AG->>+LF: Invoke with Event
    
    Note over LF: Authorization Middleware
    LF->>LF: Validate JWT Token
    LF->>LF: Extract User Claims
    LF->>LF: Check Required Permissions
    
    Note over LF,DB: Database Operations
    LF->>+SM: Get DB Credentials
    SM->>-LF: Database Connection String
    LF->>+DB: SQL Query/Command
    DB->>-LF: Query Results
    
    Note over LF,AI: AI Integration (Optional)
    LF->>+AI: Generate Response
    AI->>-LF: AI Response
    
    LF->>-AG: HTTP Response
    AG->>-U: JSON Response
```

## 🗄️ Database Schema Overview

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK
        string cognito_sub UK
        enum role
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }
    
    PERSONAS {
        uuid id PK
        string name
        enum type
        json personality_config
        json ai_config
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }
    
    CONVERSATIONS {
        uuid id PK
        string title
        string topic
        text description
        enum status
        json constraints
        uuid created_by FK
        timestamp created_at
        timestamp started_at
        timestamp updated_at
    }
    
    CONVERSATION_PARTICIPANTS {
        uuid id PK
        uuid conversation_id FK
        uuid persona_id FK
        enum role
        timestamp joined_at
        boolean is_active
    }
    
    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid author_persona_id FK
        text content
        enum type
        integer sequence_number
        timestamp timestamp
        boolean is_edited
        timestamp edited_at
        uuid reply_to_message_id FK
        json metadata
        enum moderation_status
        boolean is_visible
        boolean is_archived
    }
    
    USERS ||--o{ PERSONAS : creates
    USERS ||--o{ CONVERSATIONS : creates
    CONVERSATIONS ||--o{ CONVERSATION_PARTICIPANTS : contains
    PERSONAS ||--o{ CONVERSATION_PARTICIPANTS : participates
    CONVERSATIONS ||--o{ MESSAGES : contains
    PERSONAS ||--o{ MESSAGES : authors
    MESSAGES ||--o{ MESSAGES : replies_to
```

## 🛡️ Security & Permissions Model

```mermaid
graph TB
    subgraph "Authentication Layer"
        CognitoAuth[AWS Cognito]
        JWTToken[JWT ID Token]
        EmailClaim[Email Claim]
    end
    
    subgraph "Authorization Middleware"
        TokenValidation[Token Validation]
        ClaimsExtraction[Claims Extraction]
        RoleResolution[Role Resolution]
    end
    
    subgraph "Permission Levels"
        Public[Public Endpoints]
        Authenticated[Authenticated Users]
        AdminWhitelist[Admin Whitelist]
    end
    
    subgraph "Endpoint Protection"
        HealthCheck["/api/health"]
        UserEndpoints["/api/conversations<br/>/api/personas<br/>/api/messages"]
        AdminEndpoints["/api/admin/*"]
    end
    
    subgraph "Database Access"
        UserOwnedData[User-Owned Resources]
        SharedData[Shared Public Data]
        AdminData[System Administration]
    end
    
    CognitoAuth --> JWTToken
    JWTToken --> EmailClaim
    EmailClaim --> TokenValidation
    TokenValidation --> ClaimsExtraction
    ClaimsExtraction --> RoleResolution
    
    RoleResolution --> Public
    RoleResolution --> Authenticated
    RoleResolution --> AdminWhitelist
    
    Public --> HealthCheck
    Authenticated --> UserEndpoints
    AdminWhitelist --> AdminEndpoints
    
    Authenticated --> UserOwnedData
    Authenticated --> SharedData
    AdminWhitelist --> AdminData
    
    style Public fill:#f3e5f5
    style Authenticated fill:#e8f5e8
    style AdminWhitelist fill:#fff3e0
    style HealthCheck fill:#f3e5f5
    style UserEndpoints fill:#e8f5e8
    style AdminEndpoints fill:#fff3e0
```

## 📡 Frontend-Backend Communication

```mermaid
graph LR
    subgraph "Frontend Components"
        ConvView[ConversationView]
        AdminPage[Admin Page]
        PersonaList[Persona List]
        MessageInput[Message Input]
    end
    
    subgraph "Frontend Services"
        CognitoService[Cognito Service]
        APIService[API Service]
        AIOrchestrator[AI Orchestrator]
    end
    
    subgraph "API Endpoints"
        ConvAPI["/api/conversations"]
        PersonaAPI["/api/personas"]
        MessageAPI["/api/messages"]
        AdminAPI["/api/admin/*"]
        HealthAPI["/api/health"]
    end
    
    subgraph "Lambda Functions"
        ConvLambda[Conversation Handler]
        PersonaLambda[Persona Handler]
        MessageLambda[Message Handler]
        AdminLambda[Admin Handler]
        HealthLambda[Health Handler]
    end
    
    ConvView --> CognitoService
    AdminPage --> CognitoService
    PersonaList --> CognitoService
    MessageInput --> AIOrchestrator
    
    CognitoService --> APIService
    APIService --> ConvAPI
    APIService --> PersonaAPI
    APIService --> MessageAPI
    APIService --> AdminAPI
    APIService --> HealthAPI
    
    ConvAPI --> ConvLambda
    PersonaAPI --> PersonaLambda
    MessageAPI --> MessageLambda
    AdminAPI --> AdminLambda
    HealthAPI --> HealthLambda
    
    style CognitoService fill:#e8f5e8
    style APIService fill:#e1f5fe
    style ConvLambda fill:#fff3e0
    style PersonaLambda fill:#fff3e0
    style MessageLambda fill:#fff3e0
    style AdminLambda fill:#fff3e0
    style HealthLambda fill:#fff3e0
```

## 🔄 Message Flow & AI Integration

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant Auth as Auth Service
    participant API as API Gateway
    participant Lambda as Lambda Function
    participant DB as Database
    participant OpenAI as OpenAI API
    
    Note over U,OpenAI: User Sends Message
    U->>UI: Type message and send
    UI->>Auth: Get JWT token
    Auth->>UI: Return token
    
    UI->>+API: POST /api/messages + Bearer token
    API->>+Lambda: Invoke message handler
    
    Note over Lambda: Message Processing
    Lambda->>Lambda: Validate auth token
    Lambda->>Lambda: Extract user claims
    Lambda->>+DB: Save user message
    DB->>-Lambda: Message saved
    
    Note over Lambda: AI Response Generation
    Lambda->>Lambda: Identify AI personas in conversation
    Lambda->>+DB: Get conversation context
    DB->>-Lambda: Previous messages + persona configs
    
    Lambda->>+OpenAI: Generate AI response
    Note over OpenAI: AI processes context + persona personality
    OpenAI->>-Lambda: AI response text
    
    Lambda->>+DB: Save AI response message
    DB->>-Lambda: AI message saved
    
    Lambda->>-API: Return both messages
    API->>-UI: JSON response with new messages
    
    Note over UI: Real-time Updates
    UI->>UI: Update conversation view
    UI->>UI: Show new messages
```

## 🛠️ Development & Deployment Flow

```mermaid
graph TB
    subgraph "Development"
        LocalDev[Local Development]
        Testing[Test Suite]
        Linting[ESLint + TypeScript]
        Building[Next.js Build]
    end
    
    subgraph "Source Control"
        GitHub[GitHub Repository]
        MainBranch[Main Branch]
        PRs[Pull Requests]
    end
    
    subgraph "CI/CD Pipeline"
        GitHubActions[GitHub Actions]
        PreCommitChecks[Pre-commit Hooks]
        AutoDeploy[Automated Deployment]
    end
    
    subgraph "Infrastructure"
        Terraform[Terraform State]
        S3State[S3 Backend]
        AWSResources[AWS Resources]
    end
    
    subgraph "Production"
        CloudFront[CloudFront CDN]
        S3Hosting[S3 Static Hosting]
        APIGateway[API Gateway]
        LambdaFunctions[Lambda Functions]
        RDSDatabase[PostgreSQL RDS]
    end
    
    LocalDev --> Testing
    Testing --> Linting
    Linting --> Building
    Building --> GitHub
    
    GitHub --> PRs
    PRs --> GitHubActions
    GitHubActions --> PreCommitChecks
    PreCommitChecks --> AutoDeploy
    
    AutoDeploy --> Terraform
    Terraform --> S3State
    Terraform --> AWSResources
    
    AWSResources --> CloudFront
    AWSResources --> S3Hosting
    AWSResources --> APIGateway
    AWSResources --> LambdaFunctions
    AWSResources --> RDSDatabase
    
    style Testing fill:#e8f5e8
    style Linting fill:#e8f5e8
    style Building fill:#e8f5e8
    style PreCommitChecks fill:#fff3e0
    style AutoDeploy fill:#fff3e0
```

## 📋 Key Technical Details

### Authentication & Authorization
- **JWT Tokens**: AWS Cognito-issued ID tokens with email claims
- **Role Resolution**: Email-based admin whitelist (nlovejoy@me.com)
- **Middleware**: Lambda-based auth middleware for all protected endpoints
- **Token Validation**: Full JWT signature verification with Cognito public keys

### Database Architecture
- **PostgreSQL RDS**: Production database with VPC security
- **Connection Management**: AWS Secrets Manager for credentials
- **Schema Management**: Automated setup via admin API endpoints
- **Data Isolation**: User-owned resources with proper access controls

### API Design
- **RESTful Endpoints**: Standard HTTP methods with JSON responses
- **Error Handling**: Consistent error response format across all endpoints
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Rate Limiting**: Built-in API Gateway throttling and quotas

### Frontend Architecture
- **Next.js App Router**: Modern React with server-side generation
- **Static Export**: S3-compatible build for CDN deployment
- **State Management**: Zustand for client-side state + React Query for server state
- **Authentication Context**: React context for auth state management

### Security Considerations
- **HTTPS Everywhere**: All communication encrypted in transit
- **VPC Security**: Database isolated in private subnets
- **IAM Roles**: Least-privilege access for all AWS resources
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Prevention**: Parameterized queries and ORM usage

This architecture ensures scalability, security, and maintainability while providing a robust foundation for AI-powered conversations.