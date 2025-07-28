import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { generateEssayEmbedding } from '../processEssay/vectorUtils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface Event {
  action?: 'seed' | 'update-existing';
}

export const handler = async (event: Event) => {
  console.log('Generate embeddings handler started', event);
  
  try {
    const goldStandardTableName = process.env.GOLD_STANDARD_TABLE_NAME;
    if (!goldStandardTableName) {
      throw new Error('GOLD_STANDARD_TABLE_NAME environment variable not set');
    }

    // If action is 'seed', first insert seed data
    if (event.action === 'seed') {
      await seedGoldStandardEssays();
    }

    // Then generate embeddings for all essays without embeddings
    const scanParams = {
      TableName: goldStandardTableName,
      FilterExpression: 'attribute_not_exists(embedding) OR size(embedding) = :zero',
      ExpressionAttributeValues: {
        ':zero': 0
      }
    };

    const scanResponse = await docClient.send(new ScanCommand(scanParams));
    
    if (!scanResponse.Items || scanResponse.Items.length === 0) {
      console.log('No essays found without embeddings');
      return {
        statusCode: 200,
        message: 'No essays to process'
      };
    }

    console.log(`Found ${scanResponse.Items.length} essays without embeddings`);
    
    let successCount = 0;
    let errorCount = 0;

    // Process essays in batches
    for (const essay of scanResponse.Items) {
      try {
        console.log(`Generating embedding for essay ${essay.id}`);
        
        // Generate embedding
        const embedding = await generateEssayEmbedding(essay.topic, essay.essayText);
        
        // Update the essay with embedding
        const updateParams = {
          TableName: goldStandardTableName,
          Key: { id: essay.id },
          UpdateExpression: 'SET embedding = :embedding',
          ExpressionAttributeValues: {
            ':embedding': embedding
          }
        };
        
        await docClient.send(new UpdateCommand(updateParams));
        successCount++;
        
        // Rate limiting - wait 1 second between embeddings
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing essay ${essay.id}:`, error);
        errorCount++;
      }
    }

    return {
      statusCode: 200,
      message: `Embedding generation complete. Success: ${successCount}, Errors: ${errorCount}`
    };
    
  } catch (error) {
    console.error('Error in generate embeddings handler:', error);
    return {
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Seed PTE standard gold essays with diverse topics
async function seedGoldStandardEssays() {
  const goldStandardTableName = process.env.GOLD_STANDARD_TABLE_NAME!;
  
  const seedEssays = [
    // TOPIC 1: Climate Change (HIGH SCORE)
    {
      id: 'seed-climate-high',
      topic: 'Climate change is the biggest threat facing humanity today. To what extent do you agree or disagree?',
      category: 'AGREE_DISAGREE',
      essayText: `Climate change undeniably represents one of humanity's most pressing challenges, though whether it constitutes the single biggest threat remains debatable. While I largely agree with this statement, other existential risks deserve equal consideration.

The evidence supporting climate change as a paramount threat is overwhelming. Rising global temperatures have triggered unprecedented extreme weather events, from devastating wildfires in Australia to record-breaking hurricanes in the Americas. The Intergovernmental Panel on Climate Change warns that without immediate action, we face irreversible damage to ecosystems, massive displacement of populations, and severe food security issues affecting billions.

However, characterizing it as the singular biggest threat oversimplifies our complex global landscape. Nuclear proliferation poses an immediate existential risk, with the potential for instantaneous catastrophic destruction. Similarly, the recent pandemic demonstrated how biological threats can rapidly destabilize global systems. Artificial intelligence development, while promising, carries risks of autonomous weapons and societal disruption that could prove equally threatening.

Nevertheless, climate change's unique characteristic is its certainty and current manifestation. Unlike potential future risks, climate impacts are already visible and accelerating. Its interconnected nature amplifies other threats: resource scarcity from climate change could trigger conflicts, while rising temperatures may release ancient pathogens from melting permafrost.

In conclusion, while climate change may not be the sole biggest threat, its immediacy, scope, and cascading effects justify treating it as a top-priority crisis requiring urgent global cooperation.`,
      wordCount: 234,
      officialScore: 89,
      scoreBreakdown: {
        content: 3,  // 0-3 scale
        form: 2,     // 0-2 scale
        grammar: 2,  // 0-2 scale
        vocabulary: 2,  // 0-2 scale
        spelling: 1,  // 0-1 scale
        developmentCoherence: 2,  // 0-2 scale
        linguisticRange: 2  // 0-2 scale
        // Total: 14/14 -> 89/90
      },
      strengths: [
        'Sophisticated argumentation with nuanced position',
        'Excellent use of specific examples',
        'Complex sentence structures',
        'Advanced vocabulary (paramount, proliferation, manifestation)',
        'Strong paragraph transitions'
      ],
      weaknesses: [
        'Slightly over word limit',
        'Could use more varied punctuation'
      ],
      scoreRange: '85-90'
    },
    
    // TOPIC 1: Climate Change (MEDIUM SCORE)
    {
      id: 'seed-climate-medium',
      topic: 'Climate change is the biggest threat facing humanity today. To what extent do you agree or disagree?',
      category: 'AGREE_DISAGREE',
      essayText: `I strongly agree that climate change is the biggest threat to humanity today. The effects are already visible everywhere and will get much worse if we don't act quickly.

Firstly, climate change affects everyone on Earth. Rising temperatures cause ice caps to melt, which raises sea levels. Many coastal cities like Miami and Venice are already flooding more often. Scientists predict millions of people will lose their homes in the next decades. This is different from other problems that only affect some countries.

Secondly, climate change damages our food supply. Droughts and floods destroy crops, making food more expensive. Poor countries suffer the most because they cannot afford to import food. This leads to hunger and conflicts over resources. We saw this happen in Syria where drought contributed to civil war.

Some people argue that nuclear war or diseases are bigger threats. While these are serious, they might never happen. Climate change is happening right now and getting worse every year. We can see the evidence in extreme weather, dying coral reefs, and extinct animals.

In conclusion, I believe climate change is definitely our biggest threat because it affects everything - our homes, food, health, and security. We need immediate action from all countries to reduce emissions and protect our planet for future generations.`,
      wordCount: 209,
      officialScore: 78,
      scoreBreakdown: {
        content: 2,  // 0-3 scale (mostly on topic)
        form: 2,     // 0-2 scale
        grammar: 1,  // 0-2 scale
        vocabulary: 2,  // 0-2 scale
        spelling: 1,  // 0-1 scale
        developmentCoherence: 2,  // 0-2 scale
        linguisticRange: 1  // 0-2 scale
        // Total: 11/14 -> 78/90
      },
      strengths: [
        'Clear position and structure',
        'Good use of examples',
        'Addresses counter-arguments',
        'Appropriate paragraphing'
      ],
      weaknesses: [
        'Some repetitive vocabulary',
        'Basic sentence structures',
        'Limited use of cohesive devices',
        'Could develop ideas more deeply'
      ],
      scoreRange: '75-84'
    },

    // TOPIC 2: Social Media (HIGH SCORE)
    {
      id: 'seed-social-high',
      topic: 'Social media has replaced face-to-face communication among teenagers. Do the advantages outweigh the disadvantages?',
      category: 'ADVANTAGES_DISADVANTAGES',
      essayText: `While social media has fundamentally transformed teenage communication patterns, claiming it has entirely replaced face-to-face interaction oversimplifies a nuanced reality. Although digital platforms offer significant benefits, their disadvantages ultimately outweigh the advantages when considering adolescent development.

The advantages of social media for teenage communication are undeniable. Digital platforms enable instant global connectivity, allowing young people to maintain relationships across geographical boundaries and cultural divides. During the pandemic, these tools proved invaluable for continuing education and preserving social connections. Furthermore, online communities provide crucial support networks for marginalized youth who might struggle to find acceptance in their immediate environment.

However, the disadvantages pose serious concerns for teenage development. Excessive screen time correlates with increased anxiety, depression, and body image issues among adolescents. The curated nature of social media creates unrealistic expectations and constant comparison, damaging self-esteem during crucial formative years. Moreover, digital communication lacks the nuanced non-verbal cues essential for developing emotional intelligence and empathy. The phenomenon of cyberbullying has created new forms of harassment that follow victims beyond school hours.

Most critically, over-reliance on digital interaction impairs the development of essential interpersonal skills. Face-to-face communication teaches conflict resolution, active listening, and reading social cues – abilities crucial for future professional and personal success that cannot be fully developed through screens.

In conclusion, while social media offers valuable connectivity tools, its negative impact on teenage psychological health and social development significantly outweighs its benefits, necessitating balanced usage guidelines.`,
      wordCount: 241,
      officialScore: 90,
      scoreBreakdown: {
        content: 3,  // 0-3 scale
        form: 2,     // 0-2 scale
        grammar: 2,  // 0-2 scale
        vocabulary: 2,  // 0-2 scale
        spelling: 1,  // 0-1 scale
        developmentCoherence: 2,  // 0-2 scale
        linguisticRange: 2  // 0-2 scale
        // Total: 14/14 -> 90/90
      },
      strengths: [
        'Exceptional vocabulary range',
        'Sophisticated analysis of both sides',
        'Excellent paragraph cohesion',
        'Complex grammatical structures',
        'Clear thesis with strong support'
      ],
      weaknesses: [
        'Slightly exceeds word limit'
      ],
      scoreRange: '85-90'
    },

    // TOPIC 2: Social Media (LOW SCORE)
    {
      id: 'seed-social-low',
      topic: 'Social media has replaced face-to-face communication among teenagers. Do the advantages outweigh the disadvantages?',
      category: 'ADVANTAGES_DISADVANTAGES',
      essayText: `Social media is very popular with teenagers today. I think disadvantages is more than advantages.

Advantages of social media is teenagers can talk to friends anytime. They can share photos and videos easy. Also can make new friends from other country. During covid many student use social media for study online. This help alot when cannot go school.

But social media have many problem. First, teenager spend too much time on phone and not talk to family. They always looking at screen even when eating dinner. Second, many teenager get bully online. Bad people write mean comment and make them sad. Also teenager see perfect photo on Instagram and feel ugly. This make depression.

Another problem is teenager not learn how to talk face to face. When they grow up they cannot do job interview good because no practice talking to people. Only know how to type message.

In conclusion, social media is bad for teenager because make them antisocial and unhappy. Parents should limit time on social media.`,
      wordCount: 152,
      officialScore: 65,
      scoreBreakdown: {
        content: 2,  // 0-3 scale
        form: 1,     // 0-2 scale (under word count)
        grammar: 1,  // 0-2 scale
        vocabulary: 1,  // 0-2 scale
        spelling: 1,  // 0-1 scale
        developmentCoherence: 1,  // 0-2 scale
        linguisticRange: 1  // 0-2 scale
        // Total: 8/14 -> 65/90
      },
      strengths: [
        'Clear opinion stated',
        'Some relevant examples',
        'Basic essay structure present'
      ],
      weaknesses: [
        'Many grammatical errors',
        'Limited vocabulary',
        'Under word count',
        'Poor sentence variety',
        'Weak conclusion'
      ],
      scoreRange: '65-74'
    },

    // TOPIC 3: Remote Work (HIGH SCORE)
    {
      id: 'seed-remote-high',
      topic: 'Companies should allow all employees to work from home permanently. To what extent do you agree or disagree?',
      category: 'AGREE_DISAGREE',
      essayText: `The pandemic-driven shift to remote work has sparked debate about permanent work-from-home policies. While I acknowledge the substantial benefits of remote work, mandating it universally for all employees would be counterproductive, as optimal arrangements vary significantly across industries, roles, and individual circumstances.

Remote work offers compelling advantages that justify its expansion. Employees save considerable time and money on commuting, achieving better work-life balance and reduced stress levels. Companies benefit from access to global talent pools, reduced overhead costs, and often increased productivity. Environmental benefits include decreased carbon emissions from reduced transportation and office energy consumption. Studies indicate that many remote workers report higher job satisfaction and engagement.

However, universal remote work presents significant challenges. Certain roles require physical presence – healthcare workers, laboratory researchers, and manufacturing personnel cannot perform their duties remotely. Creative industries often rely on spontaneous collaboration and brainstorming that virtual meetings cannot fully replicate. Furthermore, remote work can blur work-life boundaries, leading to burnout, while isolation may negatively impact mental health and career development, particularly for junior employees who benefit from mentorship and observational learning.

The optimal solution lies in flexible hybrid models tailored to specific organizational needs. Companies should assess each role individually, considering factors like collaboration requirements, employee preferences, and performance metrics. This customized approach maximizes benefits while addressing the limitations of both fully remote and traditional office settings.

In conclusion, while expanding remote work options is beneficial, mandating it universally ignores the diverse needs of different industries and individuals, making flexibility the key to successful implementation.`,
      wordCount: 249,
      officialScore: 91,
      scoreBreakdown: {
        content: 3,  // 0-3 scale
        form: 2,     // 0-2 scale
        grammar: 2,  // 0-2 scale
        vocabulary: 2,  // 0-2 scale
        spelling: 1,  // 0-1 scale
        developmentCoherence: 2,  // 0-2 scale
        linguisticRange: 2  // 0-2 scale
        // Total: 14/14 -> 91/90
      },
      strengths: [
        'Exceptional analysis with balanced perspective',
        'Sophisticated vocabulary throughout',
        'Excellent essay structure and flow',
        'Strong use of examples across industries',
        'Compelling conclusion with clear position'
      ],
      weaknesses: [
        'Slightly over word limit'
      ],
      scoreRange: '85-90'
    },

    // TOPIC 4: Education Costs (MEDIUM SCORE)
    {
      id: 'seed-education-medium',
      topic: 'University education should be free for all students. Discuss both views and give your opinion.',
      category: 'DISCUSS_BOTH_VIEWS',
      essayText: `The cost of university education is a controversial topic worldwide. Some believe it should be free for everyone, while others think students should pay. Both views have valid points worth considering.

Supporters of free education argue it creates equal opportunities. When university is free, poor students can attend and improve their lives. Countries like Germany and Norway offer free education and have successful economies. Free education also benefits society because more educated people means better workers and more innovation. Additionally, graduates without debt can spend money on houses and businesses instead of loan payments.

On the other hand, free education has drawbacks. Taxpayers must pay higher taxes to fund universities, which some find unfair if they didn't attend university themselves. Free education might also reduce the value of degrees if everyone has one. Some argue that paying fees makes students more serious about their studies and less likely to waste time.

Furthermore, governments have limited budgets and might need to spend money on healthcare or infrastructure instead of free university. Private funding from student fees allows universities to maintain quality facilities and attract good professors.

In my opinion, a mixed approach works best. Governments should provide free education for students from low-income families and courses that society needs like nursing or teaching. Other students can pay reasonable fees with access to low-interest loans. This balances accessibility with financial sustainability.`,
      wordCount: 223,
      officialScore: 80,
      scoreBreakdown: {
        content: 3,  // 0-3 scale
        form: 2,     // 0-2 scale
        grammar: 1,  // 0-2 scale
        vocabulary: 2,  // 0-2 scale
        spelling: 1,  // 0-1 scale
        developmentCoherence: 1,  // 0-2 scale
        linguisticRange: 1  // 0-2 scale
        // Total: 11/14 -> 80/90
      },
      strengths: [
        'Good balance of both viewpoints',
        'Clear paragraph organization',
        'Relevant examples provided',
        'Personal opinion well-integrated',
        'Appropriate conclusion'
      ],
      weaknesses: [
        'Some simple sentence structures',
        'Could use more advanced vocabulary',
        'Limited use of complex grammar'
      ],
      scoreRange: '75-84'
    },

    // TOPIC 5: AI Impact (VERY LOW SCORE)
    {
      id: 'seed-ai-verylow',
      topic: 'Artificial intelligence will eventually make human workers unnecessary. To what extent do you agree or disagree?',
      category: 'AGREE_DISAGREE',
      essayText: `I disagre that AI make human unnecessary. AI is just computer program not real person.

First AI cannot do all job. Computer cannot fix pipe or build house. Need human hand for this work. Also computer cannot be teacher because student need real person to understand feeling. My teacher help me when sad but computer cannot do.

Second AI make mistake sometime. Last week I use ChatGPT for homework but answer wrong. If pilot job replace by AI and AI make mistake plane will crash. Very dangerous. Human more careful than computer.

But some people say AI is very smart and getting smarter. Maybe oneday AI can do everything. I still think human important because we have feeling and creative. Computer just follow program.

In conclusion AI cannot replace human because human special and have emotion. We should use AI to help us not replace us.`,
      wordCount: 134,
      officialScore: 48,
      scoreBreakdown: {
        content: 1,  // 0-3 scale (partially relevant)
        form: 0,     // 0-2 scale (significantly under word count)
        grammar: 0,  // 0-2 scale
        vocabulary: 1,  // 0-2 scale
        spelling: 0,  // 0-1 scale
        developmentCoherence: 1,  // 0-2 scale
        linguisticRange: 0  // 0-2 scale
        // Total: 3/14 -> 48/90
      },
      strengths: [
        'Opinion is stated',
        'Some attempt at examples'
      ],
      weaknesses: [
        'Severe grammatical errors throughout',
        'Very limited vocabulary',
        'Significantly under word count',
        'Poor essay structure',
        'Ideas not fully developed',
        'Many spelling errors'
      ],
      scoreRange: '25-64'
    },

    // TOPIC 6: Healthcare (HIGH SCORE)
    {
      id: 'seed-health-high',
      topic: 'Prevention is better than cure. Governments should invest more in preventive healthcare than treatment. Discuss both views and give your opinion.',
      category: 'DISCUSS_BOTH_VIEWS',
      essayText: `The allocation of healthcare resources between prevention and treatment represents a fundamental policy challenge facing modern governments. While the adage "prevention is better than cure" holds considerable merit, I believe a balanced approach incorporating both strategies is essential for comprehensive public health.

Proponents of prioritizing preventive healthcare present compelling arguments. Preventive measures, including vaccination programs, health education, and early screening initiatives, are significantly more cost-effective than treating advanced diseases. For instance, childhood immunization programs have virtually eradicated diseases like polio at a fraction of the cost of treating paralysis. Moreover, prevention improves quality of life by helping people avoid illness entirely, reducing both personal suffering and economic productivity losses. Countries like Japan, with strong preventive healthcare systems, enjoy higher life expectancies and lower per-capita healthcare costs.

However, those favoring treatment investment raise equally valid concerns. Existing patients with chronic conditions or acute illnesses require immediate care that prevention cannot address. Abandoning treatment infrastructure would be ethically unconscionable and politically untenable. Furthermore, medical breakthroughs often emerge from treatment research – cancer therapies developed for patients have led to preventive strategies. Additionally, some conditions remain unpreventable despite our best efforts, necessitating robust treatment capabilities.

In my view, the optimal approach integrates both strategies synergistically. Governments should increase preventive healthcare funding without diminishing treatment capacity. This dual investment creates a comprehensive system where prevention reduces future treatment burden while maintaining care for current patients.

In conclusion, while prevention offers superior long-term benefits, responsible healthcare policy must balance preventive and treatment investments to serve all citizens effectively.`,
      wordCount: 256,
      officialScore: 92,
      scoreBreakdown: {
        content: 3,  // 0-3 scale
        form: 2,     // 0-2 scale
        grammar: 2,  // 0-2 scale
        vocabulary: 2,  // 0-2 scale
        spelling: 1,  // 0-1 scale
        developmentCoherence: 2,  // 0-2 scale
        linguisticRange: 2  // 0-2 scale
        // Total: 14/14 -> 92/90
      },
      strengths: [
        'Exceptional vocabulary and phrasing',
        'Perfectly balanced discussion',
        'Sophisticated argument development',
        'Excellent use of specific examples',
        'Strong academic tone throughout'
      ],
      weaknesses: [
        'Slightly over word limit'
      ],
      scoreRange: '85-90'
    }
  ];

  // Insert seed essays
  for (const essay of seedEssays) {
    try {
      await docClient.send(new UpdateCommand({
        TableName: goldStandardTableName,
        Key: { id: essay.id },
        UpdateExpression: 'SET topic = :topic, category = :category, essayText = :essayText, wordCount = :wordCount, officialScore = :officialScore, scoreBreakdown = :scoreBreakdown, strengths = :strengths, weaknesses = :weaknesses, scoreRange = :scoreRange, createdAt = :createdAt, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':topic': essay.topic,
          ':category': essay.category,
          ':essayText': essay.essayText,
          ':wordCount': essay.wordCount,
          ':officialScore': essay.officialScore,
          ':scoreBreakdown': essay.scoreBreakdown,
          ':strengths': essay.strengths,
          ':weaknesses': essay.weaknesses,
          ':scoreRange': essay.scoreRange,
          ':createdAt': new Date().toISOString(),
          ':updatedAt': new Date().toISOString()
        }
      }));
      
      console.log(`Seeded essay ${essay.id}`);
    } catch (error) {
      console.error(`Error seeding essay ${essay.id}:`, error);
    }
  }
  
  console.log('Seed data insertion complete');
}