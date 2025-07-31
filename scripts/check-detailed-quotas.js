#!/usr/bin/env node

import { ServiceQuotasClient, ListServiceQuotasCommand, GetServiceQuotaCommand } from '@aws-sdk/client-service-quotas';

const BEDROCK_QUOTA_CODES = {
  'Claude 3.5 Sonnet v2': 'L-A4CB1D1C',
  'Claude 3.7 Sonnet': 'L-BEDROCK-3-7',
  'Claude 3 Haiku': 'L-FE4D819B',
  'General Bedrock': 'L-C7D6F1B0'
};

async function checkDetailedQuotas() {
  const client = new ServiceQuotasClient({ region: 'ap-south-1' });
  
  console.log('🔍 Checking detailed Bedrock quotas in Mumbai (ap-south-1)...\n');
  
  try {
    // List all Bedrock quotas
    const listCommand = new ListServiceQuotasCommand({
      ServiceCode: 'bedrock',
      MaxResults: 100
    });
    
    const response = await client.send(listCommand);
    
    console.log('📋 All Bedrock Service Quotas:\n');
    
    response.Quotas?.forEach(quota => {
      // Look for model-specific quotas
      if (quota.QuotaName?.toLowerCase().includes('request') || 
          quota.QuotaName?.toLowerCase().includes('token') ||
          quota.QuotaName?.toLowerCase().includes('claude')) {
        
        console.log(`📌 ${quota.QuotaName}`);
        console.log(`   Value: ${quota.Value} ${quota.Unit || ''}`);
        console.log(`   Code: ${quota.QuotaCode}`);
        console.log(`   Adjustable: ${quota.Adjustable ? '✅ Yes' : '❌ No'}`);
        console.log('');
      }
    });
    
    // Try to get applied quotas (if you have requested increases)
    console.log('\n📈 Checking for quota increase requests...\n');
    
    const appliedQuotasCommand = new ListServiceQuotasCommand({
      ServiceCode: 'bedrock',
      MaxResults: 100
    });
    
    const appliedResponse = await client.send(appliedQuotasCommand);
    const hasIncreases = appliedResponse.Quotas?.some(q => q.Value !== q.Value);
    
    if (!hasIncreases) {
      console.log('ℹ️  No quota increases detected. Using default values.');
    }
    
  } catch (error) {
    console.error('Error checking quotas:', error.message);
  }
  
  console.log('\n💡 To request quota increase:');
  console.log('1. Go to AWS Console → Service Quotas → Amazon Bedrock');
  console.log('2. Find the specific model quota');
  console.log('3. Click "Request quota increase"');
  console.log('4. Typical increases: 50-100 RPM for production');
}

// Also check through AWS CLI directly
async function getQuotaViaCLI() {
  console.log('\n🖥️  Alternative: Check via AWS CLI:\n');
  console.log('aws service-quotas list-service-quotas \\');
  console.log('  --service-code bedrock \\');
  console.log('  --region ap-south-1 \\');
  console.log('  --output table');
  console.log('\nOr for specific quota:');
  console.log('aws service-quotas get-service-quota \\');
  console.log('  --service-code bedrock \\');
  console.log('  --quota-code L-XXXXXXXX \\');
  console.log('  --region ap-south-1');
}

async function main() {
  await checkDetailedQuotas();
  await getQuotaViaCLI();
}

main().catch(console.error);