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
