import { Handler } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: Handler = async (event) => {
  console.log('Submit essay event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract essay data from the AppSync event
    const { essayId, content, topic, wordCount } = event.arguments;
    const userId = event.identity?.username || event.identity?.sub || 'anonymous';
    
    // Update essay status to QUEUED
    await updateEssayStatus(essayId, 'QUEUED');
    
    // Prepare message for SQS
    const message = {
      essayId,
      content,
      topic,
      wordCount,
      userId
    };
    
    // Send to SQS
    const command = new SendMessageCommand({
      QueueUrl: process.env.ESSAY_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        userId: {
          DataType: 'String',
          StringValue: userId
        }
      }
    });
    
    const result = await sqsClient.send(command);
    console.log('Message sent to SQS:', result.MessageId);
    
    return {
      success: true,
      messageId: result.MessageId,
      status: 'QUEUED',
      message: 'Essay submitted to processing queue'
    };
  } catch (error) {
    console.error('Error submitting essay:', error);
    throw error;
  }
};

async function updateEssayStatus(essayId: string, status: string): Promise<void> {
  const params = {
    TableName: process.env.ESSAY_TABLE_NAME || 'Essay',
    Key: { id: essayId },
    UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': status,
      ':updatedAt': new Date().toISOString()
    }
  };
  
  await docClient.send(new UpdateCommand(params));
  console.log(`Essay ${essayId} status updated to ${status}`);
}