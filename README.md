# RobotOrchestra

**A game where humans try to blend in with AI players.**

One human joins three AI participants responding to creative prompts. Players vote to identify who's human. Now supports multi-human matches (2v2)!

🚀 **Live**: [robotorchestra.org](https://robotorchestra.org)

## Architecture

```
Frontend → CloudFront → API Gateway → Lambda → DynamoDB
                              ↓
                        SQS Queue → Robot Worker → AWS Bedrock
```

## Quick Start

```bash
# Development
cd frontend && npm run dev

# Pre-deploy checks
npm run lint && npm run build  # frontend/
npm test                       # lambda/

# Deploy (user runs these)
./scripts/deploy-frontend.sh   # Frontend changes
./scripts/deploy-lambdas.sh    # Lambda changes
terraform apply                # Infrastructure
```

## Status

✅ **Working**: Full game flow with voting, identity reveal, and match history  
✅ **Phase 1 Complete**: User system foundation with persistent AI agents  
✅ **Phase 2 Complete**: Multi-human matches (1v3 and 2v2) with invite codes  
✅ **Admin Tools**: Debug mode for monitoring AI behavior and CloudWatch dashboards  
🔧 **In Progress**: Fixing AI prompt generation, adding invite code input  
🔜 **Next**: Identity refactor, real-time updates, performance optimizations

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Instructions for Claude AI assistant
- [CURRENT_STATUS.md](./CURRENT_STATUS.md) - Detailed architecture and implementation status
- [ROADMAP.md](./ROADMAP.md) - Future development plans
- [NOMENCLATURE.md](./NOMENCLATURE.md) - Game terminology and data flow reference