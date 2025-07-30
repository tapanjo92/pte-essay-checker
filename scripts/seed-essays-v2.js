// Enhanced seed script that reads essays from topic directories
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: 'ap-south-1' });

// Table name from environment
const TABLE_NAME = process.env.GOLD_STANDARD_TABLE_NAME || 'GoldStandardEssay-n7yssgqwc5gxve5vejyyny2dk4-NONE';

// Score level definitions
const SCORE_LEVELS = {
  'veryhigh': { range: '90-95', category: 'EXCEPTIONAL' },
  'high': { range: '85-90', category: 'EXCELLENT' },
  'medium': { range: '75-84', category: 'GOOD' },
  'low': { range: '65-74', category: 'ADEQUATE' },
  'verylow': { range: '50-65', category: 'POOR' }
};

// Topic to category mapping
const TOPIC_CATEGORIES = {
  'climate-change': 'AGREE_DISAGREE',
  'remote-work': 'ADVANTAGES_DISADVANTAGES',
  'social-media': 'ADVANTAGES_DISADVANTAGES',
  'online-education': 'AGREE_DISAGREE',
  'space-exploration': 'AGREE_DISAGREE',
  'globalization': 'ADVANTAGES_DISADVANTAGES',
  'ai-workers': 'AGREE_DISAGREE',
  'healthcare': 'DISCUSS_BOTH_VIEWS',
  'urban-living': 'ADVANTAGES_DISADVANTAGES',
  'plastic-ban': 'AGREE_DISAGREE'
};

// Generate embedding using Amazon Titan Embed Text V2
async function generateEmbedding(text) {
  const input = {
    modelId: 'amazon.titan-embed-text-v2:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      inputText: text, // Titan supports 8192 tokens - no truncation needed
      dimensions: 512, // Match production setting
      normalize: true
    })
  };

  try {
    const command = new InvokeModelCommand(input);
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// Process a single essay file
async function processEssayFile(topicDir, fileName) {
  const filePath = join(__dirname, 'gold-standard-essays', topicDir, fileName);
  const scoreLevel = fileName.replace('.json', '');
  
  if (!SCORE_LEVELS[scoreLevel]) {
    console.log(`⚠️  Skipping ${fileName} - not a valid score level`);
    return null;
  }

  try {
    const essayData = JSON.parse(readFileSync(filePath, 'utf8'));
    
    // Generate unique ID
    const id = `seed-${topicDir}-${scoreLevel}`;
    
    // Generate embedding
    console.log(`🔄 Generating embedding for ${id}...`);
    const embedding = await generateEmbedding(
      `Topic: ${essayData.topic}\n\nEssay: ${essayData.essayText}`
    );
    
    if (!embedding) {
      console.error(`❌ Failed to generate embedding for ${id}`);
      return null;
    }
    
    // Prepare DynamoDB item
    const item = {
      id,
      topic: essayData.topic,
      topicDir, // For easy filtering
      category: TOPIC_CATEGORIES[topicDir] || 'GENERAL',
      essayText: essayData.essayText,
      wordCount: essayData.wordCount,
      officialScore: essayData.officialScore,
      scoreBreakdown: essayData.scoreBreakdown,
      strengths: essayData.strengths || [],
      weaknesses: essayData.weaknesses || [],
      embedding,
      scoreRange: SCORE_LEVELS[scoreLevel].range,
      scoreCategory: SCORE_LEVELS[scoreLevel].category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'seed-v2'
    };
    
    // Save to DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Item: item
    };
    
    await docClient.send(new PutCommand(params));
    console.log(`✅ Successfully seeded ${id}`);
    
    return { success: true, id };
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return { success: false, error: error.message };
  }
}

// Main seeding function
async function seedEssays() {
  console.log(`🚀 Seeding gold standard essays to table: ${TABLE_NAME}\n`);
  
  const essaysDir = join(__dirname, 'gold-standard-essays');
  const topics = readdirSync(essaysDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log(`📁 Found ${topics.length} topic directories\n`);
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  // Process each topic directory
  for (const topic of topics) {
    console.log(`\n📂 Processing topic: ${topic}`);
    console.log('━'.repeat(40));
    
    const topicDir = join(essaysDir, topic);
    const files = readdirSync(topicDir)
      .filter(file => file.endsWith('.json'));
    
    console.log(`📄 Found ${files.length} essay files`);
    
    // Process each essay file
    for (const file of files) {
      const result = await processEssayFile(topic, file);
      if (result?.success) {
        totalSuccess++;
      } else {
        totalErrors++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Seeding Summary:');
  console.log(`✅ Success: ${totalSuccess} essays`);
  console.log(`❌ Errors: ${totalErrors} essays`);
  console.log('='.repeat(50));
  console.log('\n🎉 Seeding process complete!');
}

// Run the seeding
seedEssays().catch(console.error);