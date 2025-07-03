# am I an AI? - Deployment Guide

## **When to Use Scripts vs Terraform Directly**

### **Use Terraform Directly For:**
- ✅ **Infrastructure changes** (adding Cognito, IAM roles, etc.)
- ✅ **Resource configuration updates** 
- ✅ **Quick iteration on terraform files**
- ✅ **Simple resource additions** (no build steps needed)

```bash
cd infrastructure
terraform plan    # Review changes
terraform apply   # Deploy infrastructure
```

### **Use Deployment Scripts For:**
- ✅ **Lambda code updates** (requires build + package)
- ✅ **Frontend deployments** (requires build + S3 upload)
- ✅ **Full system deployments** (coordinates multiple components)

```bash
cd infrastructure
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --websocket  # Lambda only
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --frontend   # Frontend only  
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --all        # Everything
```

## **Component-Specific Deployment**

### **WebSocket Lambda** (Use Script)
```bash
./scripts/deploy.sh --websocket      # Builds TypeScript, packages, deploys (~2 min)
```

### **Frontend React App** (Use Script)  
```bash
./scripts/deploy.sh --frontend       # Builds Next.js, uploads to S3 (~3 min)
```

### **Infrastructure Only** (Use Terraform)
```bash
terraform apply                      # Cognito, IAM, DynamoDB, API Gateway (~1 min)
```

## Component Structure

```
scripts/
├── deploy.sh              # Main deployment orchestrator
├── destroy.sh             # Complete teardown
└── components/
    ├── shared.sh          # Common utilities
    ├── database.sh        # DynamoDB table
    ├── websocket.sh       # WebSocket API + Lambda
    └── frontend.sh        # S3 + CloudFront for v2.amianai.com
```

## Deployment Times

- **WebSocket only**: ~2 minutes
- **Frontend only**: ~3 minutes  
- **Full deployment**: ~5 minutes
- **Individual components**: ~1-3 minutes

## Architecture Differences from v1

### **Simplified Infrastructure**
- **No VPC**: Direct Lambda internet access
- **No RDS**: DynamoDB single table design
- **No NAT Gateway**: $97/month cost savings
- **WebSocket API**: Real-time messaging

### **Cost Comparison**
- **Previous**: ~$90/month (RDS + VPC + NAT Gateway)
- **Current**: ~$5/month (DynamoDB + Lambda + S3)
- **Savings**: ~$85/month ($1,020/year)

## Current Status

**Backend Redesign Complete:**
✅ **Match/Round Architecture**: Clean terminology replacing session/message  
✅ **MatchManager Class**: 21/21 tests passing, full round state management  
✅ **New WebSocket Handler**: `join_match`, `submit_response`, `submit_vote` actions  
✅ **5-Round System**: Prompt → Response → Reveal → Vote (x5) → Results  
✅ **TypeScript Foundation**: Comprehensive type safety and test coverage  

**Ready for Deployment:**
- [x] Backend redesign with Match/Round terminology
- [x] Comprehensive test coverage (30+ tests passing)
- [ ] Deploy new Lambda handler (`match-handler.ts`)
- [ ] Frontend integration with new WebSocket actions
- [ ] 5-round UI components

---

_Status: **Backend Complete** - Ready to deploy new Match/Round architecture_

## New Architecture Summary

### **Match/Round System (vs old Session/Message)**
- **Match**: 4-player game instance (1 human + 3 AI for testing)
- **Round**: Structured prompt → response → vote cycle (5 rounds total)
- **Scoring**: 1 point per correct human identification
- **WebSocket Actions**: `join_match`, `submit_response`, `submit_vote`

### **Key Files**
- **`/lambda/match-handler.ts`**: New WebSocket handler (replaces `handler.ts`)
- **`/lambda/MatchManager.ts`**: Core round state management
- **`/lambda/types.ts`**: Clean TypeScript interfaces
- **Tests**: 30+ tests covering all round transitions and edge cases