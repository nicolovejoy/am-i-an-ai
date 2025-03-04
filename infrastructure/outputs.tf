output "cloudfront_distribution_domain" {
  value = aws_cloudfront_distribution.website.domain_name
}

output "website_bucket" {
  value = aws_s3_bucket.website.bucket
} 