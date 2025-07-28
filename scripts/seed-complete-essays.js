const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: 'ap-south-1' });

// Table name for new root sandbox
const TABLE_NAME = 'GoldStandardEssay-m2naunrofnagdapazpyg44vavq-NONE';

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
  },
  // TOPIC 6: Online Education (HIGH SCORE)
  {
    id: 'seed-online-edu-high',
    topic: 'Online education is more effective than traditional classroom learning. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `While online education has revolutionized learning accessibility, claiming it surpasses traditional classroom effectiveness oversimplifies educational complexity. I partially disagree with this statement, as effectiveness depends significantly on subject matter, student characteristics, and implementation quality.

Online education offers undeniable advantages that enhance learning effectiveness for certain contexts. Digital platforms provide unprecedented flexibility, allowing students to access world-class instruction regardless of geographical constraints. Self-paced learning accommodates diverse learning speeds, while recorded lectures enable review and reinforcement. Additionally, online education often costs less, making quality education more accessible. During the pandemic, online learning proved invaluable in maintaining educational continuity.

However, traditional classrooms excel in areas where online education struggles. Face-to-face interaction facilitates immediate feedback, spontaneous discussions, and non-verbal communication crucial for comprehensive understanding. Laboratory sciences, performing arts, and hands-on vocational training require physical presence and equipment. Moreover, classroom environments provide structured learning, peer collaboration, and social development opportunities that isolated online learning cannot fully replicate.

The effectiveness ultimately depends on individual learning styles and circumstances. Visual learners may thrive with multimedia online content, while kinesthetic learners benefit from classroom activities. Motivated, self-directed students often excel online, whereas those requiring external structure and accountability perform better in traditional settings.

In conclusion, neither mode is universally superior. The most effective approach combines both methodologies, leveraging online flexibility for theoretical content while utilizing classrooms for interactive, practical, and social learning experiences. Educational institutions should focus on hybrid models that maximize both formats' strengths.`,
    wordCount: 245,
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
  // TOPIC 6: Online Education (MEDIUM SCORE)
  {
    id: 'seed-online-edu-medium',
    topic: 'Online education is more effective than traditional classroom learning. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `I disagree that online education is more effective than traditional classroom learning. While online learning has some benefits, face-to-face education provides better results for most students.

Traditional classrooms offer direct interaction between teachers and students. When students don't understand something, they can immediately ask questions and get answers. Teachers can see students' facial expressions and body language to know if they understand the lesson. This immediate feedback is very important for effective learning. In online classes, communication delays and technical problems often interrupt the learning process.

Furthermore, classroom learning provides better focus and discipline. At school, students must pay attention without distractions from home. Many students struggle to concentrate during online classes because of family members, pets, or the temptation to browse other websites. Schools also provide important social interactions where students learn teamwork and communication skills.

However, online education does have advantages. Students can learn at their own pace and review recorded lessons multiple times. It's also more convenient for people who live far from schools or have busy schedules. Online courses often cost less than traditional education.

Despite these benefits, traditional classrooms remain more effective overall. The combination of direct teacher guidance, peer interaction, and structured environment creates better learning outcomes. While online education can supplement classroom learning, it cannot fully replace the benefits of face-to-face instruction.

In conclusion, traditional classroom learning is still more effective than online education for most students, though online learning can be a useful additional tool.`,
    wordCount: 243,
    officialScore: 79,
    scoreBreakdown: {
      content: 2,
      form: 2,
      grammar: 2,
      vocabulary: 1,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 1
    },
    scoreRange: '75-84'
  },
  // TOPIC 7: Single-use Plastics (HIGH SCORE)
  {
    id: 'seed-plastics-high',
    topic: 'Governments should ban all single-use plastics immediately, regardless of economic impact. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `While the environmental crisis demands urgent action against plastic pollution, an immediate blanket ban on single-use plastics, disregarding economic consequences, would prove counterproductive. I largely disagree with this absolutist approach, advocating instead for strategic, phased implementation.

The environmental imperative for reducing plastic consumption is undeniable. Microplastics contaminate food chains globally, while plastic waste devastates marine ecosystems. The Great Pacific Garbage Patch exemplifies humanity's plastic crisis, with devastating consequences for biodiversity. Single-use plastics contribute disproportionately to this pollution, often used for mere minutes before persisting for centuries.

However, immediate implementation ignoring economic impact would create severe disruptions. Many industries, particularly healthcare and food safety, rely on single-use plastics for hygiene and contamination prevention. Developing nations often lack infrastructure for alternatives, making abrupt transitions impossible. Small businesses would face bankruptcy from sudden compliance costs, potentially triggering unemployment spikes and economic recession.

Furthermore, hasty bans without adequate alternatives might generate worse environmental outcomes. Paper alternatives often require more energy and water to produce, while reusable options need proper sanitization infrastructure. Without systematic planning, consumers might shift to equally harmful alternatives.

The optimal approach involves graduated implementation with economic support mechanisms. Governments should phase bans over 3-5 years, starting with non-essential items like straws and bags. Simultaneously, they must invest in alternative development, provide transition subsidies for affected businesses, and build recycling infrastructure.

In conclusion, while eliminating single-use plastics remains crucial, immediate bans disregarding economic factors would undermine long-term sustainability goals through social disruption and inadequate alternatives.`,
    wordCount: 248,
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
  // TOPIC 8: Globalization (MEDIUM SCORE)
  {
    id: 'seed-globalization-medium',
    topic: 'International trade barriers are being reduced worldwide. Do the advantages of globalization outweigh the disadvantages?',
    category: 'ADVANTAGES_DISADVANTAGES',
    essayText: `Globalization through reduced trade barriers has transformed the world economy. While this brings both benefits and problems, I believe the advantages outweigh the disadvantages overall.

The advantages of globalization are significant. First, free trade makes products cheaper for consumers. When countries can import goods from wherever they are produced most efficiently, prices decrease. For example, electronics from Asia and agricultural products from developing nations are now affordable worldwide. Second, globalization creates jobs and economic growth. Companies can expand into new markets, creating employment opportunities. Many developing countries have improved their economies through exports.

Additionally, globalization promotes cultural exchange and innovation. People can access products, ideas, and technologies from around the world. This sharing of knowledge accelerates progress in science, medicine, and technology. International cooperation also helps address global challenges like climate change and pandemics.

However, globalization has serious disadvantages. Local industries often cannot compete with cheap imports, causing job losses. Traditional cultures may be overwhelmed by global brands and Western influence. Income inequality has increased as wealthy corporations profit while workers face job insecurity. Environmental damage also increases as production moves to countries with weaker regulations.

Despite these problems, the benefits are greater. Millions have escaped poverty through global trade opportunities. Consumers enjoy better products at lower prices. International cooperation prevents conflicts and solves shared problems. The disadvantages can be managed through proper regulations and support for affected workers.

In conclusion, while globalization creates challenges, its advantages in reducing poverty, improving living standards, and promoting cooperation outweigh the disadvantages.`,
    wordCount: 249,
    officialScore: 81,
    scoreBreakdown: {
      content: 2,
      form: 2,
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 1
    },
    scoreRange: '75-84'
  },
  // TOPIC 9: Youth Unemployment (HIGH SCORE)
  {
    id: 'seed-youth-unemployment-high',
    topic: 'Youth unemployment rates are increasing globally. What are the main causes of this problem and what solutions can you suggest?',
    category: 'PROBLEM_SOLUTION',
    essayText: `Rising youth unemployment represents a critical global challenge threatening economic stability and social cohesion. This multifaceted problem stems from structural economic shifts and educational mismatches, requiring comprehensive policy interventions.

The primary causes are interconnected and systemic. Technological automation has eliminated many entry-level positions traditionally filled by young workers, while remaining jobs demand specialized skills. Educational systems often fail to adapt curricula to market needs, producing graduates with outdated qualifications. Additionally, economic recessions disproportionately impact youth employment, as companies prioritize experienced workers during downturns. The gig economy's growth offers flexibility but lacks stability and benefits crucial for career development.

Geographic disparities compound these challenges. Rural youth face limited local opportunities, while urban areas' high living costs barrier entry despite job availability. Furthermore, employer preferences for experienced candidates create a paradoxical situation where youth cannot gain experience without employment.

Solutions must address both supply and demand factors. Governments should incentivize businesses through tax credits for hiring and training young workers. Educational reform is crucial, integrating vocational training, apprenticeships, and industry partnerships into curricula. Digital literacy programs can prepare youth for emerging sectors.

Additionally, entrepreneurship support through microfinance and mentorship programs can create self-employment opportunities. Public works programs focused on infrastructure and environmental projects can provide immediate employment while building valuable skills. International cooperation sharing best practices can accelerate solution implementation.

In conclusion, combating youth unemployment requires coordinated efforts combining educational reform, economic incentives, and innovative employment programs. Early intervention is essential to prevent long-term scarring effects on career prospects.`,
    wordCount: 247,
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
  },
  // TOPIC 10: Food Waste (LOW SCORE)
  {
    id: 'seed-food-waste-low',
    topic: 'Food waste is a major problem in developed countries while others face starvation. What are the causes of this issue and what measures can be taken to address it?',
    category: 'PROBLEM_SOLUTION',
    essayText: `Food waste is big problem today. Rich country throw away food but poor country people hungry. This very unfair situation need to fix.

Causes of food waste many. First, supermarket throw food when expire date come even food still good. They afraid customer complaint if sell old food. Also people buy too much food because cheap. They forget in fridge and food become bad. Restaurant also waste alot because make too much food everyday.

Another cause is people not know how serious problem. They think no problem throw away little bit food. But when everyone throw away little bit, become very big amount. Rich country people never experience hungry so they not understand.

For solve this problem need many solution. Government should make law about food waste. Maybe give penalty to supermarket that throw away good food. Should donate to poor people instead. Also need education program teach people about food waste. Show them how many people starving in world.

Technology also can help. Make app to share extra food with neighbor. Restaurant can sell cheap food end of day instead throw away. Also need better system send extra food from rich country to poor country.

In conclusion food waste very serious problem but can solve if everyone work together. Need change attitude about food and make better system for sharing.`,
    wordCount: 211,
    officialScore: 64,
    scoreBreakdown: {
      content: 1,
      form: 1,
      grammar: 0,
      vocabulary: 1,
      spelling: 1,
      developmentCoherence: 1,
      linguisticRange: 0
    },
    scoreRange: '50-65'
  },
  // TOPIC 11: Four-day Work Week (HIGH SCORE)
  {
    id: 'seed-fourday-high',
    topic: 'A four-day work week should become the standard in all developed countries. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `The proposition of standardizing four-day work weeks across developed nations represents a paradigm shift in employment philosophy. While this model offers compelling benefits for work-life balance and productivity, I partially disagree with universal implementation due to sector-specific constraints and economic complexities.

Evidence supporting reduced work weeks is increasingly persuasive. Microsoft Japan's experiment yielded 40% productivity improvements, while Iceland's trials demonstrated maintained output with enhanced employee wellbeing. The traditional five-day model, established during industrial revolution conditions, appears outdated for knowledge-based economies. Reduced commuting decreases carbon emissions, while improved mental health could alleviate healthcare system burdens. Furthermore, additional leisure time stimulates consumer spending and cultural engagement.

However, universal application overlooks critical sectoral differences. Healthcare, emergency services, and education require continuous coverage that four-day schedules cannot accommodate without substantial workforce expansion. Manufacturing and retail operations with fixed costs might face profitability challenges. Small businesses particularly struggle with reduced operational days while maintaining competitive service levels. International business coordination becomes complex when countries operate different schedules.

The optimal approach involves selective implementation based on industry characteristics. Knowledge-based sectors, technology companies, and administrative roles suit compressed schedules. Essential services require innovative shift patterns maintaining coverage. Governments should incentivize pilot programs, allowing organizations to develop context-specific models rather than mandating blanket changes.

In conclusion, while four-day work weeks offer significant advantages, declaring them universal standards ignores economic realities and sectoral diversity. Flexible adoption allowing industry-specific adaptations represents a more pragmatic path toward improved work-life balance.`,
    wordCount: 244,
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
  // TOPIC 12: Urban vs Rural Living (MEDIUM SCORE)
  {
    id: 'seed-urban-rural-medium',
    topic: 'More people are choosing to live in large cities rather than rural areas. Do the advantages outweigh the disadvantages?',
    category: 'ADVANTAGES_DISADVANTAGES',
    essayText: `The global trend of urbanization continues as millions migrate from rural areas to cities annually. While urban living offers numerous opportunities, I believe the advantages slightly outweigh the disadvantages for most people.

Cities provide significant advantages for residents. Employment opportunities are more diverse and numerous in urban areas, with higher salaries typically available. Educational institutions, from schools to universities, offer better resources and variety in cities. Healthcare facilities in urban areas usually have advanced equipment and specialist doctors. Additionally, cities offer superior infrastructure including public transportation, entertainment venues, and cultural activities. The concentration of people also creates networking opportunities for career and business development.

However, urban living presents considerable challenges. The cost of living, particularly housing, is substantially higher in cities. Many urban residents spend large portions of income on small apartments. Pollution levels in cities harm health, while traffic congestion wastes hours daily. The fast-paced lifestyle often creates stress and mental health issues. Crime rates are typically higher in densely populated areas. Furthermore, urban residents lose connection with nature and community bonds are often weaker than in rural areas.

Despite these drawbacks, advantages generally prevail. Economic opportunities in cities enable people to improve living standards and escape poverty. Access to quality education and healthcare significantly impacts life outcomes. While rural areas offer peace and community, they often lack basic services and opportunities for advancement.

In conclusion, although city living involves compromises regarding cost and lifestyle, the opportunities for personal and professional development make urban advantages outweigh disadvantages for most people seeking better lives.`,
    wordCount: 250,
    officialScore: 82,
    scoreBreakdown: {
      content: 2,
      form: 2,
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 1
    },
    scoreRange: '75-84'
  },
  // TOPIC 13: Cashless Society (LOW SCORE)
  {
    id: 'seed-cashless-low',
    topic: 'Cashless societies are becoming increasingly common. Do the advantages of digital payments outweigh the disadvantages?',
    category: 'ADVANTAGES_DISADVANTAGES',
    essayText: `Nowadays many country becoming cashless society. People use card and phone to pay everything. This have good and bad points but I think disadvantage more than advantage.

Advantage of digital payment is convenient. No need carry heavy coin and paper money. Just bring phone or card can buy anything. Also safer because thief cannot steal digital money easy like cash. Online shopping also very easy with digital payment. Can buy from anywhere in world. Transaction also fast no need wait for change.

But many problem with cashless society. First, old people dont know how use technology. My grandmother cannot use smartphone so how she buy things? Also poor people maybe no have bank account or smartphone. This unfair for them. 

Another big problem is when system down cannot buy anything. Last month bank system crash and many people cannot pay for food. Very dangerous rely only on technology. Also government and company can track every purchase. No privacy anymore they know everything we buy.

Hacker also big threat. They can steal money from account and very difficult get back. With cash this not happen. Also many small shop must pay fee for card machine. This expensive for them.

In conclusion cashless society have some benefit but too many risk. We should keep both cash and digital payment not only one. This safer for everyone.`,
    wordCount: 213,
    officialScore: 67,
    scoreBreakdown: {
      content: 1,
      form: 2,
      grammar: 0,
      vocabulary: 1,
      spelling: 1,
      developmentCoherence: 1,
      linguisticRange: 0
    },
    scoreRange: '65-74'
  },
  // TOPIC 14: Free Healthcare (HIGH SCORE)
  {
    id: 'seed-healthcare-high',
    topic: 'Some believe healthcare should be completely free for all citizens, while others think people should pay for medical services. Discuss both views and give your opinion.',
    category: 'DISCUSS_BOTH_VIEWS',
    essayText: `Healthcare accessibility remains a contentious global debate, with fundamental disagreements about whether medical services constitute a basic right or market commodity. While both perspectives offer valid arguments, I believe a hybrid model combining universal basic coverage with optional private services best serves societal needs.

Proponents of free healthcare emphasize moral and practical imperatives. Healthcare as a fundamental human right ensures no citizen suffers or dies due to financial constraints. Countries like Canada and the UK demonstrate that universal systems can deliver quality care while maintaining lower per-capita costs than privatized alternatives. Free healthcare promotes preventive medicine, reducing long-term costs through early intervention. Moreover, it eliminates medical bankruptcies, a leading cause of financial ruin in countries without universal coverage. Public health benefits extend beyond individuals, as comprehensive coverage prevents epidemic spread and maintains productive workforces.

Conversely, those favoring paid services raise legitimate concerns about sustainability and quality. Free healthcare systems often struggle with funding, leading to long waiting times and restricted treatment options. Market-based systems arguably incentivize innovation and efficiency through competition. Additionally, personal payment responsibility might encourage healthier lifestyles and reduce frivolous medical consultations. Some argue that taxpayer-funded healthcare unfairly burdens healthy individuals and those who invest in preventive care.

The optimal solution integrates both approaches. Governments should guarantee universal basic healthcare covering essential services, emergencies, and preventive care, funded through progressive taxation. Simultaneously, private options could offer expedited service, elective procedures, and premium amenities. This ensures healthcare accessibility while maintaining innovation incentives and personal choice.

In conclusion, pure extremes of completely free or entirely privatized healthcare both present significant drawbacks. A thoughtfully designed hybrid system can harness both models' strengths while mitigating their weaknesses.`,
    wordCount: 282,
    officialScore: 93,
    scoreBreakdown: {
      content: 3,
      form: 1,  // Penalized for exceeding word limit
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 2
    },
    scoreRange: '85-90'
  },
  // TOPIC 15: Private Vehicles Ban (MEDIUM SCORE)
  {
    id: 'seed-vehicles-medium',
    topic: 'Some argue that private vehicles should be banned from city centers, while others believe personal transportation freedom is essential. Discuss both views and give your opinion.',
    category: 'DISCUSS_BOTH_VIEWS',
    essayText: `The debate over banning private vehicles from city centers reflects tensions between environmental concerns and individual freedom. Both sides present compelling arguments that deserve careful consideration.

Those supporting vehicle bans highlight environmental and quality of life improvements. City centers suffer from severe air pollution, with vehicles producing harmful emissions affecting residents' health. Studies show that car-free zones reduce respiratory diseases and create quieter, more pleasant environments. Traffic congestion wastes productivity and fuel, problems eliminated by vehicle restrictions. Pedestrian-only areas encourage walking and cycling, promoting public health. European cities like Amsterdam demonstrate that car-free centers can thrive economically while enhancing livability.

However, opponents emphasize practical concerns and personal liberty. Many people depend on private vehicles for mobility, especially elderly or disabled individuals who cannot easily use public transport. Parents with young children find cars essential for daily activities. Delivery services and emergency vehicles require road access. Furthermore, inadequate public transportation in many cities makes private vehicles necessary. Business owners worry that restricted access might reduce customer visits, harming local economies.

In my opinion, complete bans are too extreme, but cities should implement partial restrictions. A balanced approach could include congestion charging, limiting access during peak hours, and creating car-free zones in historic districts. Cities must first improve public transportation, provide park-and-ride facilities, and ensure accessibility for all citizens before restricting private vehicles.

In conclusion, while environmental benefits of vehicle bans are significant, cities must balance these with citizens' practical needs. Gradual implementation with infrastructure improvements offers the best path forward.`,
    wordCount: 249,
    officialScore: 83,
    scoreBreakdown: {
      content: 2,
      form: 2,
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 1
    },
    scoreRange: '75-84'
  },
  // TOPIC 16: Unpaid Internships (HIGH SCORE)
  {
    id: 'seed-internships-high',
    topic: 'Some people believe that unpaid internships exploit young workers, while others see them as valuable learning opportunities. Discuss both views and give your opinion.',
    category: 'DISCUSS_BOTH_VIEWS',
    essayText: `The prevalence of unpaid internships in competitive industries has sparked intense debate about their ethical implications and educational value. While both perspectives merit consideration, I believe unpaid internships often constitute exploitation, though certain contexts may justify their existence.

Critics rightfully highlight the exploitative nature of unpaid internships. These positions frequently involve substantial work contributions that would otherwise require paid employees, essentially providing free labor under the guise of education. This practice disproportionately advantages wealthy students who can afford to work without compensation, perpetuating socioeconomic inequality. Many unpaid interns perform menial tasks offering minimal learning value, contradicting the educational justification. Furthermore, the normalization of unpaid work devalues professional contributions and potentially violates labor laws designed to protect workers from exploitation.

Conversely, proponents emphasize legitimate educational benefits. Quality internships provide invaluable industry exposure, mentorship opportunities, and practical skill development unavailable in academic settings. For highly competitive fields like media or fashion, internships offer crucial networking opportunities and portfolio development. Some organizations, particularly non-profits with limited budgets, genuinely cannot afford paid positions but offer meaningful experience. Additionally, many unpaid internships lead to full-time employment, serving as extended job interviews benefiting both parties.

The critical distinction lies in the internship's structure and intent. Legitimate educational internships should prioritize learning over productivity, include structured mentorship, and limit duration. However, positions primarily benefiting employers through free labor clearly constitute exploitation.

In conclusion, while some unpaid internships provide genuine educational value, the majority exploit young workers' desperation for experience. Stricter regulations ensuring educational content and limiting unpaid work duration would better balance learning opportunities with fair labor practices.`,
    wordCount: 263,
    officialScore: 88,
    scoreBreakdown: {
      content: 3,
      form: 1,  // Penalty for exceeding word limit
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 2
    },
    scoreRange: '85-90'
  },
  // TOPIC 16: Unpaid Internships (MEDIUM SCORE)
  {
    id: 'seed-internships-medium',
    topic: 'Some people believe that unpaid internships exploit young workers, while others see them as valuable learning opportunities. Discuss both views and give your opinion.',
    category: 'DISCUSS_BOTH_VIEWS',
    essayText: `Unpaid internships are common in many industries today, but people disagree about whether they are fair. Some think they exploit young people, while others believe they provide important experience. Both views have valid points.

Those who oppose unpaid internships argue they are unfair to workers. Young people do real work that helps companies but receive no payment. This means only students from wealthy families can afford these opportunities, because they need financial support while working for free. Poor students must take paid jobs instead, missing chances to gain experience in their chosen field. Additionally, some companies use unpaid interns to replace paid employees, which is wrong.

However, supporters say unpaid internships offer valuable benefits. Students gain practical experience that universities cannot provide. They learn how their industry really works and develop professional skills. Internships also help students build networks and meet potential employers. Many companies hire their best interns after graduation, so these positions can lead to good jobs. For students, the experience and connections may be worth more than temporary wages.

In my opinion, unpaid internships can be acceptable if they truly focus on education. Companies should provide real training, mentorship, and meaningful projects. However, if interns do regular employee work, they deserve payment. The government should create clear rules about what unpaid internships can include.

In conclusion, while unpaid internships can provide learning opportunities, many exploit young workers. Better regulations would ensure internships benefit students rather than providing free labor for companies.`,
    wordCount: 241,
    officialScore: 80,
    scoreBreakdown: {
      content: 2,
      form: 2,
      grammar: 2,
      vocabulary: 1,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 1
    },
    scoreRange: '75-84'
  },
  // TOPIC 17: Social Media Influencers (HIGH SCORE)
  {
    id: 'seed-influencers-high',
    topic: 'Social media influencers have more impact on young people than traditional role models like teachers and parents. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `The digital revolution has fundamentally altered influence dynamics among youth, with social media personalities commanding unprecedented attention. While influencers undeniably wield substantial impact, claiming they surpass traditional role models oversimplifies the complex nature of youth development and influence.

Social media influencers possess unique advantages in capturing youth attention. Their content accessibility, relatability, and entertainment value create parasocial relationships that feel authentic to young followers. Influencers shape consumer behavior, lifestyle choices, and even career aspirations through carefully curated content. The algorithmic nature of social platforms ensures constant exposure, reinforcing their messages. Additionally, influencers often address topics traditional authorities avoid, providing guidance on contemporary issues like mental health, sexuality, and social justice that resonate with youth experiences.

However, traditional role models maintain irreplaceable influence through direct, sustained relationships. Parents shape fundamental values, emotional security, and behavioral patterns through years of daily interaction. Teachers provide structured knowledge, critical thinking skills, and personalized guidance that influencers cannot replicate. These relationships involve accountability, genuine care, and understanding of individual needs that parasocial relationships inherently lack. Moreover, traditional role models witness and respond to youth's complete personalities, not just their online personas.

The influence hierarchy depends significantly on individual circumstances and life stages. While influencers may dominate superficial choices like fashion or entertainment preferences, traditional role models typically guide crucial life decisions regarding education, relationships, and core values.

In conclusion, although social media influencers command considerable attention and shape certain youth behaviors, traditional role models retain deeper, more fundamental influence through authentic relationships and sustained guidance. The key lies in helping young people critically evaluate all influences rather than positioning them competitively.`,
    wordCount: 266,
    officialScore: 90,
    scoreBreakdown: {
      content: 3,
      form: 1,  // Penalty for exceeding word limit
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 2
    },
    scoreRange: '85-90'
  },
  // TOPIC 17: Social Media Influencers (LOW SCORE)
  {
    id: 'seed-influencers-low',
    topic: 'Social media influencers have more impact on young people than traditional role models like teachers and parents. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `I agree social media influencer have more impact on young people today than parent and teacher. This is big problem for society.

Young people spend many hour everyday on social media looking at influencer. They watch YouTube, Instagram, TikTok all the time. Influencer show perfect life with expensive thing and young people want copy them. My cousin always talking about her favorite influencer and want buy same clothes and makeup. She dont listen to parent anymore only care what influencer say.

Teacher and parent cannot compete with influencer because not interesting like social media. When teacher talk about study, student thinking about TikTok video. Parent try give good advice but children say influencer know better about modern life. Also influencer more fun and entertaining so young people prefer watching them.

But this very dangerous because influencer only want make money. They dont care about young people future just want them buy product. Many influencer promote unhealthy thing like extreme diet or dangerous challenge. Parent and teacher actually care about children but young people dont realize.

However some good influencer exist who teach useful thing. But most influencer bad influence on youth. They make young people materialistic and unrealistic about life.

In conclusion I strongly agree that influencer have too much impact on young people. Parent and teacher influence becoming weaker. This will cause many problem for future generation.`,
    wordCount: 214,
    officialScore: 66,
    scoreBreakdown: {
      content: 1,
      form: 2,
      grammar: 0,
      vocabulary: 1,
      spelling: 1,
      developmentCoherence: 1,
      linguisticRange: 0
    },
    scoreRange: '65-74'
  },
  
  // TOPIC 16: Space Exploration (HIGH SCORE - 85-90)
  {
    id: 'seed-space-high',
    topic: 'Governments should prioritize funding for space exploration over addressing problems on Earth. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `While space exploration represents humanity's ambitious quest for knowledge and survival beyond Earth, I strongly disagree that it should receive priority over addressing terrestrial problems. The immediate challenges facing our planet demand urgent attention and resources before we venture into cosmic pursuits.

Earth's pressing issues require immediate intervention. Climate change threatens ecosystems and human civilization, with rising temperatures, extreme weather events, and sea-level rise affecting billions. Poverty afflicts over 700 million people globally, denying basic necessities like food, clean water, and healthcare. Educational inequality perpetuates cycles of disadvantage, while pandemic preparedness remains critically underfunded despite COVID-19's devastating demonstration of our vulnerabilities. These challenges directly impact human survival and quality of life today, not in hypothetical futures.

However, space exploration advocates present compelling arguments. Technological innovations from space programs have yielded practical benefits, including satellite communications, GPS navigation, and medical devices. The search for habitable planets could provide humanity's ultimate insurance policy against extinction events. Additionally, space exploration inspires scientific advancement and international cooperation, fostering innovation that could solve terrestrial problems.

Nevertheless, the opportunity cost of prioritizing space over Earth is unconscionable. The billions spent on Mars missions could eliminate malaria, provide universal education, or develop renewable energy infrastructure. While space exploration should continue, it must remain secondary to solving immediate human suffering and environmental destruction.

In conclusion, although space exploration offers long-term benefits and scientific advancement, governments must prioritize addressing Earth's urgent crises. Only after ensuring basic human needs and planetary sustainability should substantial resources be allocated to cosmic ventures.`,
    wordCount: 249,
    officialScore: 88,
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
  
  // TOPIC 16: Space Exploration (MEDIUM SCORE - 75-84)
  {
    id: 'seed-space-medium',
    topic: 'Governments should prioritize funding for space exploration over addressing problems on Earth. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `I disagree with prioritizing space exploration funding over Earth's problems. While space research is important, our planet's immediate issues need more urgent attention and resources.

First, many serious problems on Earth require immediate solutions. Millions of people lack access to clean water, food, and basic healthcare. Climate change is causing natural disasters that destroy communities and threaten future generations. These problems affect real people right now, while space exploration benefits are mostly theoretical or far in the future. Governments should focus on helping citizens who are suffering today.

Second, the cost of space programs is enormous. A single space mission can cost billions of dollars, money that could build hospitals, schools, or renewable energy systems. For example, the Mars rover program cost over $2 billion, which could have provided clean water to millions or funded cancer research. When people are dying from preventable diseases, spending on space seems irresponsible.

However, space exploration does have some benefits. It leads to new technologies that can help on Earth, like satellite communications and weather monitoring. Space research also inspires young people to study science and engineering. Some argue we need to find other planets in case Earth becomes uninhabitable.

Despite these advantages, Earth's problems are too urgent to ignore. We should solve issues like poverty, disease, and environmental destruction before investing heavily in space. Once basic human needs are met, then governments can increase space funding.

In conclusion, while space exploration has value, governments must prioritize solving Earth's immediate problems first. Human welfare and planetary health should come before cosmic ambitions.`,
    wordCount: 259,
    officialScore: 79,
    scoreBreakdown: {
      content: 2,
      form: 2,
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 1
    },
    scoreRange: '75-84'
  },
  
  // TOPIC 16: Space Exploration (LOW SCORE - 65-74)
  {
    id: 'seed-space-low',
    topic: 'Governments should prioritize funding for space exploration over addressing problems on Earth. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `I dont agree government should spend more money on space than earth problem. This is very bad idea because many people suffering on earth need help first.

Earth have too many problem need fixing. Poor people everywhere cannot eat food or drink clean water. Many country have war and people dying. Hospital dont have enough doctor and medicine. School also very bad in poor area, children cannot learn properly. Why government want explore space when people on earth suffering so much? This make no sense to me.

Space exploration very expensive. Rocket cost billion dollar to build and launch. If crash then all money waste. This money better use for help poor people and build hospital. My country need more school but government talking about going to moon. Very frustrating for normal people who need help.

Some people say space exploration good for technology. Maybe true but technology not help if people hungry. Also they say maybe we find new planet to live. But this stupid idea because we already have good planet just need take care of it better.

In my opinion government must fix earth problem first before think about space. When no more poverty and everyone have good life, then can explore space. But now is not right time. Too many people need help on earth.

In conclusion space exploration waste of money when earth have so many problem. Government should use tax money help citizen not send rocket to space.`,
    wordCount: 231,
    officialScore: 68,
    scoreBreakdown: {
      content: 1,
      form: 2,
      grammar: 0,
      vocabulary: 1,
      spelling: 1,
      developmentCoherence: 1,
      linguisticRange: 0
    },
    scoreRange: '65-74'
  },
  
  // TOPIC 16: Space Exploration (VERY HIGH SCORE - 90-95)
  {
    id: 'seed-space-veryhigh',
    topic: 'Governments should prioritize funding for space exploration over addressing problems on Earth. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `The proposition that space exploration should supersede terrestrial concerns in governmental funding priorities represents a fundamental misunderstanding of humanity's immediate existential challenges. While acknowledging space exploration's profound significance, I categorically disagree with prioritizing it over Earth's pressing crises.

Terrestrial problems demand immediate resource allocation due to their direct impact on human survival and dignity. Climate change constitutes an existential threat requiring urgent mitigation, with tipping points approaching irreversibility. Approximately one billion people lack access to clean water, while preventable diseases claim millions annually. Educational disparities perpetuate intergenerational poverty, and healthcare inequalities violate basic human rights. These crises affect real lives today, not hypothetical future scenarios.

Admittedly, space exploration yields tangible benefits beyond scientific curiosity. Satellite technology revolutionized communications, weather prediction, and disaster management. Space research catalyzed innovations in materials science, computing, and medicine. Furthermore, establishing extraterrestrial colonies could safeguard humanity against extinction-level events. The psychological impact of space achievements inspires scientific pursuits and international cooperation.

However, the opportunity cost remains unjustifiable. NASA's annual budget could eradicate several tropical diseases or provide universal primary education in developing nations. The ethical imperative to address immediate suffering outweighs speculative future benefits. Moreover, many space-derived technologies could emerge from targeted Earth-focused research at lower costs.

In conclusion, while space exploration merits continued support, it cannot ethically claim priority over addressing poverty, disease, climate change, and inequality. Governments must first ensure basic human needs and planetary sustainability before allocating substantial resources to cosmic ambitions.`,
    wordCount: 245,
    officialScore: 93,
    scoreBreakdown: {
      content: 3,
      form: 2,
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 2
    },
    scoreRange: '90-95'
  },
  
  // TOPIC 16: Space Exploration (MEDIUM-HIGH SCORE - 80-85)
  {
    id: 'seed-space-mediumhigh',
    topic: 'Governments should prioritize funding for space exploration over addressing problems on Earth. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `The debate over funding priorities between space exploration and earthly problems is complex and important. While I understand the arguments for space investment, I largely disagree that it should take precedence over solving our planet's immediate challenges.

Earth faces numerous critical problems requiring urgent attention and resources. Climate change threatens coastal cities and agricultural systems worldwide, potentially displacing millions within decades. Global poverty affects nearly 10% of the world's population, denying them basic necessities like nutrition and healthcare. Pandemics, as COVID-19 demonstrated, can devastate economies and claim millions of lives without adequate preparation. These issues demand immediate action because they affect human lives and wellbeing today.

Nevertheless, space exploration offers significant long-term benefits that shouldn't be ignored. Space technology has provided GPS systems, weather satellites, and telecommunications infrastructure essential to modern life. Research in zero gravity has advanced our understanding of human biology and materials science. Additionally, discovering potentially habitable planets could ensure humanity's survival if Earth becomes uninhabitable. Space programs also foster international collaboration and inspire young people to pursue scientific careers.

However, the enormous costs of space exploration could address many terrestrial problems more immediately. The billions spent on Mars missions could fund clean water infrastructure, renewable energy development, or pandemic preparedness. While space exploration should continue, it seems morally questionable to prioritize it when preventable diseases still kill millions annually.

In conclusion, although space exploration provides valuable benefits and should receive continued support, governments must prioritize addressing immediate human suffering and environmental crises on Earth before expanding cosmic ambitions.`,
    wordCount: 253,
    officialScore: 83,
    scoreBreakdown: {
      content: 3,
      form: 1,  // Slightly over word limit
      grammar: 2,
      vocabulary: 2,
      spelling: 1,
      developmentCoherence: 2,
      linguisticRange: 2
    },
    scoreRange: '80-85'
  },
  
  // TOPIC 16: Space Exploration (VERY LOW SCORE - 50-65)
  {
    id: 'seed-space-verylow',
    topic: 'Governments should prioritize funding for space exploration over addressing problems on Earth. To what extent do you agree or disagree?',
    category: 'AGREE_DISAGREE',
    essayText: `I think government should not spend money for space when earth have problem. This wrong priority and not fair for people who suffering.

First earth problem very serious. Many people no have food and water. Children dying because no medicine. My country have many poor people living street. They need help now not tomorrow. But government want spend money for going mars. This crazy thinking. How can go to mars when people hungry in earth?

Space very expensive and dangerous. Rocket sometime explode and astronaut die. All money gone when this happen. Better use money for hospital and school. One rocket cost can build many hospital. 

Some people say space good for tecnology but I dont agree. We have enough tecnology already. What we need is help poor people and fix environment. Earth getting hot and ice melting but government looking at star instead of fixing earth.

Space exploration just for rich country to show off. They want to say we reach moon first or we have best rocket. But this not important when people suffering. Is like buying expensive car when your children hungry.

In conclusion government must stop wasting money on space and help earth first. After everyone have good life then maybe can think about space. But now wrong time.`,
    wordCount: 201,
    officialScore: 58,
    scoreBreakdown: {
      content: 1,
      form: 1,  // Just meets minimum word count
      grammar: 0,
      vocabulary: 0,
      spelling: 0,
      developmentCoherence: 1,
      linguisticRange: 0
    },
    scoreRange: '50-65'
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