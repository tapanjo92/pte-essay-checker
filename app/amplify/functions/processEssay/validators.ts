import { z } from 'zod';
import { ValidationError } from './errors';

// Essay input validation schema
export const EssayInputSchema = z.object({
  essayId: z.string().uuid('Invalid essay ID format'),
  userId: z.string().min(1, 'User ID is required'),
  topic: z.string().min(10, 'Topic must be at least 10 characters'),
  content: z.string()
    .min(50, 'Essay must be at least 50 characters')
    .max(5000, 'Essay cannot exceed 5000 characters'),
  wordCount: z.number()
    .int('Word count must be an integer')
    .min(50, 'Essay must have at least 50 words')
    .max(500, 'Essay cannot exceed 500 words')
});

// AI response validation schema
export const AIResponseSchema = z.object({
  topicRelevance: z.object({
    isOnTopic: z.boolean(),
    relevanceScore: z.number().min(0).max(100),
    explanation: z.string()
  }),
  pteScores: z.object({
    content: z.number().min(0).max(3),
    form: z.number().min(0).max(2),
    grammar: z.number().min(0).max(2),
    vocabulary: z.number().min(0).max(2),
    spelling: z.number().min(0).max(1),
    developmentCoherence: z.number().min(0).max(2),
    linguisticRange: z.number().min(0).max(2)
  }),
  detailedErrors: z.array(z.object({
    text: z.string(),
    type: z.enum(['grammar', 'vocabulary', 'coherence', 'spelling']),
    suggestion: z.string(),
    explanation: z.string().optional(),
    startIndex: z.number().min(0),
    endIndex: z.number().min(0)
  })).optional(),
  feedback: z.object({
    summary: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string())
  }).optional()
});

export function validateEssayInput(input: any) {
  try {
    return EssayInputSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'Invalid essay input',
        { errors: error.errors }
      );
    }
    throw error;
  }
}

export function validateAIResponse(response: any) {
  try {
    return AIResponseSchema.parse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'Invalid AI response format',
        { errors: error.errors }
      );
    }
    throw error;
  }
}