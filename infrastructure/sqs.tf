# SQS Infrastructure for RobotOrchestra
# Handles async robot response generation

############################
# SQS Queues
############################

# Main queue for robot response requests
resource "aws_sqs_queue" "robot_responses" {
  name                       = "${local.project_name}-robot-responses"
  visibility_timeout_seconds = 180  # 3 minutes - must be longer than Lambda timeout
  message_retention_seconds  = 86400  # 24 hours
  receive_wait_time_seconds  = 20     # Long polling
  
  # Redrive policy to send failed messages to DLQ
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.robot_responses_dlq.arn
    maxReceiveCount     = 3
  })
  
  tags = local.tags
}

# Dead letter queue for failed robot response requests
resource "aws_sqs_queue" "robot_responses_dlq" {
  name                      = "${local.project_name}-robot-responses-dlq"
  message_retention_seconds = 1209600  # 14 days
  
  tags = local.tags
}

# Queue for state update notifications from robot-worker to match-service
resource "aws_sqs_queue" "state_updates" {
  name                       = "${local.project_name}-state-updates"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 86400  # 1 day
  receive_wait_time_seconds  = 0      # Short polling for quick state updates
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.state_updates_dlq.arn
    maxReceiveCount     = 3
  })
  
  tags = local.tags
}

# Dead letter queue for failed state updates
resource "aws_sqs_queue" "state_updates_dlq" {
  name                      = "${local.project_name}-state-updates-dlq"
  message_retention_seconds = 604800  # 7 days
  
  tags = local.tags
}

############################
# IAM Policies
############################

# Policy for Lambda to send messages to SQS
resource "aws_iam_policy" "sqs_send" {
  name = "${local.project_name}-sqs-send"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.robot_responses.arn
      }
    ]
  })
  
  tags = local.tags
}

# Policy for Lambda to receive and delete messages from SQS
resource "aws_iam_policy" "sqs_receive" {
  name = "${local.project_name}-sqs-receive"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.robot_responses.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.robot_responses_dlq.arn
      }
    ]
  })
  
  tags = local.tags
}

# Policy for robot-worker to send state updates
resource "aws_iam_policy" "state_update_send" {
  name = "${local.project_name}-state-update-send"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.state_updates.arn
      }
    ]
  })
  
  tags = local.tags
}

# Policy for match-service to receive state updates
resource "aws_iam_policy" "state_update_receive" {
  name = "${local.project_name}-state-update-receive"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.state_updates.arn
      }
    ]
  })
  
  tags = local.tags
}

############################
# Outputs
############################

output "robot_responses_queue_url" {
  description = "URL of the robot responses SQS queue"
  value       = aws_sqs_queue.robot_responses.url
}

output "robot_responses_queue_arn" {
  description = "ARN of the robot responses SQS queue"
  value       = aws_sqs_queue.robot_responses.arn
}

output "robot_responses_dlq_url" {
  description = "URL of the robot responses dead letter queue"
  value       = aws_sqs_queue.robot_responses_dlq.url
}

output "state_updates_queue_url" {
  description = "URL of the state updates SQS queue"
  value       = aws_sqs_queue.state_updates.url
}

output "state_updates_queue_arn" {
  description = "ARN of the state updates SQS queue"
  value       = aws_sqs_queue.state_updates.arn
}