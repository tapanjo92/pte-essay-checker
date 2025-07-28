import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { generateEssayEmbedding, batchGenerateEmbeddings } from '../processEssay/vectorUtils';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.GOLD_STANDARD_TABLE_NAME || 'GoldStandardEssay-3jvy5oiy4fewzg24gsbnrxx5oi-NONE';

interface ProcessingResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

/**
 * Lambda handler to generate embeddings for existing gold standard essays
 * This can be triggered manually via AWS Console or CLI
 */
export const handler = async (event: any): Promise<ProcessingResult> => {
  console.log('Starting embedding generation for gold standard essays...');
  
  const result: ProcessingResult = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: []
  };
  
  try {
    // Scan all gold standard essays
    const scanParams = {
      TableName: TABLE_NAME
    };
    
    console.log('Scanning table:', TABLE_NAME);
    const scanResult = await docClient.send(new ScanCommand(scanParams));
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('No gold standard essays found');
      return result;
    }
    
    const essays = scanResult.Items;
    result.total = essays.length;
    console.log(`Found ${essays.length} essays to process`);
    
    // Process essays in batches
    const batchSize = 5;
    for (let i = 0; i < essays.length; i += batchSize) {
      const batch = essays.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(essays.length/batchSize)}`);
      
      // Generate embeddings for batch
      const texts = batch.map(essay => `Topic: ${essay.topic}\n\nEssay: ${essay.essayText}`);
      
      try {
        const embeddings = await batchGenerateEmbeddings(texts, batchSize);
        
        // Update each essay with its embedding
        for (let j = 0; j < batch.length; j++) {
          const essay = batch[j];
          const embedding = embeddings[j];
          
          if (!embedding || embedding.length === 0) {
            result.failed++;
            result.errors.push(`Failed to generate embedding for essay ${essay.id}`);
            continue;
          }
          
          try {
            // Update essay with embedding
            const updateParams = {
              TableName: TABLE_NAME,
              Key: { id: essay.id },
              UpdateExpression: 'SET embedding = :embedding, embeddingGeneratedAt = :timestamp',
              ExpressionAttributeValues: {
                ':embedding': embedding,
                ':timestamp': new Date().toISOString()
              }
            };
            
            await docClient.send(new UpdateCommand(updateParams));
            result.successful++;
            console.log(`✓ Updated essay ${essay.id} with embedding (${embedding.length} dimensions)`);
            
          } catch (updateError) {
            result.failed++;
            const errorMsg = `Failed to update essay ${essay.id}: ${updateError instanceof Error ? updateError.message : String(updateError)}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
        
      } catch (batchError) {
        // If batch fails, try individual essays
        console.error('Batch processing failed, trying individually:', batchError);
        
        for (const essay of batch) {
          try {
            const embedding = await generateEssayEmbedding(essay.topic, essay.essayText);
            
            const updateParams = {
              TableName: TABLE_NAME,
              Key: { id: essay.id },
              UpdateExpression: 'SET embedding = :embedding, embeddingGeneratedAt = :timestamp',
              ExpressionAttributeValues: {
                ':embedding': embedding,
                ':timestamp': new Date().toISOString()
              }
            };
            
            await docClient.send(new UpdateCommand(updateParams));
            result.successful++;
            console.log(`✓ Updated essay ${essay.id} with embedding`);
            
          } catch (individualError) {
            result.failed++;
            const errorMsg = `Failed to process essay ${essay.id}: ${individualError instanceof Error ? individualError.message : String(individualError)}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
      }
      
      // Rate limiting between batches
      if (i + batchSize < essays.length) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\nEmbedding generation complete!');
    console.log(`Total: ${result.total}, Successful: ${result.successful}, Failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(error => console.log(`- ${error}`));
    }
    
    return result;
    
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  }
};

// For local testing
if (require.main === module) {
  handler({}).then(result => {
    console.log('Result:', result);
    process.exit(result.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}