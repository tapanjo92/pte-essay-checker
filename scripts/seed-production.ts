import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import * as fs from 'fs';
import * as path from 'path';

// Initialize clients
const region = process.env.AWS_REGION || 'ap-south-1';
const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cfnClient = new CloudFormationClient({ region });

// Function to find table name by prefix
async function findTableName(prefix: string): Promise<string | null> {
  try {
    const command = new ListTablesCommand({});
    const response = await dynamoClient.send(command);
    
    const tables = response.TableNames || [];
    const matchingTable = tables.find(table => 
      table.startsWith(prefix) && table.includes('-') && table.endsWith('-NONE')
    );
    
    if (matchingTable) {
      console.log(`✅ Found ${prefix} table: ${matchingTable}`);
      return matchingTable;
    } else {
      console.error(`❌ No table found with prefix: ${prefix}`);
      return null;
    }
  } catch (error) {
    console.error('Error listing tables:', error);
    return null;
  }
}

// Topics data
const topics = [
  {
    id: 'pte_2025_001',
    title: 'Artificial intelligence will eventually replace human workers in most industries.',
    description: 'To what extent do you agree or disagree with this statement? Support your opinion with relevant examples and explanations.',
    category: 'AGREE_DISAGREE',
    difficulty: 'MEDIUM',
    frequency: '35%',
    keyVocabulary: ['automation', 'displacement', 'augmentation', 'redundancy', 'upskilling'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true,
  },
  // ... other topics
];

async function seedProduction() {
  console.log('🚀 Starting production seeding...\n');
  
  // 1. Find table names dynamically
  const topicTableName = await findTableName('Topic');
  const goldStandardTableName = await findTableName('GoldStandardEssay');
  
  if (!topicTableName || !goldStandardTableName) {
    console.error('❌ Could not find required tables. Make sure the app is deployed.');
    return;
  }
  
  // 2. Seed Topics
  console.log('\n📝 Seeding Topics...');
  for (const topic of topics) {
    try {
      await docClient.send(new PutCommand({
        TableName: topicTableName,
        Item: {
          ...topic,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));
      console.log(`✅ Seeded topic: ${topic.id}`);
    } catch (error) {
      console.error(`❌ Failed to seed topic ${topic.id}:`, error);
    }
  }
  
  // 3. Seed Gold Standard Essays
  console.log('\n📚 Seeding Gold Standard Essays...');
  const essaysPath = path.join(__dirname, '../app/data/gold-standard-essays.json');
  const rawData = JSON.parse(fs.readFileSync(essaysPath, 'utf-8'));
  const essays = rawData.filter((item: any) => typeof item === 'object' && item.id);
  
  for (const essay of essays) {
    try {
      await docClient.send(new PutCommand({
        TableName: goldStandardTableName,
        Item: {
          ...essay,
          createdAt: essay.createdAt || new Date().toISOString(),
          updatedAt: essay.updatedAt || new Date().toISOString(),
          scoreRange: essay.scoreRange || (
            essay.officialScore >= 85 ? '85-90' : 
            essay.officialScore >= 75 ? '75-84' : '65-74'
          )
        }
      }));
      console.log(`✅ Seeded essay: ${essay.id} - Score: ${essay.officialScore}/90`);
    } catch (error) {
      console.error(`❌ Failed to seed essay ${essay.id}:`, error);
    }
  }
  
  console.log('\n✨ Production seeding complete!');
}

// Run with environment check
if (process.argv.includes('--production')) {
  seedProduction().catch(console.error);
} else {
  console.log('⚠️  This script is for production use.');
  console.log('Usage: npx tsx seed-production.ts --production');
  console.log('\nThis script will:');
  console.log('1. Automatically find your production table names');
  console.log('2. Seed the 5 PTE topics');
  console.log('3. Seed the gold standard essays');
}