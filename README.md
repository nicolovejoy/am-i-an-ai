# RobotOrchestra

**A game where humans try to blend in with AI players.**

One human joins three AI participants responding to creative prompts. Players vote to identify who's human.

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
🔜 **Next**: Multi-human matches (2v2), admin debug mode, real-time updates

See [ROADMAP.md](./ROADMAP.md) for future plans.