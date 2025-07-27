'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { getCurrentUser } from 'aws-amplify/auth';
import { toast } from 'sonner';
import { createTracedClient } from '@/lib/xray-client';
import { useNetworkStatus, retryWithBackoff, isNetworkError } from '@/lib/network-utils';

// This is how you build a dashboard that actually works
export default function DashboardPage() {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  // Don't create client at module level - need auth context
  const [client, setClient] = useState<any>(null);
  
  // Essay state - the core of what matters
  const [essayTopic, setEssayTopic] = useState<any>(null);
  const [essayContent, setEssayContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(1200);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User state - secondary
  const [user, setUser] = useState<any>(null);
  
  // Load essay topic IMMEDIATELY - no blocking
  useEffect(() => {
    const savedTopic = localStorage.getItem('selected-essay-topic');
    if (savedTopic) {
      try {
        setEssayTopic(JSON.parse(savedTopic));
      } catch (e) {
        // Default topic as fallback
        setEssayTopic({
          id: 'default',
          title: 'Technology and Society',
          description: 'Discuss the impact of technology on modern society.'
        });
      }
    } else {
      // No topic? Redirect to selection
      router.push('/essay-questions');
    }
  }, [router]);
  
  // Load user data and create client with auth context
  useEffect(() => {
    getCurrentUser()
      .then(user => {
        setUser(user);
        // Create client after we have auth context
        setClient(createTracedClient());
      })
      .catch(() => {
        // Silent fail - essay writing should work even if auth is wonky
        console.log('Auth check failed, continuing anyway');
        setClient(createTracedClient());
      });
  }, []);
  
  // Timer logic - clean and simple
  useEffect(() => {
    if (!isTimerActive || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsTimerActive(false);
          toast.error('Time\'s up! Submit your essay now.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isTimerActive, timeRemaining]);
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setEssayContent(content);
    setWordCount(content.trim().split(/\s+/).filter(Boolean).length);
    
    // Start timer on first keystroke
    if (!isTimerActive && content.length > 0) {
      setIsTimerActive(true);
      toast.info('Timer started! 20 minutes remaining.');
    }
  };
  
  const handleSubmit = async () => {
    if (!client) {
      toast.error('Please wait, initializing...');
      return;
    }
    
    if (wordCount < 200 || wordCount > 300) {
      toast.error(`Word count must be 200-300 (current: ${wordCount})`);
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Submitting your essay...');
    
    try {
      // Get current user for submission
      const currentUser = await getCurrentUser();
      
      // Create essay record
      // The owner field will be automatically set by Amplify based on the authenticated user
      const essayResult = await retryWithBackoff(
        () => client.models.Essay.create({
          userId: currentUser.username || currentUser.userId,
          topic: essayTopic.title,
          content: essayContent,
          wordCount: wordCount,
          status: 'PENDING',
          // Explicitly set timestamps to ensure they're saved
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        { maxRetries: 3 }
      ) as any;
      
      if (!essayResult?.data?.id) {
        throw new Error('Failed to create essay');
      }
      
      const essayId = essayResult.data.id;
      
      // Submit to processing queue
      await client.mutations.submitEssayToQueue({
        essayId: essayId,
        content: essayContent,
        topic: essayTopic.title,
        wordCount: wordCount,
      }).catch((error: any) => {
        console.error('Queue submission error:', error);
        // Don't fail - processing can happen async
      });
      
      toast.success('Essay submitted successfully!', { id: toastId });
      
      // Clear and redirect
      localStorage.removeItem('selected-essay-topic');
      setTimeout(() => {
        router.push(`/dashboard/results/${essayId}`);
      }, 500);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Submission failed. Please try again.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // No topic? Show selection prompt
  if (!essayTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>No Essay Topic Selected</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <Button onClick={() => router.push('/essay-questions')}>
              Select Essay Topic
            </Button>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }
  
  // Clean, focused UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-pink-950">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-float-slow" />
      </div>
      
      <div className="relative max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Timer - always visible */}
        <div className="text-center">
          <div className={`text-4xl font-mono font-bold ${
            timeRemaining <= 60 ? 'text-red-400 animate-pulse' : 
            timeRemaining <= 300 ? 'text-orange-400' : 
            'text-white'
          }`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
        
        {/* Topic */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Essay Topic</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <h3 className="font-semibold mb-2 text-white">{essayTopic.title}</h3>
            <p className="text-sm text-gray-300">{essayTopic.description}</p>
          </GlassCardContent>
        </GlassCard>
        
        {/* Writing Area */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Your Essay</GlassCardTitle>
            <GlassCardDescription>
              {wordCount}/200-300 words
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <textarea
              className="w-full h-96 p-4 rounded-lg resize-none bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
              placeholder="Start writing your essay here... (Timer will start when you begin typing)"
              value={essayContent}
              onChange={handleContentChange}
              disabled={isSubmitting || timeRemaining === 0}
            />
            
            <div className="mt-4 flex justify-between items-center">
              <span className={`text-sm ${
                wordCount < 200 || wordCount > 300 ? 'text-red-400' : 'text-green-400'
              }`}>
                {wordCount} words
              </span>
              
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || wordCount < 200 || wordCount > 300}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Essay'}
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}