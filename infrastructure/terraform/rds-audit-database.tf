# RDS PostgreSQL for audit logs with Multi-AZ for high availability
resource "aws_db_instance" "audit_database" {
  identifier     = "lotus-pil-audit-db-${var.environment}"
  engine         = "postgres"
  engine_version = "14.7"
  instance_class = var.environment == "production" ? "db.r6g.xlarge" : "db.t3.medium"

  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds_audit.arn

  db_name  = "audit_logs"
  username = "audit_admin"
  password = random_password.audit_db_password.result

  # Multi-AZ for high availability (RTO ≤8 hours)
  multi_az               = var.environment == "production" ? true : false
  availability_zone      = var.environment == "production" ? null : "ap-southeast-1a"
  db_subnet_group_name   = aws_db_subnet_group.audit.name
  vpc_security_group_ids = [aws_security_group.audit_db.id]

  # Automated backups (RPO ≤24 hours)
  backup_retention_period = 35 # 35 days for regulatory compliance
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  # Enable automated backups to S3
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Performance Insights for monitoring
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds_audit.arn
  performance_insights_retention_period = 7

  # Deletion protection for production
  deletion_protection = var.environment == "production" ? true : false
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "audit-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  tags = {
    Name        = "Audit Database"
    Environment = var.environment
    Compliance  = "10-year-retention"
  }
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds_audit" {
  description             = "KMS key for audit database encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "Audit Database KMS Key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "rds_audit" {
  name          = "alias/audit-db-${var.environment}"
  target_key_id = aws_kms_key.rds_audit.key_id
}

# Random password for database
resource "random_password" "audit_db_password" {
  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "audit_db_password" {
  name = "audit-db-password-${var.environment}"

  tags = {
    Name        = "Audit Database Password"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "audit_db_password" {
  secret_id     = aws_secretsmanager_secret.audit_db_password.id
  secret_string = random_password.audit_db_password.result
}

# DB subnet group
resource "aws_db_subnet_group" "audit" {
  name       = "audit-db-subnet-group-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "Audit DB Subnet Group"
    Environment = var.environment
  }
}

# Security group for RDS
resource "aws_security_group" "audit_db" {
  name        = "audit-db-sg-${var.environment}"
  description = "Security group for audit database"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
    description     = "PostgreSQL access from application"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "Audit Database Security Group"
    Environment = var.environment
  }
}

# Read replica for disaster recovery (ap-northeast-1)
resource "aws_db_instance" "audit_database_replica" {
  count              = var.environment == "production" ? 1 : 0
  provider           = aws.dr_region
  identifier         = "lotus-pil-audit-db-replica-${var.environment}"
  replicate_source_db = aws_db_instance.audit_database.arn

  instance_class = "db.r6g.xlarge"
  storage_encrypted = true
  kms_key_id = aws_kms_key.rds_audit_dr[0].arn

  # No backups on replica (primary handles backups)
  backup_retention_period = 0

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds_audit_dr[0].arn

  tags = {
    Name        = "Audit Database Replica (DR)"
    Environment = var.environment
    Purpose     = "Disaster-Recovery"
  }
}

# KMS key for DR region
resource "aws_kms_key" "rds_audit_dr" {
  count                   = var.environment == "production" ? 1 : 0
  provider                = aws.dr_region
  description             = "KMS key for audit database DR encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "Audit Database DR KMS Key"
    Environment = var.environment
  }
}

# CloudWatch alarms for database monitoring
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "audit-db-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when database CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.audit_database.id
  }
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "audit-db-storage-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10 GB in bytes
  alarm_description   = "Alert when database free storage falls below 10 GB"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.audit_database.id
  }
}

# Output database connection details
output "audit_database_endpoint" {
  value       = aws_db_instance.audit_database.endpoint
  description = "Audit database endpoint"
  sensitive   = true
}

output "audit_database_name" {
  value       = aws_db_instance.audit_database.db_name
  description = "Audit database name"
}

output "audit_database_secret_arn" {
  value       = aws_secretsmanager_secret.audit_db_password.arn
  description = "ARN of the secret containing database password"
}