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