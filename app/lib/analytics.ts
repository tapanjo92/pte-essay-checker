// Analytics utility functions for tracking user events and metrics
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { v4 as uuidv4 } from 'uuid';

const client = generateClient<Schema>();

// Get device type from user agent
export function getDeviceType(): string {
  if (typeof window === 'undefined') return 'server';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    if (/ipad|tablet/i.test(userAgent)) {
      return 'tablet';
    }
    return 'mobile';
  }
  
  return 'desktop';
}

// Get browser info
export function getBrowserInfo(): string {
  if (typeof window === 'undefined') return 'server';
  return navigator.userAgent;
}

// Session management
let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    // Check if we have a session in sessionStorage
    if (typeof window !== 'undefined') {
      sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = uuidv4();
        sessionStorage.setItem('analytics_session_id', sessionId);
      }
    } else {
      sessionId = uuidv4();
    }
  }
  return sessionId;
}

// Track analytics event
export async function trackEvent(
  event: string,
  metadata?: Record<string, any>,
  essayId?: string
) {
  try {
    await client.models.AnalyticsEvent.create({
      event: event as any,
      metadata: JSON.stringify(metadata || {}),
      essayId,
      userId: 'anonymous', // TODO: Get actual user ID when available
      sessionId: getSessionId(),
      timestamp: new Date().toISOString(),
      deviceType: getDeviceType(),
      browserInfo: getBrowserInfo(),
    });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
  }
}

// Essay tracking helpers
export class EssayTracker {
  private startTime: number;
  private editCount: number = 0;
  private lastContent: string = '';
  
  constructor() {
    this.startTime = Date.now();
  }
  
  // Track content changes
  onContentChange(newContent: string) {
    if (newContent !== this.lastContent) {
      this.editCount++;
      this.lastContent = newContent;
    }
  }
  
  // Get metrics for essay submission
  getMetrics() {
    return {
      timeTaken: Math.floor((Date.now() - this.startTime) / 1000), // seconds
      editCount: this.editCount,
      deviceType: getDeviceType(),
      browserInfo: getBrowserInfo(),
    };
  }
}

// Update user progress after result
export async function updateUserProgress(
  userId: string,
  topicCategory: string,
  newScore: number,
  scoreBreakdown: {
    grammar: number;
    vocabulary: number;
    coherence: number;
    taskResponse: number;
  }
) {
  try {
    // Find existing progress for this category
    const { data: existingProgress } = await client.models.UserProgress.list({
      filter: {
        userId: { eq: userId },
        topicCategory: { eq: topicCategory }
      }
    });
    
    const current = existingProgress?.[0];
    
    if (current && current.attemptCount !== null && current.averageScore !== null) {
      // Calculate new average
      const newAttemptCount = current.attemptCount + 1;
      const newAverage = ((current.averageScore * current.attemptCount) + newScore) / newAttemptCount;
      
      // Calculate improvement
      const improvement = current.averageScore > 0 
        ? ((newScore - current.averageScore) / current.averageScore) * 100 
        : 0;
      
      // Determine weak and strong areas
      const areas = {
        grammar: scoreBreakdown.grammar,
        vocabulary: scoreBreakdown.vocabulary,
        coherence: scoreBreakdown.coherence,
        taskResponse: scoreBreakdown.taskResponse,
      };
      
      const sortedAreas = Object.entries(areas).sort(([,a], [,b]) => a - b);
      const weakAreas = sortedAreas.slice(0, 2).map(([area]) => area);
      const strongAreas = sortedAreas.slice(-2).map(([area]) => area);
      
      // Determine trend
      let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
      if (improvement > 5) trend = 'IMPROVING';
      else if (improvement < -5) trend = 'DECLINING';
      
      // Update progress
      await client.models.UserProgress.update({
        id: current.id,
        averageScore: newAverage,
        attemptCount: newAttemptCount,
        lastImprovement: improvement,
        weakAreas: weakAreas,
        strongAreas: strongAreas,
        lastAttemptDate: new Date().toISOString(),
        bestScore: Math.max(current.bestScore || 0, newScore),
        trend,
      });
    } else {
      // Create new progress record
      const areas = {
        grammar: scoreBreakdown.grammar,
        vocabulary: scoreBreakdown.vocabulary,
        coherence: scoreBreakdown.coherence,
        taskResponse: scoreBreakdown.taskResponse,
      };
      
      const sortedAreas = Object.entries(areas).sort(([,a], [,b]) => a - b);
      const weakAreas = sortedAreas.slice(0, 2).map(([area]) => area);
      const strongAreas = sortedAreas.slice(-2).map(([area]) => area);
      
      await client.models.UserProgress.create({
        userId,
        topicCategory: topicCategory as any,
        averageScore: newScore,
        attemptCount: 1,
        lastImprovement: 0,
        weakAreas,
        strongAreas,
        lastAttemptDate: new Date().toISOString(),
        bestScore: newScore,
        trend: 'STABLE',
      });
    }
  } catch (error) {
    console.error('Failed to update user progress:', error);
  }
}

// Calculate confidence score based on various factors
export function calculateConfidenceScore(
  similarEssaysFound: number,
  topicRelevance: number,
  wordCountCompliance: boolean
): number {
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