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
    status: a.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
    resultId: a.string(),
    result: a.hasOne('Result', 'essayId'),
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
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [allow.owner()]),

  Topic: a.model({
    id: a.id(),
    title: a.string().required(),
    description: a.string().required(),
    category: a.enum(['AGREE_DISAGREE', 'DISCUSS_BOTH_VIEWS', 'ADVANTAGES_DISADVANTAGES', 'PROBLEM_SOLUTION', 'POSITIVE_NEGATIVE']),
    difficulty: a.enum(['EASY', 'MEDIUM', 'HARD']),
    sampleEssays: a.json(),
    isActive: a.boolean(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.groups(['Admin']).to(['create', 'update', 'delete'])
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