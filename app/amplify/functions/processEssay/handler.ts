import { Handler } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

// Initialize clients
const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || 'us-east-1' 
});

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// PTE scoring criteria
const PTE_CRITERIA = {
  taskResponse: {
    weight: 0.25,
    description: 'How well the essay addresses the topic and task requirements'
  },
  coherence: {
    weight: 0.25,
    description: 'Logical flow and organization of ideas'
  },
  vocabulary: {
    weight: 0.25,
    description: 'Range and accuracy of vocabulary used'
  },
  grammar: {
    weight: 0.25,
    description: 'Grammatical accuracy and sentence structure'
  }
};

interface EssayProcessingEvent {
  essayId: string;
  content: string;
  topic: string;
  wordCount: number;
  userId: string;
}

interface ScoringResult {
  overallScore: number;
  taskResponseScore: number;
  coherenceScore: number;
  vocabularyScore: number;
  grammarScore: number;
  feedback: {
    summary: string;
    strengths: string[];
    improvements: string[];
    detailedFeedback: {
      taskResponse: string;
      coherence: string;
      vocabulary: string;
      grammar: string;
    };
  };
  suggestions: string[];
  highlightedErrors: Array<{
    text: string;
    type: 'grammar' | 'vocabulary' | 'coherence';
    suggestion: string;
    startIndex: number;
    endIndex: number;
  }>;
}

export const handler: Handler = async (event) => {
  // AppSync passes arguments in the 'arguments' field
  const args = event.arguments as EssayProcessingEvent;
  console.log('Processing essay:', { essayId: args.essayId, wordCount: args.wordCount });
  
  try {
    // 1. Update essay status to PROCESSING
    await updateEssayStatus(args.essayId, 'PROCESSING');
    
    // 2. Prepare the prompt for AI analysis
    const prompt = createAnalysisPrompt(args.topic, args.content);
    
    // 3. Call Bedrock AI for analysis
    console.log('Calling Bedrock AI...');
    const aiResponse = await callBedrockAI(prompt);
    console.log('AI Response received:', JSON.stringify(aiResponse, null, 2));
    
    // 4. Parse AI response and calculate scores
    const scoringResult = parseAIResponse(aiResponse);
    
    // 5. Save results to DynamoDB
    const resultId = await saveResults(args.essayId, args.userId || 'anonymous', scoringResult);
    
    // 6. Update essay status to COMPLETED
    await updateEssayStatus(args.essayId, 'COMPLETED', resultId);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Essay processed successfully',
        essayId: args.essayId,
        resultId: resultId,
        overallScore: scoringResult.overallScore
      }),
    };
  } catch (error) {
    console.error('Error processing essay:', error);
    
    // Update essay status to FAILED
    await updateEssayStatus(args.essayId, 'FAILED');
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process essay',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

function createAnalysisPrompt(topic: string, content: string): string {
  return `You are an expert PTE Academic essay evaluator. Analyze the following essay and provide detailed scoring and feedback based on PTE criteria.

Topic: ${topic}

Essay:
${content}

Please evaluate the essay on these criteria:
1. Task Response (0-90): How well does the essay address the topic and fulfill task requirements?
2. Coherence and Cohesion (0-90): Is the essay well-organized with clear progression of ideas?
3. Vocabulary (0-90): Range, accuracy, and appropriateness of vocabulary
4. Grammar (0-90): Grammatical accuracy, sentence variety, and complexity

Provide your response in the following JSON format:
{
  "scores": {
    "taskResponse": <score>,
    "coherence": <score>,
    "vocabulary": <score>,
    "grammar": <score>
  },
  "feedback": {
    "summary": "<overall assessment>",
    "strengths": ["<strength1>", "<strength2>", ...],
    "improvements": ["<improvement1>", "<improvement2>", ...],
    "detailedFeedback": {
      "taskResponse": "<detailed feedback>",
      "coherence": "<detailed feedback>",
      "vocabulary": "<detailed feedback>",
      "grammar": "<detailed feedback>"
    }
  },
  "suggestions": ["<specific suggestion 1>", "<specific suggestion 2>", ...],
  "highlightedErrors": [
    {
      "text": "<error text>",
      "type": "grammar|vocabulary|coherence",
      "suggestion": "<correction>",
      "context": "<surrounding text>"
    }
  ]
}`;
}

async function callBedrockAI(prompt: string): Promise<any> {
  const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';
  
  const input = {
    modelId: modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: prompt
      }]
    })
  };
  
  const command = new InvokeModelCommand(input);
  const response = await bedrockClient.send(command);
  
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const responseText = responseBody.content[0].text;
  
  // Remove markdown code blocks if present
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  const cleanJson = jsonMatch ? jsonMatch[1] : responseText;
  
  return JSON.parse(cleanJson);
}

function parseAIResponse(aiResponse: any): ScoringResult {
  // Calculate overall score based on PTE weighting
  const overallScore = Math.round(
    (aiResponse.scores.taskResponse * PTE_CRITERIA.taskResponse.weight +
     aiResponse.scores.coherence * PTE_CRITERIA.coherence.weight +
     aiResponse.scores.vocabulary * PTE_CRITERIA.vocabulary.weight +
     aiResponse.scores.grammar * PTE_CRITERIA.grammar.weight)
  );
  
  return {
    overallScore,
    taskResponseScore: aiResponse.scores.taskResponse,
    coherenceScore: aiResponse.scores.coherence,
    vocabularyScore: aiResponse.scores.vocabulary,
    grammarScore: aiResponse.scores.grammar,
    feedback: aiResponse.feedback,
    suggestions: aiResponse.suggestions || [],
    highlightedErrors: aiResponse.highlightedErrors || []
  };
}

async function updateEssayStatus(essayId: string, status: string, resultId?: string) {
  const updateExpression = resultId 
    ? 'SET #status = :status, resultId = :resultId, updatedAt = :updatedAt'
    : 'SET #status = :status, updatedAt = :updatedAt';
    
  const expressionAttributeValues = resultId
    ? { ':status': status, ':resultId': resultId, ':updatedAt': new Date().toISOString() }
    : { ':status': status, ':updatedAt': new Date().toISOString() };
  
  const params = {
    TableName: process.env.ESSAY_TABLE_NAME || 'Essay',
    Key: { id: essayId },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: expressionAttributeValues
  };
  
  await docClient.send(new UpdateCommand(params));
}

async function saveResults(essayId: string, userId: string, scoringResult: ScoringResult): Promise<string> {
  const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  const params = {
    TableName: process.env.RESULT_TABLE_NAME || 'Result',
    Item: {
      id: resultId,
      essayId: essayId,
      owner: userId,
      ...scoringResult,
      aiModel: process.env.BEDROCK_MODEL_ID || 'claude-3-sonnet',
      processingTime: Date.now(),
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };
  
  await docClient.send(new PutCommand(params));
  return resultId;
}