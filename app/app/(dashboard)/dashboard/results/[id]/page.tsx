'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EssayProcessingStatus } from '@/components/essay-processing-status';
import { Skeleton } from '@/components/ui/skeleton';

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
  const searchParams = useSearchParams();
  const essay1Id = params.id as string;
  const essay2Id = searchParams.get('essay2');
  
  const [loading, setLoading] = useState(true);
  const [essay1, setEssay1] = useState<any>(null);
  const [essay2, setEssay2] = useState<any>(null);
  const [result1, setResult1] = useState<Result | null>(null);
  const [result2, setResult2] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'essay1' | 'essay2' | 'both'>('essay1');

  const fetchEssayAndResult = async (essayId: string, client: any) => {
    const essayResponse = await client.models.Essay.get({ id: essayId });
    if (!essayResponse.data) {
      throw new Error(`Essay ${essayId} not found`);
    }

    let parsedResult = null;
    if (essayResponse.data.resultId) {
      const resultResponse = await client.models.Result.get({ 
        id: essayResponse.data.resultId 
      });
      if (resultResponse.data) {
        parsedResult = {
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
      }
    }

    return { essay: essayResponse.data, result: parsedResult };
  };

  useEffect(() => {
    if (!essay1Id) return;

    const fetchResults = async () => {
      try {
        const client = generateClient<Schema>();
        
        // Fetch essay 1
        const { essay: essay1Data, result: result1Data } = await fetchEssayAndResult(essay1Id, client);
        setEssay1(essay1Data);
        setResult1(result1Data);

        // Fetch essay 2 if exists
        let essay2Data = null;
        if (essay2Id) {
          const { essay: e2Data, result: result2Data } = await fetchEssayAndResult(essay2Id, client);
          essay2Data = e2Data;
          setEssay2(e2Data);
          setResult2(result2Data);
          setCurrentView('both');
        }

        // Poll if any essay is still processing
        const shouldPoll = (essay1Data.status === 'PROCESSING' || essay1Data.status === 'QUEUED') ||
                          (essay2Id && essay2Data && (essay2Data.status === 'PROCESSING' || essay2Data.status === 'QUEUED'));
        
        if (shouldPoll) {
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
  }, [essay1Id, essay2Id]);

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
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

  if ((!result1 && essay1) || (essay2 && !result2)) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Essay Results</h1>
            <p className="text-muted-foreground">
              {essay2 ? 'Processing your essays...' : 'Processing your essay...'}
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
        
        {/* Essay 1 Status */}
        {essay1 && !result1 && (
          <>
            <div className="text-lg font-semibold">Essay 1</div>
            <EssayProcessingStatus status={essay1.status} />
          </>
        )}
        
        {/* Essay 2 Status */}
        {essay2 && !result2 && (
          <>
            <div className="text-lg font-semibold mt-6">Essay 2</div>
            <EssayProcessingStatus status={essay2.status} />
          </>
        )}
        
        {/* Show essays while processing */}
        {essay1 && (
          <Card>
            <CardHeader>
              <CardTitle>Essay 1: {essay1.topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
                {essay1.content}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Word count: {essay1.wordCount}
              </p>
            </CardContent>
          </Card>
        )}
        
        {essay2 && (
          <Card>
            <CardHeader>
              <CardTitle>Essay 2: {essay2.topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
                {essay2.content}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Word count: {essay2.wordCount}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Helper function to render essay results
  const renderEssayResults = (essay: any, result: Result | null, essayNumber: number) => {
    if (!result) return null;
    
    return (
      <>
        {/* Overall Score */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Score - Essay {essayNumber}</CardTitle>
            <CardDescription>{essay.topic}</CardDescription>
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

        {/* Detailed Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.feedback && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.feedback.summary || 'No summary available'}
                  </p>
                </div>
                {result.feedback.detailedFeedback && (
                  <>
                    <div>
                      <h3 className="font-semibold mb-2">Task Response</h3>
                      <p className="text-sm text-muted-foreground">
                        {result.feedback.detailedFeedback.taskResponse || 'No feedback available'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Coherence & Cohesion</h3>
                      <p className="text-sm text-muted-foreground">
                        {result.feedback.detailedFeedback.coherence || 'No feedback available'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Vocabulary</h3>
                      <p className="text-sm text-muted-foreground">
                        {result.feedback.detailedFeedback.vocabulary || 'No feedback available'}
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Your Essay */}
        <Card>
          <CardHeader>
            <CardTitle>Your Essay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
              {essay.content}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Word count: {essay.wordCount}
            </p>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Essay Results</h2>
          <p className="mt-2 text-muted-foreground">
            {essay2 ? 'Results for both essays' : 'Results for your essay'}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Write Another Essay</Button>
        </Link>
      </div>

      {/* Navigation tabs for 2 essays */}
      {essay2 && (
        <div className="flex gap-2 border-b">
          <Button
            variant={currentView === 'essay1' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setCurrentView('essay1')}
          >
            Essay 1
          </Button>
          <Button
            variant={currentView === 'essay2' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setCurrentView('essay2')}
          >
            Essay 2
          </Button>
          <Button
            variant={currentView === 'both' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setCurrentView('both')}
          >
            Combined Results
          </Button>
        </div>
      )}

      {/* Display based on current view */}
      {currentView === 'essay1' && essay1 && renderEssayResults(essay1, result1, 1)}
      {currentView === 'essay2' && essay2 && renderEssayResults(essay2, result2, 2)}
      {currentView === 'both' && essay2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Combined Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <h3 className="font-semibold mb-2">Essay 1</h3>
                  <div className={`text-4xl font-bold ${getScoreColor(result1?.overallScore || 0)}`}>
                    {result1?.overallScore || 0}/90
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{essay1?.topic}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Essay 2</h3>
                  <div className={`text-4xl font-bold ${getScoreColor(result2?.overallScore || 0)}`}>
                    {result2?.overallScore || 0}/90
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{essay2?.topic}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <div className={`text-2xl font-bold ${getScoreColor(((result1?.overallScore || 0) + (result2?.overallScore || 0)) / 2)}`}>
                  {Math.round(((result1?.overallScore || 0) + (result2?.overallScore || 0)) / 2)}/90
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Show essay 1 results if only 1 essay */}
      {!essay2 && essay1 && renderEssayResults(essay1, result1, 1)}
    </div>
  );
}