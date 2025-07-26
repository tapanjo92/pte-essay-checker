'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { getCurrentUser } from 'aws-amplify/auth';
import { toast } from 'sonner';
import { createTracedClient } from '@/lib/xray-client';
import { useNetworkStatus, retryWithBackoff, isNetworkError } from '@/lib/network-utils';
import { WelcomeModal } from '@/components/ui/welcome-modal';

const ESSAY_TOPICS = [
  {
    id: 'pte_2025_001',
    title: 'Artificial intelligence will eventually replace human workers in most industries.',
    description: 'To what extent do you agree or disagree with this statement? Support your opinion with relevant examples and explanations.',
  },
  {
    id: 'pte_2025_003',
    title: 'The rise of remote work has fundamentally changed the traditional office culture.',
    description: 'What are the advantages and disadvantages of this trend? Provide specific examples to support your answer.',
  },
  {
    id: 'pte_2025_005',
    title: 'Social media influencers have more impact on young people than traditional role models like teachers and parents.',
    description: 'What are the causes of this phenomenon and what effects does it have on society? Support your answer with examples.',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [currentEssayNumber, setCurrentEssayNumber] = useState(1);
  const [totalEssays, setTotalEssays] = useState(1); // Default to single essay
  const [essay1Topic, setEssay1Topic] = useState(ESSAY_TOPICS[0]);
  const [essay2Topic] = useState(() => {
    // Ensure essay 2 has a different topic
    const remainingTopics = ESSAY_TOPICS.filter(t => t.id !== essay1Topic.id);
    return remainingTopics[Math.floor(Math.random() * remainingTopics.length)];
  });
  const [selectedTopic, setSelectedTopic] = useState(essay1Topic);
  const [essayContent, setEssayContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [submittedEssayIds, setSubmittedEssayIds] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hasStartedWriting, setHasStartedWriting] = useState(false);
  const [essay1Completed, setEssay1Completed] = useState(false);
  
  // Welcome modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Initialize Amplify client inside component
  const client = createTracedClient();

  // Load user data and check for first visit
  useEffect(() => {
    let hasShownWelcome = false;
    
    const loadUserData = async () => {
      try {
        const currentUser = await getCurrentUser();
        const userResult = await client.models.User.get({ id: currentUser.userId });
        
        if (userResult.data) {
          setUserData(userResult.data);
          
          // Check if user has a subscription
          if (userResult.data.subscriptionId) {
            const subResult = await client.models.UserSubscription.get({ 
              id: userResult.data.subscriptionId 
            });
            if (subResult.data) {
              setUserSubscription(subResult.data);
            }
          }
          
          // Check if this is the first visit
          const welcomeShown = localStorage.getItem('welcome-modal-shown');
          if (!welcomeShown && userResult.data && !hasShownWelcome) {
            hasShownWelcome = true;
            setShowWelcomeModal(true);
            // Show welcome toast only once
            toast.success(`Welcome to PTE Essay Checker, ${userResult.data.firstName || 'there'}! 🎉`, {
              duration: 5000,
            });
          }
        }
      } catch (error) {
        // Check if it's an authentication error
        if (error instanceof Error && 
            (error.name === 'UserUnAuthenticatedException' || 
             error.message.includes('User needs to be authenticated'))) {
          console.log('User not authenticated in dashboard, redirecting...');
          router.push('/auth');
          return;
        }
        console.error('Error loading user data:', error);
      } finally {
        setAuthChecking(false);
      }
    };
    
    loadUserData();
  }, []); // Remove client from dependencies

  // Load draft on mount
  useEffect(() => {
    // Check if coming from essay questions page
    const savedTopic = localStorage.getItem('selected-essay-topic');
    const flowType = localStorage.getItem('essay-flow-type');
    
    if (savedTopic) {
      try {
        const topic = JSON.parse(savedTopic);
        setEssay1Topic(topic);
        setSelectedTopic(topic);
        if (flowType === 'single') {
          setTotalEssays(1);
        }
      } catch (e) {
        console.error('Error parsing saved topic:', e);
      }
    }
    
    const savedEssayNumber = localStorage.getItem('current-essay-number');
    const savedEssay1Completed = localStorage.getItem('essay1-completed');
    
    if (savedEssayNumber) {
      setCurrentEssayNumber(parseInt(savedEssayNumber, 10));
    }
    
    if (savedEssay1Completed === 'true') {
      setEssay1Completed(true);
      setSelectedTopic(essay2Topic);
    }
    
    const essayPrefix = `essay${currentEssayNumber}`;
    const savedDraft = localStorage.getItem(`${essayPrefix}-draft`);
    const savedTimeRemaining = localStorage.getItem(`${essayPrefix}-time-remaining`);
    const savedTimerActive = localStorage.getItem(`${essayPrefix}-timer-active`);
    
    if (savedDraft) {
      setEssayContent(savedDraft);
      const words = savedDraft.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      
      const lastSaveTime = localStorage.getItem(`${essayPrefix}-draft-time`);
      if (lastSaveTime) {
        setLastSaved(new Date(lastSaveTime));
      }
      
      // Restore timer state
      if (savedTimeRemaining && savedTimerActive === 'true') {
        const timeLeft = parseInt(savedTimeRemaining, 10);
        if (timeLeft > 0) {
          setTimeRemaining(timeLeft);
          setHasStartedWriting(true);
          setIsTimerActive(true);
          toast.info(`Essay ${currentEssayNumber} timer resumed: ${Math.floor(timeLeft / 60)} minutes remaining`);
        }
      }
    }
  }, [currentEssayNumber, essay2Topic]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isSubmitting && wordCount >= 200 && wordCount <= 300 && hasStartedWriting) {
          handleSubmit();
        }
      }
      // Ctrl/Cmd + S to save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (essayContent && !isSaving) {
          saveDraft();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, wordCount, hasStartedWriting, essayContent, isSaving]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!essayContent && !selectedTopic) return;
    
    const saveTimer = setTimeout(() => {
      saveDraft();
    }, 30000); // 30 seconds
    
    return () => clearTimeout(saveTimer);
  }, [essayContent, selectedTopic]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerActive || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          toast.error('Time is up!', {
            description: 'Your 20 minutes have ended. Submit your essay now.',
            duration: 10000,
          });
          return 0;
        }
        
        // Time alerts
        if (prev === 600) { // 10 minutes
          toast.warning('10 minutes remaining', {
            description: 'You have 10 minutes left to complete your essay.',
          });
        } else if (prev === 300) { // 5 minutes
          toast.warning('5 minutes remaining', {
            description: 'You have 5 minutes left. Start wrapping up your essay.',
          });
        } else if (prev === 60) { // 1 minute
          toast.error('1 minute remaining!', {
            description: 'Hurry! You have only 1 minute left.',
            duration: 5000,
          });
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, timeRemaining]);

  const saveDraft = () => {
    if (essayContent || selectedTopic) {
      setIsSaving(true);
      const essayPrefix = `essay${currentEssayNumber}`;
      localStorage.setItem(`${essayPrefix}-draft`, essayContent);
      localStorage.setItem(`${essayPrefix}-topic`, selectedTopic.id);
      localStorage.setItem(`${essayPrefix}-draft-time`, new Date().toISOString());
      localStorage.setItem(`${essayPrefix}-time-remaining`, timeRemaining.toString());
      localStorage.setItem(`${essayPrefix}-timer-active`, isTimerActive.toString());
      localStorage.setItem('current-essay-number', currentEssayNumber.toString());
      setLastSaved(new Date());
      
      setTimeout(() => {
        setIsSaving(false);
        toast.success(`Essay ${currentEssayNumber} draft saved`, {
          duration: 2000,
          description: `${formatTime(timeRemaining)} remaining`,
        });
      }, 500);
    }
  };

  const clearDraft = () => {
    const essayPrefix = `essay${currentEssayNumber}`;
    localStorage.removeItem(`${essayPrefix}-draft`);
    localStorage.removeItem(`${essayPrefix}-topic`);
    localStorage.removeItem(`${essayPrefix}-draft-time`);
    localStorage.removeItem(`${essayPrefix}-time-remaining`);
    localStorage.removeItem(`${essayPrefix}-timer-active`);
    setLastSaved(null);
  };

  const clearAllDrafts = () => {
    // Clear drafts for both essays
    for (let i = 1; i <= 2; i++) {
      const essayPrefix = `essay${i}`;
      localStorage.removeItem(`${essayPrefix}-draft`);
      localStorage.removeItem(`${essayPrefix}-topic`);
      localStorage.removeItem(`${essayPrefix}-draft-time`);
      localStorage.removeItem(`${essayPrefix}-time-remaining`);
      localStorage.removeItem(`${essayPrefix}-timer-active`);
    }
    localStorage.removeItem('current-essay-number');
    localStorage.removeItem('essay1-completed');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setEssayContent(content);
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    
    // Start timer on first keystroke
    if (!hasStartedWriting && content.length > 0) {
      setHasStartedWriting(true);
      setIsTimerActive(true);
      toast.info('Timer started!', {
        description: 'You have 20 minutes to complete your essay.',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (wordCount < 200 || wordCount > 300) {
      toast.error(
        wordCount < 200 
          ? `Essay too short (${wordCount}/200 words)` 
          : `Essay too long (${wordCount}/300 words)`,
        {
          description: wordCount < 200 
            ? `Please write at least ${200 - wordCount} more words.`
            : `Please remove at least ${wordCount - 300} words.`,
        }
      );
      return;
    }

    if (!isOnline) {
      toast.error('No internet connection', {
        description: 'Please check your connection and try again.',
      });
      return;
    }

    setIsSubmitting(true);
    
    const toastId = toast.loading('Submitting your essay...');

    try {
      const user = await getCurrentUser();
      
      // Create essay record with retry
      const essayResult = await retryWithBackoff(
        () => client.models.Essay.create({
          userId: user.userId,
          topic: selectedTopic.title,
          content: essayContent,
          wordCount: wordCount,
          status: 'PENDING',
        }),
        {
          maxRetries: 3,
          onRetry: (attempt) => {
            toast.loading(`Retrying submission... (Attempt ${attempt}/3)`, { id: toastId });
          },
        }
      );

      if (!essayResult.data?.id) {
        throw new Error('Failed to create essay');
      }

      const essayId = essayResult.data.id;
      const newSubmittedIds = [...submittedEssayIds, essayId];
      setSubmittedEssayIds(newSubmittedIds);
      // Submit to queue with retry (fire and forget - don't wait for processing)
      retryWithBackoff(
        () => client.mutations.submitEssayToQueue({
          essayId: essayId,
          content: essayContent,
          topic: selectedTopic.title,
          wordCount: wordCount,
        }),
        { maxRetries: 2 }
      ).catch(error => {
        console.error('Error queueing essay for processing:', error);
        // Don't show error to user - processing can happen in background
      });
      toast.success(`Essay submitted successfully!`, { 
        id: toastId,
        description: totalEssays === 1 ? 'Redirecting to results...' : (currentEssayNumber === 1 ? 'Proceeding to Essay 2...' : 'Redirecting to results...'),
      });
      
      // Clear draft after successful submission
      clearDraft();
      
      // Handle navigation based on total essays and current number
      if (totalEssays === 1) {
        // Single essay mode - go directly to results
        setTimeout(() => {
          router.push(`/dashboard/results/${essayId}`);
          clearAllDrafts();
          localStorage.removeItem('selected-essay-topic');
          localStorage.removeItem('essay-flow-type');
        }, 1500);
      } else if (currentEssayNumber === 1 && totalEssays === 2) {
        // First essay of two - move to essay 2
        localStorage.setItem('essay1-completed', 'true');
        localStorage.setItem('essay1-id', essayId);
        
        setTimeout(() => {
          setCurrentEssayNumber(2);
          setSelectedTopic(essay2Topic);
          setEssayContent('');
          setWordCount(0);
          setTimeRemaining(1200); // Reset timer for essay 2
          setIsTimerActive(false);
          setHasStartedWriting(false);
          setEssay1Completed(true);
          setIsSubmitting(false); // Reset submitting state
          toast.info('Please write Essay 2 of 2. Essay 1 is being processed in the background.');
        }, 1500);
      } else {
        // Both essays completed - redirect to results
        localStorage.setItem('essay2-id', essayId);
        setTimeout(() => {
          const essay1Id = localStorage.getItem('essay1-id');
          if (essay1Id) {
            router.push(`/dashboard/results/${essay1Id}?essay2=${essayId}`);
          } else {
            router.push(`/dashboard/results/${essayId}`);
          }
          clearAllDrafts();
        }, 1500);
      }

    } catch (error) {
      console.error('Error submitting essay:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (isNetworkError(error)) {
        toast.error('Network error', { 
          id: toastId,
          description: 'Please check your internet connection and try again.',
          action: {
            label: 'Retry',
            onClick: () => handleSubmit(),
          },
        });
      } else {
        toast.error('Failed to submit essay', { 
          id: toastId,
          description: 'An unexpected error occurred. Your essay has been saved as a draft.',
        });
      }
      setIsSubmitting(false);
    }
  };

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('welcome-modal-shown', 'true');
  };

  // Show loading state while checking authentication
  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcome}
        userName={userData?.firstName}
        essaysRemaining={userSubscription?.essaysRemaining || 5}
      />
      
      <div className="w-full space-y-6">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          You are offline. Your work will be saved locally and synced when connection is restored.
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">PTE Essay Writing Task</h2>
          <p className="mt-2 text-gray-300">
            {totalEssays > 1 ? `Essay ${currentEssayNumber} of ${totalEssays} •` : ''} Write 200-300 words • 20 minutes per essay
          </p>
        </div>
        {hasStartedWriting && (
          <>
            {/* Desktop timer */}
            <div 
              className={`hidden md:block text-3xl font-mono font-bold ${
                timeRemaining <= 60 ? 'text-red-600 animate-pulse' : 
                timeRemaining <= 300 ? 'text-orange-600' : 
                'text-foreground'
              }`}
              role="timer"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
            >
              {formatTime(timeRemaining)}
            </div>
            {/* Mobile floating timer */}
            <div 
              className={`md:hidden fixed bottom-20 right-4 z-50 bg-background border shadow-lg rounded-full px-4 py-2 text-lg font-mono font-bold ${
                timeRemaining <= 60 ? 'text-red-600 animate-pulse border-red-600' : 
                timeRemaining <= 300 ? 'text-orange-600 border-orange-600' : 
                'text-foreground'
              }`}
              role="timer"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
            >
              {formatTime(timeRemaining)}
            </div>
          </>
        )}
      </div>

      {/* Progress indicator - only show for 2 essays */}
      {totalEssays > 1 && (
        <div className="flex gap-2">
          <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${
            currentEssayNumber >= 1 || essay1Completed ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/10'
          }`} />
          <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${
            currentEssayNumber >= 2 || essay1Completed ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'
          }`} />
        </div>
      )}

      {/* Topic Card */}
      <GlassCard variant="gradient">
        <GlassCardHeader>
          <GlassCardTitle className="text-xl">Essay Topic{totalEssays > 1 ? ` ${currentEssayNumber}` : ''}</GlassCardTitle>
          <GlassCardDescription className="text-gray-400">Read the topic carefully before you start writing</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-2">
            <h3 className="font-semibold">{selectedTopic.title}</h3>
            <p className="text-sm text-muted-foreground">{selectedTopic.description}</p>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Writing Area */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-start justify-between">
            <div>
              <GlassCardTitle className="text-xl">Write Your Essay</GlassCardTitle>
              <GlassCardDescription className="text-gray-400">
                <span
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  id="word-count"
                >
                  Current word count: {wordCount} / 200-300 words
                  {wordCount < 200 && wordCount > 0 && ' (Too short)'}
                  {wordCount > 300 && ' (Too long)'}
                </span>
              </GlassCardDescription>
            </div>
            {lastSaved && (
              <p className="text-xs text-muted-foreground">
                Draft saved at {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <textarea
            className="min-h-[300px] md:min-h-[400px] w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all"
            placeholder="Start writing your essay here... (Timer will start when you begin typing)"
            value={essayContent}
            onChange={handleContentChange}
            disabled={isSubmitting || timeRemaining === 0}
            aria-label="Essay writing area"
            aria-describedby="word-count essay-instructions"
            aria-invalid={wordCount < 200 || wordCount > 300}
          />
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter to submit • Ctrl+S to save draft
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-sm ${
                  wordCount < 200 || wordCount > 300 ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {wordCount} words
                </span>
              {essayContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveDraft}
                  disabled={isSaving}
                  aria-label={isSaving ? 'Saving draft' : 'Save current draft'}
                  aria-busy={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
              )}
              </div>
              <Button
              onClick={handleSubmit}
              disabled={isSubmitting || wordCount < 200 || wordCount > 300}
              className={`${timeRemaining === 0 ? 'animate-pulse' : ''} min-h-[44px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white`}
              aria-label={isSubmitting ? 'Submitting essay' : 'Submit essay for grading'}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 
               timeRemaining === 0 ? 'Submit Now - Time Up!' : 
               `Submit Essay ${currentEssayNumber}`}
            </Button>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
    </>
  );
}