# Comprehensive Match API Gateway and Lambda Functions
# Handles match creation, management, and history via unified REST API

############################
# REST API Gateway for All Match Operations
############################

# REST API Gateway
resource "aws_api_gateway_rest_api" "match_api" {
  name        = "${local.project_name}-match-api"
  description = "Unified REST API for match operations - create, manage, and view history"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.tags
}

# API Gateway resource for /matches
resource "aws_api_gateway_resource" "matches" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  parent_id   = aws_api_gateway_rest_api.match_api.root_resource_id
  path_part   = "matches"
}

# API Gateway resource for /matches/history
resource "aws_api_gateway_resource" "matches_history" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  parent_id   = aws_api_gateway_resource.matches.id
  path_part   = "history"
}

# API Gateway resource for /matches/{matchId}
resource "aws_api_gateway_resource" "match_by_id" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  parent_id   = aws_api_gateway_resource.matches.id
  path_part   = "{matchId}"
}

# API Gateway resource for /matches/{matchId}/responses
resource "aws_api_gateway_resource" "match_responses" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  parent_id   = aws_api_gateway_resource.match_by_id.id
  path_part   = "responses"
}

# API Gateway resource for /matches/{matchId}/votes
resource "aws_api_gateway_resource" "match_votes" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  parent_id   = aws_api_gateway_resource.match_by_id.id
  path_part   = "votes"
}

############################
# API Gateway Methods
############################

# GET /matches/history - Match History
resource "aws_api_gateway_method" "get_matches_history" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.matches_history.id
  http_method   = "GET"
  authorization = "NONE"
}

# POST /matches - Create Match
resource "aws_api_gateway_method" "post_matches" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.matches.id
  http_method   = "POST"
  authorization = "NONE"
}

# GET /matches/{matchId} - Get Match
resource "aws_api_gateway_method" "get_match" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.match_by_id.id
  http_method   = "GET"
  authorization = "NONE"
}

# POST /matches/{matchId}/responses - Submit Response
resource "aws_api_gateway_method" "post_responses" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.match_responses.id
  http_method   = "POST"
  authorization = "NONE"
}

# POST /matches/{matchId}/votes - Submit Vote
resource "aws_api_gateway_method" "post_votes" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.match_votes.id
  http_method   = "POST"
  authorization = "NONE"
}

# CORS OPTIONS methods
resource "aws_api_gateway_method" "options_matches" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.matches.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "options_matches_history" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.matches_history.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "options_match" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.match_by_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "options_responses" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.match_responses.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "options_votes" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.match_votes.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

############################
# Lambda Integrations
############################

# Lambda integration for GET /matches/history -> Match History Lambda
resource "aws_api_gateway_integration" "get_matches_history_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.match_api.id
  resource_id             = aws_api_gateway_resource.matches_history.id
  http_method             = aws_api_gateway_method.get_matches_history.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.match_service.invoke_arn
}

# Lambda integration for POST /matches -> Match Service Lambda
resource "aws_api_gateway_integration" "post_matches_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.match_api.id
  resource_id             = aws_api_gateway_resource.matches.id
  http_method             = aws_api_gateway_method.post_matches.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.match_service.invoke_arn
}

# Lambda integration for GET /matches/{matchId} -> Match Service Lambda
resource "aws_api_gateway_integration" "get_match_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.match_api.id
  resource_id             = aws_api_gateway_resource.match_by_id.id
  http_method             = aws_api_gateway_method.get_match.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.match_service.invoke_arn
}

# Lambda integration for POST /matches/{matchId}/responses -> Match Service Lambda
resource "aws_api_gateway_integration" "post_responses_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.match_api.id
  resource_id             = aws_api_gateway_resource.match_responses.id
  http_method             = aws_api_gateway_method.post_responses.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.match_service.invoke_arn
}

# Lambda integration for POST /matches/{matchId}/votes -> Match Service Lambda
resource "aws_api_gateway_integration" "post_votes_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.match_api.id
  resource_id             = aws_api_gateway_resource.match_votes.id
  http_method             = aws_api_gateway_method.post_votes.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.match_service.invoke_arn
}

# CORS integrations
resource "aws_api_gateway_integration" "options_matches_cors" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.matches.id
  http_method = aws_api_gateway_method.options_matches.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_integration" "options_matches_history_cors" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.matches_history.id
  http_method = aws_api_gateway_method.options_matches_history.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_integration" "options_match_cors" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_by_id.id
  http_method = aws_api_gateway_method.options_match.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_integration" "options_responses_cors" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_responses.id
  http_method = aws_api_gateway_method.options_responses.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_integration" "options_votes_cors" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_votes.id
  http_method = aws_api_gateway_method.options_votes.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

############################
# Method Responses
############################

# GET /matches/history responses
resource "aws_api_gateway_method_response" "get_matches_history_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.matches_history.id
  http_method = aws_api_gateway_method.get_matches_history.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# POST /matches responses
resource "aws_api_gateway_method_response" "post_matches_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.matches.id
  http_method = aws_api_gateway_method.post_matches.http_method
  status_code = "201"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# GET /matches/{matchId} responses
resource "aws_api_gateway_method_response" "get_match_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_by_id.id
  http_method = aws_api_gateway_method.get_match.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# POST responses and votes
resource "aws_api_gateway_method_response" "post_responses_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_responses.id
  http_method = aws_api_gateway_method.post_responses.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_method_response" "post_votes_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_votes.id
  http_method = aws_api_gateway_method.post_votes.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# CORS responses
resource "aws_api_gateway_method_response" "options_matches_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.matches.id
  http_method = aws_api_gateway_method.options_matches.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method_response" "options_matches_history_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.matches_history.id
  http_method = aws_api_gateway_method.options_matches_history.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method_response" "options_match_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_by_id.id
  http_method = aws_api_gateway_method.options_match.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method_response" "options_responses_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_responses.id
  http_method = aws_api_gateway_method.options_responses.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method_response" "options_votes_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_votes.id
  http_method = aws_api_gateway_method.options_votes.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

############################
# Integration Responses
############################

# Lambda integration responses
resource "aws_api_gateway_integration_response" "get_matches_history_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.matches_history.id
  http_method = aws_api_gateway_method.get_matches_history.http_method
  status_code = aws_api_gateway_method_response.get_matches_history_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.get_matches_history_lambda]
}

resource "aws_api_gateway_integration_response" "post_matches_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.matches.id
  http_method = aws_api_gateway_method.post_matches.http_method
  status_code = aws_api_gateway_method_response.post_matches_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.post_matches_lambda]
}

resource "aws_api_gateway_integration_response" "get_match_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_by_id.id
  http_method = aws_api_gateway_method.get_match.http_method
  status_code = aws_api_gateway_method_response.get_match_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.get_match_lambda]
}

resource "aws_api_gateway_integration_response" "post_responses_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_responses.id
  http_method = aws_api_gateway_method.post_responses.http_method
  status_code = aws_api_gateway_method_response.post_responses_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.post_responses_lambda]
}

resource "aws_api_gateway_integration_response" "post_votes_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_votes.id
  http_method = aws_api_gateway_method.post_votes.http_method
  status_code = aws_api_gateway_method_response.post_votes_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.post_votes_lambda]
}

# CORS integration responses
resource "aws_api_gateway_integration_response" "options_matches_cors_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.matches.id
  http_method = aws_api_gateway_method.options_matches.http_method
  status_code = aws_api_gateway_method_response.options_matches_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options_matches_cors]
}

resource "aws_api_gateway_integration_response" "options_matches_history_cors_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.matches_history.id
  http_method = aws_api_gateway_method.options_matches_history.http_method
  status_code = aws_api_gateway_method_response.options_matches_history_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options_matches_history_cors]
}

resource "aws_api_gateway_integration_response" "options_match_cors_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_by_id.id
  http_method = aws_api_gateway_method.options_match.http_method
  status_code = aws_api_gateway_method_response.options_match_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options_match_cors]
}

resource "aws_api_gateway_integration_response" "options_responses_cors_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_responses.id
  http_method = aws_api_gateway_method.options_responses.http_method
  status_code = aws_api_gateway_method_response.options_responses_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options_responses_cors]
}

resource "aws_api_gateway_integration_response" "options_votes_cors_response" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.match_votes.id
  http_method = aws_api_gateway_method.options_votes.http_method
  status_code = aws_api_gateway_method_response.options_votes_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options_votes_cors]
}

############################
# API Gateway Deployment
############################

resource "aws_api_gateway_deployment" "match_api" {
  depends_on = [
    aws_api_gateway_integration.get_matches_history_lambda,
    aws_api_gateway_integration.post_matches_lambda,
    aws_api_gateway_integration.get_match_lambda,
    aws_api_gateway_integration.post_responses_lambda,
    aws_api_gateway_integration.post_votes_lambda,
    aws_api_gateway_integration.options_matches_cors,
    aws_api_gateway_integration.options_matches_history_cors,
    aws_api_gateway_integration.options_match_cors,
    aws_api_gateway_integration.options_responses_cors,
    aws_api_gateway_integration.options_votes_cors,
    aws_api_gateway_integration_response.get_matches_history_response,
    aws_api_gateway_integration_response.post_matches_response,
    aws_api_gateway_integration_response.get_match_response,
    aws_api_gateway_integration_response.post_responses_response,
    aws_api_gateway_integration_response.post_votes_response,
    aws_api_gateway_integration_response.options_matches_cors_response,
    aws_api_gateway_integration_response.options_matches_history_cors_response,
    aws_api_gateway_integration_response.options_match_cors_response,
    aws_api_gateway_integration_response.options_responses_cors_response,
    aws_api_gateway_integration_response.options_votes_cors_response
  ]

  rest_api_id = aws_api_gateway_rest_api.match_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.matches.id,
      aws_api_gateway_resource.matches_history.id,
      aws_api_gateway_resource.match_by_id.id,
      aws_api_gateway_resource.match_responses.id,
      aws_api_gateway_resource.match_votes.id,
      aws_api_gateway_method.get_matches_history.id,
      aws_api_gateway_method.post_matches.id,
      aws_api_gateway_method.get_match.id,
      aws_api_gateway_method.post_responses.id,
      aws_api_gateway_method.post_votes.id,
      aws_api_gateway_integration.get_matches_history_lambda.id,
      aws_api_gateway_integration.post_matches_lambda.id,
      aws_api_gateway_integration.get_match_lambda.id,
      aws_api_gateway_integration.post_responses_lambda.id,
      aws_api_gateway_integration.post_votes_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway stage
resource "aws_api_gateway_stage" "match_api_prod" {
  deployment_id = aws_api_gateway_deployment.match_api.id
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  stage_name    = "prod"

  tags = local.tags
}

############################
# Match History Lambda Function
# REMOVED: Functionality merged into match-service
# To remove these resources from your infrastructure:
# 1. Run: terraform state rm aws_lambda_function.match_history
# 2. Run: terraform state rm aws_iam_role.match_history_lambda
# 3. Run: terraform state rm aws_iam_role_policy_attachment.match_history_lambda_basic
# 4. Run: terraform state rm aws_iam_role_policy_attachment.match_history_lambda_dynamodb
# 5. Run: terraform state rm aws_cloudwatch_log_group.match_history_logs
# 6. Run: terraform state rm aws_lambda_permission.match_history_apigateway
# Then run terraform apply
############################

/*
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
# Removed - VPC not needed without Kafka
# resource "aws_iam_role_policy_attachment" "match_history_lambda_vpc" {
#   role       = aws_iam_role.match_history_lambda.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
# }

# Removed - Kafka access policy
# resource "aws_iam_role_policy_attachment" "match_history_lambda_kafka" {
#   role       = aws_iam_role.match_history_lambda.name
#   policy_arn = aws_iam_policy.kafka_access.arn
# }

# Attach DynamoDB policy to match history Lambda
resource "aws_iam_role_policy_attachment" "match_history_lambda_dynamodb" {
  role       = aws_iam_role.match_history_lambda.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
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
  handler       = "match-history.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 512

  # VPC configuration for Kafka access
  # Removed - VPC configuration for Kafka access
  # vpc_config {
  #   subnet_ids         = aws_subnet.kafka_private[*].id
  #   security_group_ids = [aws_security_group.kafka_lambda.id]
  # }

  # Placeholder code - will be replaced by deployment script
  filename         = "match-history-placeholder.zip"
  source_code_hash = data.archive_file.match_history_placeholder.output_base64sha256

  environment {
    variables = {
      # Removed - Kafka environment variables
      # KAFKA_BOOTSTRAP_SERVERS = aws_msk_serverless_cluster.main.bootstrap_brokers_sasl_iam
      # KAFKA_TOPIC = "match-events"
      NODE_ENV = "production"
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.matches.name
      SQS_QUEUE_URL = aws_sqs_queue.robot_responses.url
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.match_history_logs,
    aws_iam_role_policy_attachment.match_history_lambda_basic,
    # Removed - VPC and Kafka dependencies
    # aws_iam_role_policy_attachment.match_history_lambda_vpc,
    # aws_iam_role_policy_attachment.match_history_lambda_kafka
    aws_iam_role_policy_attachment.match_history_lambda_dynamodb
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
*/

############################
# Match Service Lambda Function
############################

# IAM role for Match Service Lambda
resource "aws_iam_role" "match_service_lambda" {
  name = "${local.project_name}-match-service-lambda"

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
resource "aws_iam_role_policy_attachment" "match_service_lambda_basic" {
  role       = aws_iam_role.match_service_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# VPC access for Kafka connectivity
# Removed - VPC not needed without Kafka
# resource "aws_iam_role_policy_attachment" "match_service_lambda_vpc" {
#   role       = aws_iam_role.match_service_lambda.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
# }

# Removed - Kafka access policy
# resource "aws_iam_role_policy_attachment" "match_service_lambda_kafka" {
#   role       = aws_iam_role.match_service_lambda.name
#   policy_arn = aws_iam_policy.kafka_access.arn
# }

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
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.matches.arn
      }
    ]
  })
  
  tags = local.tags
}

# Attach DynamoDB policy to match service Lambda
resource "aws_iam_role_policy_attachment" "match_service_lambda_dynamodb" {
  role       = aws_iam_role.match_service_lambda.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# Attach SQS send policy to match service Lambda
resource "aws_iam_role_policy_attachment" "match_service_lambda_sqs" {
  role       = aws_iam_role.match_service_lambda.name
  policy_arn = aws_iam_policy.sqs_send.arn
}

# Attach state update receive policy to match service
resource "aws_iam_role_policy_attachment" "match_service_state_update_receive" {
  role       = aws_iam_role.match_service_lambda.name
  policy_arn = aws_iam_policy.state_update_receive.arn
}

# CloudWatch Log Group for Match Service Lambda
resource "aws_cloudwatch_log_group" "match_service_logs" {
  name              = "/aws/lambda/${local.project_name}-match-service"
  retention_in_days = 7
  tags              = local.tags
}

# Lambda function for match service
resource "aws_lambda_function" "match_service" {
  function_name = "${local.project_name}-match-service"
  role          = aws_iam_role.match_service_lambda.arn
  handler       = "match-service.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 512

  # VPC configuration for Kafka access
  # Removed - VPC configuration for Kafka access
  # vpc_config {
  #   subnet_ids         = aws_subnet.kafka_private[*].id
  #   security_group_ids = [aws_security_group.kafka_lambda.id]
  # }

  # Placeholder code - will be replaced by deployment script
  filename         = "match-service-placeholder.zip"
  source_code_hash = data.archive_file.match_service_placeholder.output_base64sha256

  environment {
    variables = {
      # Removed - Kafka environment variables
      # KAFKA_BOOTSTRAP_SERVERS = aws_msk_serverless_cluster.main.bootstrap_brokers_sasl_iam
      # KAFKA_TOPIC = "match-events"
      NODE_ENV = "production"
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.matches.name
      SQS_QUEUE_URL = aws_sqs_queue.robot_responses.url
      AI_SERVICE_FUNCTION_NAME = aws_lambda_function.ai_service.function_name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.match_service_logs,
    aws_iam_role_policy_attachment.match_service_lambda_basic,
    # Removed - VPC and Kafka dependencies
    # aws_iam_role_policy_attachment.match_service_lambda_vpc,
    # aws_iam_role_policy_attachment.match_service_lambda_kafka
    aws_iam_role_policy_attachment.match_service_lambda_dynamodb,
    aws_iam_role_policy_attachment.match_service_lambda_sqs,
    aws_iam_role_policy_attachment.match_service_state_update_receive,
    aws_iam_role_policy_attachment.match_service_lambda_invoke_ai
  ]

  tags = local.tags
}

# Create placeholder Lambda deployment package for match service
data "archive_file" "match_service_placeholder" {
  type        = "zip"
  output_path = "match-service-placeholder.zip"
  
  source {
    content = jsonencode({
      exports = {
        handler = "async (event) => ({ statusCode: 200, body: JSON.stringify({ message: 'Match Service API - Create and manage matches', timestamp: Date.now() }) })"
      }
    })
    filename = "index.js"
  }
}

# Lambda permissions for API Gateway

resource "aws_lambda_permission" "match_service_apigateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.match_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.match_api.execution_arn}/*/*"
}

# Policy for match service to invoke AI service
resource "aws_iam_policy" "match_service_invoke_ai_service" {
  name = "${local.project_name}-match-service-invoke-ai-service"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.ai_service.arn
      }
    ]
  })
  
  tags = local.tags
}

# Attach AI service invoke policy to match service Lambda
resource "aws_iam_role_policy_attachment" "match_service_lambda_invoke_ai" {
  role       = aws_iam_role.match_service_lambda.name
  policy_arn = aws_iam_policy.match_service_invoke_ai_service.arn
}

############################
# Robot Worker Lambda
############################

# IAM role for robot worker Lambda
resource "aws_iam_role" "robot_worker_lambda" {
  name = "${local.project_name}-robot-worker-lambda"

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
resource "aws_iam_role_policy_attachment" "robot_worker_lambda_basic" {
  role       = aws_iam_role.robot_worker_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach DynamoDB policy to robot worker Lambda
resource "aws_iam_role_policy_attachment" "robot_worker_lambda_dynamodb" {
  role       = aws_iam_role.robot_worker_lambda.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# Attach SQS receive policy to robot worker Lambda
resource "aws_iam_role_policy_attachment" "robot_worker_lambda_sqs" {
  role       = aws_iam_role.robot_worker_lambda.name
  policy_arn = aws_iam_policy.sqs_receive.arn
}

# Policy for robot worker to invoke AI service
resource "aws_iam_policy" "robot_worker_invoke_ai_service" {
  name = "${local.project_name}-robot-worker-invoke-ai-service"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.ai_service.arn
      }
    ]
  })
  
  tags = local.tags
}

# Attach AI service invoke policy to robot worker Lambda
resource "aws_iam_role_policy_attachment" "robot_worker_lambda_invoke_ai" {
  role       = aws_iam_role.robot_worker_lambda.name
  policy_arn = aws_iam_policy.robot_worker_invoke_ai_service.arn
}

# Attach state update send policy to robot worker
resource "aws_iam_role_policy_attachment" "robot_worker_state_update_send" {
  role       = aws_iam_role.robot_worker_lambda.name
  policy_arn = aws_iam_policy.state_update_send.arn
}

# CloudWatch Log Group for Robot Worker Lambda
resource "aws_cloudwatch_log_group" "robot_worker_logs" {
  name              = "/aws/lambda/${local.project_name}-robot-worker"
  retention_in_days = 7
  tags              = local.tags
}

# Lambda function for robot worker
resource "aws_lambda_function" "robot_worker" {
  function_name = "${local.project_name}-robot-worker"
  role          = aws_iam_role.robot_worker_lambda.arn
  handler       = "robot-worker.handler"
  runtime       = "nodejs20.x"
  timeout       = 120  # 2 minutes for AI processing
  memory_size   = 512

  # Placeholder code - will be replaced by deployment script
  filename         = "robot-worker-placeholder.zip"
  source_code_hash = data.archive_file.robot_worker_placeholder.output_base64sha256

  environment {
    variables = {
      NODE_ENV = "production"
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.matches.name
      AI_SERVICE_FUNCTION_NAME = aws_lambda_function.ai_service.function_name
      STATE_UPDATE_QUEUE_URL = aws_sqs_queue.state_updates.url
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.robot_worker_logs,
    aws_iam_role_policy_attachment.robot_worker_lambda_basic,
    aws_iam_role_policy_attachment.robot_worker_lambda_dynamodb,
    aws_iam_role_policy_attachment.robot_worker_lambda_sqs,
    aws_iam_role_policy_attachment.robot_worker_lambda_invoke_ai,
    aws_iam_role_policy_attachment.robot_worker_state_update_send
  ]

  tags = local.tags
}

# Create placeholder Lambda deployment package for robot worker
data "archive_file" "robot_worker_placeholder" {
  type        = "zip"
  output_path = "robot-worker-placeholder.zip"
  
  source {
    content  = "exports.handler = async () => ({ statusCode: 200, body: 'Robot Worker Placeholder' })"
    filename = "index.js"
  }
}

# SQS event source mapping for robot worker
resource "aws_lambda_event_source_mapping" "robot_worker_sqs" {
  event_source_arn = aws_sqs_queue.robot_responses.arn
  function_name    = aws_lambda_function.robot_worker.function_name
  batch_size       = 1  # Process one message at a time for better error handling
}

# Event source mapping for match-service to receive state updates
resource "aws_lambda_event_source_mapping" "match_service_state_updates" {
  event_source_arn = aws_sqs_queue.state_updates.arn
  function_name    = aws_lambda_function.match_service.function_name
  batch_size       = 10  # Process multiple state updates together
}

# Lambda permission for SQS to invoke match-service
resource "aws_lambda_permission" "match_service_sqs" {
  statement_id  = "AllowExecutionFromSQS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.match_service.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.state_updates.arn
}

############################
# Outputs
############################

output "match_api_url" {
  description = "Match API Gateway URL"
  value       = "${aws_api_gateway_rest_api.match_api.execution_arn}/prod"
}

/*
output "match_history_lambda_name" {
  description = "Match History Lambda function name"
  value       = aws_lambda_function.match_history.function_name
}
*/

output "match_service_lambda_name" {
  description = "Match Service Lambda function name"
  value       = aws_lambda_function.match_service.function_name
}

output "robot_worker_lambda_name" {
  description = "Robot Worker Lambda function name"
  value       = aws_lambda_function.robot_worker.function_name
}

############################
# Admin Service Resources
############################

# API Gateway resource for /admin
resource "aws_api_gateway_resource" "admin" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  parent_id   = aws_api_gateway_rest_api.match_api.root_resource_id
  path_part   = "admin"
}

# API Gateway resource for /admin/matches
resource "aws_api_gateway_resource" "admin_matches" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "matches"
}

# API Gateway resource for /admin/stats
resource "aws_api_gateway_resource" "admin_stats" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "stats"
}

# DELETE /admin/matches - Delete all matches
resource "aws_api_gateway_method" "delete_admin_matches" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.admin_matches.id
  http_method   = "DELETE"
  authorization = "NONE"
}

# GET /admin/stats - Get statistics
resource "aws_api_gateway_method" "get_admin_stats" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.admin_stats.id
  http_method   = "GET"
  authorization = "NONE"
}

# CORS OPTIONS for /admin/matches
resource "aws_api_gateway_method" "options_admin_matches" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.admin_matches.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# CORS OPTIONS for /admin/stats
resource "aws_api_gateway_method" "options_admin_stats" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.admin_stats.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Integration for DELETE /admin/matches
resource "aws_api_gateway_integration" "delete_admin_matches" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.admin_matches.id
  http_method = aws_api_gateway_method.delete_admin_matches.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.admin_service.invoke_arn
}

# Integration for GET /admin/stats
resource "aws_api_gateway_integration" "get_admin_stats" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.admin_stats.id
  http_method = aws_api_gateway_method.get_admin_stats.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.admin_service.invoke_arn
}

# CORS integration for /admin/matches
resource "aws_api_gateway_integration" "options_admin_matches" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.admin_matches.id
  http_method = aws_api_gateway_method.options_admin_matches.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_admin_matches" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.admin_matches.id
  http_method = aws_api_gateway_method.options_admin_matches.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_admin_matches" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.admin_matches.id
  http_method = aws_api_gateway_method.options_admin_matches.http_method
  status_code = aws_api_gateway_method_response.options_admin_matches.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS integration for /admin/stats
resource "aws_api_gateway_integration" "options_admin_stats" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.admin_stats.id
  http_method = aws_api_gateway_method.options_admin_stats.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_admin_stats" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.admin_stats.id
  http_method = aws_api_gateway_method.options_admin_stats.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_admin_stats" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.admin_stats.id
  http_method = aws_api_gateway_method.options_admin_stats.http_method
  status_code = aws_api_gateway_method_response.options_admin_stats.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

############################
# Admin Service Lambda
############################

# IAM role for Admin Service Lambda
resource "aws_iam_role" "admin_service_lambda" {
  name = "${local.project_name}-admin-service-lambda"

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
resource "aws_iam_role_policy_attachment" "admin_service_lambda_basic" {
  role       = aws_iam_role.admin_service_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach DynamoDB policy to admin service Lambda
resource "aws_iam_role_policy_attachment" "admin_service_lambda_dynamodb" {
  role       = aws_iam_role.admin_service_lambda.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# CloudWatch Log Group for Admin Service Lambda
resource "aws_cloudwatch_log_group" "admin_service_logs" {
  name              = "/aws/lambda/${local.project_name}-admin-service"
  retention_in_days = 7
  tags              = local.tags
}

# Admin Service Lambda Function
resource "aws_lambda_function" "admin_service" {
  function_name = "${local.project_name}-admin-service"
  role          = aws_iam_role.admin_service_lambda.arn
  handler       = "admin-service.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 512

  # Placeholder code - will be replaced by deployment script
  filename         = "admin-service-placeholder.zip"
  source_code_hash = data.archive_file.admin_service_placeholder.output_base64sha256

  environment {
    variables = {
      NODE_ENV = "production"
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.matches.name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.admin_service_logs,
    aws_iam_role_policy_attachment.admin_service_lambda_basic,
    aws_iam_role_policy_attachment.admin_service_lambda_dynamodb
  ]

  tags = local.tags
}

# Create placeholder Lambda deployment package for admin service
data "archive_file" "admin_service_placeholder" {
  type        = "zip"
  output_path = "admin-service-placeholder.zip"
  
  source {
    content = jsonencode({
      exports = {
        handler = "function(event, context) { return { statusCode: 200, body: 'Placeholder - deploy with deploy-lambdas.sh' }; }"
      }
    })
    filename = "admin-service.js"
  }
}

# Lambda permissions for API Gateway to invoke admin service
resource "aws_lambda_permission" "admin_service_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.match_api.execution_arn}/*/*"
}

output "match_api_endpoint" {
  description = "Match API base endpoint"
  value       = "https://${aws_api_gateway_rest_api.match_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod"
}

output "match_history_endpoint" {
  description = "Match History API endpoint (now served by match-service)"
  value       = "https://${aws_api_gateway_rest_api.match_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod/matches/history"
}

output "match_api_endpoints" {
  description = "All Match API endpoints"
  value = {
    base_url = "https://${aws_api_gateway_rest_api.match_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod"
    history = "https://${aws_api_gateway_rest_api.match_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod/matches/history"
    create_match = "https://${aws_api_gateway_rest_api.match_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod/matches"
    get_match = "https://${aws_api_gateway_rest_api.match_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod/matches/{matchId}"
    submit_response = "https://${aws_api_gateway_rest_api.match_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod/matches/{matchId}/responses"
    submit_vote = "https://${aws_api_gateway_rest_api.match_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod/matches/{matchId}/votes"
  }
}