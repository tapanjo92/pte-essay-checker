/**
 * Type definitions for PTE Essay Checker
 * Following AWS Amplify Gen 2 best practices for type safety
 */

import type { Schema } from '@/amplify/data/resource';

// Base types from Amplify schema
export type Essay = Schema['Essay']['type'];
export type Result = Schema['Result']['type'];
export type User = Schema['User']['type'];
export type Topic = Schema['Topic']['type'];

// Essay status enum
export enum EssayStatus {
  CREATED = 'CREATED',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Highlighted error interface
export interface HighlightedError {
  text: string;
  type: 'grammar' | 'vocabulary' | 'coherence' | 'spelling';
  suggestion?: string;
  correction?: string; // Some backend responses use 'correction' instead of 'suggestion'
  explanation?: string;
  startIndex: number;
  endIndex: number;
  severity?: 'high' | 'medium' | 'low';
}

// Detailed feedback structure
export interface DetailedFeedback {
  content?: string;
  form?: string;
  grammar?: string;
  vocabulary?: string;
  spelling?: string;
  developmentCoherence?: string;
  linguisticRange?: string;
  taskResponse?: string;
  coherence?: string;
}

// Feedback interface
export interface Feedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  detailedFeedback: DetailedFeedback;
}

// Score breakdown for new PTE format
export interface ScoreBreakdown {
  content?: number;
  form?: number;
  grammar?: number;
  vocabulary?: number;
  spelling?: number;
  developmentCoherence?: number;
  linguisticRange?: number;
  // Legacy fields
  taskResponse?: number;
  task?: number;
  coherence?: number;
}

// PTE scores interface
export interface PTEScores {
  overall: number;
  communicativeSkills: {
    listening: number;
    reading: number;
    speaking: number;
    writing: number;
  };
  enablingSkills: {
    grammar: number;
    oralFluency: number;
    pronunciation: number;
    spelling: number;
    vocabulary: number;
    writtenDiscourse: number;
  };
}

// Topic relevance interface
export interface TopicRelevance {
  isOnTopic: boolean;
  relevanceScore: number;
  explanation: string;
}

// Processed result interface
export interface ProcessedResult extends Omit<Result, 'feedback' | 'suggestions' | 'highlightedErrors'> {
  feedback: Feedback;
  suggestions: string[];
  highlightedErrors: HighlightedError[];
  pteScores?: PTEScores;
  topicRelevance?: TopicRelevance;
}

// Essay with result interface
export interface EssayWithResult {
  essay: Essay;
  result: ProcessedResult | null;
}

// View type for comparison
export type ViewType = 'essay1' | 'essay2' | 'both';

// Section type for results page
export type ResultSection = 'overview' | 'feedback' | 'essay';

// Score category type
export type ScoreCategory = 'overall' | 'taskResponse' | 'coherence' | 'vocabulary' | 'grammar';

// API error interface
export interface ApiError {
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  retryable?: boolean;
}

// Fetch state interface
export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

// Chart data point interface
export interface ChartDataPoint {
  name: string;
  value: number;
  fullMark: number;
}

// Score improvement interface
export interface ScoreImprovement {
  category: ScoreCategory;
  previousScore: number;
  currentScore: number;
  improvement: number;
  percentage: number;
}