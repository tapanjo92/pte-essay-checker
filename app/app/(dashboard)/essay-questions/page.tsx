'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const PTE_ESSAY_TOPICS = [
  {
    id: '1',
    title: 'Technology and Society',
    description: 'Do you agree or disagree with the following statement? Technology has made our lives more complicated than it was in the past. Use specific reasons and examples to support your answer.',
    category: 'Agree/Disagree'
  },
  {
    id: '2',
    title: 'Education System',
    description: 'Some people believe that university education should be free for all students. Others think students should pay for their education. Discuss both views and give your opinion.',
    category: 'Discussion'
  },
  {
    id: '3',
    title: 'Climate Change',
    description: 'Climate change is one of the biggest challenges facing humanity. What are the main causes of climate change and what can individuals do to help solve this problem?',
    category: 'Problem/Solution'
  },
  {
    id: '4',
    title: 'Work-Life Balance',
    description: 'In many countries, people are working longer hours than ever before. What are the reasons for this? Is this a positive or negative development?',
    category: 'Causes/Effects'
  },
  {
    id: '5',
    title: 'Social Media Impact',
    description: 'Social media has revolutionized the way we communicate. Do the advantages of social media outweigh the disadvantages? Support your answer with relevant examples.',
    category: 'Advantages/Disadvantages'
  }
];

export default function EssayQuestionsPage() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartEssay = () => {
    if (!selectedTopic) {
      return;
    }

    setIsLoading(true);
    
    // Store the selected topic in localStorage
    const topic = PTE_ESSAY_TOPICS.find(t => t.id === selectedTopic);
    if (topic) {
      localStorage.setItem('selected-essay-topic', JSON.stringify(topic));
      localStorage.setItem('essay-flow-type', 'single'); // Single essay mode
      
      // Clear any existing drafts
      localStorage.removeItem('current-essay-number');
      localStorage.removeItem('essay1-completed');
      
      // Navigate to dashboard
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-4xl px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">PTE Essay Questions</h1>
          <p className="text-lg text-muted-foreground">
            Choose one topic from the list below. You'll have 20 minutes to write a 200-300 word essay.
          </p>
        </div>

        {/* Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Available Essay Topics</CardTitle>
            <CardDescription>
              Select a topic that you feel most comfortable writing about
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedTopic} onValueChange={setSelectedTopic}>
              <div className="space-y-4">
                {PTE_ESSAY_TOPICS.map((topic) => (
                  <div key={topic.id} className="relative">
                    <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                      <RadioGroupItem value={topic.id} id={topic.id} className="mt-1" />
                      <Label htmlFor={topic.id} className="flex-1 cursor-pointer">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{topic.title}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {topic.category}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {topic.description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleStartEssay}
            disabled={!selectedTopic || isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? 'Loading...' : 'Start Writing Essay'}
          </Button>
        </div>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Essay Writing Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• You will have <strong>20 minutes</strong> to complete your essay</p>
            <p>• Your essay must be between <strong>200-300 words</strong></p>
            <p>• The timer will start automatically when you begin typing</p>
            <p>• Your essay will be evaluated on task response, coherence, vocabulary, and grammar</p>
            <p>• Make sure to address all parts of the question</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}