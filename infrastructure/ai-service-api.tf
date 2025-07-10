# AI Service Lambda Function
resource "aws_lambda_function" "ai_service" {
  function_name = "${var.project_name}-ai-service"
  role          = aws_iam_role.ai_service_lambda_role.arn
  handler       = "handlers/ai-service.handler"
  runtime       = "nodejs20.x"
  timeout       = 30  # AI requests can take longer
  memory_size   = 512 # More memory for AI processing

  filename         = "ai-service-placeholder.zip"
  source_code_hash = filebase64sha256("ai-service-placeholder.zip")

  environment {
    variables = {
      NODE_OPTIONS = "--enable-source-maps"
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# IAM Role for AI Service Lambda
resource "aws_iam_role" "ai_service_lambda_role" {
  name = "${var.project_name}-ai-service-lambda-role"

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
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "ai_service_lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.ai_service_lambda_role.name
}

# Bedrock access policy
resource "aws_iam_role_policy" "ai_service_bedrock_policy" {
  name = "${var.project_name}-ai-service-bedrock-policy"
  role = aws_iam_role.ai_service_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-opus-20240229-v1:0",
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
        ]
      }
    ]
  })
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "ai_service_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.match_api.execution_arn}/*/*"
}

# API Gateway Resource for AI Service
resource "aws_api_gateway_resource" "ai" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  parent_id   = aws_api_gateway_rest_api.match_api.root_resource_id
  path_part   = "ai"
}

resource "aws_api_gateway_resource" "ai_generate" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  parent_id   = aws_api_gateway_resource.ai.id
  path_part   = "generate"
}

# POST /ai/generate
resource "aws_api_gateway_method" "ai_generate_post" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.ai_generate.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "ai_generate_post" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.ai_generate.id
  http_method = aws_api_gateway_method.ai_generate_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.ai_service.invoke_arn
}

# OPTIONS /ai/generate (for CORS)
resource "aws_api_gateway_method" "ai_generate_options" {
  rest_api_id   = aws_api_gateway_rest_api.match_api.id
  resource_id   = aws_api_gateway_resource.ai_generate.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "ai_generate_options" {
  rest_api_id = aws_api_gateway_rest_api.match_api.id
  resource_id = aws_api_gateway_resource.ai_generate.id
  http_method = aws_api_gateway_method.ai_generate_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.ai_service.invoke_arn
}

# Output the Lambda function name for deployment script
output "ai_service_lambda_name" {
  value = aws_lambda_function.ai_service.function_name
}