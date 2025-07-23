import { SQSHandler, SQSEvent } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize clients
const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || 'ap-south-1' 
});

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'ap-south-1' });

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

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log('SQS Event received:', JSON.stringify(event, null, 2));
  
  // Process each message (should be 1 based on our config)
  for (const record of event.Records) {
    try {
      // Parse the message body
      const args = JSON.parse(record.body) as EssayProcessingEvent;
      
      console.log('Processing essay:', { 
        essayId: args.essayId, 
        wordCount: args.wordCount, 
        userId: args.userId 
      });
      
      // 1. Update essay status to PROCESSING
      console.log('Updating essay status to PROCESSING...');
      await updateEssayStatus(args.essayId, 'PROCESSING');
      console.log('Essay status updated');
      
      // 2. Prepare the prompt for AI analysis
      const prompt = createAnalysisPrompt(args.topic, args.content);
      
      // 3. Call Bedrock AI for analysis
      console.log('Calling Bedrock AI...');
      const aiResponse = await callBedrockAI(prompt);
      console.log('AI Response received:', JSON.stringify(aiResponse, null, 2));
      
      // 4. Parse AI response and calculate scores
      console.log('Parsing AI response...');
      const scoringResult = parseAIResponse(aiResponse);
      console.log('Scoring result:', scoringResult.overallScore);
      
      // 5. Save results to DynamoDB
      console.log('Saving results to DynamoDB...');
      const resultId = await saveResults(args.essayId, args.userId || 'anonymous', scoringResult);
      console.log('Results saved with ID:', resultId);
      
      // 6. Update essay status to COMPLETED
      await updateEssayStatus(args.essayId, 'COMPLETED', resultId);
      
      console.log(`Successfully processed essay ${args.essayId}`);
    } catch (error) {
      console.error('Error processing essay from SQS:', error);
      
      // Update essay status to FAILED
      try {
        const message = JSON.parse(record.body);
        if (message.essayId) {
          await updateEssayStatus(message.essayId, 'FAILED');
        }
      } catch (parseError) {
        console.error('Could not parse message to update status:', parseError);
      }
      
      // Re-throw to make the message visible again for retry
      throw error;
    }
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

Provide your response as a valid JSON object (no markdown, no code blocks, just pure JSON) in the following format:
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
  const modelId = process.env.BEDROCK_MODEL_ID || 'meta.llama3-8b-instruct-v1:0';
  
  let requestBody;
  
  // Different input formats for different models
  if (modelId.includes('llama')) {
    // Llama format
    requestBody = {
      prompt: prompt,
      max_gen_len: 4000,
      temperature: 0.2,
      top_p: 0.9
    };
  } else {
    // Titan format
    requestBody = {
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: 4000,
        temperature: 0.2,
        topP: 0.9
      }
    };
  }
  
  const input = {
    modelId: modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(requestBody)
  };
  
  const command = new InvokeModelCommand(input);
  
  // Retry logic with exponential backoff for throttling
  let retries = 0;
  const maxRetries = 5;
  let response;
  
  while (retries < maxRetries) {
    try {
      response = await bedrockClient.send(command);
      break; // Success, exit retry loop
    } catch (error: any) {
      if (error.name === 'ThrottlingException' && retries < maxRetries - 1) {
        retries++;
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s, 16s
        console.log(`Throttled by Bedrock, retrying in ${delay/1000}s... (attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Re-throw if not throttling or max retries reached
      }
    }
  }
  
  if (!response) {
    throw new Error('Failed to get response from Bedrock after retries');
  }
  
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  // Different output formats for different models
  let responseText = '';
  if (modelId.includes('llama')) {
    // Llama format
    responseText = responseBody.generation || '';
  } else {
    // Titan format
    responseText = responseBody.results?.[0]?.outputText || responseBody.outputText || '';
  }
  
  console.log('Raw AI response length:', responseText.length);
  console.log('Raw AI response preview:', responseText.substring(0, 200));
  
  // Try multiple patterns to extract JSON
  let cleanJson = responseText.trim();
  
  // Handle Titan's specific response format with empty code blocks
  // Remove the first empty ``` block if it exists
  cleanJson = cleanJson.replace(/^```\s*```\s*/, '');
  
  // Pattern 1: Look for JSON between code blocks (with or without 'json' tag)
  const codeBlockMatch = cleanJson.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch && codeBlockMatch[1].trim()) {
    cleanJson = codeBlockMatch[1].trim();
  } else {
    // Pattern 2: Extract everything between first { and last }
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    } else {
      // Pattern 3: Remove all ``` and try to parse what's left
      cleanJson = cleanJson.replace(/```/g, '').trim();
    }
  }
  
  try {
    console.log('Attempting to parse cleaned JSON, length:', cleanJson.length);
    const parsed = JSON.parse(cleanJson);
    console.log('Successfully parsed AI response');
    return parsed;
  } catch (parseError) {
    console.error('Failed to parse JSON:', cleanJson.substring(0, 500));
    console.error('Parse error:', parseError);
    throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
  }
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
      aiModel: process.env.BEDROCK_MODEL_ID || 'meta.llama3-8b-instruct-v1:0',
      processingTime: Date.now(),
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };
  
  await docClient.send(new PutCommand(params));
  return resultId;
}

async function getUserEmail(userId: string): Promise<string | null> {
  if (!userId || userId === 'anonymous') return null;
  
  try {
    const params = {
      TableName: process.env.USER_TABLE_NAME!,
      Key: { id: userId }
    };
    
    const response = await docClient.send(new GetCommand(params));
    return response.Item?.email || null;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
}

async function sendResultEmail(
  userEmail: string, 
  essayId: string, 
  resultId: string, 
  scoringResult: ScoringResult,
  topic: string
) {
  const appUrl = process.env.APP_URL || 'http://3.109.164.76:3000';
  const resultUrl = `${appUrl}/results/${essayId}`;
  
  const emailParams = {
    Source: 'noreply@getcomplical.com', // Using your verified SES domain
    Destination: {
      ToAddresses: [userEmail]
    },
    Message: {
      Subject: {
        Data: `Your PTE Essay Results - Score: ${scoringResult.overallScore}/90`
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Your PTE Essay Results Are Ready!</h2>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Overall Score: ${scoringResult.overallScore}/90</h3>
                <p><strong>Topic:</strong> ${topic}</p>
              </div>
              
              <div style="margin: 20px 0;">
                <h4>Score Breakdown:</h4>
                <ul style="list-style: none; padding: 0;">
                  <li>📝 Task Response: ${scoringResult.taskResponseScore}/90</li>
                  <li>🔗 Coherence & Cohesion: ${scoringResult.coherenceScore}/90</li>
                  <li>📚 Vocabulary: ${scoringResult.vocabularyScore}/90</li>
                  <li>✏️ Grammar: ${scoringResult.grammarScore}/90</li>
                </ul>
              </div>
              
              <div style="margin: 30px 0;">
                <a href="${resultUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Detailed Results
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Click the button above to see detailed feedback, suggestions for improvement, and your complete essay analysis.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px;">
                This is an automated email from GetComplical.com PTE Essay Checker. Please do not reply to this email.
              </p>
            </div>
          `
        }
      }
    }
  };
  
  try {
    await sesClient.send(new SendEmailCommand(emailParams));
    console.log('Email sent successfully to:', userEmail);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - we don't want to fail the whole process if email fails
  }
}