'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Clock, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const client = generateClient<Schema>();

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
        filter: { userId: { eq: user.userId } }
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
            ...essay,
            overallScore
          };
        })
      );

      // Sort by creation date (newest first)
      essaysWithResults.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

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

  const formatDate = (dateString: string) => {
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Essay History</h1>
          <p className="text-muted-foreground">View all your previous essays and scores</p>
        </div>
        <Link href="/dashboard">
          <Button>Write New Essay</Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Essays</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{essays.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageScore > 0 ? averageScore : '-'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEssays.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Essay List */}
      <div className="space-y-4">
        {essays.map((essay) => (
          <Card key={essay.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{essay.topic}</CardTitle>
                  <CardDescription>
                    <span className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {formatDate(essay.createdAt)}
                      <span className="text-muted-foreground">•</span>
                      {essay.wordCount} words
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(essay.status)}
                  {essay.overallScore && (
                    <span className={`text-2xl font-bold ${getScoreColor(essay.overallScore)}`}>
                      {essay.overallScore}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {essay.content}
              </p>
              <Link href={`/dashboard/results/${essay.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}