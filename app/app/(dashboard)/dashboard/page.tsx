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
  const [selectedTopic, setSelectedTopic] = useState(ESSAY_TOPICS[0]);
  const [essayContent, setEssayContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [submittedEssayId, setSubmittedEssayId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize Amplify client inside component
  const client = generateClient<Schema>();

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('essay-draft');
    const savedTopic = localStorage.getItem('essay-topic');
    
    if (savedDraft) {
      setEssayContent(savedDraft);
      const words = savedDraft.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      
      const lastSaveTime = localStorage.getItem('essay-draft-time');
      if (lastSaveTime) {
        setLastSaved(new Date(lastSaveTime));
      }
    }
    
    if (savedTopic) {
      const topic = ESSAY_TOPICS.find(t => t.id === savedTopic);
      if (topic) {
        setSelectedTopic(topic);
      }
    }
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!essayContent && !selectedTopic) return;
    
    const saveTimer = setTimeout(() => {
      saveDraft();
    }, 30000); // 30 seconds
    
    return () => clearTimeout(saveTimer);
  }, [essayContent, selectedTopic]);

  const saveDraft = () => {
    if (essayContent || selectedTopic) {
      setIsSaving(true);
      localStorage.setItem('essay-draft', essayContent);
      localStorage.setItem('essay-topic', selectedTopic.id);
      localStorage.setItem('essay-draft-time', new Date().toISOString());
      setLastSaved(new Date());
      
      setTimeout(() => {
        setIsSaving(false);
        toast.success('Draft saved', {
          duration: 2000,
        });
      }, 500);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('essay-draft');
    localStorage.removeItem('essay-topic');
    localStorage.removeItem('essay-draft-time');
    setLastSaved(null);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setEssayContent(content);
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
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
      setSubmittedEssayId(essayId);
      setProcessingStatus('Processing essay with AI...');
      
      toast.loading('Queueing essay for AI analysis...', { id: toastId });

      // Call the submitEssayToQueue mutation
      const processingResult = await client.mutations.submitEssayToQueue({
        essayId: essayId,
        content: essayContent,
        topic: selectedTopic.description,
        wordCount: wordCount,
      });

      setProcessingStatus('Essay submitted to processing queue. Redirecting to results...');
      toast.success('Essay submitted successfully!', { 
        id: toastId,
        description: 'Redirecting to results page...',
      });
      
      // Clear draft after successful submission
      clearDraft();
      
      // Redirect to results page where they can see progress
      setTimeout(() => {
        router.push(`/dashboard/results/${essayId}`);
      }, 1500);

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
      <div>
        <h2 className="text-3xl font-bold">Write Your Essay</h2>
        <p className="mt-2 text-muted-foreground">
          Select a topic and write your essay. It will be automatically scored using AI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Topic</CardTitle>
          <CardDescription>Choose one of the following essay topics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ESSAY_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                selectedTopic.id === topic.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedTopic(topic)}
            >
              <h3 className="font-semibold">{topic.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>
            </div>
          ))}
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
            className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Start writing your essay here..."
            value={essayContent}
            onChange={handleContentChange}
            disabled={isSubmitting}
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
            >
              {isSubmitting ? 'Processing...' : 'Submit Essay'}
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