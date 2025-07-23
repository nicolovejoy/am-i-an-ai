# AI Prompt Generation Fix

## Issue
AI prompt generation is failing for rounds 2-5, causing fallback to hardcoded prompts.

## Root Cause
The AI service expects model name format `claude-3-haiku` but match-service is sending `anthropic.claude-3-haiku-20240307-v1:0` (the full Bedrock model ID).

## Error Details
```
Invalid enum value. Expected 'claude-3-sonnet' | 'claude-3-haiku' | 'claude-3-opus', 
received 'anthropic.claude-3-haiku-20240307-v1:0'
```

## Fix Required
In `lambda/match-service.ts`, find where the model is specified (likely in `generateAIPrompt` function around line 70-80) and change:
```typescript
model: "anthropic.claude-3-haiku-20240307-v1:0"
```
to:
```typescript
model: "claude-3-haiku"
```

## Verification
After fixing and deploying:
1. Check CloudWatch dashboard for `AIPromptGenerationSuccess` metric
2. Start a match and verify round 2+ prompts are not "Sample Prompt..."
3. Use admin debug panel to monitor prompts

## Deploy
```bash
cd infrastructure
./scripts/deploy-lambdas.sh
```