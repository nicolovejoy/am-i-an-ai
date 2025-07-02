# AmIAnAI v2 - 2H+2AI Deployment Scripts

## Quick Start

### Deploy Everything
```bash
cd v2
DOMAIN_NAME=amianai.com ./scripts/deploy.sh --all
```

### Deploy Specific Components
```bash
./scripts/deploy.sh --websocket      # WebSocket Lambda only (~2 min)
./scripts/deploy.sh --frontend       # Frontend only (~3 min)
./scripts/deploy.sh --database       # DynamoDB only (~1 min)
```

### Destroy Infrastructure
```bash
./scripts/destroy.sh                 # Complete teardown (~2 min)
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
- **v1**: ~$90/month (RDS + VPC + NAT Gateway)
- **v2**: ~$5/month (DynamoDB + Lambda + S3)
- **Savings**: ~$85/month ($1,020/year)

## Current Status

**Phase 1 Complete:**
✅ **WebSocket Lambda**: 240 lines, 8/8 tests passing  
✅ **Core Features**: 2H+2AI, A/B/C/D anonymity, 10min timer  
✅ **TDD Success**: <500 lines total, all functionality working  

**Ready for Deployment:**
- [ ] DynamoDB table creation
- [ ] WebSocket API Gateway setup  
- [ ] Lambda deployment
- [ ] Frontend build and S3 deployment
- [ ] v2.amianai.com subdomain

---

_Status: **Ready for Infrastructure** - Backend logic complete, deployment pending_