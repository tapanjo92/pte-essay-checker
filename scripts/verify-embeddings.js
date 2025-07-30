const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function verifyEmbeddings() {
  console.log('\n🔍 Verifying Gold Standard Essay Embeddings...\n');
  
  try {
    // Get table name from environment or use pattern
    const tableName = process.env.GOLD_STANDARD_TABLE_NAME || 
                     'GoldStandardEssay-lj2kaxrlwrdh7lvqph5pgrykti-NONE';
    
    console.log(`📊 Checking table: ${tableName}\n`);
    
    // Count essays with embeddings
    let withEmbeddings = 0;
    let withoutEmbeddings = 0;
    let lastEvaluatedKey;
    const sampleEssays = [];
    
    // Scan all essays
    do {
      const params = {
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey
      };
      
      const result = await docClient.send(new ScanCommand(params));
      
      result.Items.forEach(item => {
        if (item.embedding && Array.isArray(item.embedding) && item.embedding.length > 0) {
          withEmbeddings++;
          if (sampleEssays.length < 5) {
            sampleEssays.push({
              id: item.id,
              topic: item.topic,
              score: item.officialScore,
              embeddingSize: item.embedding.length,
              firstValues: item.embedding.slice(0, 3).map(v => v.toFixed(4))
            });
          }
        } else {
          withoutEmbeddings++;
        }
      });
      
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    
    // Display results
    console.log('📈 SUMMARY:');
    console.log(`✅ Essays WITH embeddings: ${withEmbeddings}`);
    console.log(`❌ Essays WITHOUT embeddings: ${withoutEmbeddings}`);
    console.log(`📊 TOTAL essays: ${withEmbeddings + withoutEmbeddings}`);
    console.log(`🎯 Coverage: ${((withEmbeddings / (withEmbeddings + withoutEmbeddings)) * 100).toFixed(1)}%\n`);
    
    if (sampleEssays.length > 0) {
      console.log('🔬 Sample Essays with Embeddings:');
      sampleEssays.forEach((essay, idx) => {
        console.log(`\n${idx + 1}. ID: ${essay.id}`);
        console.log(`   Topic: "${essay.topic.substring(0, 60)}..."`);
        console.log(`   Score: ${essay.score}/90`);
        console.log(`   Embedding: ${essay.embeddingSize} dimensions`);
        console.log(`   First 3 values: [${essay.firstValues.join(', ')}]`);
      });
    }
    
    // Check embedding consistency
    if (sampleEssays.length > 0) {
      const dimensions = sampleEssays[0].embeddingSize;
      const consistent = sampleEssays.every(e => e.embeddingSize === dimensions);
      console.log(`\n🔧 Embedding Consistency: ${consistent ? '✅ All embeddings have ' + dimensions + ' dimensions' : '❌ Inconsistent dimensions'}`);
    }
    
    // Prometheus's verdict
    console.log('\n🏛️  PROMETHEUS VERDICT:');
    if (withEmbeddings >= 80 && withoutEmbeddings === 0) {
      console.log('✅ Excellent! Your gold standard corpus is fully embedded and ready for production RAG.');
    } else if (withEmbeddings >= 60) {
      console.log('⚠️  Good progress, but some essays lack embeddings. Re-run seed script for complete coverage.');
    } else {
      console.log('❌ Insufficient embeddings. Your RAG system will underperform. Re-seed immediately!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure you have the correct table name and AWS credentials configured.');
  }
}

// Run verification
verifyEmbeddings().then(() => {
  console.log('\n✨ Verification complete!\n');
}).catch(console.error);