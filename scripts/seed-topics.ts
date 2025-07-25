import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table name - update this based on your actual table name
const TABLE_NAME = 'Topic-3jvy5oiy4fewzg24gsbnrxx5oi-NONE';

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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pte_2025_002',
    title: 'Some people believe that unpaid internships exploit young workers, while others see them as valuable learning opportunities.',
    description: 'Discuss both these views and give your own opinion. Include relevant examples from your knowledge or experience.',
    category: 'DISCUSS_BOTH_VIEWS',
    difficulty: 'HARD',
    frequency: '28%',
    keyVocabulary: ['exploitation', 'compensation', 'experience', 'networking', 'equity'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pte_2025_003',
    title: 'The rise of remote work has fundamentally changed the traditional office culture.',
    description: 'What are the advantages and disadvantages of this trend? Provide specific examples to support your answer.',
    category: 'ADVANTAGES_DISADVANTAGES',
    difficulty: 'EASY',
    frequency: '25%',
    keyVocabulary: ['flexibility', 'isolation', 'productivity', 'collaboration', 'work-life balance'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pte_2025_004',
    title: 'Governments should prioritize funding for space exploration over addressing problems on Earth.',
    description: 'To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples.',
    category: 'AGREE_DISAGREE',
    difficulty: 'HARD',
    frequency: '22%',
    keyVocabulary: ['prioritization', 'allocation', 'innovation', 'terrestrial', 'advancement'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pte_2025_005',
    title: 'Social media influencers have more impact on young people than traditional role models like teachers and parents.',
    description: 'What are the causes of this phenomenon and what effects does it have on society? Support your answer with examples.',
    category: 'CAUSES_EFFECTS',
    difficulty: 'MEDIUM',
    frequency: '20%',
    keyVocabulary: ['influence', 'authenticity', 'aspirational', 'mentorship', 'values'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function seedTopics() {
  console.log(`Seeding ${topics.length} PTE essay topics to ${TABLE_NAME}`);
  
  for (const topic of topics) {
    try {
      const params = {
        TableName: TABLE_NAME,
        Item: topic
      };
      
      await docClient.send(new PutCommand(params));
      console.log(`✅ Seeded topic: ${topic.id} - ${topic.title.substring(0, 50)}...`);
      
    } catch (error) {
      console.error(`❌ Failed to seed topic ${topic.id}:`, error);
    }
  }
  
  console.log('✨ Topic seeding complete!');
}

// Run the seeding
seedTopics().catch(console.error);