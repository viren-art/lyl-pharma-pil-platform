resource "aws_s3_bucket" "traceability_logs" {
  bucket = "lotus-pil-traceability-logs-${var.environment}"

  tags = {
    Name        = "PIL Traceability Logs"
    Environment = var.environment
    Compliance  = "10-year-retention"
  }
}

resource "aws_s3_bucket_versioning" "traceability_logs" {
  bucket = aws_s3_bucket.traceability_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "traceability_logs" {
  bucket = aws_s3_bucket.traceability_logs.id

  rule {
    id     = "retain-10-years"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    expiration {
      days = 3650 # 10 years
    }
  }

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "traceability_logs" {
  bucket = aws_s3_bucket.traceability_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.traceability_logs.arn
    }
  }
}

resource "aws_kms_key" "traceability_logs" {
  description             = "KMS key for traceability logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "Traceability Logs KMS Key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "traceability_logs" {
  name          = "alias/traceability-logs-${var.environment}"
  target_key_id = aws_kms_key.traceability_logs.key_id
}

resource "aws_s3_bucket_public_access_block" "traceability_logs" {
  bucket = aws_s3_bucket.traceability_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "traceability_logs" {
  bucket = aws_s3_bucket.traceability_logs.id

  target_bucket = aws_s3_bucket.audit_logs.id
  target_prefix = "s3-access-logs/traceability/"
}

output "traceability_logs_bucket_name" {
  value       = aws_s3_bucket.traceability_logs.bucket
  description = "S3 bucket name for traceability logs"
}

output "traceability_logs_bucket_arn" {
  value       = aws_s3_bucket.traceability_logs.arn
  description = "S3 bucket ARN for traceability logs"
}