import { SQSHandler, SQSEvent } from 'aws-lambda';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { GetCommand, UpdateCommand, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { generateEssayEmbedding, findSimilarVectors, VectorSearchResult } from './vectorUtils';
import { bedrockClient, docClient, sesClient, warmConnections } from './clients';
import * as AWSXRay from 'aws-xray-sdk-core';
import { 
  detectFallbackErrors
} from './enhanced-prompt';
import { 
  generateRealisticFeedback, 
  generateRealisticScoreProjection
} from './realistic-feedback-generator';
import { 
  createRealisticPrompt, 
  getRealisticScaledScore, 
  createStrictFallbackResponse,
  REALISTIC_PTE_CRITERIA 
} from './realistic-pte-prompt';
import { createRealisticRAGPrompt } from './realistic-rag-prompt';
import { validateAndAdjustScore, scoreValidator } from './score-validator';
import { EssayProcessingError, AIServiceError, ValidationError, handleProcessingError } from './errors';
import { logger } from './logger';
import { validateEssayInput, validateAIResponse } from './validators';
import { bedrockCircuitBreaker } from './circuit-breaker';
import { metrics } from './monitoring';

// Warm connections on cold start
warmConnections().catch(error => {
  logger.error('Failed to warm connections', error, { operation: 'warmup' });
});

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
  // AI insights
  aiInsights?: {
    aiPreferences: string[];
    commonPitfalls: string[];
    quickWins: string[];
  };
  scoreProjection?: {
    currentBand: string;
    potentialBand: string;
    timeToTarget: string;
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
    explanation?: string; // Optional field for why the error is wrong
    startIndex: number;
    endIndex: number;
    severity?: 'high' | 'medium' | 'low';
  }>;
  // Error handling fields
  errorStatus?: 'analysis_failed' | 'partial_failure';
  errorMessage?: string;
}

// Structured logging helper (now uses centralized logger)
function structuredLog(level: string, message: string, metadata?: any) {
  switch (level.toLowerCase()) {
    case 'info':
      logger.info(message, metadata);
      break;
    case 'warn':
      logger.warn(message, metadata);
      break;
    case 'error':
      logger.error(message, new Error(message), metadata);
      break;
    case 'debug':
      logger.debug(message, metadata);
      break;
    default:
      logger.info(message, metadata);
  }
}

// Sanitize content to prevent prompt injection attacks
function sanitizeContent(content: string): string {
  // Handle undefined or null content
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Remove potential prompt injection patterns
  return content
    .replace(/\{.*?\}/g, '')        // Remove anything in curly braces
    .replace(/###.*?###/g, '')      // Remove anything between triple hashes
    .replace(/\[INST\].*?\[\/INST\]/g, '') // Remove instruction markers
    .replace(/\<\|.*?\|\>/g, '')    // Remove special tokens
    .replace(/IGNORE.*?INSTRUCTIONS?/gi, '') // Remove "ignore instructions" attempts
    .replace(/SYSTEM:.*?[\n\r]/gi, '') // Remove system prompt attempts
    .replace(/\n{3,}/g, '\n\n')     // Normalize excessive newlines
    .trim();
}

// 🔧 NEW: Attempt to recover from truncated JSON responses
function attemptPartialJSONRecovery(truncatedJson: string): any | null {
  try {
    logger.debug('Attempting partial JSON recovery');
    
    // Try to find and extract the topicRelevance section at minimum
    const topicRelevanceMatch = truncatedJson.match(/"topicRelevance"\s*:\s*\{[^}]*"relevanceScore"\s*:\s*(\d+)[^}]*\}/);
    
    if (topicRelevanceMatch) {
      const relevanceScore = parseInt(topicRelevanceMatch[1]) || 50;
      logger.debug('Extracted relevance score from truncated JSON', { relevanceScore });
      
      // Try to extract any partial PTE scores
      const contentMatch = truncatedJson.match(/"content"\s*:\s*(\d+)/);
      const formMatch = truncatedJson.match(/"form"\s*:\s*(\d+)/);
      const grammarMatch = truncatedJson.match(/"grammar"\s*:\s*(\d+)/);
      
      const partialScores = {
        content: contentMatch ? parseInt(contentMatch[1]) : Math.floor(relevanceScore / 30),
        form: formMatch ? parseInt(formMatch[1]) : 1,
        grammar: grammarMatch ? parseInt(grammarMatch[1]) : 1,
        vocabulary: 1,
        spelling: 1,
        developmentCoherence: 1,
        linguisticRange: 1
      };
      
      logger.debug('Created partial recovery with scores', { partialScores });
      
      return {
        topicRelevance: {
          isOnTopic: relevanceScore >= 50,
          relevanceScore: relevanceScore,
          explanation: `Recovered from truncated response. Relevance score: ${relevanceScore}%`
        },
        pteScores: partialScores,
        feedback: {
          summary: `Analysis was partially completed due to response truncation. Relevance: ${relevanceScore}%. Please resubmit for complete analysis.`,
          strengths: ["Essay structure detected"],
          improvements: ["Complete analysis requires resubmission"],
          detailedFeedback: {
            taskResponse: "Partial analysis - response was truncated",
            coherence: "Unable to complete analysis due to truncation",
            vocabulary: "Unable to complete analysis due to truncation", 
            grammar: "Unable to complete analysis due to truncation"
          }
        },
        suggestions: ["Resubmit essay for complete analysis"],
        highlightedErrors: []
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Partial JSON recovery failed', error as Error);
    return null;
  }
}

// Create strict fallback response - no scores when analysis fails
function createFallbackResponse(reason: string): any {
  logger.info('Creating fallback response', { reason });
  
  // Don't provide inflated scores when analysis fails
  // This prevents grade inflation from technical issues
  return {
    analysisStatus: 'failed',
    failureReason: reason,
    topicRelevance: { 
      isOnTopic: false, 
      relevanceScore: 0,
      explanation: `Analysis failed: ${reason}`
    },
    pteScores: {
      content: 0,
      form: 0,
      grammar: 0,
      vocabulary: 0,
      spelling: 0,
      developmentCoherence: 0,
      linguisticRange: 0
    },
    feedback: {
      summary: `Technical error prevented essay analysis: ${reason}. This is not a reflection of your essay quality. Please try again.`,
      strengths: [],
      improvements: ["Unable to analyze due to technical error"],
      detailedFeedback: {
        taskResponse: "Analysis failed - please resubmit",
        coherence: "Analysis failed - please resubmit",
        vocabulary: "Analysis failed - please resubmit",
        grammar: "Analysis failed - please resubmit"
      }
    },
    suggestions: [
      "Please resubmit your essay for analysis",
      "If this error persists, contact support"
    ],
    highlightedErrors: [],
    errorMessage: `Analysis could not be completed: ${reason}`,
    requiresResubmission: true
  };
}

// 🔧 NEW: Bedrock AI with retry logic for incomplete responses
async function callBedrockAIWithRetry(
  prompt: string, 
  essayId: string, 
  correlationId: string,
  maxRetries: number = 2
): Promise<any> {
  let lastError: Error | null = null;
  const operationTimer = logger.startTimer('bedrock_ai_call');
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      logger.info('Calling Bedrock AI', {
        essayId,
        correlationId,
        attempt,
        maxRetries: maxRetries + 1
      });
      
      // Use circuit breaker
      const response = await bedrockCircuitBreaker.execute(async () => {
        const startTime = Date.now();
        const result = await callBedrockAI(prompt);
        
        // Record latency
        await metrics.recordAILatency(
          Date.now() - startTime,
          process.env.BEDROCK_MODEL_ID || 'unknown'
        );
        
        return result;
      });
      
      // Validate response
      try {
        const validatedResponse = validateAIResponse(response);
        operationTimer();
        return validatedResponse;
      } catch (validationError) {
        // Log validation error but try to recover if possible
        logger.warn('AI response validation failed', {
          essayId,
          correlationId,
          error: (validationError as Error).message,
          attempt
        });
        
        // If we have partial data, use it
        if (response?.topicRelevance && response?.pteScores) {
          logger.info('Using partial AI response despite validation errors', {
            essayId,
            correlationId
          });
          return response;
        }
        
        throw validationError;
      }
      
    } catch (error) {
      lastError = error as Error;
      logger.error('Bedrock AI attempt failed', lastError, {
        essayId,
        correlationId,
        attempt
      });
      
      // If this is the last attempt, don't retry
      if (attempt === maxRetries + 1) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      logger.debug('Waiting before retry', { waitTimeMs: waitTime, attempt });
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // All retries failed - return fallback response instead of throwing
  logger.error('All Bedrock attempts failed', lastError || new Error('Unknown error'), {
    essayId,
    correlationId,
    attempts: maxRetries + 1
  });
  
  return createFallbackResponse(`Bedrock AI failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
}

// Calculate confidence score based on various factors
function calculateConfidence(similarEssaysFound: number, topicRelevance: number, wordCountCompliance: boolean): number {
  let confidence = 0.5; // base confidence
  
  // More similar essays = higher confidence
  confidence += Math.min(similarEssaysFound * 0.05, 0.25);
  
  // Topic relevance affects confidence
  confidence += (topicRelevance / 100) * 0.15;
  
  // Word count compliance
  if (wordCountCompliance) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  const segment = AWSXRay.getSegment();
  const batchTimer = logger.startTimer('sqs_batch_processing');
  
  logger.info('SQS batch received', { 
    recordCount: event.Records.length,
    eventSourceARNs: event.Records.map(r => r.eventSourceARN) 
  });
  
  // Process each message (should be 1 based on our config)
  for (const record of event.Records) {
    const subsegment = segment?.addNewSubsegment('ProcessEssay');
    const processingStartTime = Date.now();
    const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let queueWaitTime = 0;
    
    try {
      // Calculate queue wait time
      const messageTimestamp = record.attributes.SentTimestamp;
      if (messageTimestamp) {
        queueWaitTime = processingStartTime - parseInt(messageTimestamp);
      }
      
      // Parse the message body
      const messageBody = JSON.parse(record.body) as EssayProcessingEvent;
      
      // Validate input using Zod
      const validatedInput = validateEssayInput(messageBody);
      
      // Sanitize content to prevent prompt injection
      const originalContent = validatedInput.content;
      validatedInput.content = sanitizeContent(validatedInput.content);
      
      // Also sanitize topic (in case it comes from user input)
      const originalTopic = validatedInput.topic;
      validatedInput.topic = sanitizeContent(validatedInput.topic);
      
      // Log if content was modified
      if (originalContent !== validatedInput.content || originalTopic !== validatedInput.topic) {
        logger.warn('Content sanitized - potential prompt injection detected', {
          essayId: validatedInput.essayId,
          correlationId,
          contentModified: originalContent !== validatedInput.content,
          topicModified: originalTopic !== validatedInput.topic,
          originalLength: originalContent.length,
          sanitizedLength: validatedInput.content.length,
          removed: originalContent.length - validatedInput.content.length
        });
      }
      
      logger.info('Processing essay', { 
        essayId: validatedInput.essayId,
        correlationId,
        wordCount: validatedInput.wordCount, 
        userId: validatedInput.userId 
      });
      
      // Validate word count (PTE requirement: 200-300 words)
      if (validatedInput.wordCount < 200 || validatedInput.wordCount > 300) {
        logger.warn('Essay word count outside PTE requirements', {
          essayId: validatedInput.essayId,
          correlationId,
          wordCount: validatedInput.wordCount,
          required: '200-300'
        });
      }
      
      // 1. Update essay status to PROCESSING
      await updateEssayStatus(validatedInput.essayId, 'PROCESSING');
      
      // 2. Prepare the prompt for AI analysis with RAG enhancement
      const { prompt, similarEssaysCount, vectorSearchUsed } = await createRAGEnhancedPrompt(
        validatedInput.topic, 
        validatedInput.content, 
        validatedInput.wordCount
      );
      
      // 3. Call Bedrock AI for analysis with retry logic
      const aiResponse = await callBedrockAIWithRetry(prompt, validatedInput.essayId, correlationId);
      
      // 4. Parse AI response and calculate scores
      let scoringResult = parseAIResponse(aiResponse, validatedInput.wordCount, validatedInput.content);
      
      // 4a. Validate and adjust score if needed
      const { finalScore, validationWarnings } = validateAndAdjustScore(
        scoringResult.overallScore, 
        aiResponse
      );
      
      if (validationWarnings.length > 0) {
        logger.info('Score validation warnings', { validationWarnings });
        structuredLog('WARN', 'Score adjusted by validator', {
          originalScore: scoringResult.overallScore,
          adjustedScore: finalScore,
          warnings: validationWarnings
        });
        
        // Update the scoring result with validated score
        scoringResult.overallScore = finalScore;
        
        // Add validation warnings to feedback
        if (!scoringResult.feedback.improvements) {
          scoringResult.feedback.improvements = [];
        }
        scoringResult.feedback.improvements.push(
          ...validationWarnings.map(w => `Score validation: ${w}`)
        );
      }
      
      // Log distribution report periodically
      if (Math.random() < 0.1) { // 10% of requests
        logger.debug('Score distribution report', { report: scoreValidator.getDistributionReport() });
      }
      
      // 5. Save results to DynamoDB with performance metrics
      const processingDuration = Date.now() - processingStartTime;
      const resultId = await saveResults(
        validatedInput.essayId, 
        validatedInput.userId || 'anonymous', 
        scoringResult,
        {
          processingDuration,
          queueWaitTime,
          vectorSearchUsed,
          similarEssaysFound: similarEssaysCount,
          confidenceScore: calculateConfidence(
            similarEssaysCount, 
            aiResponse.topicRelevance?.relevanceScore || 100, 
            validatedInput.wordCount >= 200 && validatedInput.wordCount <= 300
          )
        }
      );
      
      // 5a. If essay scored highly, consider adding to gold standard
      if (scoringResult.overallScore >= 85) {
        await considerForGoldStandard(
          validatedInput.topic, 
          validatedInput.content, 
          validatedInput.wordCount, 
          scoringResult
        );
      }
      
      // 6. Update essay status to COMPLETED
      await updateEssayStatus(validatedInput.essayId, 'COMPLETED', resultId);
      
      // Record metrics
      await metrics.recordProcessingTime(processingDuration, 'success');
      await metrics.recordAIScore(scoringResult.overallScore);
      
      logger.info('Successfully processed essay', { 
        essayId: validatedInput.essayId,
        correlationId,
        processingDuration,
        overallScore: scoringResult.overallScore
      });
      
      subsegment?.addAnnotation('essayId', validatedInput.essayId);
      subsegment?.addAnnotation('userId', validatedInput.userId || 'anonymous');
      subsegment?.addAnnotation('score', scoringResult.overallScore);
      subsegment?.close();
    } catch (error) {
      subsegment?.addError(error as Error);
      subsegment?.close();
      
      // 🔧 NEW: Instead of marking as FAILED, try to provide fallback results
      try {
        const message = JSON.parse(record.body);
        if (message.essayId) {
          
          // Create emergency fallback scoring
          const emergencyFallback = createFallbackResponse(`Processing error: ${(error as Error).message || 'Unknown error'}`);
          const emergencyScoring = parseAIResponse(emergencyFallback, message.wordCount || 250);
          
          // Save emergency results
          const processingDuration = Date.now() - (message.timestamp ? parseInt(message.timestamp) : Date.now() - 30000);
          const resultId = await saveResults(
            message.essayId,
            message.userId || 'anonymous',
            emergencyScoring,
            {
              processingDuration,
              queueWaitTime: 0,
              vectorSearchUsed: false,
              similarEssaysFound: 0,
              confidenceScore: 0.1 // Very low confidence due to error
            }
          );
          
          // Mark as completed with low-confidence results instead of failed
          await updateEssayStatus(message.essayId, 'COMPLETED', resultId);
          
          // Don't re-throw - we've handled the error gracefully
          return;
        }
      } catch (fallbackError) {
        
        // Only now mark as FAILED if we truly cannot handle it
        try {
          const message = JSON.parse(record.body);
          if (message.essayId) {
            await updateEssayStatus(message.essayId, 'FAILED');
          }
        } catch (parseError) {
        }
        
        // Re-throw to make the message visible again for retry
        throw error;
      }
    }
  }
  
  batchTimer();
};

// RAG: Find similar essays from gold standard using vector search
async function findSimilarEssays(topic: string, content: string, wordCount: number): Promise<{ essays: any[], count: number, vectorSearchUsed: boolean }> {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('RAG.FindSimilarEssays');
  
  try {
    logger.info('Finding similar essays for RAG', { topic, wordCount });
    
    // First, try vector-based semantic search
    try {
      // Generate embedding for the student's essay
      const studentEmbedding = await generateEssayEmbedding(topic, content);
      subsegment?.addAnnotation('vectorSearch', true);
      
      // Scan all gold standard essays (in production, use a vector database)
      const scanParams = {
        TableName: process.env.GOLD_STANDARD_TABLE_NAME!,
        FilterExpression: 'attribute_exists(embedding)',
        ProjectionExpression: 'id, topic, essayText, wordCount, officialScore, scoreBreakdown, strengths, weaknesses, embedding'
      };
      
      const scanResponse = await docClient.send(new ScanCommand(scanParams));
      
      if (scanResponse.Items && scanResponse.Items.length > 0) {
        // Find similar essays using vector similarity
        const vectorResults = findSimilarVectors(
          studentEmbedding,
          scanResponse.Items,
          5, // Get top 5
          0.7 // Minimum 70% similarity
        );
        
        if (vectorResults.length > 0) {
          logger.info('Found similar essays via vector search', { 
            count: vectorResults.length,
            similarities: vectorResults.map(r => r.similarity)
          });
          subsegment?.addAnnotation('vectorResultsFound', vectorResults.length);
          
          // Return essays sorted by similarity
          return {
            essays: vectorResults.map(r => ({
              ...r.item,
              similarity: r.similarity
            })),
            count: vectorResults.length,
            vectorSearchUsed: true
          };
        }
      }
    } catch (vectorError) {
      logger.warn('Vector search failed, falling back to topic match', { error: (vectorError as Error).message });
      subsegment?.addAnnotation('vectorSearchFailed', true);
    }
    
    // Fallback to exact topic matching if vector search fails or returns no results
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
      Limit: 5
    };
    
    try {
      const response = await docClient.send(new QueryCommand(params));
      
      if (response.Items && response.Items.length > 0) {
        logger.info('Found similar essays via topic match', { count: response.Items.length });
        subsegment?.addAnnotation('topicMatchFound', response.Items.length);
        
        // Sort by closest word count
        const essays = response.Items.sort((a, b) => 
          Math.abs(a.wordCount - wordCount) - Math.abs(b.wordCount - wordCount)
        ).slice(0, 3);
        
        return {
          essays,
          count: essays.length,
          vectorSearchUsed: false
        };
      }
    } catch (queryError) {
      logger.warn('Gold standard query failed', { error: (queryError as Error).message });
    }
    
    return { essays: [], count: 0, vectorSearchUsed: false };
  } catch (error) {
    subsegment?.addError(error as Error);
    logger.error('RAG enhancement failed', error as Error);
    return { essays: [], count: 0, vectorSearchUsed: false };
  } finally {
    subsegment?.close();
  }
}

// Create RAG-enhanced prompt
async function createRAGEnhancedPrompt(topic: string, content: string, wordCount: number): Promise<{ prompt: string, similarEssaysCount: number, vectorSearchUsed: boolean }> {
  const { essays: similarEssays, count, vectorSearchUsed } = await findSimilarEssays(topic, content, wordCount);
  
  if (similarEssays.length === 0) {
    logger.info('No similar essays found, using standard prompt');
    return {
      prompt: createRealisticPrompt(topic, content, wordCount),
      similarEssaysCount: 0,
      vectorSearchUsed
    };
  }
  
  // Build RAG context with similarity scores
  const ragContext = similarEssays.map((essay, index) => {
    const similarityInfo = essay.similarity ? `(${Math.round(essay.similarity * 100)}% similar)` : '';
    
    // Check if essay has new PTE format
    if (essay.scoreBreakdown && typeof essay.scoreBreakdown.content === 'number') {
      return `
Example Essay #${index + 1} ${similarityInfo} (Official PTE Score: ${essay.officialScore}/90):
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
Example Essay #${index + 1} ${similarityInfo} (Official PTE Score: ${essay.officialScore}/90):
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

  // Create realistic RAG-enhanced prompt
  const enhancedPrompt = createRealisticRAGPrompt(topic, content, wordCount, ragContext);
  
  return {
    prompt: enhancedPrompt,
    similarEssaysCount: count,
    vectorSearchUsed
  };
}

// Create fallback prompt when RAG is not available
function createFallbackPrompt(topic: string, content: string, wordCount: number): string {
  return `You are an expert PTE Academic essay evaluator. Analyze the following essay and provide detailed scoring and feedback based on official PTE criteria.

Topic: ${topic}

Essay:
${content}

🚨 CRITICAL PTE TOPIC RELEVANCE RULES - READ CAREFULLY:
⚠️  STRICT TOPIC MATCHING REQUIRED - PTE essays MUST directly address the specific prompt given.

1. FIRST AND MOST IMPORTANT: Check if the essay DIRECTLY addresses the EXACT topic provided.
   
   TOPIC RELEVANCE EXAMPLES:
   ❌ OFF-TOPIC (0-10% relevance):
   - Topic: "Unpaid internships exploit young workers vs. valuable learning opportunities"
   - Essay about: AI replacing human workers, robots, automation → COMPLETELY OFF-TOPIC
   
   ❌ OFF-TOPIC (0-20% relevance):
   - Topic: "Social media impact on teenagers"  
   - Essay about: Online education benefits → DIFFERENT TOPIC
   
   ⚠️  PARTIALLY RELEVANT (30-60% relevance):
   - Topic: "Should governments ban smoking in public places?"
   - Essay about: General health effects of smoking → MISSES KEY ASPECT (government bans)
   
   ✅ ON-TOPIC (80-100% relevance):
   - Topic: "University education should be free for all students"
   - Essay about: Arguments for/against free university education → DIRECTLY ADDRESSES TOPIC

2. CRITICAL: If essay discusses a completely different subject from the topic, it's OFF-TOPIC regardless of quality.
   - OFF-TOPIC essays MUST receive 0/3 for Content and relevanceScore under 20%.
   - Maximum overall score for OFF-TOPIC essays: 25/90

3. Be EXTREMELY strict - even well-written essays on wrong topics are failures in PTE.
4. Only essays that DIRECTLY respond to the specific question/statement should score above 70% relevance.

Please evaluate the essay using the official PTE Academic scoring criteria (total 14 points scaled to 90):
1. Content (3 points): Topic relevance, idea development, and completeness
2. Form (2 points): Essay structure, paragraphing, and word count compliance (200-300 words)
3. Grammar (2 points): Grammatical accuracy and sentence structure
4. Vocabulary (2 points): Range and accuracy of vocabulary used
5. Spelling (1 point): Spelling accuracy
6. Development & Coherence (2 points): Logical flow, cohesion, and paragraph development
7. Linguistic Range (2 points): Variety in sentence patterns and linguistic structures

CRITICAL: Provide your response as a valid JSON object. Do NOT use markdown formatting, code blocks, or any other formatting. Return ONLY the JSON object starting with { and ending with }. Here is the required format:
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
      "text": "<EXACT error text from essay>",
      "type": "grammar|vocabulary|coherence|spelling",
      "suggestion": "<specific correction>",
      "explanation": "<why this is wrong>",
      "startIndex": <character position where error starts>,
      "endIndex": <character position where error ends>
    }
  ]

CRITICAL REQUIREMENTS FOR ERROR DETECTION:
1. Quote the EXACT text from the essay (character-perfect matching)
2. Calculate precise character positions by counting from the start of essay content
3. Provide specific corrections, not general advice  
4. Find minimum 5-10 specific errors with exact locations
5. Count characters carefully: startIndex is where error begins, endIndex is where it ends
6. IMPORTANT: You MUST analyze the ENTIRE essay from beginning to end, including the conclusion paragraph
7. CRITICAL: Make sure to find errors throughout the essay - beginning, middle AND end sections
8. Example: If essay starts "The AI technology is very good..." and "very good" (positions 23-32) should be "excellent", then:
   - text: "very good"
   - startIndex: 23
   - endIndex: 32
   - suggestion: "excellent"
}`;
}

async function callBedrockAI(prompt: string): Promise<any> {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('BedrockAI');
  
  try {
    const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';
    subsegment?.addAnnotation('modelId', modelId);
    
    logger.debug('Preparing Bedrock request', { 
      modelId, 
      promptLength: prompt.length 
    });
    
    let requestBody;
  
  // Different input formats for different models
  if (modelId.includes('claude')) {
    // Claude format
    requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 8000,
      temperature: 0.0,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      system: "You are an expert PTE Academic essay evaluator. Always respond with valid JSON only, no additional text or formatting."
    };
  } else if (modelId.includes('llama')) {
    // Llama format
    requestBody = {
      prompt: prompt,
      max_gen_len: 4000,
      temperature: 0.0,
      top_p: 0.9
    };
  } else {
    // Titan format
    requestBody = {
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: 4000,
        temperature: 0.0,
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
        logger.warn('Bedrock throttled, retrying', {
          attempt: retries,
          maxRetries,
          delayMs: delay,
          errorName: error.name
        });
        retrySubsegment?.addAnnotation('retryDelay', delay);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Convert to proper error type
        if (error.name === 'ThrottlingException') {
          throw new AIServiceError('AI service is currently busy. Please try again in a moment.');
        } else if (error.name === 'ValidationException') {
          throw new ValidationError('Invalid request to AI service', { details: error.message });
        } else {
          throw new AIServiceError(`AI service error: ${error.message || 'Unknown error'}`);
        }
      }
    } finally {
      retrySubsegment?.close();
    }
  }
  
  if (!response) {
    throw new Error('Failed to get response from Bedrock after retries');
  }
  
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  logger.debug('Bedrock response structure', { keys: Object.keys(responseBody) });
  
  // Different output formats for different models
  let responseText = '';
  if (modelId.includes('claude')) {
    // Claude format
    responseText = responseBody.content?.[0]?.text || '';
  } else if (modelId.includes('llama')) {
    // Llama format - check multiple possible fields
    responseText = responseBody.generation || responseBody.completion || responseBody.content || '';
    if (!responseText && responseBody.generations) {
      responseText = responseBody.generations[0]?.text || '';
    }
  } else {
    // Titan format
    responseText = responseBody.results?.[0]?.outputText || responseBody.outputText || '';
  }
  
  if (!responseText) {
    logger.error('Empty response from Bedrock', new Error('Empty response'), {
      responsePreview: JSON.stringify(responseBody).substring(0, 500)
    });
    throw new Error('Bedrock returned empty response');
  }
  
  logger.debug('Raw AI response received', {
    length: responseText.length,
    preview: responseText.substring(0, 200)
  });
  
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
    logger.debug('Attempting to parse cleaned JSON', { length: cleanJson.length });
    const parsed = JSON.parse(cleanJson);
    logger.debug('Successfully parsed AI response');
    
    // Validate that we have the essential fields
    if (!parsed.topicRelevance && !parsed.pteScores) {
      logger.warn('Parsed JSON missing essential fields, treating as incomplete');
      throw new Error('Incomplete JSON structure - missing essential fields');
    }
    
    subsegment?.close();
    return parsed;
  } catch (parseError) {
    logger.error('Failed to parse JSON', parseError as Error, {
      jsonPreview: cleanJson.substring(0, 500)
    });
    
    // 🔧 NEW: Try to recover from truncated JSON by attempting partial parsing
    const partialResult = attemptPartialJSONRecovery(cleanJson);
    if (partialResult) {
      logger.info('Successfully recovered from truncated JSON');
      subsegment?.close();
      return partialResult;
    }
    
    // If the response looks like a markdown table, it might be an error response
    if (cleanJson.includes('|') && cleanJson.includes('---')) {
      logger.error('AI returned a markdown table instead of JSON', new Error('Invalid response format'));
      subsegment?.addError(new Error('AI returned markdown instead of JSON'));
      subsegment?.close();
      
      // Return a fallback response
      return createFallbackResponse('AI returned markdown table format');
    }
    
    // 🔧 NEW: For JSON parsing failures, return a structured fallback instead of throwing
    logger.error('JSON parsing failed completely, returning fallback response', parseError as Error);
    subsegment?.addError(parseError as Error);
    subsegment?.close();
    
    return createFallbackResponse(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
  } catch (error) {
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
}

// Note: getRealisticScaledScore is imported from './realistic-pte-prompt'

// Industry-standard error enhancement
function enhanceHighlightedErrors(aiErrors: any[], content: string, wordCount: number): any[] {
  const validatedErrors: any[] = [];
  
  // First, validate and fix AI errors with incorrect indices
  (aiErrors || []).forEach((error, index) => {
    if (!error.text) {
      logger.warn('Error missing text field', { errorIndex: index });
      return;
    }
    
    // Find the actual position of the error text in the content
    const actualIndex = content.indexOf(error.text);
    
    if (actualIndex === -1) {
      // Text not found - this might be a truncated text
      logger.warn('Error text not found in content', { 
        errorText: error.text,
        errorIndex: index 
      });
      
      // Try to find a partial match (first 20 chars)
      const partialText = error.text.substring(0, 20);
      const partialIndex = content.indexOf(partialText);
      
      if (partialIndex !== -1) {
        // Found partial match - try to find the complete phrase
        const words = error.text.split(' ');
        let searchText = words[0];
        let foundIndex = content.indexOf(searchText, partialIndex);
        
        if (foundIndex !== -1) {
          // Build up the phrase word by word
          for (let i = 1; i < words.length; i++) {
            const nextWord = words[i];
            const nextIndex = content.indexOf(nextWord, foundIndex + searchText.length);
            
            if (nextIndex === -1 || nextIndex > foundIndex + searchText.length + 10) {
              // Word not found or too far away - use what we have
              break;
            }
            searchText = content.substring(foundIndex, nextIndex + nextWord.length);
          }
          
          validatedErrors.push({
            ...error,
            text: searchText,
            startIndex: foundIndex,
            endIndex: foundIndex + searchText.length
          });
        }
      }
    } else {
      // Text found - use actual indices
      validatedErrors.push({
        ...error,
        startIndex: actualIndex,
        endIndex: actualIndex + error.text.length
      });
    }
  });
  
  const combinedErrors = [...validatedErrors];
  
  // Check if AI errors cover the full essay
  const maxAIErrorEnd = validatedErrors.length > 0 
    ? Math.max(...validatedErrors.map(e => e.endIndex || 0)) 
    : 0;
  
  const coveragePercent = content.length > 0 ? (maxAIErrorEnd / content.length) * 100 : 0;
  
  logger.debug('AI error coverage after validation', {
    originalCount: aiErrors?.length || 0,
    validatedCount: validatedErrors.length,
    covered: maxAIErrorEnd,
    total: content.length,
    percentage: coveragePercent.toFixed(1)
  });
  
  // If AI errors don't cover at least 80% of the essay OR we have fewer than 5 errors, add fallback detection
  if (coveragePercent < 80 || combinedErrors.length < 5) {
    logger.debug('Insufficient coverage or too few errors, adding fallback detection');
    
    const fallbackErrors = detectFallbackErrors(content);
    
    // Add fallback errors that don't overlap with AI errors
    fallbackErrors.forEach(fallbackError => {
      const isDuplicate = combinedErrors.some(aiError => 
        (aiError.startIndex === fallbackError.startIndex) ||
        (Math.abs(aiError.startIndex - fallbackError.startIndex) < 5 && aiError.type === fallbackError.type)
      );
      
      // Prioritize errors in uncovered areas
      const isInUncoveredArea = fallbackError.startIndex > maxAIErrorEnd;
      
      if (!isDuplicate && (combinedErrors.length < 15 || isInUncoveredArea)) {
        combinedErrors.push(fallbackError);
      }
    });
  }
  
  // Log sample of errors for debugging
  if (combinedErrors.length > 0) {
    logger.debug('Sample of final errors', {
      firstError: {
        text: combinedErrors[0].text,
        startIndex: combinedErrors[0].startIndex,
        endIndex: combinedErrors[0].endIndex,
        type: combinedErrors[0].type
      },
      totalErrors: combinedErrors.length
    });
  }
  
  // Sort by position
  combinedErrors.sort((a, b) => a.startIndex - b.startIndex);
  
  // Log final coverage
  const finalMaxEnd = combinedErrors.length > 0 
    ? Math.max(...combinedErrors.map(e => parseInt(e.endIndex) || 0))
    : 0;
  const finalCoverage = content.length > 0 ? (finalMaxEnd / content.length) * 100 : 0;
  
  logger.debug('Final error coverage', {
    covered: finalMaxEnd,
    total: content.length,
    percentage: finalCoverage.toFixed(1)
  });
  logger.debug('Total errors after enhancement', { count: combinedErrors.length });
  
  return combinedErrors;
}

function parseAIResponse(aiResponse: any, wordCount: number, content: string): ScoringResult {
  let overallScore: number;
  let result: ScoringResult;
  
  // Check if this is a failed analysis response
  if (aiResponse.analysisStatus === 'failed' || aiResponse.requiresResubmission) {
    // Return minimal scores for failed analysis
    return {
      overallScore: 0,
      taskResponseScore: 0,
      coherenceScore: 0,
      vocabularyScore: 0,
      grammarScore: 0,
      pteScores: {
        content: 0,
        form: 0,
        grammar: 0,
        vocabulary: 0,
        spelling: 0,
        developmentCoherence: 0,
        linguisticRange: 0
      },
      topicRelevance: aiResponse.topicRelevance || { isOnTopic: false, relevanceScore: 0 },
      feedback: aiResponse.feedback || {
        summary: aiResponse.errorMessage || 'Analysis failed',
        strengths: [],
        improvements: ['Essay analysis could not be completed'],
        detailedFeedback: {}
      },
      suggestions: aiResponse.suggestions || ['Please resubmit your essay'],
      highlightedErrors: [],
      errorStatus: 'analysis_failed',
      errorMessage: aiResponse.failureReason || 'Technical error'
    };
  }
  
  // CRITICAL: Check for off-topic essays first
  if (aiResponse.topicRelevance) {
    const relevanceScore = aiResponse.topicRelevance.relevanceScore || 100;
    const isOnTopic = aiResponse.topicRelevance.isOnTopic !== false;
    
    logger.info('Topic Relevance Check', {
      isOnTopic,
      relevanceScore,
      explanation: aiResponse.topicRelevance.explanation
    });
    
    // Implement graduated content scoring based on relevance
    if (aiResponse.pteScores) {
      const originalContent = aiResponse.pteScores.content || 0;
      
      if (relevanceScore >= 90) {
        // 90-100% relevant: Full content score (no change)
        logger.info('Essay is fully on-topic', { relevanceScore });
      } else if (relevanceScore >= 70) {
        // 70-89% relevant: 2/3 content
        aiResponse.pteScores.content = Math.min(originalContent, 2);
        logger.warn('Essay is mostly on-topic, capping content at 2/3', {
          relevanceScore,
          originalContentScore: originalContent,
          adjustedContentScore: aiResponse.pteScores.content
        });
      } else if (relevanceScore >= 50) {
        // 50-69% relevant: 1/3 content
        aiResponse.pteScores.content = Math.min(originalContent, 1);
        logger.warn('Essay is partially on-topic, capping content at 1/3', {
          relevanceScore,
          originalContentScore: originalContent,
          adjustedContentScore: aiResponse.pteScores.content
        });
      } else {
        // <50% relevant: 0/3 content
        aiResponse.pteScores.content = 0;
        logger.warn('Essay is off-topic, setting content to 0/3', {
          relevanceScore,
          originalContentScore: originalContent
        });
      }
      
      // Add appropriate feedback based on relevance
      if (!aiResponse.feedback) {
        aiResponse.feedback = {};
      }
      
      if (relevanceScore < 50) {
        aiResponse.feedback.summary = `🚨 CRITICAL: This essay is OFF-TOPIC and does not address the given prompt. In PTE Academic, off-topic essays receive automatic failure (max 25/90) regardless of language quality. ${aiResponse.feedback.summary || ''}`;
      } else if (relevanceScore < 70) {
        aiResponse.feedback.summary = `⚠️ WARNING: This essay only partially addresses the topic. Key aspects of the prompt are missing. Maximum achievable score is limited to 65/90. ${aiResponse.feedback.summary || ''}`;
      } else if (relevanceScore < 90) {
        aiResponse.feedback.summary = `📝 NOTE: While this essay addresses the topic, some aspects could be more directly related to the prompt. ${aiResponse.feedback.summary || ''}`;
      }
    }
  }
  
  // Check if AI returned new PTE format
  if (aiResponse.pteScores) {
    // Apply word count penalty to Form score
    const originalFormScore = aiResponse.pteScores.form || 0;
    if (wordCount < 200 || wordCount > 300) {
      aiResponse.pteScores.form = Math.max(0, originalFormScore - 1);
      logger.warn('Applied word count penalty to Form score', {
        wordCount,
        originalFormScore,
        adjustedFormScore: aiResponse.pteScores.form,
        reason: wordCount < 200 ? 'Under 200 words' : 'Over 300 words'
      });
      
      // Add feedback about word count
      if (!aiResponse.feedback) {
        aiResponse.feedback = {};
      }
      if (!aiResponse.feedback.detailedFeedback) {
        aiResponse.feedback.detailedFeedback = {};
      }
      aiResponse.feedback.detailedFeedback.form = `Word count penalty applied: ${wordCount} words (required: 200-300). ${aiResponse.feedback.detailedFeedback.form || ''}`;
    }
    
    // Calculate overall score from PTE raw scores (out of 14)
    const rawTotal = 
      aiResponse.pteScores.content +
      aiResponse.pteScores.form +
      aiResponse.pteScores.grammar +
      aiResponse.pteScores.vocabulary +
      aiResponse.pteScores.spelling +
      aiResponse.pteScores.developmentCoherence +
      aiResponse.pteScores.linguisticRange;
    
    // Scale to 90 with realistic scoring
    // Most essays score 8-11 out of 14 (57-79%)
    overallScore = Math.round((rawTotal / 14) * 90);
    
    // Validation: Perfect scores are extremely rare
    if (overallScore >= 85 && rawTotal < 13) {
      logger.warn('Score adjustment - perfect scores require exceptional writing', {
        rawTotal,
        calculatedScore: overallScore,
        adjustedScore: Math.round((rawTotal / 14) * 90)
      });
    }
    
    // Apply relevance-based caps
    const relevanceScore = aiResponse.topicRelevance?.relevanceScore || 100;
    
    if (relevanceScore < 50) {
      // <50% relevant: Cap at 25/90
      overallScore = Math.min(overallScore, 25);
      logger.warn('Applied off-topic score cap (25/90)', {
        relevanceScore,
        originalScore: Math.round((rawTotal / 14) * 90),
        cappedScore: overallScore
      });
    } else if (relevanceScore >= 50 && relevanceScore < 70) {
      // 50-69% relevant: Cap at 65/90
      overallScore = Math.min(overallScore, 65);
      logger.warn('Applied partial relevance score cap (65/90)', {
        relevanceScore,
        originalScore: Math.round((rawTotal / 14) * 90),
        cappedScore: overallScore
      });
    }
    
    // Generate realistic feedback
    // Map detailedErrors (from AI) to highlightedErrors (expected by code)
    const aiErrors = aiResponse.detailedErrors || aiResponse.highlightedErrors || [];
    const enhancedErrors = enhanceHighlightedErrors(aiErrors, content, wordCount);
    const realisticFeedback = generateRealisticFeedback(
      overallScore,
      aiResponse.pteScores,
      aiResponse.topicRelevance,
      enhancedErrors,
      aiResponse.feedback?.strengths || [],
      aiResponse.feedback?.improvements || []
    );
    
    // Generate realistic score projection
    const projection = generateRealisticScoreProjection(overallScore, enhancedErrors.length);
    
    // Map new scores to legacy format for backward compatibility
    result = {
      overallScore,
      // Map roughly to old system
      // Realistic scoring: Raw scores mapped accurately
      taskResponseScore: Math.round(getRealisticScaledScore(aiResponse.pteScores.content, 3)),
      coherenceScore: Math.round(getRealisticScaledScore(aiResponse.pteScores.developmentCoherence, 2)),
      vocabularyScore: Math.round(getRealisticScaledScore(aiResponse.pteScores.vocabulary, 2)),
      grammarScore: Math.round(getRealisticScaledScore(aiResponse.pteScores.grammar, 2)),
      pteScores: aiResponse.scaledScores || {
        // Realistic scaling with stricter interpretation
        // 0/max = 0-30, 1/max = 35-55, 2/max = 60-75, max/max = 80-90
        content: Math.round(getRealisticScaledScore(aiResponse.pteScores.content, 3)),
        form: Math.round(getRealisticScaledScore(aiResponse.pteScores.form, 2)),
        grammar: Math.round(getRealisticScaledScore(aiResponse.pteScores.grammar, 2)),
        vocabulary: Math.round(getRealisticScaledScore(aiResponse.pteScores.vocabulary, 2)),
        spelling: Math.round(getRealisticScaledScore(aiResponse.pteScores.spelling, 1)),
        developmentCoherence: Math.round(getRealisticScaledScore(aiResponse.pteScores.developmentCoherence, 2)),
        linguisticRange: Math.round(getRealisticScaledScore(aiResponse.pteScores.linguisticRange, 2))
      },
      topicRelevance: aiResponse.topicRelevance,
      aiInsights: aiResponse.aiInsights || {
        aiPreferences: ['Sentence length 15-20 words', 'Academic vocabulary preferred', 'Clear paragraph structure'],
        commonPitfalls: enhancedErrors.slice(0, 3).map(e => e.explanation),
        quickWins: realisticFeedback.priorityActions.slice(0, 3)
      },
      scoreProjection: aiResponse.scoreProjection || {
        currentBand: `${Math.floor(overallScore / 5) * 5}-${Math.floor(overallScore / 5) * 5 + 5}`,
        potentialBand: `${projection.potential - 5}-${projection.potential}`,
        timeToTarget: projection.timeframe
      },
      feedback: {
        summary: realisticFeedback.executiveSummary,
        strengths: aiResponse.feedback?.strengths || [],
        improvements: realisticFeedback.priorityActions,
        detailedFeedback: {
          ...realisticFeedback.detailedBreakdown,
          // Legacy fields
          taskResponse: realisticFeedback.detailedBreakdown.content || aiResponse.feedback?.detailedFeedback?.content || 'No specific feedback available.',
          coherence: realisticFeedback.detailedBreakdown.developmentCoherence || aiResponse.feedback?.detailedFeedback?.developmentCoherence || 'No specific feedback available.',
          vocabulary: realisticFeedback.detailedBreakdown.vocabulary || aiResponse.feedback?.detailedFeedback?.vocabulary || 'No specific feedback available.',
          grammar: realisticFeedback.detailedBreakdown.grammar || aiResponse.feedback?.detailedFeedback?.grammar || 'No specific feedback available.'
        }
      },
      suggestions: [
        ...realisticFeedback.priorityActions,
        realisticFeedback.studyPlan.split('\n')[0], // First line of study plan
        realisticFeedback.realityCheck
      ].filter(Boolean).slice(0, 5),
      highlightedErrors: enhancedErrors
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
      feedback: {
        ...aiResponse.feedback,
        detailedFeedback: {
          taskResponse: aiResponse.feedback?.detailedFeedback?.content || 'No specific feedback available.',
          coherence: aiResponse.feedback?.detailedFeedback?.developmentCoherence || 'No specific feedback available.',
          vocabulary: aiResponse.feedback?.detailedFeedback?.vocabulary || 'No specific feedback available.',
          grammar: aiResponse.feedback?.detailedFeedback?.grammar || 'No specific feedback available.'
        }
      },
      suggestions: aiResponse.suggestions || [],
      highlightedErrors: enhanceHighlightedErrors(aiResponse.detailedErrors || aiResponse.highlightedErrors || [], content, wordCount)
    };
  }
  
  return result;
}

async function updateEssayStatus(
  essayId: string, 
  status: string, 
  resultId?: string,
  errorDetails?: {
    error: string;
    errorCode: string;
    correlationId: string;
  }
) {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('DynamoDB.UpdateEssayStatus');
  
  try {
    subsegment?.addAnnotation('essayId', essayId);
    subsegment?.addAnnotation('status', status);
    if (resultId) subsegment?.addAnnotation('resultId', resultId);
    
    let updateExpression = 'SET #status = :status, updatedAt = :updatedAt';
    let expressionAttributeValues: any = {
      ':status': status,
      ':updatedAt': new Date().toISOString()
    };
    
    if (resultId) {
      updateExpression += ', resultId = :resultId';
      expressionAttributeValues[':resultId'] = resultId;
    }
    
    if (errorDetails) {
      updateExpression += ', errorMessage = :errorMessage, errorCode = :errorCode, correlationId = :correlationId';
      expressionAttributeValues[':errorMessage'] = errorDetails.error;
      expressionAttributeValues[':errorCode'] = errorDetails.errorCode;
      expressionAttributeValues[':correlationId'] = errorDetails.correlationId;
    }
    
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

async function saveResults(
  essayId: string, 
  userId: string, 
  scoringResult: ScoringResult,
  performanceMetrics?: {
    processingDuration: number;
    queueWaitTime: number;
    vectorSearchUsed: boolean;
    similarEssaysFound: number;
    confidenceScore: number;
  }
): Promise<string> {
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
        aiModel: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
        processingTime: Date.now(),
        // Add performance metrics if provided
        ...(performanceMetrics && {
          processingDuration: performanceMetrics.processingDuration,
          queueWaitTime: performanceMetrics.queueWaitTime,
          vectorSearchUsed: performanceMetrics.vectorSearchUsed,
          similarEssaysFound: performanceMetrics.similarEssaysFound,
          confidenceScore: performanceMetrics.confidenceScore
        }),
        // Analysis insights
        methodVersion: '1.0',
        analysisEngine: 'PTE Expert System',
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
    logger.error('Error fetching user email', error as Error);
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
    logger.info('Email sent successfully', { userEmail });
  } catch (error) {
    logger.error('Error sending email', error as Error);
    // Don't throw - we don't want to fail the whole process if email fails
  }
}

// Add high-scoring essays to gold standard with embeddings
async function considerForGoldStandard(
  topic: string,
  essayText: string,
  wordCount: number,
  scoringResult: any
): Promise<void> {
  try {
    // Only add essays with score >= 85 and good feedback
    if (scoringResult.overallScore < 85) {
      return;
    }

    // Generate embedding for the essay
    logger.info('Generating embedding for potential gold standard essay');
    const embedding = await generateEssayEmbedding(topic, essayText);
    
    // Determine score range
    let scoreRange = '85-90';
    if (scoringResult.overallScore >= 90) {
      scoreRange = '90+';
    }
    
    // Extract category from topic (simplified - in production, use AI to classify)
    let category = 'AGREE_DISAGREE';
    if (topic.toLowerCase().includes('discuss both')) {
      category = 'DISCUSS_BOTH_VIEWS';
    } else if (topic.toLowerCase().includes('advantages') && topic.toLowerCase().includes('disadvantages')) {
      category = 'ADVANTAGES_DISADVANTAGES';
    }
    
    // Create gold standard entry
    const goldStandardEntry = {
      id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic: topic,
      category: category,
      essayText: essayText,
      wordCount: wordCount,
      officialScore: scoringResult.overallScore,
      scoreBreakdown: {
        content: scoringResult.taskResponseScore,
        coherence: scoringResult.coherenceScore,
        vocabulary: scoringResult.vocabularyScore,
        grammar: scoringResult.grammarScore
      },
      strengths: scoringResult.feedback?.strengths || [],
      weaknesses: scoringResult.feedback?.improvements || [],
      embedding: embedding,
      scoreRange: scoreRange,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'auto-generated'
    };
    
    // Save to GoldStandardEssay table
    const putParams = {
      TableName: process.env.GOLD_STANDARD_TABLE_NAME!,
      Item: goldStandardEntry,
      ConditionExpression: 'attribute_not_exists(id)' // Prevent overwrites
    };
    
    await docClient.send(new PutCommand(putParams));
    logger.info('Successfully added high-scoring essay to gold standard');
    
  } catch (error) {
    logger.error('Error adding to gold standard', error as Error);
    // Don't throw - this is a nice-to-have feature
  }
}