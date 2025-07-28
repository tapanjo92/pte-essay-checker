import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import * as AWSXRay from 'aws-xray-sdk-core';

// Initialize Bedrock client with X-Ray tracing
const { captureAWSv3Client } = AWSXRay;
const bedrockClient = captureAWSv3Client(new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || 'ap-south-1' 
}));

// Cache for embeddings to reduce API calls
const embeddingCache = new Map<string, { embedding: number[], timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

export interface VectorSearchResult {
  item: any;
  similarity: number;
}

/**
 * Generate embedding vector for given text using Amazon Titan
 * @param text - Text to convert to embedding vector
 * @returns Array of numbers representing the embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('GenerateEmbedding');
  
  try {
    // Check cache first
    const cacheKey = createCacheKey(text);
    const cached = embeddingCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      subsegment?.addAnnotation('cache', 'hit');
      return cached.embedding;
    }
    
    subsegment?.addAnnotation('cache', 'miss');
    subsegment?.addMetadata('textLength', text.length);
    
    // Titan has an 8K character limit
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
    
    // Retry logic for throttling
    let retries = 0;
    const maxRetries = 3;
    let lastError: any;
    
    while (retries < maxRetries) {
      try {
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        if (!responseBody.embedding || !Array.isArray(responseBody.embedding)) {
          throw new Error('Invalid embedding response from Titan');
        }
        
        const embedding = responseBody.embedding;
        
        // Cache the result
        embeddingCache.set(cacheKey, { embedding, timestamp: Date.now() });
        
        // Clean old cache entries
        if (embeddingCache.size > 1000) {
          cleanCache();
        }
        
        subsegment?.addAnnotation('embeddingDimensions', embedding.length);
        return embedding;
        
      } catch (error: any) {
        lastError = error;
        
        if (error.name === 'ThrottlingException' && retries < maxRetries - 1) {
          retries++;
          const delay = Math.pow(2, retries) * 1000;
          console.log(`Throttled by Bedrock, retrying in ${delay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    
    throw lastError;
    
  } catch (error) {
    subsegment?.addError(error as Error);
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    subsegment?.close();
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Similarity score between 0 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  
  // Handle edge case where one vector is all zeros
  if (denominator === 0) {
    return 0;
  }
  
  return dotProduct / denominator;
}

/**
 * Find most similar items based on vector similarity
 * @param queryVector - The vector to search for
 * @param candidates - Array of items with embeddings
 * @param topK - Number of results to return
 * @param threshold - Minimum similarity threshold (0-1)
 * @returns Array of similar items sorted by similarity
 */
export function findSimilarVectors<T extends { embedding?: number[] }>(
  queryVector: number[],
  candidates: T[],
  topK: number = 5,
  threshold: number = 0.5
): VectorSearchResult[] {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('VectorSimilaritySearch');
  
  try {
    subsegment?.addAnnotation('candidateCount', candidates.length);
    subsegment?.addAnnotation('topK', topK);
    
    const results: VectorSearchResult[] = [];
    
    for (const candidate of candidates) {
      if (!candidate.embedding || candidate.embedding.length === 0) {
        continue;
      }
      
      try {
        const similarity = cosineSimilarity(queryVector, candidate.embedding);
        
        if (similarity >= threshold) {
          results.push({
            item: candidate,
            similarity
          });
        }
      } catch (error) {
        console.warn('Error calculating similarity for candidate:', error);
        // Continue with other candidates
      }
    }
    
    // Sort by similarity descending and take top K
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, topK);
    
    subsegment?.addAnnotation('resultsFound', topResults.length);
    subsegment?.addMetadata('similarities', topResults.map(r => r.similarity));
    
    return topResults;
    
  } finally {
    subsegment?.close();
  }
}

/**
 * Generate a combined embedding for topic and content
 * @param topic - Essay topic
 * @param content - Essay content
 * @returns Embedding vector
 */
export async function generateEssayEmbedding(topic: string, content: string): Promise<number[]> {
  // Combine topic and first part of content for better semantic matching
  const combinedText = `Topic: ${topic}\n\nEssay: ${content.substring(0, 3000)}`;
  return generateEmbedding(combinedText);
}

/**
 * Create cache key for text
 */
function createCacheKey(text: string): string {
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `embed_${hash}_${text.length}`;
}

/**
 * Clean old entries from cache
 */
function cleanCache(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  for (const [key, value] of embeddingCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      entriesToDelete.push(key);
    }
  }
  
  for (const key of entriesToDelete) {
    embeddingCache.delete(key);
  }
  
  console.log(`Cleaned ${entriesToDelete.length} expired cache entries`);
}

/**
 * Batch generate embeddings with rate limiting
 * @param texts - Array of texts to embed
 * @param batchSize - Number of embeddings to generate concurrently
 * @returns Array of embeddings
 */
export async function batchGenerateEmbeddings(
  texts: string[],
  batchSize: number = 5
): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(text => generateEmbedding(text));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      embeddings.push(...batchResults);
    } catch (error) {
      console.error(`Error in batch ${i}-${i + batchSize}:`, error);
      // Try individually for failed batch
      for (const text of batch) {
        try {
          const embedding = await generateEmbedding(text);
          embeddings.push(embedding);
        } catch (individualError) {
          console.error('Failed to generate embedding for text:', individualError);
          embeddings.push([]); // Empty array for failed embeddings
        }
      }
    }
    
    // Rate limiting between batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }
  
  return embeddings;
}