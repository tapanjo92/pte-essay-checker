import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({ region: 'ap-south-1' });

const ESSAY_TABLE = 'Essay-3jvy5oiy4fewzg24gsbnrxx5oi-NONE';
const QUEUE_URL = 'https://sqs.ap-south-1.amazonaws.com/493093635246/pte-essay-processing-queue';

// Off-topic test essay about AWS (same as your submission)
const offTopicEssay = {
  id: `test-off-topic-${Date.now()}`,
  topic: 'Artificial intelligence will eventually replace human workers in most industries.',
  content: `Data storage is another area where people often make mistakes. S3 is incredible - eleven nines of durability - but you need to understand the storage classes. Intelligent-Tiering has saved my clients millions by automatically moving data between access tiers. And for databases, stop defaulting to RDS. DynamoDB can handle massive scale if you design your access patterns correctly. Single-digit millisecond response times at any scale - try getting that with traditional databases.

The real game-changer lately has been the integration of AI services. Bedrock makes it trivial to incorporate large language models into your applications. I've built RAG systems using Bedrock, OpenSearch, and Lambda that would have been impossible just two years ago.

Security-wise, always assume breach. Use IAM roles, not keys. Enable GuardDuty on day one. Set up CloudTrail for everything. And please, use Systems Manager Session Manager instead of SSH - it's more secure and you get full audit logs.

Cost optimization is where I see the biggest gaps. People provision for peak and waste money 90% of the time. Use autoscaling, leverage spot instances for non-critical workloads, and set up Cost Explorer alerts. I've seen companies cut their bills by 70% just by right-sizing their instances and using savings plans effectively.`,
  wordCount: 210,
  userId: 'test-user-off-topic'
};

async function testOffTopicEssay() {
  console.log('Testing off-topic essay detection...\n');
  
  try {
    // 1. Create essay in DynamoDB
    const timestamp = new Date().toISOString();
    await docClient.send(new PutCommand({
      TableName: ESSAY_TABLE,
      Item: {
        id: offTopicEssay.id,
        userId: offTopicEssay.userId,
        topic: offTopicEssay.topic,
        content: offTopicEssay.content,
        wordCount: offTopicEssay.wordCount,
        status: 'PENDING',
        createdAt: timestamp,
        updatedAt: timestamp,
        owner: offTopicEssay.userId
      }
    }));
    
    console.log(`✅ Created test essay: ${offTopicEssay.id}`);
    console.log(`Topic: ${offTopicEssay.topic}`);
    console.log(`Content: About AWS services (completely off-topic)`);
    
    // 2. Submit to SQS queue
    const messageBody = {
      essayId: offTopicEssay.id,
      content: offTopicEssay.content,
      topic: offTopicEssay.topic,
      wordCount: offTopicEssay.wordCount,
      userId: offTopicEssay.userId
    };
    
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(messageBody)
    }));
    
    console.log('\n✅ Submitted to processing queue');
    console.log('\n⏳ Wait 30-60 seconds for processing...');
    console.log('\nThen check the result:');
    console.log(`aws dynamodb scan --table-name Result-3jvy5oiy4fewzg24gsbnrxx5oi-NONE --filter-expression "essayId = :eid" --expression-attribute-values '{":eid": {"S": "${offTopicEssay.id}"}}' --region ap-south-1 | jq '.Items[0] | {score: .overallScore.N, content: .pteScores.M.content.N, relevance: .topicRelevance}'`);
    
    console.log('\n\n🎯 Expected result:');
    console.log('- Overall score: 25/90 or less');
    console.log('- Content score: 0/90');
    console.log('- Topic relevance: isOnTopic: false');
    console.log('- Feedback should mention essay is off-topic');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testOffTopicEssay();