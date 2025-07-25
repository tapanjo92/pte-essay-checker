"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const fs = require("fs");
const path = require("path");
// Initialize DynamoDB client
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: 'ap-south-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
// Read the gold standard essays
const essaysPath = path.join(__dirname, '../app/data/gold-standard-essays.json');
const essays = JSON.parse(fs.readFileSync(essaysPath, 'utf-8'));
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
            await docClient.send(new lib_dynamodb_1.PutCommand(params));
            console.log(`✅ Seeded essay ${essay.id} - Score: ${essay.officialScore}/90`);
        }
        catch (error) {
            console.error(`❌ Failed to seed essay ${essay.id}:`, error);
        }
    }
    console.log('✨ Seeding complete!');
}
// Run the seeding
seedEssays().catch(console.error);
