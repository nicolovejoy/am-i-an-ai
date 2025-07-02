# AmIAnAI v2 - Simplified 2H+2AI Infrastructure
# DynamoDB + WebSocket API + Lambda (No VPC, No RDS)

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

locals {
  project_name = "amianai-v2"
  
  tags = {
    Project     = local.project_name
    Environment = "production"
    Version     = "2.0"
    Purpose     = "2H+2AI-real-time-conversations"
  }
}

############################
# DynamoDB Table
############################

resource "aws_dynamodb_table" "sessions" {
  name           = "${local.project_name}-sessions"
  billing_mode   = "PAY_PER_REQUEST"  # Serverless pricing
  hash_key       = "sessionId"
  range_key      = "connectionId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  attribute {
    name = "connectionId"
    type = "S"
  }

  # TTL for automatic session cleanup
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = local.tags
}

############################
# Lambda Function
############################

# IAM role for Lambda
resource "aws_iam_role" "websocket_lambda" {
  name = "${local.project_name}-websocket-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

# Lambda basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.websocket_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB access policy
resource "aws_iam_policy" "dynamodb_access" {
  name = "${local.project_name}-dynamodb-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.sessions.arn
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.websocket_lambda.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# API Gateway Management policy for WebSocket
resource "aws_iam_policy" "apigateway_management" {
  name = "${local.project_name}-apigateway-management"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "execute-api:ManageConnections"
        ]
        Resource = "arn:aws:execute-api:${var.aws_region}:*:*/@connections/*"
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_apigateway" {
  role       = aws_iam_role.websocket_lambda.name
  policy_arn = aws_iam_policy.apigateway_management.arn
}

# Lambda function
resource "aws_lambda_function" "websocket" {
  function_name = "${local.project_name}-websocket"
  role          = aws_iam_role.websocket_lambda.arn
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  # Placeholder code - will be replaced by deployment script
  filename         = "websocket-placeholder.zip"
  source_code_hash = data.archive_file.websocket_placeholder.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.sessions.name
    }
  }

  tags = local.tags
}

# Create placeholder Lambda deployment package
data "archive_file" "websocket_placeholder" {
  type        = "zip"
  output_path = "websocket-placeholder.zip"
  
  source {
    content = jsonencode({
      exports = {
        handler = "async (event) => ({ statusCode: 200, body: JSON.stringify({ message: 'Placeholder WebSocket Lambda' }) })"
      }
    })
    filename = "index.js"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "websocket_logs" {
  name              = "/aws/lambda/${local.project_name}-websocket"
  retention_in_days = 7
  tags              = local.tags
}

############################
# WebSocket API Gateway
############################

resource "aws_apigatewayv2_api" "websocket" {
  name                       = "${local.project_name}-websocket-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"

  tags = local.tags
}

# Lambda integration
resource "aws_apigatewayv2_integration" "websocket_lambda" {
  api_id             = aws_apigatewayv2_api.websocket.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.websocket.invoke_arn
}

# Routes
resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_lambda.id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_lambda.id}"
}

resource "aws_apigatewayv2_route" "message" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "message"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_lambda.id}"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_lambda.id}"
}

# Deployment
resource "aws_apigatewayv2_deployment" "websocket" {
  api_id = aws_apigatewayv2_api.websocket.id

  depends_on = [
    aws_apigatewayv2_route.connect,
    aws_apigatewayv2_route.disconnect,
    aws_apigatewayv2_route.message,
    aws_apigatewayv2_route.default
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id        = aws_apigatewayv2_api.websocket.id
  deployment_id = aws_apigatewayv2_deployment.websocket.id
  name          = "prod"

  tags = local.tags
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "websocket_apigateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.websocket.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

############################
# Outputs
############################

output "websocket_url" {
  description = "WebSocket API Gateway URL"
  value       = "${aws_apigatewayv2_api.websocket.api_endpoint}/prod"
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.sessions.name
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.websocket.function_name
}