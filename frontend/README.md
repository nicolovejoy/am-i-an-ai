# AmIAnAI - Multi-Persona Conversation System

A platform where humans and AI agents interact through ambiguous personas, built with Next.js and PostgreSQL.

## 🏗️ Architecture Overview

- **Frontend**: Next.js app deployed to AWS S3/CloudFront
- **Database**: PostgreSQL on AWS RDS (production-only)
- **Auth**: AWS Cognito
- **Infrastructure**: Terraform-managed AWS resources

## 🚀 Development Setup (Hybrid Approach)

**Strategy**: Local Next.js development server + Production AWS database

### Prerequisites

- Node.js 18+ 
- AWS CLI configured with appropriate permissions
- Access to AmIAnAI AWS account

### Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/nicolovejoy/amianai.git
   cd amianai/frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with production database settings
   ```

3. **Start Development Server**
   ```bash
   npm run dev  # Usually starts on localhost:3001
   ```

4. **Setup Database** (First time only)
   ```bash
   # Create schema
   curl -X POST http://localhost:3001/api/admin/setup-database
   
   # Seed sample data
   curl -X POST http://localhost:3001/api/admin/seed-database
   
   # Verify setup
   curl http://localhost:3001/api/admin/database-status
   ```

## 📊 Database Management

### API Endpoints
- `GET /api/admin/database-status` - Check connection and table counts
- `POST /api/admin/setup-database` - Create schema (tables + indexes)
- `POST /api/admin/seed-database` - Clear and populate with sample data

### Safety Features
- Requires `ENABLE_DB_ADMIN=true` environment variable
- Production database protection built-in
- Clear logging of all operations

## 🛠️ Development Workflow

1. **Local Development**: Make changes with instant hot reload
2. **Test with Production Data**: Use real AWS database for testing
3. **Build and Deploy**: Deploy to S3/CloudFront when ready

```bash
# Development
npm run dev

# Testing
npm run test
npm run lint

# Production Build
npm run build

# Type Checking
npx tsc --noEmit
```

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/admin/         # Database admin endpoints
│   ├── auth/              # Authentication pages
│   ├── profile/           # User profile
│   └── about/             # Static pages
├── components/
│   ├── auth/              # Auth-related components
│   ├── forms/             # Form components
│   └── [core]/            # Chat, navigation, etc.
├── contexts/              # React contexts (Auth, Toast)
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities
│   ├── database.ts        # Database connection
│   ├── schema.ts          # Database schema (legacy)
│   ├── secrets.ts         # AWS Secrets Manager
│   └── seedData.ts        # Sample data (legacy)
├── repositories/          # Data access layer
├── services/              # External services (Cognito, APIs)
├── types/                 # TypeScript definitions
└── providers/             # React Query, context providers
```

## 🎯 Core Features

- **Multi-Persona System**: Users can create multiple personas (human/AI)
- **Ambiguous Conversations**: Participants' true nature (human/AI) is hidden
- **Conversation Management**: Structured discussions with goals and constraints
- **User Authentication**: AWS Cognito integration
- **Real-time Chat**: Message threading and conversation flows

## 🔒 Environment Configuration

### Required Variables
```bash
# Database (Production)
DB_SECRET_ARN=arn:aws:secretsmanager:...
ENABLE_DB_ADMIN=true

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_...
NEXT_PUBLIC_COGNITO_CLIENT_ID=...

# Environment
NODE_ENV=production
```

## 📚 Related Documentation

- **Infrastructure**: See `/infrastructure/` for Terraform setup
- **Next Steps**: See `../NEXT_STEPS.md` for immediate tasks
- **Project Guidelines**: See `../CLAUDE.md` for development strategy

## ⚠️ Important Notes

- **Production-Only Database**: No local database setup
- **AWS Dependency**: Requires active AWS infrastructure
- **Database Admin**: Use admin APIs carefully - they modify production data
- **Environment Parity**: Local development uses production database

## 🧪 Testing

```bash
npm test              # Run test suite
npm run test:watch    # Watch mode
npm run lint          # ESLint
npm run type-check    # TypeScript validation
```

## 🚀 Deployment

Deployment is handled through infrastructure scripts:

```bash
cd ../infrastructure
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/setup.sh
```

This builds and deploys the frontend to S3/CloudFront automatically.

## 📈 Next Steps

1. Complete database setup (see `NEXT_STEPS.md`)
2. Build conversation interface
3. Implement persona management
4. Add AI integration
5. Production optimization