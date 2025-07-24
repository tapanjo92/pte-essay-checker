'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createTracedClient } from '@/lib/xray-client';

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

export default function PublicResultsPage() {
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
        // Initialize client with API key for public access
        const client = createTracedClient({
          authMode: 'apiKey'
        });
        
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
            setResult(resultResponse.data as any);
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl pt-10">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
            <div className="mt-4 text-center">
              <Link href="/">
                <Button>Go to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-4xl pt-10">
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
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl space-y-6 px-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">PTE Essay Results</h1>
          <p className="mt-2 text-lg text-gray-600">
            Detailed analysis of your essay performance
          </p>
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
              <p className="text-sm text-muted-foreground">{result.feedback.summary}</p>
            </div>
            
            {result.feedback.strengths.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold text-green-600">Strengths</h4>
                <ul className="list-inside list-disc space-y-1">
                  {result.feedback.strengths.map((strength, index) => (
                    <li key={index} className="text-sm">{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.feedback.improvements.length > 0 && (
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
                {result.feedback.detailedFeedback.taskResponse}
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-semibold">Coherence & Cohesion</h4>
              <p className="text-sm text-muted-foreground">
                {result.feedback.detailedFeedback.coherence}
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-semibold">Vocabulary</h4>
              <p className="text-sm text-muted-foreground">
                {result.feedback.detailedFeedback.vocabulary}
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-semibold">Grammar</h4>
              <p className="text-sm text-muted-foreground">
                {result.feedback.detailedFeedback.grammar}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions */}
        {result.suggestions && result.suggestions.length > 0 && (
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
            <CardDescription>
              Topic: {essay.topic} | Word count: {essay.wordCount}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{essay.content}</p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center pt-6">
          <Link href="/">
            <Button size="lg" className="mr-4">Try Another Essay</Button>
          </Link>
          <Link href="/auth">
            <Button size="lg" variant="outline">Sign Up for More Features</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}