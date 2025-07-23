#!/bin/bash

# Setup CloudWatch metric filters for RobotOrchestra monitoring

echo "🔧 Setting up CloudWatch metric filters for RobotOrchestra..."

# Function to create a metric filter
create_metric_filter() {
    local log_group=$1
    local filter_name=$2
    local filter_pattern=$3
    local metric_name=$4
    local metric_namespace="RobotOrchestra"
    
    echo "Creating metric filter: $filter_name"
    
    aws logs put-metric-filter \
        --log-group-name "$log_group" \
        --filter-name "$filter_name" \
        --filter-pattern "$filter_pattern" \
        --metric-transformations \
        "metricName=$metric_name,metricNamespace=$metric_namespace,metricValue=1,defaultValue=0" \
        2>/dev/null || echo "  ⚠️  Filter $filter_name already exists or log group not found"
}

# Match Service Metrics
echo "📊 Setting up Match Service metrics..."
LOG_GROUP="/aws/lambda/robot-orchestra-match-service"

create_metric_filter "$LOG_GROUP" \
    "AIPromptFailures" \
    '"[ERROR] Error generating AI prompt"' \
    "AIPromptGenerationFailures"

create_metric_filter "$LOG_GROUP" \
    "AIPromptSuccess" \
    '"AI prompt generated:"' \
    "AIPromptGenerationSuccess"

create_metric_filter "$LOG_GROUP" \
    "FallbackPromptUsage" \
    '"Using fallback prompt"' \
    "FallbackPromptUsage"

create_metric_filter "$LOG_GROUP" \
    "MatchCreated" \
    '"Match created in DynamoDB"' \
    "MatchesCreated"

create_metric_filter "$LOG_GROUP" \
    "VoteSubmitted" \
    '"Vote submitted for match"' \
    "VotesSubmitted"

create_metric_filter "$LOG_GROUP" \
    "RoundCompleted" \
    '"Round * completed"' \
    "RoundsCompleted"

# Robot Worker Metrics
echo "🤖 Setting up Robot Worker metrics..."
LOG_GROUP="/aws/lambda/robot-orchestra-robot-worker"

create_metric_filter "$LOG_GROUP" \
    "RobotResponseGenerated" \
    '"Robot * response added to match"' \
    "RobotResponsesGenerated"

create_metric_filter "$LOG_GROUP" \
    "RobotResponseFallback" \
    '"Failed to generate AI response"' \
    "RobotResponseFallbacks"

create_metric_filter "$LOG_GROUP" \
    "AIServiceTimeout" \
    '"AI service timeout"' \
    "AIServiceTimeouts"

# AI Service Metrics (if deployed)
echo "🧠 Setting up AI Service metrics..."
LOG_GROUP="/aws/lambda/robot-orchestra-ai-service"

create_metric_filter "$LOG_GROUP" \
    "AIServiceRequests" \
    '"Processing AI request"' \
    "AIServiceRequests" 2>/dev/null || echo "  ℹ️  AI Service not deployed yet"

create_metric_filter "$LOG_GROUP" \
    "BedrockAPIErrors" \
    '"Bedrock API error"' \
    "BedrockAPIErrors" 2>/dev/null || echo "  ℹ️  AI Service not deployed yet"

# Error Metrics
echo "❌ Setting up Error metrics..."

create_metric_filter "/aws/lambda/robot-orchestra-match-service" \
    "MatchServiceErrors" \
    '"[ERROR]"' \
    "MatchServiceErrors"

create_metric_filter "/aws/lambda/robot-orchestra-robot-worker" \
    "RobotWorkerErrors" \
    '"[ERROR]"' \
    "RobotWorkerErrors"

echo "✅ Metric filters created!"
echo ""
echo "📈 You can now create a CloudWatch Dashboard with these metrics:"
echo "  - RobotOrchestra/AIPromptGenerationFailures"
echo "  - RobotOrchestra/AIPromptGenerationSuccess"
echo "  - RobotOrchestra/FallbackPromptUsage"
echo "  - RobotOrchestra/MatchesCreated"
echo "  - RobotOrchestra/VotesSubmitted"
echo "  - RobotOrchestra/RobotResponsesGenerated"
echo "  - RobotOrchestra/RobotResponseFallbacks"
echo ""
echo "💡 Tip: Create alarms for:"
echo "  - AIPromptGenerationFailures > 0 (AI service issues)"
echo "  - FallbackPromptUsage > 0 (degraded experience)"
echo "  - RobotResponseFallbacks > 0 (AI response generation issues)"