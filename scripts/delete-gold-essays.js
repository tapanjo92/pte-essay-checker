import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = 'GoldStandardEssay-dq5wpe6bmvgp3atdny3sbjhesa-NONE';

async function deleteAllItems() {
  console.log('🗑️  Deleting all items from:', TABLE_NAME);
  
  const scanResult = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    Select: 'ALL_ATTRIBUTES'
  }));
  
  console.log(`Found ${scanResult.Items.length} items to delete`);
  
  for (const item of scanResult.Items) {
    try {
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id: item.id }
      }));
      console.log(`✅ Deleted: ${item.id}`);
    } catch (error) {
      console.error(`❌ Error deleting ${item.id}:`, error.message);
    }
  }
  
  console.log('✨ Deletion complete!');
}

deleteAllItems().catch(console.error);