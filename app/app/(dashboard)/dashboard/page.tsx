'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from 'aws-amplify/auth';
import { toast } from 'sonner';

const ESSAY_TOPICS = [
  {
    id: '1',
    title: 'Technology and Society',
    description: 'Do you agree or disagree with the following statement? Technology has made our lives more complicated than it was in the past.',
  },
  {
    id: '2',
    title: 'Education',
    description: 'Some people believe that university education should be free for all students. Others think students should pay for their education. Discuss both views and give your opinion.',
  },
  {
    id: '3',
    title: 'Environment',
    description: 'Climate change is one of the biggest challenges facing humanity. What are the main causes of climate change and what can individuals do to help solve this problem?',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [currentEssayNumber, setCurrentEssayNumber] = useState(1);
  const [totalEssays] = useState(2); // PTE can have 1-2 essays, we'll prepare for 2
  const [essay1Topic] = useState(ESSAY_TOPICS[Math.floor(Math.random() * ESSAY_TOPICS.length)]);
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
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hasStartedWriting, setHasStartedWriting] = useState(false);
  const [essay1Completed, setEssay1Completed] = useState(false);
  
  // Initialize Amplify client inside component
  const client = generateClient<Schema>();

  // Load draft on mount
  useEffect(() => {
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

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error('Paste disabled', {
      description: 'Copy/paste is not allowed in PTE exam conditions.',
    });
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error('Copy disabled', {
      description: 'Copy/paste is not allowed in PTE exam conditions.',
    });
  };

  const handleCut = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error('Cut disabled', {
      description: 'Copy/paste is not allowed in PTE exam conditions.',
    });
  };

  const handleSubmit = async () => {
    if (wordCount < 200 || wordCount > 300) {
      toast.error('Essay must be between 200-300 words', {
        description: `Current word count: ${wordCount}`,
      });
      return;
    }

    setIsSubmitting(true);
    setProcessingStatus('Submitting essay...');
    
    const toastId = toast.loading('Submitting your essay...');

    try {
      const user = await getCurrentUser();
      
      // Create essay record
      const essayResult = await client.models.Essay.create({
        userId: user.userId,
        topic: selectedTopic.title,
        content: essayContent,
        wordCount: wordCount,
        status: 'PENDING',
      });

      if (!essayResult.data?.id) {
        throw new Error('Failed to create essay');
      }

      const essayId = essayResult.data.id;
      const newSubmittedIds = [...submittedEssayIds, essayId];
      setSubmittedEssayIds(newSubmittedIds);
      setProcessingStatus('Processing essay with AI...');
      
      toast.loading('Queueing essay for AI analysis...', { id: toastId });

      // Call the submitEssayToQueue mutation
      const processingResult = await client.mutations.submitEssayToQueue({
        essayId: essayId,
        content: essayContent,
        topic: selectedTopic.description,
        wordCount: wordCount,
      });

      setProcessingStatus(`Essay ${currentEssayNumber} submitted to processing queue.`);
      toast.success(`Essay ${currentEssayNumber} submitted successfully!`, { 
        id: toastId,
        description: currentEssayNumber === 1 ? 'Proceeding to Essay 2...' : 'Redirecting to results...',
      });
      
      // Clear draft after successful submission
      clearDraft();
      
      // Handle navigation based on essay number
      if (currentEssayNumber === 1) {
        // Save state and move to essay 2
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
          setProcessingStatus(null);
          setEssay1Completed(true);
          toast.info('Please write Essay 2 of 2');
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
      toast.error('Failed to submit essay', { 
        id: toastId,
        description: 'Please try again. If the problem persists, contact support.',
      });
      setProcessingStatus('Error processing essay. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">PTE Essay Writing Task</h2>
          <p className="mt-2 text-muted-foreground">
            Essay {currentEssayNumber} of {totalEssays} • Write a 200-300 word essay on the given topic. You have 20 minutes per essay.
          </p>
        </div>
        {hasStartedWriting && (
          <div className={`text-3xl font-mono font-bold ${
            timeRemaining <= 60 ? 'text-red-600 animate-pulse' : 
            timeRemaining <= 300 ? 'text-orange-600' : 
            'text-foreground'
          }`}>
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2">
        <div className={`flex-1 h-2 rounded-full ${
          currentEssayNumber >= 1 ? 'bg-primary' : 'bg-muted'
        }`} />
        <div className={`flex-1 h-2 rounded-full ${
          currentEssayNumber >= 2 || essay1Completed ? 'bg-primary' : 'bg-muted'
        }`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Essay {currentEssayNumber} Topic</CardTitle>
          <CardDescription>Read the topic carefully before you start writing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h3 className="font-semibold mb-2">{selectedTopic.title}</h3>
            <p className="text-sm">{selectedTopic.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Write Your Essay</CardTitle>
              <CardDescription>
                Write 200-300 words on the selected topic. Current word count: {wordCount}
              </CardDescription>
            </div>
            <div className="text-right">
              {lastSaved && (
                <p className="text-xs text-muted-foreground">
                  Draft saved {lastSaved.toLocaleTimeString()}
                </p>
              )}
              {isSaving && (
                <p className="text-xs text-muted-foreground">Saving draft...</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            placeholder="Start writing your essay here... (Timer will start when you begin typing)"
            value={essayContent}
            onChange={handleContentChange}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            disabled={isSubmitting || timeRemaining === 0}
            spellCheck={false}
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className={wordCount < 200 || wordCount > 300 ? 'text-destructive' : 'text-muted-foreground'}>
                {wordCount} words (200-300 required)
              </span>
              {essayContent && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveDraft}
                    disabled={isSaving}
                  >
                    Save Draft
                  </Button>
                </>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || wordCount < 200 || wordCount > 300}
              className={timeRemaining === 0 ? 'animate-pulse' : ''}
            >
              {isSubmitting ? 'Processing...' : 
               timeRemaining === 0 ? 'Submit Now - Time Up!' : 
               'Submit Essay'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {processingStatus && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-sm">{processingStatus}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}