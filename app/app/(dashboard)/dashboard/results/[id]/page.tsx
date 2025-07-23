'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Result {
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
}

export default function ResultsPage() {
  const params = useParams();
  const essayId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [essay, setEssay] = useState<any>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!essayId) return;

    const fetchResults = async () => {
      try {
        // Initialize client inside the async function
        const client = generateClient<Schema>();
        
        // Fetch essay data
        const essayResponse = await client.models.Essay.get({ id: essayId });
        if (!essayResponse.data) {
          throw new Error('Essay not found');
        }
        setEssay(essayResponse.data);

        // Fetch result data
        if (essayResponse.data.resultId) {
          const resultResponse = await client.models.Result.get({ 
            id: essayResponse.data.resultId 
          });
          if (resultResponse.data) {
            console.log('Result data:', resultResponse.data);
            // Parse JSON fields that are stored as strings
            const parsedResult = {
              ...resultResponse.data,
              feedback: typeof resultResponse.data.feedback === 'string' 
                ? JSON.parse(resultResponse.data.feedback) 
                : resultResponse.data.feedback,
              suggestions: typeof resultResponse.data.suggestions === 'string'
                ? JSON.parse(resultResponse.data.suggestions)
                : resultResponse.data.suggestions,
              highlightedErrors: typeof resultResponse.data.highlightedErrors === 'string'
                ? JSON.parse(resultResponse.data.highlightedErrors)
                : resultResponse.data.highlightedErrors
            };
            setResult(parsedResult as any);
          }
        } else if (essayResponse.data.status === 'PROCESSING') {
          // Poll for results if still processing
          setTimeout(() => fetchResults(), 2000);
          return;
        }
      } catch (err: any) {
        console.error('Error fetching results:', err);
        setError(err.message || 'Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [essayId]);

  const getScoreColor = (score: number) => {
    if (score >= 79) return 'text-green-600';
    if (score >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 79) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-lg">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
            <div className="mt-4 text-center">
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Essay is still being processed. Please wait...</p>
            <div className="mt-4 text-center">
              <Button onClick={() => window.location.reload()}>Refresh</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Essay Results</h2>
          <p className="mt-2 text-muted-foreground">
            Topic: {essay.topic}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Write Another Essay</Button>
        </Link>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(result.overallScore)}`}>
              {result.overallScore}/90
            </div>
            <p className="mt-2 text-lg">{getScoreLabel(result.overallScore)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
          <CardDescription>Individual component scores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Task Response</p>
              <p className={`text-2xl font-bold ${getScoreColor(result.taskResponseScore)}`}>
                {result.taskResponseScore}/90
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Coherence & Cohesion</p>
              <p className={`text-2xl font-bold ${getScoreColor(result.coherenceScore)}`}>
                {result.coherenceScore}/90
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Vocabulary</p>
              <p className={`text-2xl font-bold ${getScoreColor(result.vocabularyScore)}`}>
                {result.vocabularyScore}/90
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Grammar</p>
              <p className={`text-2xl font-bold ${getScoreColor(result.grammarScore)}`}>
                {result.grammarScore}/90
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{result.feedback?.summary || 'No summary available'}</p>
            {/* Debug: Show raw feedback data */}
            {!result.feedback && <pre className="text-xs">Debug: {JSON.stringify(result, null, 2)}</pre>}
          </div>
          
          {result.feedback?.strengths && result.feedback.strengths.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold text-green-600">Strengths</h4>
              <ul className="list-inside list-disc space-y-1">
                {result.feedback.strengths.map((strength, index) => (
                  <li key={index} className="text-sm">{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {result.feedback?.improvements && result.feedback.improvements.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold text-orange-600">Areas for Improvement</h4>
              <ul className="list-inside list-disc space-y-1">
                {result.feedback.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm">{improvement}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-1 font-semibold">Task Response</h4>
            <p className="text-sm text-muted-foreground">
              {result.feedback?.detailedFeedback?.taskResponse || 'No feedback available'}
            </p>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Coherence & Cohesion</h4>
            <p className="text-sm text-muted-foreground">
              {result.feedback?.detailedFeedback?.coherence || 'No feedback available'}
            </p>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Vocabulary</h4>
            <p className="text-sm text-muted-foreground">
              {result.feedback?.detailedFeedback?.vocabulary || 'No feedback available'}
            </p>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Grammar</h4>
            <p className="text-sm text-muted-foreground">
              {result.feedback?.detailedFeedback?.grammar || 'No feedback available'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {result.suggestions && Array.isArray(result.suggestions) && result.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suggestions for Next Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1">
              {result.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm">{suggestion}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Original Essay */}
      <Card>
        <CardHeader>
          <CardTitle>Your Essay</CardTitle>
          <CardDescription>Word count: {essay.wordCount}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{essay.content}</p>
        </CardContent>
      </Card>
    </div>
  );
}