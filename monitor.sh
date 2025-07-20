#!/bin/bash
# Real-time monitoring script for Robot Orchestra

echo "🔍 Robot Orchestra Live Monitor"
echo "==============================="
echo "Press Ctrl+C to stop"
echo ""

# Function to check service health
check_health() {
  local service=$1
  local url=$2
  
  response=$(curl -s -w "\\n%{http_code}" "$url" 2>/dev/null)
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" = "200" ]; then
    echo "✅ $service: Healthy"
  else
    echo "❌ $service: Error (HTTP $http_code)"
  fi
}

# Function to check Lambda errors
check_lambda_errors() {
  local function_name=$1
  local errors=$(aws logs filter-log-events \
    --log-group-name "/aws/lambda/$function_name" \
    --start-time $(($(date +%s)*1000-300000)) \
    --filter-pattern "ERROR" \
    --query 'events[].message' \
    --output text 2>/dev/null | wc -l)
  
  if [ "$errors" -gt 0 ]; then
    echo "⚠️  $function_name: $errors errors in last 5 min"
  else
    echo "✅ $function_name: No recent errors"
  fi
}

# Main monitoring loop
while true; do
  clear
  echo "🔍 Robot Orchestra Live Monitor - $(date)"
  echo "==============================="
  
  echo ""
  echo "API Health Checks:"
  check_health "Match Service" "https://api.robotorchestra.org/health"
  check_health "Match History" "https://api.robotorchestra.org/matches/history"
  
  echo ""
  echo "Lambda Function Status:"
  check_lambda_errors "robot-orchestra-match-service"
  check_lambda_errors "robot-orchestra-robot-worker"
  check_lambda_errors "robot-orchestra-ai-service"
  check_lambda_errors "robot-orchestra-admin-service"
  
  echo ""
  echo "SQS Queue Status:"
  QUEUE_URL=$(aws sqs get-queue-url --queue-name robot-orchestra-robot-responses --query QueueUrl --output text 2>/dev/null)
  if [ -n "$QUEUE_URL" ]; then
    MSG_COUNT=$(aws sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names ApproximateNumberOfMessages --query 'Attributes.ApproximateNumberOfMessages' --output text 2>/dev/null)
    echo "📬 Robot Response Queue: $MSG_COUNT messages"
  fi
  
  echo ""
  echo "Recent Activity:"
  RECENT_MATCHES=$(aws dynamodb scan \
    --table-name robot-orchestra-matches \
    --filter-expression "#ts = :zero AND createdAt > :recent" \
    --expression-attribute-names '{"#ts": "timestamp"}' \
    --expression-attribute-values '{":zero": {"N": "0"}, ":recent": {"S": "'$(date -u -v-1H +%Y-%m-%dT%H:%M:%S.000Z)'"}}' \
    --query 'Count' \
    --output text 2>/dev/null)
  echo "🎮 Matches created in last hour: ${RECENT_MATCHES:-0}"
  
  echo ""
  echo "Refreshing in 30 seconds..."
  sleep 30
done