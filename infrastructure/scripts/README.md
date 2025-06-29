# Infrastructure Scripts

## Quick Start

### Deploy Everything
```bash
cd infrastructure
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --all
```

### Deploy Specific Components
```bash
./scripts/deploy.sh --lambda          # Backend code only (~2 min)
./scripts/deploy.sh --frontend        # Frontend only
./scripts/deploy.sh --database        # Database only
./scripts/deploy.sh --cognito         # Auth only
```

### Destroy Infrastructure
```bash
./scripts/destroy.sh                  # Preserves Cognito users (default)
./scripts/destroy.sh --complete       # Destroys everything including users
```

## Component Structure

```
scripts/
├── deploy.sh              # Main deployment orchestrator
├── destroy.sh             # Destruction with Cognito preservation
└── components/
    ├── state-backend.sh   # S3 + DynamoDB state
    ├── cognito.sh         # Authentication
    ├── database.sh        # RDS PostgreSQL
    ├── networking.sh      # VPC + security groups
    ├── lambda.sh          # API functions
    ├── frontend.sh        # S3 + CloudFront
    └── shared.sh          # Common utilities
```

## Deployment Times

- **Lambda only**: ~2 minutes
- **Full deployment**: ~20 minutes
- **Individual components**: ~5 minutes

## Recent Updates (2025-06-28)

✅ **Authentication System Cleanup**
- Removed legacy API services and auth middleware
- Centralized admin role management
- Enhanced security with audit logging
- All 390 tests passing

**Recommended**: Lambda-only deployment to apply auth fixes
```bash
./scripts/deploy.sh --lambda
```

---

_Status: **Production Ready** - All systems operational_