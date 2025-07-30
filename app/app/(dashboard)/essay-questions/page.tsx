'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from 'aws-amplify/auth';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, Shuffle } from 'lucide-react';

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
  },
  {
    id: 'pte_2025_006',
    title: 'Online education is more effective than traditional classroom learning.',
    description: 'To what extent do you agree or disagree? Support your opinion with examples and evidence.',
    category: 'Agree/Disagree',
    frequency: '32%',
    difficulty: 'MEDIUM'
  },
  {
    id: 'pte_2025_007',
    title: 'Governments should ban all single-use plastics immediately, regardless of economic impact.',
    description: 'To what extent do you agree or disagree? Give reasons for your answer.',
    category: 'Agree/Disagree',
    frequency: '24%',
    difficulty: 'HARD'
  },
  {
    id: 'pte_2025_008',
    title: 'International trade barriers are being reduced worldwide.',
    description: 'Do the advantages of globalization outweigh the disadvantages? Discuss with examples.',
    category: 'Advantages/Disadvantages',
    frequency: '27%',
    difficulty: 'MEDIUM'
  },
  {
    id: 'pte_2025_009',
    title: 'Youth unemployment rates are increasing globally.',
    description: 'What are the main causes of this problem and what solutions can you suggest?',
    category: 'Problem/Solution',
    frequency: '29%',
    difficulty: 'MEDIUM'
  },
  {
    id: 'pte_2025_010',
    title: 'Food waste is a major problem in developed countries while others face starvation.',
    description: 'What are the causes of this issue and what measures can be taken to address it?',
    category: 'Problem/Solution',
    frequency: '21%',
    difficulty: 'EASY'
  },
  {
    id: 'pte_2025_011',
    title: 'A four-day work week should become the standard in all developed countries.',
    description: 'To what extent do you agree or disagree? Provide reasons and examples.',
    category: 'Agree/Disagree',
    frequency: '18%',
    difficulty: 'MEDIUM'
  },
  {
    id: 'pte_2025_012',
    title: 'More people are choosing to live in large cities rather than rural areas.',
    description: 'Do the advantages outweigh the disadvantages? Support your answer with examples.',
    category: 'Advantages/Disadvantages',
    frequency: '26%',
    difficulty: 'EASY'
  },
  {
    id: 'pte_2025_013',
    title: 'Cashless societies are becoming increasingly common.',
    description: 'Do the advantages of digital payments outweigh the disadvantages? Discuss both sides.',
    category: 'Advantages/Disadvantages',
    frequency: '23%',
    difficulty: 'MEDIUM'
  },
  {
    id: 'pte_2025_014',
    title: 'Some believe healthcare should be completely free for all citizens, while others think people should pay for medical services.',
    description: 'Discuss both views and give your opinion. Include relevant examples.',
    category: 'Discussion',
    frequency: '31%',
    difficulty: 'HARD'
  },
  {
    id: 'pte_2025_015',
    title: 'Some argue that private vehicles should be banned from city centers, while others believe personal transportation freedom is essential.',
    description: 'Discuss both views and give your opinion. Support with examples.',
    category: 'Discussion',
    frequency: '19%',
    difficulty: 'MEDIUM'
  }
];

export default function EssayQuestionsPage() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  // Get unique categories
  const categories = ['All', ...new Set(PTE_ESSAY_TOPICS.map(t => t.category))];
  const difficulties = ['All', 'EASY', 'MEDIUM', 'HARD'];

  // Filter topics based on selections
  const filteredTopics = PTE_ESSAY_TOPICS.filter(topic => {
    const categoryMatch = selectedCategory === 'All' || topic.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'All' || topic.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  // Get random topic
  const selectRandomTopic = () => {
    if (filteredTopics.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredTopics.length);
      setSelectedTopic(filteredTopics[randomIndex].id);
    }
  };

  const handleStartEssay = () => {
    console.log('handleStartEssay called');
    console.log('selectedTopic:', selectedTopic);
    
    if (!selectedTopic) {
      alert('Please select a topic first');
      return;
    }

    setIsLoading(true);
    
    // Store the selected topic in localStorage
    const topic = PTE_ESSAY_TOPICS.find(t => t.id === selectedTopic);
    console.log('Found topic:', topic);
    
    if (topic) {
      try {
        localStorage.setItem('selected-essay-topic', JSON.stringify(topic));
        localStorage.setItem('essay-flow-type', 'single'); // Single essay mode
        
        // Clear any existing drafts
        localStorage.removeItem('current-essay-number');
        localStorage.removeItem('essay1-completed');
        
        console.log('localStorage set, navigating to dashboard...');
        
        // Force navigation with window.location as fallback
        const dashboardUrl = '/dashboard';
        console.log('Navigating to:', dashboardUrl);
        
        // Try router.push first
        router.push(dashboardUrl);
        
        // Fallback after a short delay
        setTimeout(() => {
          if (window.location.pathname !== '/dashboard') {
            console.log('Router push failed, using window.location');
            window.location.href = dashboardUrl;
          }
        }, 500);
        
      } catch (error) {
        console.error('Error in handleStartEssay:', error);
        alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setIsLoading(false);
      }
    } else {
      console.error('Topic not found in list');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">PTE Essay Questions</h1>
          <p className="text-lg text-gray-300">
            Choose one topic from the list below. You'll have 20 minutes to write a 200-300 word essay.
          </p>
        </div>

        {/* Filters */}
        <GlassCard variant="default">
          <GlassCardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <GlassCardTitle className="text-lg">Filter Topics</GlassCardTitle>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Difficulty</Label>
                <div className="flex gap-2">
                  {difficulties.map(difficulty => (
                    <Badge
                      key={difficulty}
                      variant={selectedDifficulty === difficulty ? "default" : "outline"}
                      className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                        difficulty === 'EASY' ? 'text-blue-400' :
                        difficulty === 'MEDIUM' ? 'text-yellow-400' :
                        difficulty === 'HARD' ? 'text-red-400' : ''
                      }`}
                      onClick={() => setSelectedDifficulty(difficulty)}
                    >
                      {difficulty}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectRandomTopic}
                  className="flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Random Topic
                </Button>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-400">
              Showing {filteredTopics.length} of {PTE_ESSAY_TOPICS.length} topics
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Topics */}
        <GlassCard variant="gradient">
          <GlassCardHeader>
            <GlassCardTitle className="text-xl">Available Essay Topics</GlassCardTitle>
            <GlassCardDescription className="text-gray-300">
              {filteredTopics.length === 0 ? 'No topics match your filters. Try adjusting them.' : 'Select a topic that you feel most comfortable writing about'}
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <RadioGroup value={selectedTopic} onValueChange={setSelectedTopic}>
              <div className="space-y-4">
                {filteredTopics.map((topic) => (
                  <div key={topic.id} className="relative">
                    <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-all duration-200 backdrop-blur-sm">
                      <RadioGroupItem value={topic.id} id={topic.id} className="mt-1" />
                      <Label htmlFor={topic.id} className="flex-1 cursor-pointer">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">{topic.title}</span>
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              {topic.category}
                            </span>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              {topic.frequency} frequency
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              topic.difficulty === 'EASY' ? 'bg-blue-500/20 text-blue-400' :
                              topic.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {topic.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {topic.description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </GlassCardContent>
        </GlassCard>

        {/* Action Button */}
        <div className="flex justify-center gap-4">
          <Button 
            size="lg" 
            onClick={handleStartEssay}
            disabled={!selectedTopic || isLoading}
            className="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {isLoading ? 'Loading...' : 'Start Writing Essay'}
          </Button>
          
          {/* Debug: Direct link */}
          {selectedTopic && (
            <Link href="/dashboard">
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  const topic = PTE_ESSAY_TOPICS.find(t => t.id === selectedTopic);
                  if (topic) {
                    localStorage.setItem('selected-essay-topic', JSON.stringify(topic));
                    localStorage.setItem('essay-flow-type', 'single');
                  }
                }}
              >
                Direct Link to Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Instructions */}
        <GlassCard variant="default">
          <GlassCardHeader>
            <GlassCardTitle className="text-lg">Essay Writing Guidelines</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-2 text-sm text-gray-300">
            <p>• You will have <strong>20 minutes</strong> to complete your essay</p>
            <p>• Your essay must be between <strong>200-300 words</strong></p>
            <p>• The timer will start automatically when you begin typing</p>
            <p>• Your essay will be evaluated on task response, coherence, vocabulary, and grammar</p>
            <p>• Make sure to address all parts of the question</p>
          </GlassCardContent>
        </GlassCard>
    </div>
  );
}