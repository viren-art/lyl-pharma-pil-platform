# S3 bucket for 10-year audit trail retention with Glacier storage
resource "aws_s3_bucket" "audit_archives" {
  bucket = "lotus-pil-audit-archives-${var.environment}"

  tags = {
    Name        = "PIL Audit Archives"
    Environment = var.environment
    Compliance  = "10-year-retention"
    Purpose     = "Regulatory-Audit-Trail"
  }
}

# Enable versioning for immutable audit trail
resource "aws_s3_bucket_versioning" "audit_archives" {
  bucket = aws_s3_bucket.audit_archives.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle policy: transition to Glacier after 90 days, retain for 10 years
resource "aws_s3_bucket_lifecycle_configuration" "audit_archives" {
  bucket = aws_s3_bucket.audit_archives.id

  rule {
    id     = "audit-retention-10-years"
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

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# AES-256 encryption at rest using KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "audit_archives" {
  bucket = aws_s3_bucket.audit_archives.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.audit_archives.arn
    }
    bucket_key_enabled = true
  }
}

# KMS key for audit archives encryption with 90-day rotation
resource "aws_kms_key" "audit_archives" {
  description             = "KMS key for audit archives encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "Audit Archives KMS Key"
    Environment = var.environment
    Rotation    = "90-days"
  }
}

resource "aws_kms_alias" "audit_archives" {
  name          = "alias/audit-archives-${var.environment}"
  target_key_id = aws_kms_key.audit_archives.key_id
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "audit_archives" {
  bucket = aws_s3_bucket.audit_archives.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable access logging
resource "aws_s3_bucket_logging" "audit_archives" {
  bucket = aws_s3_bucket.audit_archives.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "audit-archives-logs/"
}

# S3 bucket for access logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "lotus-pil-access-logs-${var.environment}"

  tags = {
    Name        = "S3 Access Logs"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cross-region replication for disaster recovery (RPO ≤24 hours)
resource "aws_s3_bucket_replication_configuration" "audit_archives" {
  bucket = aws_s3_bucket.audit_archives.id
  role   = aws_iam_role.replication.arn

  rule {
    id     = "audit-dr-replication"
    status = "Enabled"

    filter {
      prefix = ""
    }

    destination {
      bucket        = aws_s3_bucket.audit_archives_dr.arn
      storage_class = "GLACIER"

      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }
}

# DR bucket in secondary region (ap-northeast-1)
resource "aws_s3_bucket" "audit_archives_dr" {
  provider = aws.dr_region
  bucket   = "lotus-pil-audit-archives-dr-${var.environment}"

  tags = {
    Name        = "PIL Audit Archives DR"
    Environment = var.environment
    Purpose     = "Disaster-Recovery"
  }
}

resource "aws_s3_bucket_versioning" "audit_archives_dr" {
  provider = aws.dr_region
  bucket   = aws_s3_bucket.audit_archives_dr.id

  versioning_configuration {
    status = "Enabled"
  }
}

# IAM role for replication
resource "aws_iam_role" "replication" {
  name = "s3-audit-replication-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "replication" {
  role = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.audit_archives.arn
        ]
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.audit_archives.arn}/*"
        ]
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.audit_archives_dr.arn}/*"
        ]
      }
    ]
  })
}

# CloudWatch alarm for replication lag (RTO ≤8 hours)
resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  alarm_name          = "audit-replication-lag-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/S3"
  period              = "3600" # 1 hour
  statistic           = "Maximum"
  threshold           = "28800" # 8 hours in seconds
  alarm_description   = "Alert when audit replication lag exceeds 8 hours (RTO threshold)"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    SourceBucket      = aws_s3_bucket.audit_archives.id
    DestinationBucket = aws_s3_bucket.audit_archives_dr.id
    RuleId            = "audit-dr-replication"
  }
}

# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "audit-alerts-${var.environment}"

  tags = {
    Name        = "Audit Alerts"
    Environment = var.environment
  }
}

# Output bucket names for application configuration
output "audit_archives_bucket" {
  value       = aws_s3_bucket.audit_archives.id
  description = "S3 bucket for audit archives"
}

output "audit_archives_dr_bucket" {
  value       = aws_s3_bucket.audit_archives_dr.id
  description = "S3 bucket for audit archives DR"
}

output "audit_kms_key_id" {
  value       = aws_kms_key.audit_archives.id
  description = "KMS key ID for audit archives encryption"
}