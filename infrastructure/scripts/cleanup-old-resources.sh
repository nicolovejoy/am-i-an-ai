#!/bin/bash
set -e

# Cleanup Old AWS Resources
# Safe utility to remove unused AWS resources

echo "🧹 AWS Resource Cleanup Utility"
echo "================================"

# Function to safely delete NAT gateways
cleanup_nat_gateways() {
    echo ""
    echo "🌉 Checking for NAT Gateways..."
    
    NAT_GATEWAYS=$(aws ec2 describe-nat-gateways --filter "Name=state,Values=available" --query 'NatGateways[*].{Id: NatGatewayId, Name: Tags[?Key==`Name`].Value|[0]}' --output text)
    
    if [ -z "$NAT_GATEWAYS" ]; then
        echo "✅ No active NAT Gateways found"
        return
    fi
    
    echo "Found NAT Gateways:"
    echo "$NAT_GATEWAYS"
    echo ""
    echo "⚠️  NAT Gateways cost ~\$45/month each"
    echo "Delete these NAT Gateways? (y/n)"
    read -r response
    
    if [ "$response" = "y" ]; then
        echo "$NAT_GATEWAYS" | while read -r nat_id name; do
            if [ -n "$nat_id" ]; then
                echo "🗑️  Deleting NAT Gateway: $nat_id ($name)"
                aws ec2 delete-nat-gateway --nat-gateway-id "$nat_id"
            fi
        done
        echo "✅ NAT Gateways deletion initiated (takes ~2 minutes)"
    fi
}

# Function to cleanup unattached Elastic IPs
cleanup_elastic_ips() {
    echo ""
    echo "📍 Checking for unattached Elastic IPs..."
    
    UNATTACHED_EIPS=$(aws ec2 describe-addresses --query 'Addresses[?AssociationId==null].{AllocationId: AllocationId, PublicIp: PublicIp}' --output text)
    
    if [ -z "$UNATTACHED_EIPS" ]; then
        echo "✅ No unattached Elastic IPs found"
        return
    fi
    
    echo "Found unattached Elastic IPs:"
    echo "$UNATTACHED_EIPS"
    echo ""
    echo "⚠️  Unattached Elastic IPs cost \$3.65/month each"
    echo "Release these Elastic IPs? (y/n)"
    read -r response
    
    if [ "$response" = "y" ]; then
        echo "$UNATTACHED_EIPS" | while read -r alloc_id public_ip; do
            if [ -n "$alloc_id" ]; then
                echo "🗑️  Releasing Elastic IP: $public_ip ($alloc_id)"
                aws ec2 release-address --allocation-id "$alloc_id"
            fi
        done
        echo "✅ Elastic IPs released"
    fi
}

# Function to check for unused RDS instances
check_rds_instances() {
    echo ""
    echo "🗃️  Checking for RDS instances..."
    
    RDS_INSTANCES=$(aws rds describe-db-instances --query 'DBInstances[*].{Id: DBInstanceIdentifier, Status: DBInstanceStatus, Class: DBInstanceClass}' --output text 2>/dev/null || echo "")
    
    if [ -z "$RDS_INSTANCES" ]; then
        echo "✅ No RDS instances found"
        return
    fi
    
    echo "Found RDS instances:"
    echo "$RDS_INSTANCES"
    echo ""
    echo "⚠️  RDS instances cost \$15-50+/month each"
    echo "💡 Use terraform to manage RDS instances safely"
}

# Main execution
echo "This utility helps identify and remove unused AWS resources"
echo "that may be costing money unnecessarily."
echo ""

cleanup_nat_gateways
cleanup_elastic_ips
check_rds_instances

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "💰 Potential monthly savings from cleanup:"
echo "  - NAT Gateways: \$45 each"
echo "  - Unattached Elastic IPs: \$3.65 each"
echo "  - Unused RDS: \$15-50+ each"