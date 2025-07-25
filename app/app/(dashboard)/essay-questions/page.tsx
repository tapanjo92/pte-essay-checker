'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const PTE_ESSAY_TOPICS = [
  {
    id: 'pte_2025_001',
    title: 'Artificial intelligence will eventually replace human workers in most industries.',
    description: 'To what extent do you agree or disagree with this statement? Support your opinion with relevant examples and explanations.',
    category: 'Agree/Disagree',
    frequency: '35%',
    difficulty: 'MEDIUM'
  },
  {
    id: 'pte_2025_002',
    title: 'Some people believe that unpaid internships exploit young workers, while others see them as valuable learning opportunities.',
    description: 'Discuss both these views and give your own opinion. Include relevant examples from your knowledge or experience.',
    category: 'Discussion',
    frequency: '28%',
    difficulty: 'HARD'
  },
  {
    id: 'pte_2025_003',
    title: 'The rise of remote work has fundamentally changed the traditional office culture.',
    description: 'What are the advantages and disadvantages of this trend? Provide specific examples to support your answer.',
    category: 'Advantages/Disadvantages',
    frequency: '25%',
    difficulty: 'EASY'
  },
  {
    id: 'pte_2025_004',
    title: 'Governments should prioritize funding for space exploration over addressing problems on Earth.',
    description: 'To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples.',
    category: 'Agree/Disagree',
    frequency: '22%',
    difficulty: 'HARD'
  },
  {
    id: 'pte_2025_005',
    title: 'Social media influencers have more impact on young people than traditional role models like teachers and parents.',
    description: 'What are the causes of this phenomenon and what effects does it have on society? Support your answer with examples.',
    category: 'Causes/Effects',
    frequency: '20%',
    difficulty: 'MEDIUM'
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{topic.title}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {topic.category}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {topic.frequency} frequency
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              topic.difficulty === 'EASY' ? 'bg-blue-100 text-blue-800' :
                              topic.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {topic.difficulty}
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