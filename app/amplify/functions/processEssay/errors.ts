// Custom error types for better error handling
export class EssayProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'EssayProcessingError';
  }
}

export class AIServiceError extends EssayProcessingError {
  constructor(message: string, details?: any) {
    super(message, 'AI_SERVICE_ERROR', 503, true, details);
    this.name = 'AIServiceError';
  }
}

export class ValidationError extends EssayProcessingError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, false, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends EssayProcessingError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, { retryAfter });
    this.name = 'RateLimitError';
  }
}

// Error handler with proper logging and monitoring
export function handleProcessingError(error: any, context: {
  essayId: string;
  userId: string;
  operation: string;
}): EssayProcessingError {
  // Log to CloudWatch with structured data
  console.error('Essay processing error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    context,
    timestamp: new Date().toISOString()
  });

  // Convert known errors to proper types
  if (error.name === 'ThrottlingException') {
    return new RateLimitError('AI service is currently busy. Please try again in a moment.', 30);
  }

  if (error.message?.includes('Invalid essay content')) {
    return new ValidationError('Essay content validation failed', { 
      field: 'content',
      reason: error.message 
    });
  }

  // Default to generic error
  return new EssayProcessingError(
    'An unexpected error occurred while processing your essay',
    'UNKNOWN_ERROR',
    500,
    true,
    { originalError: error.message }
  );
}