'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EssayProcessingStatus } from '@/components/essay-processing-status';
import { Skeleton } from '@/components/ui/skeleton';
import { createTracedClient } from '@/lib/xray-client';
import { HighlightedEssay, type HighlightedError } from '@/components/highlighted-essay';
import { 
  Trophy, 
  Target, 
  BookOpen, 
  PenTool, 
  Link2, 
  TrendingUp,
  Clock,
  ArrowRight,
  FileText,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Download,
  Share2,
  Brain,
  Zap
} from 'lucide-react';

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
  highlightedErrors?: HighlightedError[];
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
  const [selectedSection, setSelectedSection] = useState<'overview' | 'feedback' | 'essay'>('overview');

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
    if (score >= 79) return 'text-green-500';
    if (score >= 65) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 79) return 'from-green-400 to-emerald-600';
    if (score >= 65) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 79) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 79) return <Trophy className="w-6 h-6 text-green-500" />;
    if (score >= 65) return <Target className="w-6 h-6 text-yellow-500" />;
    return <AlertCircle className="w-6 h-6 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-12 w-64" />
              <Skeleton className="mt-3 h-6 w-96" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Results</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if ((!result1 && essay1) || (essay2 && !result2)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Processing Your Essay{essay2 ? 's' : ''}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Our AI is analyzing your writing. This typically takes 30-60 seconds.
            </p>
          </div>
          
          {essay1 && !result1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Essay 1
              </h2>
              <EssayProcessingStatus status={essay1.status} />
            </div>
          )}
          
          {essay2 && !result2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Essay 2
              </h2>
              <EssayProcessingStatus status={essay2.status} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Helper function to render score card
  const renderScoreCard = (label: string, score: number, icon: React.ReactNode, color: string) => (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity" 
           style={{ backgroundImage: `linear-gradient(to bottom right, ${color}, ${color})` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
          {icon}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-sm text-gray-500">/90</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div 
            className={`h-full bg-gradient-to-r transition-all duration-1000 ${getScoreGradient(score)}`}
            style={{ width: `${(score / 90) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  // Helper function to render essay results
  const renderEssayResults = (essay: any, result: Result | null, essayNumber: number) => {
    if (!result) return null;
    
    return (
      <div className="space-y-8">
        {/* Section Navigation */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'feedback', label: 'Detailed Feedback', icon: <Brain className="w-4 h-4" /> },
            { id: 'essay', label: 'Your Essay', icon: <FileText className="w-4 h-4" /> }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                selectedSection === section.id
                  ? 'bg-white dark:bg-gray-800 shadow-md text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {section.icon}
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Section */}
        {selectedSection === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Score Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-50 blur-3xl" />
              <div className="relative rounded-[23px] bg-gray-900/90 backdrop-blur-xl p-8 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Essay {essayNumber} Score</h2>
                    <p className="text-blue-200/80 text-lg">{essay.topic}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getScoreIcon(result.overallScore)}
                    <span className="text-lg font-medium bg-white/20 px-4 py-2 rounded-full backdrop-blur">
                      {getScoreLabel(result.overallScore)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-4">
                    <span className="text-7xl font-black">{result.overallScore}</span>
                    <span className="text-2xl text-blue-200/60">out of 90</span>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-blue-200/60 mb-1">Word Count</p>
                    <p className="text-2xl font-semibold">{essay.wordCount}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
                  <div>
                    <p className="text-sm text-blue-200/60 mb-1">Task Response</p>
                    <p className="text-xl font-semibold">{result.taskResponseScore}/90</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-200/60 mb-1">Coherence</p>
                    <p className="text-xl font-semibold">{result.coherenceScore}/90</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-200/60 mb-1">Vocabulary</p>
                    <p className="text-xl font-semibold">{result.vocabularyScore}/90</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-200/60 mb-1">Grammar</p>
                    <p className="text-xl font-semibold">{result.grammarScore}/90</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Breakdown Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {renderScoreCard(
                'Task Response',
                result.taskResponseScore,
                <Target className="w-5 h-5 text-blue-600" />,
                '#3b82f6'
              )}
              {renderScoreCard(
                'Coherence & Cohesion',
                result.coherenceScore,
                <Link2 className="w-5 h-5 text-purple-600" />,
                '#9333ea'
              )}
              {renderScoreCard(
                'Vocabulary',
                result.vocabularyScore,
                <BookOpen className="w-5 h-5 text-pink-600" />,
                '#ec4899'
              )}
              {renderScoreCard(
                'Grammar',
                result.grammarScore,
                <PenTool className="w-5 h-5 text-orange-600" />,
                '#f97316'
              )}
            </div>

            {/* Summary Card */}
            {result.feedback?.summary && (
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                    {result.feedback.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Strengths & Improvements */}
            <div className="grid gap-6 md:grid-cols-2">
              {result.feedback?.strengths && result.feedback.strengths.length > 0 && (
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-green-50 dark:bg-green-950/20">
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {result.feedback.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {result.feedback?.improvements && result.feedback.improvements.length > 0 && (
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-amber-50 dark:bg-amber-950/20">
                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <TrendingUp className="w-5 h-5" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {result.feedback.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <ArrowRight className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Detailed Feedback Section */}
        {selectedSection === 'feedback' && result.feedback?.detailedFeedback && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Task Response Feedback */}
              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Task Response
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {result.feedback.detailedFeedback.taskResponse || 'No specific feedback available.'}
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Score</span>
                      <span className={`text-2xl font-bold ${getScoreColor(result.taskResponseScore)}`}>
                        {result.taskResponseScore}/90
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coherence Feedback */}
              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-purple-600" />
                    Coherence & Cohesion
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {result.feedback.detailedFeedback.coherence || 'No specific feedback available.'}
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Score</span>
                      <span className={`text-2xl font-bold ${getScoreColor(result.coherenceScore)}`}>
                        {result.coherenceScore}/90
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vocabulary Feedback */}
              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                <CardHeader className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-pink-600" />
                    Vocabulary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {result.feedback.detailedFeedback.vocabulary || 'No specific feedback available.'}
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Score</span>
                      <span className={`text-2xl font-bold ${getScoreColor(result.vocabularyScore)}`}>
                        {result.vocabularyScore}/90
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grammar Feedback */}
              <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                <CardHeader className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-orange-600" />
                    Grammar
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {result.feedback.detailedFeedback.grammar || 'No specific feedback available.'}
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Score</span>
                      <span className={`text-2xl font-bold ${getScoreColor(result.grammarScore)}`}>
                        {result.grammarScore}/90
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" />
                    Actionable Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {result.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                          {index + 1}
                        </span>
                        <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Essay Section */}
        {selectedSection === 'essay' && (
          <div className="animate-fadeIn">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Your Essay</CardTitle>
                    <CardDescription className="mt-2 text-base">{essay.topic}</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Word Count</p>
                      <p className="text-xl font-semibold">{essay.wordCount}</p>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 pb-8">
                <HighlightedEssay 
                  content={essay.content}
                  errors={result?.highlightedErrors || []}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-pink-950 text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-float-delayed" />
      </div>

      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Essay Analysis Results
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Comprehensive feedback powered by AI
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Link href="/dashboard/history">
                <Button variant="outline" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  History
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  Write New Essay
                </Button>
              </Link>
            </div>
          </div>

          {/* Navigation tabs for multiple essays */}
          {essay2 && (
            <div className="mb-8 p-1 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
              <div className="grid grid-cols-3 gap-1">
                {[
                  { value: 'essay1', label: 'Essay 1' },
                  { value: 'essay2', label: 'Essay 2' },
                  { value: 'both', label: 'Compare' }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setCurrentView(tab.value as any)}
                    className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      currentView === tab.value
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {tab.label}
                    {currentView === tab.value && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-xl" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content based on view */}
          {currentView === 'essay1' && essay1 && renderEssayResults(essay1, result1, 1)}
          {currentView === 'essay2' && essay2 && renderEssayResults(essay2, result2, 2)}
          
          {/* Comparison View */}
          {currentView === 'both' && essay2 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Essay 1 Summary */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                    <CardTitle className="flex items-center justify-between">
                      <span>Essay 1</span>
                      {result1 && getScoreIcon(result1.overallScore)}
                    </CardTitle>
                    <CardDescription>{essay1.topic}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className={`text-5xl font-bold mb-2 ${result1 ? getScoreColor(result1.overallScore) : ''}`}>
                        {result1?.overallScore || 0}/90
                      </div>
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                        {result1 ? getScoreLabel(result1.overallScore) : 'Processing...'}
                      </p>
                    </div>
                    {result1 && (
                      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Task Response</p>
                          <p className="text-lg font-semibold">{result1.taskResponseScore}/90</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Coherence</p>
                          <p className="text-lg font-semibold">{result1.coherenceScore}/90</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Vocabulary</p>
                          <p className="text-lg font-semibold">{result1.vocabularyScore}/90</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Grammar</p>
                          <p className="text-lg font-semibold">{result1.grammarScore}/90</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Essay 2 Summary */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                    <CardTitle className="flex items-center justify-between">
                      <span>Essay 2</span>
                      {result2 && getScoreIcon(result2.overallScore)}
                    </CardTitle>
                    <CardDescription>{essay2.topic}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className={`text-5xl font-bold mb-2 ${result2 ? getScoreColor(result2.overallScore) : ''}`}>
                        {result2?.overallScore || 0}/90
                      </div>
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                        {result2 ? getScoreLabel(result2.overallScore) : 'Processing...'}
                      </p>
                    </div>
                    {result2 && (
                      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Task Response</p>
                          <p className="text-lg font-semibold">{result2.taskResponseScore}/90</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Coherence</p>
                          <p className="text-lg font-semibold">{result2.coherenceScore}/90</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Vocabulary</p>
                          <p className="text-lg font-semibold">{result2.vocabularyScore}/90</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Grammar</p>
                          <p className="text-lg font-semibold">{result2.grammarScore}/90</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Chart */}
              {result1 && result2 && (
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Score Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        { label: 'Overall Score', score1: result1.overallScore, score2: result2.overallScore },
                        { label: 'Task Response', score1: result1.taskResponseScore, score2: result2.taskResponseScore },
                        { label: 'Coherence', score1: result1.coherenceScore, score2: result2.coherenceScore },
                        { label: 'Vocabulary', score1: result1.vocabularyScore, score2: result2.vocabularyScore },
                        { label: 'Grammar', score1: result1.grammarScore, score2: result2.grammarScore }
                      ].map((item, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{item.label}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className={`font-semibold ${getScoreColor(item.score1)}`}>
                                Essay 1: {item.score1}
                              </span>
                              <span className={`font-semibold ${getScoreColor(item.score2)}`}>
                                Essay 2: {item.score2}
                              </span>
                            </div>
                          </div>
                          <div className="relative h-8 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                            <div 
                              className={`absolute top-0 left-0 h-4 bg-gradient-to-r ${getScoreGradient(item.score1)} opacity-70`}
                              style={{ width: `${(item.score1 / 90) * 100}%` }}
                            />
                            <div 
                              className={`absolute bottom-0 left-0 h-4 bg-gradient-to-r ${getScoreGradient(item.score2)} opacity-70`}
                              style={{ width: `${(item.score2 / 90) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-8 pt-8 border-t text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Score</p>
                      <div className={`text-3xl font-bold ${
                        getScoreColor(Math.round((result1.overallScore + result2.overallScore) / 2))
                      }`}>
                        {Math.round((result1.overallScore + result2.overallScore) / 2)}/90
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Show single essay results if no comparison */}
          {!essay2 && essay1 && renderEssayResults(essay1, result1, 1)}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          33% {
            transform: translateY(-30px) translateX(20px);
          }
          66% {
            transform: translateY(20px) translateX(-10px);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          33% {
            transform: translateY(20px) translateX(-20px);
          }
          66% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 20s ease-in-out infinite;
          animation-delay: 5s;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}