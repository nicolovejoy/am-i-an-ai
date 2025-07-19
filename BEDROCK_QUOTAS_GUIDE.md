# Quick Guide: Finding Your Bedrock Quotas

## Step 1: Navigate to Service Quotas
1. Open AWS Console
2. Search for "Service Quotas" in the top search bar
3. Click on "Service Quotas"

## Step 2: Find Bedrock Service
1. In the AWS services list, search for "Bedrock"
2. Click on "Amazon Bedrock"

## Step 3: Find the RIGHT Quotas (ignore the 500+ others)

### Option A: Search by "claude"
1. In the search box, type: **claude**
2. Look for quotas that mention "requests per minute"

### Option B: Search by "anthropic"
1. In the search box, type: **anthropic**
2. Look for rate limit quotas

### Option C: Look for these patterns
The quotas might be named like:
- "Requests per minute for Claude 3 Haiku"
- "anthropic.claude-3-haiku requests per minute"
- "Claude 3 Haiku - InvokeModel requests per minute"
- Or similar variations

### Option D: Check CloudWatch for actual usage
1. Go to CloudWatch → Metrics → Bedrock
2. Look for metrics with "claude" or "anthropic" in the name
3. This will show you which models you're actually using

## What You'll See
Each quota shows:
- **Applied quota value**: Your current limit (e.g., 60 requests/minute)
- **AWS default quota**: The standard limit
- A "Request increase" button if you need more

## Quick Check for Usage
To see if you're hitting limits:
1. Go to CloudWatch → Metrics → Bedrock
2. Look for "ModelInvocationThrottles" metric
3. If you see spikes, you're hitting rate limits

## Your App's Usage Pattern
- Each match triggers 3 robot responses simultaneously
- With staggered delays: 0ms, 2000ms, 4000ms
- This spreads requests over 4 seconds to avoid throttling

## Recommendation
Since you only use Haiku for robot responses:
1. Keep Haiku enabled (it's the cheapest anyway)
2. You can disable Opus to avoid accidental expensive usage
3. Keep Sonnet for future prompt generation features