const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: 'ap-south-1' });

// Table name from your deployment
const TABLE_NAME = 'GoldStandardEssay-3jvy5oiy4fewzg24gsbnrxx5oi-NONE';

async function generateEmbedding(text) {
  try {
    const truncatedText = text.substring(0, 8000);
    
    const input = {
      modelId: 'amazon.titan-embed-text-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: truncatedText
      })
    };
    
    const command = new InvokeModelCommand(input);
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (!responseBody.embedding || !Array.isArray(responseBody.embedding)) {
      throw new Error('Invalid embedding response from Titan');
    }
    
    return responseBody.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function generateEmbeddingsForEssays() {
  console.log('Starting embedding generation for gold standard essays...');
  
  const result = {
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
    
    // Process essays one by one with delay
    for (let i = 0; i < essays.length; i++) {
      const essay = essays[i];
      console.log(`\nProcessing essay ${i + 1}/${essays.length}: ${essay.id}`);
      
      try {
        // Generate embedding
        const text = `Topic: ${essay.topic}\n\nEssay: ${essay.essayText}`;
        const embedding = await generateEmbedding(text);
        
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
        
      } catch (error) {
        result.failed++;
        const errorMsg = `Failed to process essay ${essay.id}: ${error.message}`;
        result.errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
      
      // Rate limiting - wait 1 second between essays
      if (i < essays.length - 1) {
        console.log('Waiting 1 second before next essay...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n========================================');
    console.log('Embedding generation complete!');
    console.log(`Total: ${result.total}`);
    console.log(`Successful: ${result.successful}`);
    console.log(`Failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(error => console.log(`- ${error}`));
    }
    
    return result;
    
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  generateEmbeddingsForEssays()
    .then(result => {
      console.log('\nFinal result:', JSON.stringify(result, null, 2));
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}