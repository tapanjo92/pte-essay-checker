import { SQSHandler, SQSEvent } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as AWSXRay from 'aws-xray-sdk-core';

// Capture AWS SDK v3 clients with X-Ray
const { captureAWSv3Client } = AWSXRay;

// Initialize clients with X-Ray tracing
const bedrockClient = captureAWSv3Client(new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || 'ap-south-1' 
}));

const dynamoClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = captureAWSv3Client(new SESClient({ region: process.env.AWS_REGION || 'ap-south-1' }));

// PTE scoring criteria - Official 7 criteria mapped to 14 points
const PTE_CRITERIA = {
  content: {
    maxPoints: 3,
    weight: 3/14, // 21.4%
    description: 'Topic relevance, idea development, and completeness'
  },
  form: {
    maxPoints: 2,
    weight: 2/14, // 14.3%
    description: 'Essay structure, paragraphing, and word count (200-300)'
  },
  grammar: {
    maxPoints: 2,
    weight: 2/14, // 14.3%
    description: 'Grammatical accuracy and sentence structure'
  },
  vocabulary: {
    maxPoints: 2,
    weight: 2/14, // 14.3%
    description: 'Range and accuracy of vocabulary used'
  },
  spelling: {
    maxPoints: 1,
    weight: 1/14, // 7.1%
    description: 'Spelling accuracy'
  },
  developmentCoherence: {
    maxPoints: 2,
    weight: 2/14, // 14.3%
    description: 'Logical flow, cohesion, and paragraph development'
  },
  linguisticRange: {
    maxPoints: 2,
    weight: 2/14, // 14.3%
    description: 'Variety in sentence patterns and linguistic structures'
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
  // Legacy scores for backward compatibility
  taskResponseScore: number;
  coherenceScore: number;
  vocabularyScore: number;
  grammarScore: number;
  // New PTE scores
  pteScores?: {
    content: number;
    form: number;
    grammar: number;
    vocabulary: number;
    spelling: number;
    developmentCoherence: number;
    linguisticRange: number;
  };
  // Topic relevance for transparency
  topicRelevance?: {
    isOnTopic: boolean;
    relevanceScore: number;
    explanation: string;
  };
  feedback: {
    summary: string;
    strengths: string[];
    improvements: string[];
    detailedFeedback: {
      content?: string;
      form?: string;
      grammar: string;
      vocabulary: string;
      spelling?: string;
      developmentCoherence?: string;
      linguisticRange?: string;
      // Legacy fields
      taskResponse?: string;
      coherence?: string;
    };
  };
  suggestions: string[];
  highlightedErrors: Array<{
    text: string;
    type: 'grammar' | 'vocabulary' | 'coherence' | 'spelling';
    suggestion: string;
    startIndex: number;
    endIndex: number;
  }>;
}

// Structured logging helper
function structuredLog(level: string, message: string, metadata?: any) {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
    traceId: process.env._X_AMZN_TRACE_ID
  };
  console.log(JSON.stringify(log));
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  const segment = AWSXRay.getSegment();
  structuredLog('INFO', 'SQS Event received', { 
    recordCount: event.Records.length,
    eventSourceARNs: event.Records.map(r => r.eventSourceARN) 
  });
  
  // Process each message (should be 1 based on our config)
  for (const record of event.Records) {
    const subsegment = segment?.addNewSubsegment('ProcessEssay');
    try {
      // Parse the message body
      const args = JSON.parse(record.body) as EssayProcessingEvent;
      
      structuredLog('INFO', 'Processing essay', { 
        essayId: args.essayId, 
        wordCount: args.wordCount, 
        userId: args.userId 
      });
      
      // Validate word count (PTE requirement: 200-300 words)
      if (args.wordCount < 200 || args.wordCount > 300) {
        structuredLog('WARN', 'Essay word count outside PTE requirements', {
          essayId: args.essayId,
          wordCount: args.wordCount,
          required: '200-300'
        });
      }
      
      // 1. Update essay status to PROCESSING
      console.log('Updating essay status to PROCESSING...');
      await updateEssayStatus(args.essayId, 'PROCESSING');
      console.log('Essay status updated');
      
      // 2. Prepare the prompt for AI analysis with RAG enhancement
      const prompt = await createRAGEnhancedPrompt(args.topic, args.content, args.wordCount);
      
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
      subsegment?.addAnnotation('essayId', args.essayId);
      subsegment?.addAnnotation('userId', args.userId || 'anonymous');
      subsegment?.close();
    } catch (error) {
      console.error('Error processing essay from SQS:', error);
      subsegment?.addError(error as Error);
      subsegment?.close();
      
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

// RAG: Find similar essays from gold standard
async function findSimilarEssays(topic: string, wordCount: number): Promise<any[]> {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('RAG.FindSimilarEssays');
  
  try {
    structuredLog('INFO', 'Finding similar essays for RAG', { topic, wordCount });
    
    // Query gold standard essays by topic
    const params = {
      TableName: process.env.GOLD_STANDARD_TABLE_NAME!,
      IndexName: 'goldStandardEssaysByTopic',
      KeyConditionExpression: '#topic = :topic',
      ExpressionAttributeNames: {
        '#topic': 'topic'
      },
      ExpressionAttributeValues: {
        ':topic': topic
      },
      Limit: 5 // Get up to 5 similar essays
    };
    
    try {
      const response = await docClient.send(new QueryCommand(params));
      
      if (response.Items && response.Items.length > 0) {
        structuredLog('INFO', 'Found similar essays', { count: response.Items.length });
        subsegment?.addAnnotation('similarEssaysFound', response.Items.length);
        
        // Sort by closest word count
        return response.Items.sort((a, b) => 
          Math.abs(a.wordCount - wordCount) - Math.abs(b.wordCount - wordCount)
        ).slice(0, 3); // Return top 3 most similar
      }
    } catch (queryError) {
      // If table doesn't exist or query fails, continue without RAG
      structuredLog('WARN', 'Gold standard query failed', { error: queryError });
    }
    
    return [];
  } catch (error) {
    subsegment?.addError(error as Error);
    structuredLog('ERROR', 'RAG enhancement failed', { error });
    return [];
  } finally {
    subsegment?.close();
  }
}

// Create RAG-enhanced prompt
async function createRAGEnhancedPrompt(topic: string, content: string, wordCount: number): Promise<string> {
  const similarEssays = await findSimilarEssays(topic, wordCount);
  
  if (similarEssays.length === 0) {
    structuredLog('INFO', 'No similar essays found, using standard prompt');
    return createAnalysisPrompt(topic, content);
  }
  
  // Build RAG context
  const ragContext = similarEssays.map(essay => {
    // Check if essay has new PTE format
    if (essay.scoreBreakdown && typeof essay.scoreBreakdown.content === 'number') {
      return `
Example Essay (Official PTE Score: ${essay.officialScore}/90):
Topic: ${essay.topic}
Word Count: ${essay.wordCount}
PTE Score Breakdown (Raw scores out of 14 points):
- Content: ${essay.scoreBreakdown.content}/3
- Form: ${essay.scoreBreakdown.form}/2
- Grammar: ${essay.scoreBreakdown.grammar}/2
- Vocabulary: ${essay.scoreBreakdown.vocabulary}/2
- Spelling: ${essay.scoreBreakdown.spelling}/1
- Development & Coherence: ${essay.scoreBreakdown.developmentCoherence}/2
- Linguistic Range: ${essay.scoreBreakdown.linguisticRange}/2
Key Strengths: ${essay.strengths?.join(', ') || 'N/A'}
Key Weaknesses: ${essay.weaknesses?.join(', ') || 'N/A'}
Essay Excerpt: ${essay.essayText.substring(0, 200)}...
`;
    } else {
      // Fallback for old format
      return `
Example Essay (Official PTE Score: ${essay.officialScore}/90):
Topic: ${essay.topic}
Word Count: ${essay.wordCount}
Score Breakdown:
- Task Response: ${essay.scoreBreakdown.task || essay.scoreBreakdown.taskResponse}/90
- Coherence: ${essay.scoreBreakdown.coherence}/90
- Vocabulary: ${essay.scoreBreakdown.vocabulary}/90
- Grammar: ${essay.scoreBreakdown.grammar}/90
Key Strengths: ${essay.strengths?.join(', ') || 'N/A'}
Key Weaknesses: ${essay.weaknesses?.join(', ') || 'N/A'}
Essay Excerpt: ${essay.essayText.substring(0, 200)}...
`;
    }
  }).join('\n---\n');

  // Create enhanced prompt
  return `You are an expert PTE Academic essay evaluator. You have access to similar essays with official PTE scores for reference.

REFERENCE ESSAYS WITH OFFICIAL SCORES:
${ragContext}

IMPORTANT: Use the reference essays above to calibrate your scoring. Essays with similar quality should receive similar scores.

Now evaluate the following essay:

Topic: ${topic}
Word Count: ${wordCount}

Essay:
${content}

CRITICAL PTE SCORING RULES:
1. FIRST, check if the essay addresses the given topic. If the essay is completely off-topic or unrelated to the prompt, it MUST receive 0/3 for Content (0/90 scaled).
   - Example: If topic is about "AI replacing workers" but essay discusses "AWS cloud services", it's OFF-TOPIC
   - Example: If topic is about "remote work" but essay discusses "climate change", it's OFF-TOPIC
2. An off-topic essay CANNOT score higher than 25/90 overall, regardless of grammar or vocabulary quality.
3. Essays that partially address the topic but miss key aspects should receive no more than 1/3 for Content.
4. Word count violations (under 200 or over 300 words) result in reduced Form score.
5. IMPORTANT: Evaluate topic relevance BEFORE any other criteria. A well-written essay on the wrong topic is still a failure in PTE.

Please evaluate the essay using the official PTE Academic scoring criteria (total 14 points scaled to 90):
1. Content (3 points): Topic relevance, idea development, and completeness
2. Form (2 points): Essay structure, paragraphing, and word count compliance (200-300 words)
3. Grammar (2 points): Grammatical accuracy and sentence structure
4. Vocabulary (2 points): Range and accuracy of vocabulary used
5. Spelling (1 point): Spelling accuracy
6. Development & Coherence (2 points): Logical flow, cohesion, and paragraph development
7. Linguistic Range (2 points): Variety in sentence patterns and linguistic structures

IMPORTANT: The reference essays above use the official PTE scoring. Compare this essay's quality to the reference essays and ensure your scores are consistent with the official scoring patterns shown.

Provide your response as a valid JSON object (no markdown, no code blocks, just pure JSON) in the following format:
{
  "topicRelevance": {
    "isOnTopic": <true/false>,
    "relevanceScore": <0-100>,
    "explanation": "<brief explanation of why the essay is on/off topic>"
  },
  "pteScores": {
    "content": <0-3>,
    "form": <0-2>,
    "grammar": <0-2>,
    "vocabulary": <0-2>,
    "spelling": <0-1>,
    "developmentCoherence": <0-2>,
    "linguisticRange": <0-2>
  },
  "scaledScores": {
    "content": <scaled to 90>,
    "form": <scaled to 90>,
    "grammar": <scaled to 90>,
    "vocabulary": <scaled to 90>,
    "spelling": <scaled to 90>,
    "developmentCoherence": <scaled to 90>,
    "linguisticRange": <scaled to 90>
  },
  "feedback": {
    "summary": "<overall assessment>",
    "strengths": ["<strength1>", "<strength2>", ...],
    "improvements": ["<improvement1>", "<improvement2>", ...],
    "detailedFeedback": {
      "content": "<detailed feedback>",
      "form": "<detailed feedback>",
      "grammar": "<detailed feedback>",
      "vocabulary": "<detailed feedback>",
      "spelling": "<detailed feedback>",
      "developmentCoherence": "<detailed feedback>",
      "linguisticRange": "<detailed feedback>"
    }
  },
  "suggestions": ["<suggestion1>", "<suggestion2>", ...],
  "highlightedErrors": [
    {
      "text": "<error text>",
      "type": "grammar|vocabulary|coherence|spelling",
      "correction": "<suggested correction>",
      "startIndex": <number>,
      "endIndex": <number>
    }
  ],
  "comparisonNote": "<brief note comparing this essay to the reference essays>"
}`;
}

function createAnalysisPrompt(topic: string, content: string): string {
  return `You are an expert PTE Academic essay evaluator. Analyze the following essay and provide detailed scoring and feedback based on official PTE criteria.

Topic: ${topic}

Essay:
${content}

CRITICAL PTE SCORING RULES:
1. FIRST, check if the essay addresses the given topic. If the essay is completely off-topic or unrelated to the prompt, it MUST receive 0/3 for Content (0/90 scaled).
   - Example: If topic is about "AI replacing workers" but essay discusses "AWS cloud services", it's OFF-TOPIC
   - Example: If topic is about "remote work" but essay discusses "climate change", it's OFF-TOPIC
2. An off-topic essay CANNOT score higher than 25/90 overall, regardless of grammar or vocabulary quality.
3. Essays that partially address the topic but miss key aspects should receive no more than 1/3 for Content.
4. Word count violations (under 200 or over 300 words) result in reduced Form score.
5. IMPORTANT: Evaluate topic relevance BEFORE any other criteria. A well-written essay on the wrong topic is still a failure in PTE.

Please evaluate the essay using the official PTE Academic scoring criteria (total 14 points scaled to 90):
1. Content (3 points): Topic relevance, idea development, and completeness
2. Form (2 points): Essay structure, paragraphing, and word count compliance (200-300 words)
3. Grammar (2 points): Grammatical accuracy and sentence structure
4. Vocabulary (2 points): Range and accuracy of vocabulary used
5. Spelling (1 point): Spelling accuracy
6. Development & Coherence (2 points): Logical flow, cohesion, and paragraph development
7. Linguistic Range (2 points): Variety in sentence patterns and linguistic structures

Provide your response as a valid JSON object (no markdown, no code blocks, just pure JSON) in the following format:
{
  "topicRelevance": {
    "isOnTopic": <true/false>,
    "relevanceScore": <0-100>,
    "explanation": "<brief explanation of why the essay is on/off topic>"
  },
  "pteScores": {
    "content": <0-3>,
    "form": <0-2>,
    "grammar": <0-2>,
    "vocabulary": <0-2>,
    "spelling": <0-1>,
    "developmentCoherence": <0-2>,
    "linguisticRange": <0-2>
  },
  "scaledScores": {
    "content": <scaled to 90>,
    "form": <scaled to 90>,
    "grammar": <scaled to 90>,
    "vocabulary": <scaled to 90>,
    "spelling": <scaled to 90>,
    "developmentCoherence": <scaled to 90>,
    "linguisticRange": <scaled to 90>
  },
  "feedback": {
    "summary": "<overall assessment>",
    "strengths": ["<strength1>", "<strength2>", ...],
    "improvements": ["<improvement1>", "<improvement2>", ...],
    "detailedFeedback": {
      "content": "<detailed feedback>",
      "form": "<detailed feedback>",
      "grammar": "<detailed feedback>",
      "vocabulary": "<detailed feedback>",
      "spelling": "<detailed feedback>",
      "developmentCoherence": "<detailed feedback>",
      "linguisticRange": "<detailed feedback>"
    }
  },
  "suggestions": ["<specific suggestion 1>", "<specific suggestion 2>", ...],
  "highlightedErrors": [
    {
      "text": "<error text>",
      "type": "grammar|vocabulary|coherence|spelling",
      "suggestion": "<correction>",
      "context": "<surrounding text>"
    }
  ]
}`;
}

async function callBedrockAI(prompt: string): Promise<any> {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('BedrockAI');
  
  try {
    const modelId = process.env.BEDROCK_MODEL_ID || 'meta.llama3-8b-instruct-v1:0';
    subsegment?.addAnnotation('modelId', modelId);
    
    let requestBody;
  
  // Different input formats for different models
  if (modelId.includes('claude')) {
    // Claude format
    requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4000,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };
  } else if (modelId.includes('llama')) {
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
    const retrySubsegment = subsegment?.addNewSubsegment(`BedrockRetry_${retries}`);
    try {
      retrySubsegment?.addAnnotation('attempt', retries + 1);
      retrySubsegment?.addMetadata('request', { modelId, promptLength: prompt.length });
      
      const startTime = Date.now();
      response = await bedrockClient.send(command);
      
      const duration = Date.now() - startTime;
      retrySubsegment?.addAnnotation('duration', duration);
      retrySubsegment?.addAnnotation('success', true);
      
      break; // Success, exit retry loop
    } catch (error: any) {
      retrySubsegment?.addAnnotation('error', error.name);
      retrySubsegment?.addMetadata('error', error);
      
      if (error.name === 'ThrottlingException' && retries < maxRetries - 1) {
        retries++;
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s, 16s
        console.log(`Throttled by Bedrock, retrying in ${delay/1000}s... (attempt ${retries}/${maxRetries})`);
        retrySubsegment?.addAnnotation('retryDelay', delay);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Re-throw if not throttling or max retries reached
      }
    } finally {
      retrySubsegment?.close();
    }
  }
  
  if (!response) {
    throw new Error('Failed to get response from Bedrock after retries');
  }
  
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  // Different output formats for different models
  let responseText = '';
  if (modelId.includes('claude')) {
    // Claude format
    responseText = responseBody.content?.[0]?.text || '';
  } else if (modelId.includes('llama')) {
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
    subsegment?.close();
    return parsed;
  } catch (parseError) {
    console.error('Failed to parse JSON:', cleanJson.substring(0, 500));
    console.error('Parse error:', parseError);
    subsegment?.addError(parseError as Error);
    subsegment?.close();
    throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
  } catch (error) {
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
}

function parseAIResponse(aiResponse: any): ScoringResult {
  let overallScore: number;
  let result: ScoringResult;
  
  // CRITICAL: Check for off-topic essays first
  if (aiResponse.topicRelevance) {
    const relevanceScore = aiResponse.topicRelevance.relevanceScore || 100;
    const isOnTopic = aiResponse.topicRelevance.isOnTopic !== false;
    
    structuredLog('INFO', 'Topic relevance check', {
      isOnTopic,
      relevanceScore,
      explanation: aiResponse.topicRelevance.explanation
    });
    
    // If essay is off-topic, enforce strict scoring rules
    if (!isOnTopic || relevanceScore < 50) {
      structuredLog('WARN', 'Essay is off-topic, applying PTE penalty', {
        relevanceScore,
        originalContentScore: aiResponse.pteScores?.content
      });
      
      // Force content score to 0 for off-topic essays
      if (aiResponse.pteScores) {
        aiResponse.pteScores.content = 0;
      }
      
      // Add warning to feedback
      if (!aiResponse.feedback) {
        aiResponse.feedback = {};
      }
      aiResponse.feedback.summary = `CRITICAL: This essay is off-topic and does not address the given prompt. In PTE Academic, off-topic essays receive very low scores regardless of language quality. ${aiResponse.feedback.summary || ''}`;
    }
  }
  
  // Check if AI returned new PTE format
  if (aiResponse.pteScores) {
    // Calculate overall score from PTE raw scores (out of 14)
    const rawTotal = 
      aiResponse.pteScores.content +
      aiResponse.pteScores.form +
      aiResponse.pteScores.grammar +
      aiResponse.pteScores.vocabulary +
      aiResponse.pteScores.spelling +
      aiResponse.pteScores.developmentCoherence +
      aiResponse.pteScores.linguisticRange;
    
    // Scale to 90
    overallScore = Math.round((rawTotal / 14) * 90);
    
    // CRITICAL: Apply off-topic veto - cap score at 25/90 if content is 0
    if (aiResponse.pteScores.content === 0) {
      overallScore = Math.min(overallScore, 25);
      structuredLog('WARN', 'Applied off-topic score cap', {
        originalScore: Math.round((rawTotal / 14) * 90),
        cappedScore: overallScore
      });
    }
    
    // Map new scores to legacy format for backward compatibility
    result = {
      overallScore,
      // Map roughly to old system
      taskResponseScore: aiResponse.scaledScores?.content || Math.round((aiResponse.pteScores.content / 3) * 90),
      coherenceScore: aiResponse.scaledScores?.developmentCoherence || Math.round((aiResponse.pteScores.developmentCoherence / 2) * 90),
      vocabularyScore: aiResponse.scaledScores?.vocabulary || Math.round((aiResponse.pteScores.vocabulary / 2) * 90),
      grammarScore: aiResponse.scaledScores?.grammar || Math.round((aiResponse.pteScores.grammar / 2) * 90),
      pteScores: aiResponse.scaledScores || {
        content: Math.round((aiResponse.pteScores.content / 3) * 90),
        form: Math.round((aiResponse.pteScores.form / 2) * 90),
        grammar: Math.round((aiResponse.pteScores.grammar / 2) * 90),
        vocabulary: Math.round((aiResponse.pteScores.vocabulary / 2) * 90),
        spelling: Math.round((aiResponse.pteScores.spelling / 1) * 90),
        developmentCoherence: Math.round((aiResponse.pteScores.developmentCoherence / 2) * 90),
        linguisticRange: Math.round((aiResponse.pteScores.linguisticRange / 2) * 90)
      },
      topicRelevance: aiResponse.topicRelevance,
      feedback: aiResponse.feedback,
      suggestions: aiResponse.suggestions || [],
      highlightedErrors: aiResponse.highlightedErrors || []
    };
  } else {
    // Fallback to old format
    overallScore = Math.round(
      (aiResponse.scores.taskResponse * 0.25 +
       aiResponse.scores.coherence * 0.25 +
       aiResponse.scores.vocabulary * 0.25 +
       aiResponse.scores.grammar * 0.25)
    );
    
    result = {
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
  
  return result;
}

async function updateEssayStatus(essayId: string, status: string, resultId?: string) {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('DynamoDB.UpdateEssayStatus');
  
  try {
    subsegment?.addAnnotation('essayId', essayId);
    subsegment?.addAnnotation('status', status);
    if (resultId) subsegment?.addAnnotation('resultId', resultId);
    
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
    
    const startTime = Date.now();
    await docClient.send(new UpdateCommand(params));
    const duration = Date.now() - startTime;
    
    subsegment?.addAnnotation('duration', duration);
    subsegment?.addMetadata('params', params);
  } catch (error) {
    subsegment?.addError(error as Error);
    throw error;
  } finally {
    subsegment?.close();
  }
}

async function saveResults(essayId: string, userId: string, scoringResult: ScoringResult): Promise<string> {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('DynamoDB.SaveResults');
  
  try {
    const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    subsegment?.addAnnotation('essayId', essayId);
    subsegment?.addAnnotation('userId', userId);
    subsegment?.addAnnotation('resultId', resultId);
    subsegment?.addAnnotation('overallScore', scoringResult.overallScore);
    
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
    
    const startTime = Date.now();
    await docClient.send(new PutCommand(params));
    const duration = Date.now() - startTime;
    
    subsegment?.addAnnotation('duration', duration);
    subsegment?.addMetadata('scores', {
      task: scoringResult.taskResponseScore,
      coherence: scoringResult.coherenceScore,
      vocabulary: scoringResult.vocabularyScore,
      grammar: scoringResult.grammarScore
    });
    
    return resultId;
  } catch (error) {
    subsegment?.addError(error as Error);
    throw error;
  } finally {
    subsegment?.close();
  }
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
  const appUrl = process.env.APP_URL || 'https://main.d1hed7gjlm8m1f.amplifyapp.com';
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