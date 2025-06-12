#!/usr/bin/env node

/**
 * Script to fix message counts in the database
 * Calls the Lambda admin endpoint to recalculate message counts
 */

const API_URL = process.env.LAMBDA_API_URL || 'https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod';

async function fixMessageCounts() {
  console.log('🔧 Fixing message counts in production database...');
  console.log(`📡 API URL: ${API_URL}`);
  
  try {
    const response = await fetch(`${API_URL}/api/admin/fix-message-counts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Message counts fixed successfully!');
      console.log(`📊 Fixed ${result.fixed} conversations`);
      
      if (result.details && result.details.length > 0) {
        console.log('\n📋 Detailed changes:');
        result.details.forEach(detail => {
          console.log(`  • ${detail.title}: ${detail.oldCount} → ${detail.newCount} messages`);
        });
      }
      
      console.log('\n📈 Verification:');
      console.log(`  • Total conversations: ${result.verification.totalConversations}`);
      console.log(`  • Correct counts: ${result.verification.correctCounts}`);
      console.log(`  • Fixed at: ${result.timestamp}`);
      
      if (result.verification.totalConversations === result.verification.correctCounts) {
        console.log('🎉 All conversations now have correct message counts!');
      } else {
        console.log('⚠️  Some conversations may still have incorrect counts.');
      }
    } else {
      console.error('❌ Failed to fix message counts:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Error calling admin endpoint:', error.message);
    
    if (error.message.includes('fetch is not defined')) {
      console.error('\n💡 This script requires Node.js 18+ or you can install node-fetch:');
      console.error('   npm install node-fetch');
    }
    
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  fixMessageCounts().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { fixMessageCounts };