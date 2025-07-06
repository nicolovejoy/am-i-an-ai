# Match History API Gateway and Lambda
# Serves Kafka-sourced match history via new dedicated REST API Gateway

############################
# REST API Gateway for Match History
############################

# REST API Gateway
resource "aws_api_gateway_rest_api" "match_history" {
  name        = "${local.project_name}-match-history-api"
  description = "REST API for match history from Kafka events"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.tags
}

# API Gateway resource for /matches
resource "aws_api_gateway_resource" "matches" {
  rest_api_id = aws_api_gateway_rest_api.match_history.id
  parent_id   = aws_api_gateway_rest_api.match_history.root_resource_id
  path_part   = "matches"
}

# API Gateway resource for /matches/history
resource "aws_api_gateway_resource" "matches_history" {
  rest_api_id = aws_api_gateway_rest_api.match_history.id
  parent_id   = aws_api_gateway_resource.matches.id
  path_part   = "history"
}

# API Gateway method for GET /matches/history
resource "aws_api_gateway_method" "get_matches_history" {
  rest_api_id   = aws_api_gateway_rest_api.match_history.id
  resource_id   = aws_api_gateway_resource.matches_history.id
  http_method   = "GET"
  authorization = "NONE"
}

# CORS method for OPTIONS /matches/history
resource "aws_api_gateway_method" "options_matches_history" {
  rest_api_id   = aws_api_gateway_rest_api.match_history.id
  resource_id   = aws_api_gateway_resource.matches_history.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Lambda integration for GET method
resource "aws_api_gateway_integration" "match_history_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.match_history.id
  resource_id             = aws_api_gateway_resource.matches_history.id
  http_method             = aws_api_gateway_method.get_matches_history.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.match_history.invoke_arn
}

# CORS integration for OPTIONS method
resource "aws_api_gateway_integration" "options_cors" {
  rest_api_id = aws_api_gateway_rest_api.match_history.id
  resource_id = aws_api_gateway_resource.matches_history.id
  http_method = aws_api_gateway_method.options_matches_history.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# Method response for GET
resource "aws_api_gateway_method_response" "get_matches_history_response" {
  rest_api_id = aws_api_gateway_rest_api.match_history.id
  resource_id = aws_api_gateway_resource.matches_history.id
  http_method = aws_api_gateway_method.get_matches_history.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# Method response for OPTIONS (CORS)
resource "aws_api_gateway_method_response" "options_matches_history_response" {
  rest_api_id = aws_api_gateway_rest_api.match_history.id
  resource_id = aws_api_gateway_resource.matches_history.id
  http_method = aws_api_gateway_method.options_matches_history.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# Integration response for GET
resource "aws_api_gateway_integration_response" "get_matches_history_response" {
  rest_api_id = aws_api_gateway_rest_api.match_history.id
  resource_id = aws_api_gateway_resource.matches_history.id
  http_method = aws_api_gateway_method.get_matches_history.http_method
  status_code = aws_api_gateway_method_response.get_matches_history_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.match_history_lambda]
}

# Integration response for OPTIONS (CORS)
resource "aws_api_gateway_integration_response" "options_cors_response" {
  rest_api_id = aws_api_gateway_rest_api.match_history.id
  resource_id = aws_api_gateway_resource.matches_history.id
  http_method = aws_api_gateway_method.options_matches_history.http_method
  status_code = aws_api_gateway_method_response.options_matches_history_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options_cors]
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "match_history" {
  depends_on = [
    aws_api_gateway_integration.match_history_lambda,
    aws_api_gateway_integration.options_cors,
    aws_api_gateway_integration_response.get_matches_history_response,
    aws_api_gateway_integration_response.options_cors_response
  ]

  rest_api_id = aws_api_gateway_rest_api.match_history.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.matches.id,
      aws_api_gateway_resource.matches_history.id,
      aws_api_gateway_method.get_matches_history.id,
      aws_api_gateway_integration.match_history_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway stage
resource "aws_api_gateway_stage" "match_history_prod" {
  deployment_id = aws_api_gateway_deployment.match_history.id
  rest_api_id   = aws_api_gateway_rest_api.match_history.id
  stage_name    = "prod"

  tags = local.tags
}

############################
# Match History Lambda Function
############################

# IAM role for Match History Lambda
resource "aws_iam_role" "match_history_lambda" {
  name = "${local.project_name}-match-history-lambda"

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
resource "aws_iam_role_policy_attachment" "match_history_lambda_basic" {
  role       = aws_iam_role.match_history_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# VPC access for Kafka connectivity
resource "aws_iam_role_policy_attachment" "match_history_lambda_vpc" {
  role       = aws_iam_role.match_history_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Kafka access policy
resource "aws_iam_role_policy_attachment" "match_history_lambda_kafka" {
  role       = aws_iam_role.match_history_lambda.name
  policy_arn = aws_iam_policy.kafka_access.arn
}

# CloudWatch Log Group for Match History Lambda
resource "aws_cloudwatch_log_group" "match_history_logs" {
  name              = "/aws/lambda/${local.project_name}-match-history"
  retention_in_days = 7
  tags              = local.tags
}

# Lambda function for match history
resource "aws_lambda_function" "match_history" {
  function_name = "${local.project_name}-match-history"
  role          = aws_iam_role.match_history_lambda.arn
  handler       = "match-history-consumer.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 512

  # VPC configuration for Kafka access
  vpc_config {
    subnet_ids         = aws_subnet.kafka_private[*].id
    security_group_ids = [aws_security_group.kafka_lambda.id]
  }

  # Placeholder code - will be replaced by deployment script
  filename         = "match-history-placeholder.zip"
  source_code_hash = data.archive_file.match_history_placeholder.output_base64sha256

  environment {
    variables = {
      KAFKA_BOOTSTRAP_SERVERS = aws_msk_serverless_cluster.main.bootstrap_brokers_sasl_iam
      KAFKA_TOPIC = "match-events"
      NODE_ENV = "production"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.match_history_logs,
    aws_iam_role_policy_attachment.match_history_lambda_basic,
    aws_iam_role_policy_attachment.match_history_lambda_vpc,
    aws_iam_role_policy_attachment.match_history_lambda_kafka
  ]

  tags = local.tags
}

# Create placeholder Lambda deployment package for match history
data "archive_file" "match_history_placeholder" {
  type        = "zip"
  output_path = "match-history-placeholder.zip"
  
  source {
    content = jsonencode({
      exports = {
        handler = "async (event) => ({ statusCode: 200, body: JSON.stringify({ message: 'Match History API - Phase 1 Kafka Consumer', timestamp: Date.now() }) })"
      }
    })
    filename = "index.js"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "match_history_apigateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.match_history.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.match_history.execution_arn}/*/*"
}

############################
# Outputs
############################

output "match_history_api_url" {
  description = "Match History API Gateway URL"
  value       = "${aws_api_gateway_rest_api.match_history.execution_arn}/prod"
}

output "match_history_lambda_name" {
  description = "Match History Lambda function name"
  value       = aws_lambda_function.match_history.function_name
}

output "match_history_endpoint" {
  description = "Match History API endpoint"
  value       = "https://${aws_api_gateway_rest_api.match_history.id}.execute-api.${var.aws_region}.amazonaws.com/prod/matches/history"
}