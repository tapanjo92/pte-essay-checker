import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import * as fs from 'fs';
import * as path from 'path';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Read the gold standard essays
const essaysPath = path.join(__dirname, '../app/data/gold-standard-essays.json');
const rawData = JSON.parse(fs.readFileSync(essaysPath, 'utf-8'));
// Filter out the instructions key to get only essay objects
const essays = rawData.filter((item: any) => typeof item === 'object' && item.id);

// Table name - update this based on your actual table name
const TABLE_NAME = 'GoldStandardEssay-3jvy5oiy4fewzg24gsbnrxx5oi-NONE';

async function seedEssays() {
  console.log(`Seeding ${essays.length} gold standard essays to ${TABLE_NAME}`);
  
  for (const essay of essays) {
    try {
      // Add timestamps
      const enrichedEssay = {
        ...essay,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add score range for indexing
        scoreRange: essay.officialScore >= 85 ? '85-90' : 
                   essay.officialScore >= 75 ? '75-84' : '65-74'
      };
      
      const params = {
        TableName: TABLE_NAME,
        Item: enrichedEssay
      };
      
      await docClient.send(new PutCommand(params));
      console.log(`✅ Seeded essay ${essay.id} - Score: ${essay.officialScore}/90`);
      
    } catch (error) {
      console.error(`❌ Failed to seed essay ${essay.id}:`, error);
    }
  }
  
  console.log('✨ Seeding complete!');
}

// Run the seeding
seedEssays().catch(console.error);