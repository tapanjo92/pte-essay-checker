import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { submitEssayToQueue } from '../functions/submitEssayToQueue/resource';

const schema = a.schema({
  User: a.model({
    id: a.id(),
    email: a.string().required(),
    username: a.string(),
    firstName: a.string(),
    lastName: a.string(),
    subscriptionId: a.string(),
    subscription: a.belongsTo('UserSubscription', 'subscriptionId'),
    essays: a.hasMany('Essay', 'userId'),
    progress: a.hasMany('UserProgress', 'userId'),
    events: a.hasMany('AnalyticsEvent', 'userId'),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [allow.owner()]),
  
  UserSubscription: a.model({
    id: a.id(),
    plan: a.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']),
    status: a.enum(['ACTIVE', 'CANCELLED', 'EXPIRED']),
    essaysRemaining: a.integer(),
    essaysLimit: a.integer(),
    validUntil: a.datetime(),
    users: a.hasMany('User', 'subscriptionId'),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [allow.owner()]),
  
  Essay: a.model({
    id: a.id(),
    userId: a.string().required(),
    user: a.belongsTo('User', 'userId'),
    topic: a.string().required(),
    content: a.string().required(),
    wordCount: a.integer().required(),
    status: a.enum(['PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']),
    resultId: a.string(),
    result: a.hasOne('Result', 'essayId'),
    // Analytics fields
    timeTaken: a.integer(), // seconds spent writing
    editCount: a.integer().default(0), // number of changes
    deviceType: a.string(), // mobile/desktop/tablet
    browserInfo: a.string(), // user agent string
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [allow.owner()]),
  
  Result: a.model({
    id: a.id(),
    essayId: a.string().required(),
    essay: a.belongsTo('Essay', 'essayId'),
    overallScore: a.float().required(),
    grammarScore: a.float().required(),
    vocabularyScore: a.float().required(),
    coherenceScore: a.float().required(),
    taskResponseScore: a.float().required(),
    feedback: a.json().required(),
    suggestions: a.json(),
    highlightedErrors: a.json(),
    processingTime: a.integer(),
    aiModel: a.string(),
    // New PTE scores
    pteScores: a.json(),
    topicRelevance: a.json(),
    // Performance metrics
    processingDuration: a.integer(), // milliseconds
    queueWaitTime: a.integer(), // milliseconds
    vectorSearchUsed: a.boolean().default(false),
    similarEssaysFound: a.integer().default(0),
    confidenceScore: a.float(), // 0-1 AI confidence
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [allow.owner()]),

  Topic: a.model({
    id: a.id(),
    title: a.string().required(),
    description: a.string().required(),
    category: a.enum(['AGREE_DISAGREE', 'DISCUSS_BOTH_VIEWS', 'ADVANTAGES_DISADVANTAGES', 'PROBLEM_SOLUTION', 'POSITIVE_NEGATIVE', 'CAUSES_EFFECTS']),
    difficulty: a.enum(['EASY', 'MEDIUM', 'HARD']),
    frequency: a.string(), // e.g., "35%"
    keyVocabulary: a.json(), // ["automation", "displacement", "augmentation"]
    wordCountMin: a.integer().default(200),
    wordCountMax: a.integer().default(300),
    timeLimit: a.integer().default(20), // minutes
    sampleEssays: a.json(),
    isActive: a.boolean(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.groups(['Admin']).to(['create', 'update', 'delete'])
  ]),

  // Gold Standard Essays for RAG implementation
  GoldStandardEssay: a.model({
    id: a.id(),
    topic: a.string().required(),
    topicId: a.string(), // Reference to Topic.id
    category: a.enum(['AGREE_DISAGREE', 'DISCUSS_BOTH_VIEWS', 'ADVANTAGES_DISADVANTAGES', 'PROBLEM_SOLUTION', 'POSITIVE_NEGATIVE', 'CAUSES_EFFECTS']),
    essayText: a.string().required(),
    wordCount: a.integer().required(),
    officialScore: a.integer().required(), // Out of 90
    scoreBreakdown: a.json().required(), // {task: 80, coherence: 75, vocabulary: 70, grammar: 85}
    strengths: a.json(), // ["Clear thesis", "Good examples", "Varied vocabulary"]
    weaknesses: a.json(), // ["Minor grammar errors", "Repetitive phrases"]
    embedding: a.json(), // Vector embedding for similarity search (future)
    scoreRange: a.string(), // "65-74", "75-84", "85-90"
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.groups(['Admin']).to(['create', 'update', 'delete'])
  ]).secondaryIndexes(index => [
    index('topic'),
    index('scoreRange')
  ]),

  // User Progress Tracking
  UserProgress: a.model({
    id: a.id(),
    userId: a.string().required(),
    user: a.belongsTo('User', 'userId'),
    topicCategory: a.enum(['AGREE_DISAGREE', 'DISCUSS_BOTH_VIEWS', 'ADVANTAGES_DISADVANTAGES', 'PROBLEM_SOLUTION', 'POSITIVE_NEGATIVE', 'CAUSES_EFFECTS']),
    averageScore: a.float().default(0),
    attemptCount: a.integer().default(0),
    lastImprovement: a.float().default(0), // percentage change
    weakAreas: a.json(), // ["grammar", "coherence", etc]
    strongAreas: a.json(), // ["vocabulary", "task_response", etc]
    lastAttemptDate: a.datetime(),
    bestScore: a.float().default(0),
    trend: a.enum(['IMPROVING', 'STABLE', 'DECLINING']),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [allow.owner()])
    .secondaryIndexes(index => [
      index('userId').queryField('progressByUser'),
      index('topicCategory')
    ]),

  // Analytics Events for User Journey
  AnalyticsEvent: a.model({
    id: a.id(),
    userId: a.string().required(),
    user: a.belongsTo('User', 'userId'),
    event: a.enum([
      'ESSAY_STARTED',
      'ESSAY_SUBMITTED', 
      'ESSAY_CANCELLED',
      'RESULT_VIEWED',
      'FEEDBACK_RATED',
      'SUBSCRIPTION_UPGRADED',
      'FEATURE_USED',
      'ERROR_OCCURRED'
    ]),
    metadata: a.json(), // Flexible JSON for event-specific data
    essayId: a.string(), // Optional reference to essay
    sessionId: a.string(), // Track user sessions
    timestamp: a.datetime().required(),
    deviceType: a.string(),
    browserInfo: a.string(),
    ipAddress: a.string(),
    createdAt: a.datetime(),
  }).authorization(allow => [
    allow.owner().to(['read']),
    allow.groups(['Admin']).to(['read', 'delete'])
  ]).secondaryIndexes(index => [
    index('userId').sortKeys(['timestamp']).queryField('eventsByUser'),
    index('event').sortKeys(['timestamp']).queryField('eventsByType'),
    index('sessionId').queryField('eventsBySession')
  ]),

  submitEssayToQueue: a.mutation()
    .arguments({
      essayId: a.string().required(),
      content: a.string().required(),
      topic: a.string().required(),
      wordCount: a.integer().required(),
    })
    .returns(a.json())
    .handler(a.handler.function(submitEssayToQueue))
    .authorization(allow => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});