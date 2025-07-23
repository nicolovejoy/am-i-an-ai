#!/bin/bash

# Create CloudWatch Dashboard for RobotOrchestra

DASHBOARD_NAME="RobotOrchestra-Monitoring"
REGION="${AWS_REGION:-us-east-1}"

echo "📊 Creating CloudWatch Dashboard: $DASHBOARD_NAME"

# Dashboard JSON definition
DASHBOARD_BODY=$(cat << 'EOF'
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "RobotOrchestra", "AIPromptGenerationSuccess", { "stat": "Sum", "period": 300, "color": "#2ca02c" } ],
                    [ ".", "AIPromptGenerationFailures", { "stat": "Sum", "period": 300, "color": "#d62728" } ],
                    [ ".", "FallbackPromptUsage", { "stat": "Sum", "period": 300, "color": "#ff7f0e" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "AI Prompt Generation",
                "period": 300,
                "annotations": {
                    "horizontal": [
                        {
                            "label": "Fallback threshold",
                            "value": 1,
                            "fill": "above"
                        }
                    ]
                }
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "RobotOrchestra", "MatchesCreated", { "stat": "Sum", "period": 300 } ],
                    [ ".", "VotesSubmitted", { "stat": "Sum", "period": 300 } ],
                    [ ".", "RoundsCompleted", { "stat": "Sum", "period": 300 } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "Match Activity",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "RobotOrchestra", "RobotResponsesGenerated", { "stat": "Sum", "period": 300, "color": "#2ca02c" } ],
                    [ ".", "RobotResponseFallbacks", { "stat": "Sum", "period": 300, "color": "#d62728" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "Robot Responses",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "RobotOrchestra", "MatchServiceErrors", { "stat": "Sum", "period": 300, "color": "#d62728" } ],
                    [ ".", "RobotWorkerErrors", { "stat": "Sum", "period": 300, "color": "#ff7f0e" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "Errors",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 12,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/Lambda", "Invocations", "FunctionName", "robot-orchestra-match-service", { "stat": "Sum", "period": 300 } ],
                    [ ".", "Errors", ".", ".", { "stat": "Sum", "period": 300, "color": "#d62728" } ],
                    [ ".", "Duration", ".", ".", { "stat": "Average", "period": 300, "yAxis": "right" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "Match Service Lambda Performance",
                "period": 300,
                "yAxis": {
                    "left": {
                        "min": 0
                    },
                    "right": {
                        "min": 0
                    }
                }
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 12,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/Lambda", "Invocations", "FunctionName", "robot-orchestra-robot-worker", { "stat": "Sum", "period": 300 } ],
                    [ ".", "Errors", ".", ".", { "stat": "Sum", "period": 300, "color": "#d62728" } ],
                    [ ".", "Duration", ".", ".", { "stat": "Average", "period": 300, "yAxis": "right" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "Robot Worker Lambda Performance",
                "period": 300,
                "yAxis": {
                    "left": {
                        "min": 0
                    },
                    "right": {
                        "min": 0
                    }
                }
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 18,
            "width": 24,
            "height": 1,
            "properties": {
                "metrics": [
                    [ "RobotOrchestra", "AIPromptGenerationFailures", { "stat": "Sum", "period": 2628000 } ],
                    [ ".", "FallbackPromptUsage", { "stat": "Sum", "period": 2628000 } ],
                    [ ".", "RobotResponseFallbacks", { "stat": "Sum", "period": 2628000 } ]
                ],
                "view": "singleValue",
                "region": "us-east-1",
                "title": "Monthly Fallback Usage",
                "period": 300
            }
        },
        {
            "type": "log",
            "x": 0,
            "y": 19,
            "width": 24,
            "height": 6,
            "properties": {
                "query": "SOURCE '/aws/lambda/robot-orchestra-match-service'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20",
                "region": "us-east-1",
                "stacked": false,
                "view": "table",
                "title": "Recent Errors"
            }
        }
    ]
}
EOF
)

# Create the dashboard
aws cloudwatch put-dashboard \
    --dashboard-name "$DASHBOARD_NAME" \
    --dashboard-body "$DASHBOARD_BODY" \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo "✅ Dashboard created successfully!"
    echo ""
    echo "🔗 View your dashboard at:"
    echo "https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=${DASHBOARD_NAME}"
    echo ""
    echo "📊 Dashboard includes:"
    echo "  - AI Prompt Generation metrics"
    echo "  - Match Activity tracking"
    echo "  - Robot Response metrics"
    echo "  - Error monitoring"
    echo "  - Lambda performance metrics"
    echo "  - Recent error logs"
else
    echo "❌ Failed to create dashboard"
fi