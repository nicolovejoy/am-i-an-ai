# Infrastructure Scripts - Granular Deployment Plan

## Overview

This document outlines the plan to refactor AmIAnAI infrastructure scripts from a monolithic approach to a granular, component-based deployment system. This will enable selective deployment of components, preserve user data during testing iterations, and improve development velocity.

## Current State

### Existing Scripts
- `setup.sh` - Monolithic deployment (handles all components)
- `destroy.sh` - Full teardown with optional state backend cleanup

### Current Limitations
- Must deploy entire infrastructure for any change
- Cannot preserve Cognito user pools during testing iterations
- Long deployment times for simple changes
- Difficult to debug component-specific issues

## Target Architecture

### New Script Structure
```
infrastructure/scripts/
├── deploy.sh                 # Main orchestrator script
├── components/
│   ├── state-backend.sh     # S3 + DynamoDB state management
│   ├── cognito.sh           # Authentication (preserve option)
│   ├── database.sh          # RDS PostgreSQL + secrets
│   ├── networking.sh        # VPC + security groups
│   ├── lambda.sh            # Lambda functions + API Gateway
│   ├── frontend.sh          # S3 + CloudFront
│   └── shared.sh            # Common functions
└── destroy/
    ├── destroy.sh           # Main destroy orchestrator
    ├── destroy-selective.sh # Destroy with Cognito preservation
    └── destroy-complete.sh  # Full teardown including state
```

### Terraform Module Structure
```
infrastructure/modules/
├── cognito/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── database/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── networking/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── lambda/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── frontend/
    ├── main.tf
    ├── variables.tf
    └── outputs.tf
```

## Implementation Phases

### ✅ Phase 0: Planning & Documentation
- [x] Document granular infrastructure plan
- [x] Update destroy script for Cognito preservation prompt

### ✅ Phase 1: Component Scripts (COMPLETED)
- [x] Extract common functions to `shared.sh`
- [x] Create individual component deployment scripts
- [x] Create main orchestrator script `deploy.sh`
- [x] Maintain backward compatibility with current monolithic approach

### 📋 Phase 2: Terraform Modularization
- [ ] Split main.tf into focused modules
- [ ] Add conditional resource creation for preservation scenarios
- [ ] Test module dependencies and outputs
- [ ] Update variable files and outputs

### 📋 Phase 3: Enhanced Orchestration
- [ ] Create new `deploy.sh` with component selection
- [ ] Update `destroy.sh` with preservation options
- [ ] Add validation and dependency checking
- [ ] Create comprehensive testing

### 📋 Phase 4: Documentation & Migration
- [ ] Update CLAUDE.md with new deployment commands
- [ ] Create migration guide from old to new scripts
- [ ] Add troubleshooting guide
- [ ] Update README.md with new workflow

## New Deployment Commands

### Full Deployment (Current Behavior)
```bash
# Deploy everything (equivalent to current setup.sh)
./scripts/deploy.sh --all

# Deploy with forced refresh
./scripts/deploy.sh --all --force-refresh
```

### Selective Component Deployment
```bash
# Individual components
./scripts/deploy.sh --lambda           # Deploy just Lambda functions
./scripts/deploy.sh --database         # Deploy just database
./scripts/deploy.sh --frontend         # Deploy just frontend  
./scripts/deploy.sh --cognito          # Deploy just authentication

# Component groups
./scripts/deploy.sh --backend          # Lambda + Database + API Gateway
./scripts/deploy.sh --infrastructure   # Networking + Core services (no app)
./scripts/deploy.sh --application      # Lambda + Frontend (no infrastructure)
```

### Enhanced Destroy Options
```bash
# Preserve Cognito (DEFAULT - for user testing)
./scripts/destroy.sh                   # Prompts, defaults to preserve Cognito

# Explicit preservation
./scripts/destroy.sh --preserve-cognito

# Full destroy including Cognito
./scripts/destroy.sh --complete

# Selective component destroy
./scripts/destroy.sh --lambda --database  # Keep frontend + cognito
```

## Cognito Preservation Strategy

### Problem Statement
During development iterations, we need to preserve Cognito user pools so that user testers can maintain their accounts across infrastructure rebuilds.

### Solution: Conditional Terraform Resources
```hcl
# In cognito module
variable "preserve_cognito" {
  description = "Skip Cognito resources if preserving existing"
  type        = bool
  default     = false
}

variable "existing_cognito_pool_name" {
  description = "Name of existing Cognito pool to reference"
  type        = string
  default     = "amianai-user-pool"
}

# Conditional resource creation
resource "aws_cognito_user_pool" "main" {
  count = var.preserve_cognito ? 0 : 1
  # ... existing config
}

# Data source for existing resources
data "aws_cognito_user_pool" "existing" {
  count = var.preserve_cognito ? 1 : 0
  name  = var.existing_cognito_pool_name
}

# Output that works for both scenarios
output "user_pool_id" {
  value = var.preserve_cognito ? 
    data.aws_cognito_user_pool.existing[0].id : 
    aws_cognito_user_pool.main[0].id
}
```

### Destroy Script Enhancement
The destroy script will prompt with Cognito preservation as the default:

```bash
echo "🔐 Preserve Cognito user pool? (keeps user accounts for testing)"
echo "   [Y/n] (default: Yes)"
read -r cognito_response

# Default to preserve if empty response
if [ -z "$cognito_response" ] || [ "$cognito_response" = "y" ] || [ "$cognito_response" = "Y" ]; then
    PRESERVE_COGNITO=true
    echo "✅ Cognito user pool will be preserved"
else
    PRESERVE_COGNITO=false
    echo "❌ Cognito user pool will be destroyed"
fi
```

## Benefits

### Development Velocity
- **Faster iterations**: Deploy only changed components
- **Reduced deployment time**: Skip unchanged infrastructure
- **Better debugging**: Isolate issues to specific components

### Cost Optimization
- **Selective teardown**: Destroy expensive resources (RDS) while keeping cheap ones
- **Development flexibility**: Keep core infrastructure, iterate on application

### User Experience
- **Preserve user accounts**: Cognito pools maintained across rebuilds
- **Continuous testing**: User testers don't lose access during development

### Operational Excellence
- **Modular maintenance**: Update components independently
- **Clear dependencies**: Explicit component relationships
- **Better rollbacks**: Revert specific components if needed

## Migration Strategy

### Backward Compatibility
The current workflow will continue to work:
```bash
# Current command (will continue to work)
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/setup.sh

# New equivalent
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --all
```

### Migration Steps for Users
1. **Phase 1**: Use new scripts alongside old ones
2. **Phase 2**: Migrate to component-based deployments
3. **Phase 3**: Deprecate old monolithic scripts (optional)

## Testing Strategy

### Component Testing
- Each component script must be testable in isolation
- Mock dependencies where possible
- Validate outputs and state consistency

### Integration Testing
- Test component dependencies and ordering
- Validate cross-component communications
- End-to-end deployment validation

### Rollback Testing
- Verify ability to rollback individual components
- Test recovery from partial deployment failures
- Validate state consistency after rollbacks

## Security Considerations

### State Management
- Maintain secure state backend
- Ensure component isolation doesn't compromise security
- Validate permissions for selective deployments

### Cognito Preservation
- Secure handling of existing Cognito pool references
- Prevent accidental exposure of user data
- Maintain authentication security during transitions

## Success Metrics

### Performance
- [ ] Component deployment time < 5 minutes
- [ ] Full deployment time < 20 minutes (down from 40 minutes)
- [ ] Lambda-only deployment < 2 minutes

### Reliability
- [ ] 100% backward compatibility maintained
- [ ] Zero data loss during component updates
- [ ] Successful Cognito preservation across rebuilds

### Usability
- [ ] Clear error messages for failed deployments
- [ ] Intuitive command-line interface
- [ ] Comprehensive documentation and examples

## Implementation Progress

- [x] **Phase 0.1**: Create implementation plan documentation
- [x] **Phase 0.2**: Update destroy script with Cognito preservation prompt
- [x] **Phase 1.1**: Extract shared functions (`shared.sh`)
- [x] **Phase 1.2**: Create component scripts (6 components)
- [x] **Phase 1.3**: Create orchestration script (`deploy.sh`)
- [ ] **Phase 2.1**: Modularize Terraform configuration
- [ ] **Phase 3.1**: Enhanced destroy options
- [ ] **Phase 4.1**: Update project documentation

---

*Last updated: 2025-06-18*  
*Next review: After Phase 1 completion*