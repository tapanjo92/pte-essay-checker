'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernLayout, ModernSection, GradientText } from '@/components/ui/modern-layout';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernHero } from '@/components/ui/modern-hero';
import { 
  ChevronRight, 
  Clock, 
  BarChart, 
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Brain,
  Zap,
  TrendingUp
} from 'lucide-react';

const PTE_ESSAY_TOPICS = [
  {
    id: 'pte_2025_001',
    title: 'Artificial intelligence will eventually replace human workers in most industries.',
    description: 'To what extent do you agree or disagree with this statement? Support your opinion with relevant examples and explanations.',
    category: 'Agree/Disagree',
    frequency: '35%',
    difficulty: 'MEDIUM',
    icon: '🤖',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'pte_2025_002',
    title: 'Some people believe that unpaid internships exploit young workers, while others see them as valuable learning opportunities.',
    description: 'Discuss both these views and give your own opinion. Include relevant examples from your knowledge or experience.',
    category: 'Discussion',
    frequency: '28%',
    difficulty: 'HARD',
    icon: '💼',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'pte_2025_003',
    title: 'The rise of remote work has fundamentally changed the traditional office culture.',
    description: 'What are the advantages and disadvantages of this trend? Provide specific examples to support your answer.',
    category: 'Advantages/Disadvantages',
    frequency: '25%',
    difficulty: 'EASY',
    icon: '🏠',
    gradient: 'from-green-500 to-teal-500',
  },
  {
    id: 'pte_2025_004',
    title: 'Governments should prioritize funding for space exploration over addressing problems on Earth.',
    description: 'To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples.',
    category: 'Agree/Disagree',
    frequency: '22%',
    difficulty: 'HARD',
    icon: '🚀',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'pte_2025_005',
    title: 'Social media influencers have more impact on young people than traditional role models like teachers and parents.',
    description: 'What are the causes of this phenomenon and what effects does it have on society? Support your answer with examples.',
    category: 'Causes/Effects',
    frequency: '20%',
    difficulty: 'MEDIUM',
    icon: '📱',
    gradient: 'from-pink-500 to-violet-500',
  }
];

export default function ModernEssayQuestionsPage() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleStartEssay = () => {
    if (!selectedTopic) return;

    setIsLoading(true);
    const topic = PTE_ESSAY_TOPICS.find(t => t.id === selectedTopic);
    if (topic) {
      localStorage.setItem('selected-essay-topic', JSON.stringify(topic));
      localStorage.setItem('essay-flow-type', 'single');
      localStorage.removeItem('current-essay-number');
      localStorage.removeItem('essay1-completed');
      router.push('/dashboard');
    }
  };

  const selectedTopicData = PTE_ESSAY_TOPICS.find(t => t.id === selectedTopic);

  return (
    <ModernLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <ModernHero
          title="Choose Your Essay Topic"
          subtitle="PTE Academic Writing Task"
          description="Select from our curated collection of essay topics. You'll have 20 minutes to craft a compelling 200-300 word response."
        />

        {/* Topics Grid */}
        <ModernSection className="px-6 pb-24 mx-auto max-w-7xl">
          <div className="grid gap-6 mb-12">
            {PTE_ESSAY_TOPICS.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredCard(topic.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <ModernCard
                  variant="gradient-border"
                  glowColor={topic.id === selectedTopic ? 'rgba(94, 92, 230, 0.8)' : 'rgba(94, 92, 230, 0.3)'}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedTopic === topic.id ? 'ring-2 ring-purple-500/50' : ''
                  }`}
                  onClick={() => setSelectedTopic(topic.id)}
                >
                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className={`
                      flex items-center justify-center w-16 h-16 rounded-2xl text-3xl
                      bg-gradient-to-br ${topic.gradient} bg-opacity-20
                    `}>
                      {topic.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-xl font-semibold text-white leading-tight">
                          {topic.title}
                        </h3>
                        
                        {/* Selection indicator */}
                        <motion.div
                          animate={{
                            scale: selectedTopic === topic.id ? 1 : 0,
                            opacity: selectedTopic === topic.id ? 1 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                          className="flex-shrink-0"
                        >
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </motion.div>
                      </div>

                      <p className="text-gray-400 leading-relaxed">
                        {topic.description}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full">
                          <Target className="w-3 h-3" />
                          {topic.category}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          {topic.frequency} frequency
                        </span>
                        <span className={`
                          inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full
                          ${topic.difficulty === 'EASY' 
                            ? 'bg-cyan-500/10 text-cyan-400' 
                            : topic.difficulty === 'MEDIUM'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-red-500/10 text-red-400'
                          }
                        `}>
                          <BarChart className="w-3 h-3" />
                          {topic.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hover effect overlay */}
                  <motion.div
                    animate={{
                      opacity: hoveredCard === topic.id ? 1 : 0,
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl pointer-events-none"
                  />
                </ModernCard>
              </motion.div>
            ))}
          </div>

          {/* Selected Topic Preview & Action */}
          <AnimatePresence mode="wait">
            {selectedTopic && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <ModernCard variant="hover-glow" className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-300 mb-2">
                        Selected Topic
                      </h4>
                      <p className="text-2xl font-semibold text-white">
                        {selectedTopicData?.title}
                      </p>
                    </div>
                    <ModernButton
                      variant="glow"
                      size="lg"
                      onClick={handleStartEssay}
                      loading={isLoading}
                      icon={<ArrowRight className="w-5 h-5" />}
                    >
                      Start Writing
                    </ModernButton>
                  </div>
                </ModernCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guidelines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <ModernCard variant="default" className="bg-gradient-to-r from-gray-900/80 to-gray-900/60">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Essay Writing Guidelines
                </h3>
                <p className="text-gray-400">
                  Everything you need to know before you begin
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <GuidelineCard
                  icon={<Clock className="w-6 h-6" />}
                  title="Time Limit"
                  description="20 minutes per essay"
                  highlight="Timer starts when you begin typing"
                />
                <GuidelineCard
                  icon={<Target className="w-6 h-6" />}
                  title="Word Count"
                  description="200-300 words required"
                  highlight="Stay within the limit for best scores"
                />
                <GuidelineCard
                  icon={<Brain className="w-6 h-6" />}
                  title="Evaluation"
                  description="AI-powered analysis"
                  highlight="Instant feedback on all criteria"
                />
              </div>
            </ModernCard>
          </motion.div>
        </ModernSection>
      </div>
    </ModernLayout>
  );
}

function GuidelineCard({
  icon,
  title,
  description,
  highlight
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
}) {
  return (
    <div className="text-center space-y-3">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl mx-auto">
        <div className="text-blue-400">{icon}</div>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">{title}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
        <p className="text-blue-400 text-xs mt-2">{highlight}</p>
      </div>
    </div>
  );
}