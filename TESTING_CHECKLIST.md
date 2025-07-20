# Robot Orchestra Testing Checklist

## 🚀 Post-Deployment Testing

### 1. Infrastructure Verification
- [ ] Run `terraform apply` successfully
- [ ] Run `./scripts/deploy-lambdas.sh` successfully
- [ ] Run `./scripts/deploy-frontend.sh` successfully
- [ ] Remove old match-history resources with terraform state rm commands

### 2. API Testing
- [ ] Run `./test-api.sh` - all tests should pass
- [ ] Verify match-service handles `/matches/history`
- [ ] Verify admin endpoints work at `/admin/*`

### 3. Frontend Testing
- [ ] Open https://robotorchestra.org
- [ ] Create a new match
- [ ] Check browser Network tab - polling should be every 4 seconds
- [ ] Submit a response - verify all 4 responses appear
- [ ] Vote - verify voting works correctly
- [ ] Complete a match - verify identity reveal works

### 4. AI Prompt Testing
- [ ] Create multiple matches
- [ ] Verify prompts are different each time (not from hardcoded list)
- [ ] Check CloudWatch logs for "AI prompt generated:" messages
- [ ] If AI fails, verify fallback to hardcoded prompts works

### 5. Admin Panel Testing
- [ ] Navigate to https://robotorchestra.org/admin
- [ ] Click "Clear Match Data" - should show admin service deployed
- [ ] Click "Delete All Matches" (if authorized)
- [ ] Verify matches are deleted from DynamoDB

### 6. CloudWatch Monitoring
Check logs for each service:
```bash
# Match service logs (includes history)
aws logs tail /aws/lambda/robot-orchestra-match-service --since 10m

# Robot worker logs
aws logs tail /aws/lambda/robot-orchestra-robot-worker --since 10m

# AI service logs
aws logs tail /aws/lambda/robot-orchestra-ai-service --since 10m

# Admin service logs
aws logs tail /aws/lambda/robot-orchestra-admin-service --since 10m
```

### 7. Error Scenarios
- [ ] Try to access non-existent match - should get 404
- [ ] Submit response with missing fields - should get 400
- [ ] Check DLQ for any failed messages

### 8. Performance Checks
- [ ] Monitor Lambda cold starts
- [ ] Check DynamoDB read/write capacity
- [ ] Verify no throttling in CloudWatch metrics

## 🐛 Common Issues & Solutions

### Issue: Robot responses not appearing
- Check SQS queue for messages
- Check robot-worker CloudWatch logs
- Verify STATE_UPDATE_QUEUE_URL is set

### Issue: AI prompts not working
- Check AI service logs
- Verify Bedrock permissions
- Check AI_SERVICE_FUNCTION_NAME env var

### Issue: Match history empty
- Verify API Gateway routes to match-service
- Check match-service logs for errors
- Ensure DynamoDB has matches with timestamp=0

### Issue: Admin service not working
- Check admin-service deployment
- Verify IAM permissions
- Check Authorization header

## 📊 Success Criteria

✅ All API endpoints return expected responses
✅ AI generates unique prompts for each round
✅ Polling reduced to 4 seconds
✅ Match history served by match-service
✅ Admin panel can delete matches
✅ No errors in CloudWatch logs
✅ Frontend works smoothly end-to-end