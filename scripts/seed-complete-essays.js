const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: 'ap-south-1' });

// Table name for vector-v2 sandbox
const TABLE_NAME = 'GoldStandardEssay-toe5fxy46rae3ir5mqpzcwndt4-NONE';

// Complete seed essays array
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
      content: 3,
      form: 2,
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 2
    },
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
      content: 2,
      form: 2,
      grammar: 1,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 1
    },
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
      content: 3,
      form: 2,
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 2
    },
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
      content: 2,
      form: 1,
      grammar: 1,
      vocabulary: 1,
      spelling: 1,
      developmentCoherence: 1,
      linguisticRange: 1
    },
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
      content: 3,
      form: 2,
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 2
    },
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
      content: 3,
      form: 2,
      grammar: 1,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 1,
      linguisticRange: 1
    },
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
      content: 1,
      form: 0,
      grammar: 0,
      vocabulary: 1,
      spelling: 0,
      developmentCoherence: 1,
      linguisticRange: 0
    },
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
      content: 3,
      form: 2,
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 2
    },
    scoreRange: '85-90'
  }
];

async function generateEmbedding(text) {
  try {
    const truncatedText = text.substring(0, 8000);
    
    const input = {
      modelId: 'amazon.titan-embed-text-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: truncatedText
      })
    };
    
    const command = new InvokeModelCommand(input);
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (!responseBody.embedding || !Array.isArray(responseBody.embedding)) {
      throw new Error('Invalid embedding response from Titan');
    }
    
    return responseBody.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function seedAllEssays() {
  console.log(`\n🚀 Seeding ${seedEssays.length} gold standard essays to table: ${TABLE_NAME}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const essay of seedEssays) {
    try {
      console.log(`📝 Processing essay ${essay.id} (${essay.scoreRange})...`);
      
      // Generate embedding
      const combinedText = `Topic: ${essay.topic}\n\nEssay: ${essay.essayText.substring(0, 3000)}`;
      const embedding = await generateEmbedding(combinedText);
      console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
      
      // Save to DynamoDB
      const params = {
        TableName: TABLE_NAME,
        Key: { id: essay.id },
        UpdateExpression: 'SET topic = :topic, category = :category, essayText = :essayText, wordCount = :wordCount, officialScore = :officialScore, scoreBreakdown = :scoreBreakdown, strengths = :strengths, weaknesses = :weaknesses, scoreRange = :scoreRange, embedding = :embedding, createdAt = :createdAt, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':topic': essay.topic,
          ':category': essay.category,
          ':essayText': essay.essayText,
          ':wordCount': essay.wordCount,
          ':officialScore': essay.officialScore,
          ':scoreBreakdown': essay.scoreBreakdown,
          ':strengths': essay.strengths || [],
          ':weaknesses': essay.weaknesses || [],
          ':scoreRange': essay.scoreRange,
          ':embedding': embedding,
          ':createdAt': new Date().toISOString(),
          ':updatedAt': new Date().toISOString()
        }
      };
      
      await docClient.send(new UpdateCommand(params));
      console.log(`✅ Successfully seeded essay ${essay.id}\n`);
      successCount++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error seeding essay ${essay.id}:`, error.message, '\n');
      errorCount++;
    }
  }
  
  console.log('\n📊 Seeding Summary:');
  console.log(`✅ Success: ${successCount} essays`);
  console.log(`❌ Errors: ${errorCount} essays`);
  console.log('\n🎉 Seeding process complete!');
}

seedAllEssays().catch(console.error);