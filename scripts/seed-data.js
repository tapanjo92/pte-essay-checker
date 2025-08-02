import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION || 'us-east-1' });

// Table names from environment or use the current deployment
const TOPIC_TABLE_NAME = process.env.TOPIC_TABLE_NAME || 'Topic-dq5wpe6bmvgp3atdny3sbjhesa-NONE';
const GOLD_STANDARD_TABLE_NAME = process.env.GOLD_STANDARD_TABLE_NAME || 'GoldStandardEssay-dq5wpe6bmvgp3atdny3sbjhesa-NONE';

// Command line arguments
const args = process.argv.slice(2);
const shouldSeedTopics = args.includes('--topics') || args.includes('--all');
const shouldSeedEssays = args.includes('--essays') || args.includes('--all');
const forceReload = args.includes('--force');

if (!shouldSeedTopics && !shouldSeedEssays) {
  console.log(`
Usage: node seed-data.js [options]
Options:
  --topics    Seed only topics
  --essays    Seed only gold standard essays
  --all       Seed both topics and essays
  --force     Force reload (replace existing data)
  `);
  process.exit(0);
}

// Essay topics matching the frontend (industry best practice: single source of truth)
const PTE_ESSAY_TOPICS = [
  {
    id: 'pte_2025_001',
    title: 'Artificial intelligence will eventually replace human workers in most industries.',
    description: 'To what extent do you agree or disagree with this statement? Support your opinion with relevant examples and explanations.',
    category: 'AGREE_DISAGREE',
    frequency: '35%',
    difficulty: 'MEDIUM',
    keyVocabulary: ['automation', 'displacement', 'augmentation', 'efficiency', 'workforce'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_003',
    title: 'The rise of remote work has fundamentally changed the traditional office culture.',
    description: 'What are the advantages and disadvantages of this trend? Provide specific examples to support your answer.',
    category: 'ADVANTAGES_DISADVANTAGES',
    frequency: '25%',
    difficulty: 'EASY',
    keyVocabulary: ['flexibility', 'productivity', 'collaboration', 'work-life balance', 'isolation'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_004',
    title: 'Governments should prioritize funding for space exploration over addressing problems on Earth.',
    description: 'To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples.',
    category: 'AGREE_DISAGREE',
    frequency: '22%',
    difficulty: 'HARD',
    keyVocabulary: ['priority', 'allocation', 'resources', 'innovation', 'earthly concerns'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_005',
    title: 'Social media influencers have more impact on young people than traditional role models like teachers and parents.',
    description: 'What are the causes of this phenomenon and what effects does it have on society? Support your answer with examples.',
    category: 'CAUSES_EFFECTS',
    frequency: '20%',
    difficulty: 'MEDIUM',
    keyVocabulary: ['influence', 'role model', 'social media', 'authority', 'values'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_006',
    title: 'Online education is more effective than traditional classroom learning.',
    description: 'To what extent do you agree or disagree? Support your opinion with examples and evidence.',
    category: 'AGREE_DISAGREE',
    frequency: '32%',
    difficulty: 'MEDIUM',
    keyVocabulary: ['accessibility', 'interaction', 'self-paced', 'engagement', 'effectiveness'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_007',
    title: 'Governments should ban all single-use plastics immediately, regardless of economic impact.',
    description: 'To what extent do you agree or disagree? Give reasons for your answer.',
    category: 'AGREE_DISAGREE',
    frequency: '24%',
    difficulty: 'HARD',
    keyVocabulary: ['environmental', 'sustainability', 'economic impact', 'alternatives', 'regulation'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_008',
    title: 'International trade barriers are being reduced worldwide.',
    description: 'Do the advantages of globalization outweigh the disadvantages? Discuss with examples.',
    category: 'ADVANTAGES_DISADVANTAGES',
    frequency: '27%',
    difficulty: 'MEDIUM',
    keyVocabulary: ['globalization', 'trade barriers', 'economic growth', 'cultural impact', 'inequality'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_009',
    title: 'Youth unemployment rates are increasing globally.',
    description: 'What are the main causes of this problem and what solutions can you suggest?',
    category: 'PROBLEM_SOLUTION',
    frequency: '29%',
    difficulty: 'MEDIUM',
    keyVocabulary: ['unemployment', 'skills gap', 'education', 'job market', 'opportunities'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_010',
    title: 'Food waste is a major problem in developed countries while others face starvation.',
    description: 'What are the causes of this issue and what measures can be taken to address it?',
    category: 'PROBLEM_SOLUTION',
    frequency: '21%',
    difficulty: 'EASY',
    keyVocabulary: ['food waste', 'distribution', 'consumption', 'sustainability', 'inequality'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_012',
    title: 'More people are choosing to live in large cities rather than rural areas.',
    description: 'Do the advantages outweigh the disadvantages? Support your answer with examples.',
    category: 'ADVANTAGES_DISADVANTAGES',
    frequency: '26%',
    difficulty: 'EASY',
    keyVocabulary: ['urbanization', 'opportunities', 'infrastructure', 'quality of life', 'community'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_013',
    title: 'Cashless societies are becoming increasingly common.',
    description: 'Do the advantages of digital payments outweigh the disadvantages? Discuss both sides.',
    category: 'ADVANTAGES_DISADVANTAGES',
    frequency: '23%',
    difficulty: 'MEDIUM',
    keyVocabulary: ['digital payments', 'convenience', 'security', 'privacy', 'accessibility'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  },
  {
    id: 'pte_2025_014',
    title: 'Some believe healthcare should be completely free for all citizens, while others think people should pay for medical services.',
    description: 'Discuss both views and give your opinion. Include relevant examples.',
    category: 'DISCUSS_BOTH_VIEWS',
    frequency: '31%',
    difficulty: 'HARD',
    keyVocabulary: ['healthcare', 'universal access', 'quality', 'taxation', 'responsibility'],
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 20,
    isActive: true
  }
];

// Topic mapping for gold standard essays
const TOPIC_MAPPING = {
  'ai-workers': 'pte_2025_001',
  'remote-work': 'pte_2025_003',
  'space-exploration': 'pte_2025_004',
  'social-media': 'pte_2025_005',
  'online-education': 'pte_2025_006',
  'plastic-ban': 'pte_2025_007',
  'globalization': 'pte_2025_008',
  'unemployment': 'pte_2025_009',
  'food-waste': 'pte_2025_010',
  'urban-living': 'pte_2025_012',
  'digital-economy': 'pte_2025_013', // Cashless societies
  'healthcare': 'pte_2025_014'
};

async function seedTopics() {
  console.log('🚀 Seeding PTE essay topics to table:', TOPIC_TABLE_NAME);
  console.log(`📝 Total topics to seed: ${PTE_ESSAY_TOPICS.length}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const topic of PTE_ESSAY_TOPICS) {
    try {
      // Check if topic already exists
      try {
        const existing = await docClient.send(new GetCommand({
          TableName: TOPIC_TABLE_NAME,
          Key: { id: topic.id }
        }));
        
        if (existing.Item && !forceReload) {
          console.log(`⏭️  Skipping topic: ${topic.id} - Already exists`);
          continue;
        } else if (existing.Item && forceReload) {
          console.log(`🔄 Reloading topic: ${topic.id} - Force flag set`);
        }
      } catch (error) {
        // Topic doesn't exist, continue with creation
      }
      
      // Add metadata
      const item = {
        ...topic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __typename: 'Topic'
      };
      
      await docClient.send(new PutCommand({
        TableName: TOPIC_TABLE_NAME,
        Item: item
      }));
      
      console.log(`✅ Seeded topic: ${topic.id} - ${topic.title.substring(0, 50)}...`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error seeding topic ${topic.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n==================================================');
  console.log('📊 Topic Seeding Summary:');
  console.log(`✅ Success: ${successCount} topics`);
  console.log(`❌ Errors: ${errorCount} topics`);
  console.log('==================================================\n');
  
  if (successCount === PTE_ESSAY_TOPICS.length) {
    console.log('🎉 All topics seeded successfully!');
  }
}

// Generate embedding using Amazon Titan
async function generateEmbedding(text) {
  try {
    const params = {
      modelId: 'amazon.titan-embed-text-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: text.substring(0, 8192) // Titan limit
      })
    };

    const command = new InvokeModelCommand(params);
    const response = await bedrockClient.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.embedding; // 1536 dimensions
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

async function seedGoldStandardEssays() {
  console.log('📚 Seeding Gold Standard Essays to table:', GOLD_STANDARD_TABLE_NAME);
  
  const essaysDir = './gold-standard-essays';
  const categories = await readdir(essaysDir);
  
  let totalCount = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (const category of categories) {
    if (category === 'README.md') continue; // Skip README file
    
    const categoryPath = join(essaysDir, category);
    const files = await readdir(categoryPath);
    
    console.log(`\n📁 Processing category: ${category}`);
    const topicId = TOPIC_MAPPING[category];
    
    if (!topicId) {
      console.warn(`⚠️  No topic mapping found for category: ${category}`);
      continue;
    }
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      totalCount++;
      
      try {
        const filePath = join(categoryPath, file);
        const content = await readFile(filePath, 'utf-8');
        const essay = JSON.parse(content);
        
        // Generate deterministic ID (same every time for same essay)
        const essayId = `gold_${category}_${file.replace('.json', '')}`;
        
        // Check if essay already exists
        try {
          const existing = await docClient.send(new GetCommand({
            TableName: GOLD_STANDARD_TABLE_NAME,
            Key: { id: essayId }
          }));
          
          if (existing.Item && !forceReload) {
            console.log(`⏭️  Skipping: ${category}/${file} - Already exists`);
            continue;
          } else if (existing.Item && forceReload) {
            console.log(`🔄 Reloading: ${category}/${file} - Force flag set`);
          }
        } catch (error) {
          // Essay doesn't exist, continue with creation
        }
        
        // Generate embedding for the essay
        console.log(`🔄 Generating embedding for: ${category}/${file}`);
        const embedding = await generateEmbedding(`Topic: ${essay.topic}\n\nEssay: ${essay.essayText}`);
        
        // Prepare item for DynamoDB
        const item = {
          id: essayId,
          topicId: topicId,
          topic: essay.topic,
          essayText: essay.essayText,
          wordCount: essay.wordCount,
          officialScore: essay.officialScore,
          scoreBreakdown: essay.scoreBreakdown,
          strengths: essay.strengths || [],
          weaknesses: essay.weaknesses || [],
          scoreRange: file.replace('.json', ''), // veryhigh, high, medium, low, verylow
          embedding: embedding,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __typename: 'GoldStandardEssay'
        };
        
        // Save to DynamoDB
        await docClient.send(new PutCommand({
          TableName: GOLD_STANDARD_TABLE_NAME,
          Item: item
        }));
        
        console.log(`✅ Seeded: ${category}/${file} (Score: ${essay.officialScore}/90)`);
        successCount++;
        
        // Rate limiting for Bedrock
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error seeding ${category}/${file}:`, error.message);
        errorCount++;
      }
    }
  }
  
  console.log('\n==================================================');
  console.log('📊 Gold Standard Essays Seeding Summary:');
  console.log(`📄 Total files processed: ${totalCount}`);
  console.log(`✅ Success: ${successCount} essays`);
  console.log(`❌ Errors: ${errorCount} essays`);
  console.log('==================================================\n');
}

// Main execution
async function main() {
  console.log('🚀 Starting PTE Essay Checker Data Seeding...\n');
  
  if (shouldSeedTopics) {
    await seedTopics();
  }
  
  if (shouldSeedEssays) {
    await seedGoldStandardEssays();
  }
  
  console.log('\n✨ Seeding complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});