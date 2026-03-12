# S3 bucket for AI validation reports with 10-year retention
resource "aws_s3_bucket" "validation_reports" {
  bucket = "lotus-pil-validation-reports-${var.environment}"

  tags = {
    Name        = "AI Validation Reports"
    Environment = var.environment
    Compliance  = "10-year-retention"
    Purpose     = "Regulatory-Inspection"
  }
}

# Enable versioning for immutable validation reports
resource "aws_s3_bucket_versioning" "validation_reports" {
  bucket = aws_s3_bucket.validation_reports.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle policy: transition to Glacier after 90 days, retain for 10 years
resource "aws_s3_bucket_lifecycle_configuration" "validation_reports" {
  bucket = aws_s3_bucket.validation_reports.id

  rule {
    id     = "validation-report-retention-10-years"
    status = "Enabled"

    # Transition to Infrequent Access after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Transition to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Transition to Deep Archive after 1 year
    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    # Delete after 10 years (3650 days)
    expiration {
      days = 3650
    }
  }
}

# AES-256 encryption at rest using KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "validation_reports" {
  bucket = aws_s3_bucket.validation_reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.validation_reports.arn
    }
    bucket_key_enabled = true
  }
}

# KMS key for validation reports encryption
resource "aws_kms_key" "validation_reports" {
  description             = "KMS key for AI validation reports encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "Validation Reports KMS Key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "validation_reports" {
  name          = "alias/validation-reports-${var.environment}"
  target_key_id = aws_kms_key.validation_reports.key_id
}

# Block public access
resource "aws_s3_bucket_public_access_block" "validation_reports" {
  bucket = aws_s3_bucket.validation_reports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy for regulatory compliance team access
resource "aws_s3_bucket_policy" "validation_reports" {
  bucket = aws_s3_bucket.validation_reports.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowRegulatoryTeamAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.regulatory_team_role_arn
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.validation_reports.arn,
          "${aws_s3_bucket.validation_reports.arn}/*"
        ]
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.validation_reports.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# CloudWatch alarm for validation report generation failures
resource "aws_cloudwatch_metric_alarm" "validation_report_failures" {
  alarm_name          = "validation-report-generation-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ValidationReportErrors"
  namespace           = "PIL/Validation"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert when validation report generation fails more than 5 times in 5 minutes"
  alarm_actions       = [var.sns_topic_arn]

  tags = {
    Environment = var.environment
  }
}