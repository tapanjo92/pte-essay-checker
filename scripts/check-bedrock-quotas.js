#!/usr/bin/env node

import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { ServiceQuotasClient, ListServiceQuotasCommand } from '@aws-sdk/client-service-quotas';

const regions = ['us-east-1', 'ap-south-1'];

async function checkBedrockModels(region) {
  console.log(`\n🔍 Checking Bedrock models in ${region}...`);
  
  try {
    const client = new BedrockClient({ region });
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);
    
    const claudeModels = response.modelSummaries
      ?.filter(model => model.modelId?.includes('claude'))
      ?.map(model => ({
        id: model.modelId,
        name: model.modelName,
        provider: model.providerName,
        status: model.modelLifecycle?.status || 'UNKNOWN'
      }));
    
    if (claudeModels && claudeModels.length > 0) {
      console.log(`✅ Found ${claudeModels.length} Claude models:`);
      claudeModels.forEach(model => {
        const isSonnet = model.id.includes('sonnet');
        const emoji = isSonnet ? '🌟' : '📝';
        console.log(`   ${emoji} ${model.id}`);
        console.log(`      Name: ${model.name}`);
        console.log(`      Status: ${model.status}`);
      });
    } else {
      console.log('❌ No Claude models found or not accessible');
    }
  } catch (error) {
    if (error.name === 'AccessDeniedException') {
      console.log('❌ Access denied - you may need to request model access in this region');
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

async function checkServiceQuotas(region) {
  console.log(`\n📊 Checking Bedrock quotas in ${region}...`);
  
  try {
    const client = new ServiceQuotasClient({ region });
    const command = new ListServiceQuotasCommand({
      ServiceCode: 'bedrock'
    });
    const response = await client.send(command);
    
    const relevantQuotas = response.Quotas
      ?.filter(quota => 
        quota.QuotaName?.toLowerCase().includes('claude') ||
        quota.QuotaName?.toLowerCase().includes('anthropic')
      )
      ?.map(quota => ({
        name: quota.QuotaName,
        value: quota.Value,
        unit: quota.Unit
      }));
    
    if (relevantQuotas && relevantQuotas.length > 0) {
      console.log('📈 Claude-related quotas:');
      relevantQuotas.forEach(quota => {
        console.log(`   • ${quota.name}: ${quota.value} ${quota.unit}`);
      });
    } else {
      console.log('ℹ️  No specific Claude quotas found (this is normal)');
    }
  } catch (error) {
    console.log(`⚠️  Cannot check quotas: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 AWS Bedrock Claude Model & Quota Check');
  console.log('=========================================');
  
  for (const region of regions) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`REGION: ${region}`);
    console.log('='.repeat(50));
    
    await checkBedrockModels(region);
    await checkServiceQuotas(region);
  }
  
  console.log('\n\n💡 Next Steps:');
  console.log('1. If you see "Access denied", go to AWS Console → Bedrock → Model access');
  console.log('2. Request access to Claude 3 Sonnet or Claude 3.5 Sonnet models');
  console.log('3. Access is usually granted within minutes');
  console.log('4. For quotas, you may need to request increases through AWS Support');
}

main().catch(console.error);