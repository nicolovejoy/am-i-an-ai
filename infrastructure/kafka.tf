# MSK Serverless Kafka Infrastructure for RobotOrchestra
# Phase 1: Read-only validation with sample match data

############################
# VPC for MSK Serverless
############################

# VPC for Kafka cluster
resource "aws_vpc" "kafka" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${local.project_name}-kafka-vpc"
  })
}

# Private subnets for MSK (requires at least 2 AZs)
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "kafka_private" {
  count             = 2
  vpc_id            = aws_vpc.kafka.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.tags, {
    Name = "${local.project_name}-kafka-private-${count.index + 1}"
    Type = "Private"
  })
}

# Internet Gateway for Lambda access
resource "aws_internet_gateway" "kafka" {
  vpc_id = aws_vpc.kafka.id

  tags = merge(local.tags, {
    Name = "${local.project_name}-kafka-igw"
  })
}

# Public subnets for NAT Gateways
resource "aws_subnet" "kafka_public" {
  count                   = 2
  vpc_id                  = aws_vpc.kafka.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${local.project_name}-kafka-public-${count.index + 1}"
    Type = "Public"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "kafka_nat" {
  count  = 2
  domain = "vpc"

  depends_on = [aws_internet_gateway.kafka]

  tags = merge(local.tags, {
    Name = "${local.project_name}-kafka-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "kafka" {
  count         = 2
  allocation_id = aws_eip.kafka_nat[count.index].id
  subnet_id     = aws_subnet.kafka_public[count.index].id

  depends_on = [aws_internet_gateway.kafka]

  tags = merge(local.tags, {
    Name = "${local.project_name}-kafka-nat-${count.index + 1}"
  })
}

# Route table for public subnets
resource "aws_route_table" "kafka_public" {
  vpc_id = aws_vpc.kafka.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.kafka.id
  }

  tags = merge(local.tags, {
    Name = "${local.project_name}-kafka-public-rt"
  })
}

# Route table associations for public subnets
resource "aws_route_table_association" "kafka_public" {
  count          = 2
  subnet_id      = aws_subnet.kafka_public[count.index].id
  route_table_id = aws_route_table.kafka_public.id
}

# Route tables for private subnets
resource "aws_route_table" "kafka_private" {
  count  = 2
  vpc_id = aws_vpc.kafka.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.kafka[count.index].id
  }

  tags = merge(local.tags, {
    Name = "${local.project_name}-kafka-private-rt-${count.index + 1}"
  })
}

# Route table associations for private subnets
resource "aws_route_table_association" "kafka_private" {
  count          = 2
  subnet_id      = aws_subnet.kafka_private[count.index].id
  route_table_id = aws_route_table.kafka_private[count.index].id
}

############################
# Security Groups
############################

# Security group for MSK cluster
resource "aws_security_group" "msk" {
  name_prefix = "${local.project_name}-msk-"
  vpc_id      = aws_vpc.kafka.id
  description = "Security group for MSK Serverless cluster"

  # Allow Kafka traffic from Lambda
  ingress {
    from_port       = 9098
    to_port         = 9098
    protocol        = "tcp"
    security_groups = [aws_security_group.kafka_lambda.id]
    description     = "Kafka SASL/SCRAM traffic from Lambda"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.tags, {
    Name = "${local.project_name}-msk-sg"
  })
}

# Security group for Lambda functions accessing Kafka
resource "aws_security_group" "kafka_lambda" {
  name_prefix = "${local.project_name}-kafka-lambda-"
  vpc_id      = aws_vpc.kafka.id
  description = "Security group for Lambda functions accessing Kafka"

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.tags, {
    Name = "${local.project_name}-kafka-lambda-sg"
  })
}

############################
# MSK Serverless Cluster
############################

# MSK Serverless cluster
resource "aws_msk_serverless_cluster" "main" {
  cluster_name = "${local.project_name}-kafka"

  vpc_config {
    subnet_ids         = aws_subnet.kafka_private[*].id
    security_group_ids = [aws_security_group.msk.id]
  }

  client_authentication {
    sasl {
      iam {
        enabled = true
      }
    }
  }

  tags = local.tags
}

############################
# IAM Roles and Policies for Kafka Access
############################

# IAM policy for Kafka access
resource "aws_iam_policy" "kafka_access" {
  name = "${local.project_name}-kafka-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:Connect",
          "kafka-cluster:AlterCluster",
          "kafka-cluster:DescribeCluster"
        ]
        Resource = aws_msk_serverless_cluster.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:*Topic*",
          "kafka-cluster:WriteData",
          "kafka-cluster:ReadData"
        ]
        Resource = "${aws_msk_serverless_cluster.main.arn}/topic/*/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:AlterGroup",
          "kafka-cluster:DescribeGroup"
        ]
        Resource = "${aws_msk_serverless_cluster.main.arn}/group/*/*"
      }
    ]
  })

  tags = local.tags
}

# Note: Kafka access policies are now attached to individual Lambda functions
# that need Kafka access (e.g., match-history Lambda, population scripts)
# See match-history-api.tf for examples

############################
# Outputs
############################

output "msk_cluster_arn" {
  description = "MSK Serverless cluster ARN"
  value       = aws_msk_serverless_cluster.main.arn
}

output "msk_bootstrap_brokers" {
  description = "MSK bootstrap brokers for SASL/IAM"
  value       = aws_msk_serverless_cluster.main.bootstrap_brokers_sasl_iam
}

output "kafka_vpc_id" {
  description = "VPC ID for Kafka cluster"
  value       = aws_vpc.kafka.id
}

output "kafka_private_subnet_ids" {
  description = "Private subnet IDs for Kafka"
  value       = aws_subnet.kafka_private[*].id
}

output "kafka_security_group_id" {
  description = "Security group ID for Lambda Kafka access"
  value       = aws_security_group.kafka_lambda.id
}