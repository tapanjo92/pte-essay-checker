// Centralized essay topics following industry best practice
// This allows easy maintenance and consistency across the app

export interface EssayTopic {
  id: string;
  title: string;
  description: string;
  category: 'Agree/Disagree' | 'Discussion' | 'Advantages/Disadvantages' | 'Causes/Effects' | 'Problem/Solution';
  frequency: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export const PTE_ESSAY_TOPICS: EssayTopic[] = [
  {
    id: 'pte_2025_001',
    title: 'Artificial intelligence will eventually replace human workers in most industries.',
    description: 'To what extent do you agree or disagree with this statement? Support your opinion with relevant examples and explanations.',
    category: 'Agree/Disagree',
    frequency: '35%',
    difficulty: 'MEDIUM'
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
  }
];

// Export topic count for display
export const TOTAL_TOPICS = PTE_ESSAY_TOPICS.length;