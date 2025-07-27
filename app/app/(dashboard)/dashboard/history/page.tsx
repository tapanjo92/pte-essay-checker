'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Clock, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { createTracedClient } from '@/lib/xray-client';

const client = createTracedClient();

interface EssayWithResult {
  id: string;
  topic: string;
  content: string;
  wordCount: number;
  status: string;
  createdAt: string;
  resultId?: string;
  overallScore?: number;
}

export default function EssayHistoryPage() {
  const [essays, setEssays] = useState<EssayWithResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEssays();
  }, []);

  const fetchEssays = async () => {
    try {
      const user = await getCurrentUser();
      
      // Fetch all essays for the user
      const essaysResponse = await client.models.Essay.list({
        filter: { userId: { eq: user.username || user.userId } }
      });

      if (!essaysResponse.data) {
        setEssays([]);
        return;
      }

      // Fetch results for essays that have them
      const essaysWithResults = await Promise.all(
        essaysResponse.data.map(async (essay) => {
          let overallScore;
          if (essay.resultId) {
            try {
              const resultResponse = await client.models.Result.get({ 
                id: essay.resultId 
              });
              if (resultResponse.data) {
                overallScore = resultResponse.data.overallScore;
              }
            } catch (err) {
              console.error('Error fetching result:', err);
            }
          }
          
          return {
            id: essay.id || '',
            topic: essay.topic || '',
            content: essay.content || '',
            wordCount: essay.wordCount || 0,
            status: essay.status || 'PENDING',
            createdAt: essay.createdAt || '',
            resultId: essay.resultId || undefined,
            overallScore
          };
        })
      );

      // Sort by creation date (newest first)
      essaysWithResults.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setEssays(essaysWithResults);
    } catch (error) {
      console.error('Error fetching essays:', error);
      toast.error('Failed to load essay history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: { label: 'Completed', variant: 'default' as const },
      PROCESSING: { label: 'Processing', variant: 'secondary' as const },
      QUEUED: { label: 'Queued', variant: 'outline' as const },
      PENDING: { label: 'Pending', variant: 'outline' as const },
      FAILED: { label: 'Failed', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getScoreColor = (score?: number) => {
    if (!score) return '';
    if (score >= 79) return 'text-green-600';
    if (score >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Essay History</h1>
          <p className="text-muted-foreground">View all your previous essays and scores</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-48 bg-muted rounded"></div>
                <div className="h-4 w-32 bg-muted rounded mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (essays.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Essay History</h1>
          <p className="text-muted-foreground">View all your previous essays and scores</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No essays yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start practicing by writing your first essay
            </p>
            <Link href="/dashboard">
              <Button>Write Your First Essay</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const completedEssays = essays.filter(e => e.status === 'COMPLETED');
  const averageScore = completedEssays.length > 0
    ? Math.round(completedEssays.reduce((sum, e) => sum + (e.overallScore || 0), 0) / completedEssays.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Essay History
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Track your progress and review past essays
            </p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Write New Essay
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Essays</p>
                  <p className="text-3xl font-bold mt-2">{essays.length}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Average Score</p>
                  <p className="text-3xl font-bold mt-2">
                    {averageScore > 0 ? `${averageScore}/90` : 'N/A'}
                  </p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Completed</p>
                  <p className="text-3xl font-bold mt-2">{completedEssays.length}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Essay List */}
        <div className="space-y-6">
          {essays.map((essay) => (
            <Card key={essay.id} className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{essay.topic}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(essay.createdAt || '')}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {essay.wordCount} words
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(essay.status)}
                    {essay.overallScore !== undefined && (
                      <div className="text-center">
                        <span className={`text-3xl font-bold ${getScoreColor(essay.overallScore)}`}>
                          {essay.overallScore}
                        </span>
                        <span className="text-sm text-gray-500 block">/ 90</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-6 leading-relaxed">
                  {essay.content}
                </p>
                <Link href={`/dashboard/results/${essay.id}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                    View Detailed Results
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}