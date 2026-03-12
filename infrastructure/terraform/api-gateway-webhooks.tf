# API Gateway for regulatory announcement webhooks
resource "aws_api_gateway_rest_api" "announcement_webhooks" {
  name        = "lotus-pil-announcement-webhooks-${var.environment}"
  description = "Webhook endpoints for TFDA, FDA Thailand, DAV announcements"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "Announcement Webhooks API"
    Environment = var.environment
  }
}

# /announcements resource
resource "aws_api_gateway_resource" "announcements" {
  rest_api_id = aws_api_gateway_rest_api.announcement_webhooks.id
  parent_id   = aws_api_gateway_rest_api.announcement_webhooks.root_resource_id
  path_part   = "announcements"
}

# /announcements/webhook resource
resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.announcement_webhooks.id
  parent_id   = aws_api_gateway_resource.announcements.id
  path_part   = "webhook"
}

# POST /announcements/webhook method
resource "aws_api_gateway_method" "webhook_post" {
  rest_api_id   = aws_api_gateway_rest_api.announcement_webhooks.id
  resource_id   = aws_api_gateway_resource.webhook.id
  http_method   = "POST"
  authorization = "NONE" # Webhooks from regulatory authorities don't use OAuth

  request_parameters = {
    "method.request.header.X-Webhook-Signature" = false
  }
}

# Integration with ECS backend service
resource "aws_api_gateway_integration" "webhook_integration" {
  rest_api_id = aws_api_gateway_rest_api.announcement_webhooks.id
  resource_id = aws_api_gateway_resource.webhook.id
  http_method = aws_api_gateway_method.webhook_post.http_method

  integration_http_method = "POST"
  type                    = "HTTP_PROXY"
  uri                     = "http://${aws_lb.backend.dns_name}/api/v1/announcements/webhook"

  request_templates = {
    "application/json" = jsonencode({
      body = "$input.body"
    })
  }
}

# Method response
resource "aws_api_gateway_method_response" "webhook_200" {
  rest_api_id = aws_api_gateway_rest_api.announcement_webhooks.id
  resource_id = aws_api_gateway_resource.webhook.id
  http_method = aws_api_gateway_method.webhook_post.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

# Integration response
resource "aws_api_gateway_integration_response" "webhook_200" {
  rest_api_id = aws_api_gateway_rest_api.announcement_webhooks.id
  resource_id = aws_api_gateway_resource.webhook.id
  http_method = aws_api_gateway_method.webhook_post.http_method
  status_code = aws_api_gateway_method_response.webhook_200.status_code

  depends_on = [aws_api_gateway_integration.webhook_integration]
}

# Deployment
resource "aws_api_gateway_deployment" "announcement_webhooks" {
  rest_api_id = aws_api_gateway_rest_api.announcement_webhooks.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.webhook.id,
      aws_api_gateway_method.webhook_post.id,
      aws_api_gateway_integration.webhook_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.webhook_integration
  ]
}

# Stage
resource "aws_api_gateway_stage" "announcement_webhooks" {
  deployment_id = aws_api_gateway_deployment.announcement_webhooks.id
  rest_api_id   = aws_api_gateway_rest_api.announcement_webhooks.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name        = "Announcement Webhooks Stage"
    Environment = var.environment
  }
}

# CloudWatch Logs for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/announcement-webhooks-${var.environment}"
  retention_in_days = 90

  tags = {
    Name        = "API Gateway Logs"
    Environment = var.environment
  }
}

# Usage plan for rate limiting
resource "aws_api_gateway_usage_plan" "announcement_webhooks" {
  name = "announcement-webhooks-${var.environment}"

  api_stages {
    api_id = aws_api_gateway_rest_api.announcement_webhooks.id
    stage  = aws_api_gateway_stage.announcement_webhooks.stage_name
  }

  quota_settings {
    limit  = 10000
    period = "DAY"
  }

  throttle_settings {
    burst_limit = 100
    rate_limit  = 50
  }
}

# Output webhook URL
output "announcement_webhook_url" {
  value       = "${aws_api_gateway_stage.announcement_webhooks.invoke_url}/announcements/webhook"
  description = "Webhook URL for regulatory announcements"
}