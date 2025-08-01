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
import { PTE_ESSAY_TOPICS, TOTAL_TOPICS } from '@/lib/essay-topics';

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