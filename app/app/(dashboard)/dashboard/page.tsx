'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from 'aws-amplify/auth';

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
  
  // Initialize Amplify client inside component
  const client = generateClient<Schema>();

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setEssayContent(content);
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };

  const handleSubmit = async () => {
    if (wordCount < 200 || wordCount > 300) {
      alert('Essay must be between 200-300 words');
      return;
    }

    setIsSubmitting(true);
    setProcessingStatus('Submitting essay...');

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

      // Call the processEssay mutation
      const processingResult = await client.mutations.processEssay({
        essayId: essayId,
        content: essayContent,
        topic: selectedTopic.description,
        wordCount: wordCount,
      });

      setProcessingStatus('Essay processed successfully!');
      
      // Redirect to results page
      setTimeout(() => {
        router.push(`/dashboard/results/${essayId}`);
      }, 1000);

    } catch (error) {
      console.error('Error submitting essay:', error);
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
          <CardTitle>Write Your Essay</CardTitle>
          <CardDescription>
            Write 200-300 words on the selected topic. Current word count: {wordCount}
          </CardDescription>
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
            <div className="text-sm">
              <span className={wordCount < 200 || wordCount > 300 ? 'text-destructive' : 'text-muted-foreground'}>
                {wordCount} words (200-300 required)
              </span>
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