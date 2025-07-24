'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EssayProcessingStatus } from '@/components/essay-processing-status';
import { Skeleton } from '@/components/ui/skeleton';
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
        const client = createTracedClient();
        
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
          <div className="flex gap-2">
            <Link href="/dashboard/history">
              <Button variant="outline">View History</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Write New Essay</Button>
            </Link>
          </div>
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
      <div className="space-y-6">
        {/* Overall Score Card with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Essay {essayNumber} Results</h3>
                <p className="mt-1 text-blue-100">{essay.topic}</p>
              </div>
              <div className="rounded-full bg-white/20 px-4 py-2 backdrop-blur">
                <span className="text-sm font-medium">{getScoreLabel(result.overallScore)}</span>
              </div>
            </div>
            <div className="flex items-baseline space-x-3">
              <span className="text-7xl font-bold">{result.overallScore}</span>
              <span className="text-2xl font-light opacity-80">/ 90</span>
            </div>
          </div>
        </div>

        {/* Score Breakdown Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Task Response', score: result.taskResponseScore, icon: '📝' },
            { label: 'Coherence & Cohesion', score: result.coherenceScore, icon: '🔗' },
            { label: 'Vocabulary', score: result.vocabularyScore, icon: '📚' },
            { label: 'Grammar', score: result.grammarScore, icon: '✏️' }
          ].map((item, index) => (
            <Card key={index} className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</p>
                    <div className="flex items-baseline space-x-2">
                      <span className={`text-3xl font-bold ${getScoreColor(item.score)}`}>
                        {item.score}
                      </span>
                      <span className="text-sm text-gray-500">/ 90</span>
                    </div>
                  </div>
                  <div className="text-4xl">{item.icon}</div>
                </div>
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        item.score >= 79 ? 'bg-green-500' :
                        item.score >= 65 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(item.score / 90) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Feedback */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gray-50 dark:bg-gray-900/50">
            <CardTitle className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Detailed Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {result.feedback && (
              <>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
                  <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">Summary</h3>
                  <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
                    {result.feedback.summary || 'No summary available'}
                  </p>
                </div>
                {result.feedback.detailedFeedback && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                      <h3 className="mb-2 flex items-center space-x-2 font-semibold">
                        <span className="text-lg">📝</span>
                        <span>Task Response</span>
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {result.feedback.detailedFeedback.taskResponse || 'No feedback available'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                      <h3 className="mb-2 flex items-center space-x-2 font-semibold">
                        <span className="text-lg">🔗</span>
                        <span>Coherence & Cohesion</span>
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {result.feedback.detailedFeedback.coherence || 'No feedback available'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                      <h3 className="mb-2 flex items-center space-x-2 font-semibold">
                        <span className="text-lg">📚</span>
                        <span>Vocabulary</span>
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {result.feedback.detailedFeedback.vocabulary || 'No feedback available'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                      <h3 className="mb-2 flex items-center space-x-2 font-semibold">
                        <span className="text-lg">✏️</span>
                        <span>Grammar</span>
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {result.feedback.detailedFeedback.grammar || 'No feedback available'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Your Essay */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <CardTitle>Your Essay</CardTitle>
              <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium dark:bg-gray-800">
                {essay.wordCount} words
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="whitespace-pre-wrap rounded-lg bg-gray-50 dark:bg-gray-900/50 p-6 text-base leading-relaxed">
              {essay.content}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Essay Results
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              {essay2 ? 'Complete assessment for both essays' : 'Complete assessment for your essay'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/history">
              <Button variant="outline" className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>View History</span>
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                Write Another Essay
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation tabs for 2 essays */}
        {essay2 && (
          <div className="flex rounded-lg bg-white dark:bg-gray-950 p-1 shadow-lg">
            <Button
              variant={currentView === 'essay1' ? 'default' : 'ghost'}
              className={`flex-1 rounded-md transition-all ${
                currentView === 'essay1' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setCurrentView('essay1')}
            >
              Essay 1
            </Button>
            <Button
              variant={currentView === 'essay2' ? 'default' : 'ghost'}
              className={`flex-1 rounded-md transition-all ${
                currentView === 'essay2' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setCurrentView('essay2')}
            >
              Essay 2
            </Button>
            <Button
              variant={currentView === 'both' ? 'default' : 'ghost'}
              className={`flex-1 rounded-md transition-all ${
                currentView === 'both' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
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
    </div>
  );
}