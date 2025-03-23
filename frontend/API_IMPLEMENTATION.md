# Am I an AI? - API Implementation Plan

This document outlines the detailed implementation plan for the backend API that will handle user accounts and authentication for the "Am I an AI?" application.

## Current Status

Currently, the application uses simulated API responses for authentication:

- User registration and login are handled with mock data
- User session data is stored only in localStorage
- No persistent database for user accounts
- No real token validation or security measures

## Backend Technology Stack

We recommend implementing the backend using the following technologies:

1. **Node.js + Express.js**: Fast, JavaScript-based backend that matches our frontend stack
2. **DynamoDB**: AWS's NoSQL database for storing user accounts and conversation history
3. **JWT (JSON Web Tokens)**: For secure authentication
4. **bcrypt**: For password hashing
5. **Nodemailer**: For sending verification emails
6. **Joi/Zod**: For API request validation

### Alternative Options

- **Serverless Functions**: AWS Lambda or Vercel Serverless Functions
- **PostgreSQL**: If relational data structures are preferred
- **Supabase/Firebase**: For quicker implementation with built-in auth systems

## API Endpoints

### Authentication API

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

### User Management API

```
GET    /api/users/profile
PUT    /api/users/profile
DELETE /api/users/account
GET    /api/users/history
```

### Analysis API

```
POST   /api/analysis/detect
GET    /api/analysis/history
GET    /api/analysis/:id
DELETE /api/analysis/:id
```

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String, // bcrypt hashed
  isVerified: Boolean,
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  role: String, // "user", "admin"
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  apiKey: String, // for premium users
  usageCount: Number,
  usageLimit: Number, // for rate limiting
  subscription: {
    type: String, // "free", "premium", "enterprise"
    expiresAt: Date
  }
}
```

### Analysis Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // reference to User
  title: String,
  text: String, // original text analyzed
  result: String, // "human", "ai", "unknown"
  confidence: Number, // percentage
  tokenCount: Number,
  createdAt: Date,
  metadata: Object // any additional analysis data
}
```

## Authentication Flow

1. **Registration**:

   - User submits name, email, password
   - API validates input, checks for existing email
   - Password is hashed with bcrypt
   - Verification token is generated
   - User record is created in database (unverified)
   - Verification email is sent
   - Response: userId, success message (no token yet)

2. **Email Verification**:

   - User clicks link in email with verification token
   - API validates token and marks user as verified
   - Response: success message and redirect to login

3. **Login**:

   - User submits email, password
   - API validates credentials
   - JWT token is generated with user information and expiry
   - Response: user object, token

4. **Session Management**:
   - Token is stored in frontend localStorage
   - Token is included in Authorization header for protected requests
   - Token is validated on server for each protected request
   - Frontend handles token expiry and auto-logout

## Security Considerations

1. **Password Security**:

   - Enforce strong password requirements
   - Hash passwords with bcrypt (min 12 rounds)
   - Never store or transmit plaintext passwords

2. **API Security**:

   - Use HTTPS for all API requests
   - Implement rate limiting to prevent brute force attacks
   - JWT tokens with appropriate expiry times
   - CORS configuration to restrict origins

3. **Data Protection**:
   - Sanitize all user inputs
   - Validate request parameters and bodies
   - Implement proper error handling without exposing sensitive information
   - Regular security audits

## Implementation Phases

### Phase 1: Core Authentication (2-3 weeks)

1. Set up Express.js server with basic middleware
2. Configure DynamoDB connection with AWS SDK
3. Implement user schema
4. Create registration and login endpoints
5. Set up password hashing
6. Implement JWT token generation and validation
7. Connect frontend API service to new backend

### Phase 2: Email & Account Management (1-2 weeks)

1. Set up email service
2. Implement email verification flow
3. Add password reset functionality
4. Create user profile management endpoints
5. Update frontend to use these new APIs

### Phase 3: Analysis History & Premium Features (2-3 weeks)

1. Implement analysis storage
2. Create analysis history endpoints
3. Add user usage tracking
4. Implement rate limiting
5. Develop premium subscription features

## Deployment Strategy

1. **Development Environment**:

   - Local development with DynamoDB Local
   - Environment variables for configuration

2. **Staging Environment**:

   - Vercel/Netlify deployment connected to staging database
   - Simulated email delivery for testing

3. **Production Environment**:
   - Vercel/Netlify for frontend
   - AWS/DigitalOcean/Heroku for backend API
   - DynamoDB Atlas (production cluster)
   - Real email delivery service
   - Monitoring and logging

## API Documentation

We will use Swagger/OpenAPI for documenting the API endpoints, which will provide:

- Interactive API documentation
- Request/response examples
- Authentication requirements
- Schema definitions

## Next Steps

1. Determine the preferred backend technology stack
2. Set up the development environment
3. Create repository structure
4. Implement core authentication endpoints
5. Update frontend API service to connect to real backend

## Implementation Steps

1. Set up Express server with basic routes
2. Configure DynamoDB connection with AWS SDK
3. Implement user schema
4. Create registration and login endpoints
5. Set up password hashing
6. Implement JWT token generation and validation
7. Connect frontend API service to new backend

### 4. Dev Environment Setup

- Use environment variables for configuration
- Local development with DynamoDB Local

## Resources

### Tools

- AWS DynamoDB (main database)
