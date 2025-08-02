// Realistic PTE Feedback Generator
// Provides honest, calibrated feedback based on actual PTE score distributions

interface RealisticFeedback {
  executiveSummary: string;
  scoreAnalysis: string;
  priorityActions: string[];
  detailedBreakdown: {
    [key: string]: string;
  };
  studyPlan: string;
  realityCheck: string;
}

// Realistic score bands based on actual PTE distributions
function getRealisticScoreBand(score: number): string {
  if (score >= 85) return '85-90';  // Top 1-2% - Exceptional
  if (score >= 79) return '79-84';  // Top 7-8% - High Achievement
  if (score >= 71) return '71-78';  // Top 25% - Above Average
  if (score >= 61) return '61-70';  // 50-75th percentile - Average
  if (score >= 51) return '51-60';  // 25-50th percentile - Below Average
  if (score >= 31) return '31-50';  // Bottom 25% - Poor
  return '0-30';                     // Bottom 5% - Very Poor
}

// Realistic feedback templates
const REALISTIC_FEEDBACK_TEMPLATES = {
  '85-90': {
    executiveSummary: `Exceptional performance - Top 1-2% of test takers. Your essay demonstrates near-native proficiency with sophisticated language use. This level is extremely rare and difficult to achieve.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 is exceptional. Strengths observed:
    • Complex grammatical structures used accurately
    • Rich academic vocabulary with precise usage
    • Excellent coherence and organization
    • Compelling argument development
    
    Note: Maintaining this level requires consistent practice as even small errors can lower scores at this range.`,
    
    priorityActions: [
      'Practice maintaining consistency under time pressure',
      'Review any minor errors to prevent score drops',
      'Continue reading academic texts to maintain vocabulary'
    ],
    
    studyPlan: `To maintain 85+ scores:
    • Daily academic reading (30 min)
    • Weekly timed essay practice
    • Focus on eliminating ALL minor errors
    • Study native speaker academic writing patterns`,
    
    realityCheck: `This score indicates exceptional ability. In real PTE, maintaining 85+ is extremely challenging. Even native speakers often score 80-85.`
  },
  
  '79-84': {
    executiveSummary: `High achievement - Top 7-8% of test takers. Your essay shows strong command of English with minor areas for improvement. You're well-positioned for most university requirements.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 is well above average. Analysis shows:
    • Good grammatical accuracy with occasional errors
    • Appropriate academic vocabulary
    • Clear organization and coherence
    • Well-developed arguments
    
    Gap to 85+: Requires exceptional consistency and sophisticated language throughout.`,
    
    priorityActions: [
      'Eliminate remaining grammar errors ({{ERROR_COUNT}} found)',
      'Upgrade vocabulary in 2-3 paragraphs',
      'Add more sophisticated transitions',
      'Vary sentence structures more'
    ],
    
    studyPlan: `To reach 85+ (top 1-2%):
    • Master complex grammar patterns
    • Learn 10 new academic words weekly
    • Practice paraphrasing complex ideas
    • Analyze 85+ score sample essays`,
    
    realityCheck: `You're already in the top 10%. Reaching 85+ requires near-perfect execution - a significant challenge even for advanced speakers.`
  },
  
  '71-78': {
    executiveSummary: `Above average performance - Top 25% of test takers. Your essay meets most PTE requirements with room for improvement in accuracy and sophistication.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 shows solid competence. Current performance:
    • Generally accurate grammar with some errors
    • Mix of simple and complex sentences
    • Adequate vocabulary with some repetition
    • Clear but basic organization
    
    Key gaps: Consistency in accuracy and more sophisticated language use.`,
    
    priorityActions: [
      'Fix grammar errors ({{ERROR_COUNT}} found) - focus on articles and tenses',
      'Replace basic vocabulary with academic alternatives',
      'Add variety to sentence beginnings',
      'Strengthen paragraph transitions',
      'Develop ideas with more specific examples'
    ],
    
    studyPlan: `To reach 79+ (top 10%):
    • Grammar workbook exercises (30 min daily)
    • Academic word list study (20 words/week)
    • Read and analyze high-scoring essays
    • Practice writing complex sentences`,
    
    realityCheck: `You're above average but need significant improvement for 79+. Most test-takers score 65-75, so you're doing better than the majority.`
  },
  
  '61-70': {
    executiveSummary: `Average performance - Middle 50% of test takers. Your essay shows basic competence but needs improvement in multiple areas to reach higher bands.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 is typical for PTE candidates. Current issues:
    • Multiple grammar errors affecting clarity
    • Limited vocabulary range
    • Simple sentence structures
    • Basic organization
    
    This is the most common score range - you're not alone in needing improvement.`,
    
    priorityActions: [
      'Master basic grammar rules - especially articles and verb tenses',
      'Build vocabulary systematically - start with common academic words',
      'Practice paragraph structure with clear topic sentences',
      'Work on spelling accuracy',
      'Read sample essays daily to internalize patterns'
    ],
    
    studyPlan: `To reach 71+ (above average):
    • Complete grammar course focusing on common errors
    • Learn 50 essential academic words
    • Write 3 practice essays weekly with timer
    • Get feedback on each essay
    • Read simplified academic articles daily`,
    
    realityCheck: `Average scores require consistent work to improve. Most people need 2-3 months of regular practice to move up 5-10 points.`
  },
  
  '51-60': {
    executiveSummary: `Below average performance - Bottom 25-50%. Your essay shows basic communication ability but significant weaknesses in accuracy and development.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 indicates substantial areas for improvement:
    • Frequent grammar errors interfering with meaning
    • Very limited vocabulary
    • Mostly simple sentences
    • Weak organization and development
    • Below minimum word count or other structural issues`,
    
    priorityActions: [
      'Focus on basic grammar - start with subject-verb agreement',
      'Build core vocabulary (1000 most common words)',
      'Practice writing complete sentences',
      'Learn basic essay structure',
      'Aim for 200-300 words consistently'
    ],
    
    studyPlan: `Foundation building needed:
    • Basic grammar workbook (1 hour daily)
    • Vocabulary flashcards (20 words daily)
    • Guided writing exercises
    • Read graded readers (elementary level)
    • Consider formal English classes`,
    
    realityCheck: `Significant improvement needed. With dedicated daily practice, reaching 65-70 is achievable in 3-6 months.`
  },
  
  '31-50': {
    executiveSummary: `Poor performance - Bottom 15-25%. Your essay shows very limited English proficiency with fundamental issues in all areas.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 indicates fundamental challenges:
    • Severe grammar errors throughout
    • Extremely limited vocabulary
    • Difficulty forming correct sentences
    • Unclear organization
    • May be significantly under word count`,
    
    priorityActions: [
      'Start with basic English course',
      'Focus on simple sentence construction',
      'Learn basic grammar rules',
      'Build essential vocabulary (500 words)',
      'Practice writing short paragraphs'
    ],
    
    studyPlan: `Intensive foundation work required:
    • Beginner English textbook
    • Daily grammar exercises
    • Basic vocabulary building
    • Sentence writing practice
    • Consider professional tutoring`,
    
    realityCheck: `This score indicates need for comprehensive English study. Reaching PTE-ready levels (65+) typically requires 6-12 months of intensive study.`
  },
  
  '0-30': {
    executiveSummary: `Very poor performance - Bottom 5%. Your essay indicates minimal English proficiency. Comprehensive language learning needed before attempting PTE.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 shows:
    • Inability to construct coherent sentences
    • Minimal vocabulary
    • No clear essay structure
    • Possible off-topic response
    • Far below word count requirements`,
    
    priorityActions: [
      'Enroll in beginner English classes',
      'Start with basic alphabet and pronunciation',
      'Learn fundamental grammar patterns',
      'Build survival vocabulary',
      'Practice copying simple sentences'
    ],
    
    studyPlan: `Complete beginner program needed:
    • A1 level English course
    • Daily practice with basics
    • Focus on foundation before PTE
    • Minimum 1 year preparation needed`,
    
    realityCheck: `PTE requires B2+ level English. You're currently at A1 or below. Focus on general English improvement before PTE-specific preparation.`
  }
};

export function generateRealisticFeedback(
  score: number,
  pteScores: any,
  topicRelevance: any,
  errors: any[],
  strengths: string[],
  weaknesses: string[]
): RealisticFeedback {
  const band = getRealisticScoreBand(score);
  const template = REALISTIC_FEEDBACK_TEMPLATES[band];
  
  // Safety check for undefined template
  if (!template) {
    console.error(`No feedback template found for band: ${band}, score: ${score}`);
    return {
      executiveSummary: 'Analysis completed.',
      scoreAnalysis: `Score: ${score}/90`,
      priorityActions: ['Review essay feedback', 'Practice writing'],
      detailedBreakdown: {},
      studyPlan: 'Continue practicing PTE essays.',
      realityCheck: 'Keep working on your skills.'
    };
  }
  
  // Build detailed breakdown based on PTE criteria
  const detailedBreakdown: { [key: string]: string } = {};
  
  // Content feedback
  if (pteScores.content === 3) {
    detailedBreakdown.content = 'Exceptional content - fully addresses topic with sophisticated analysis.';
  } else if (pteScores.content === 2) {
    detailedBreakdown.content = 'Good content - addresses topic well but could be more nuanced.';
  } else if (pteScores.content === 1) {
    detailedBreakdown.content = 'Basic content - addresses topic but lacks depth or misses key aspects.';
  } else {
    detailedBreakdown.content = 'Poor content - off-topic or severely underdeveloped.';
  }
  
  // Grammar feedback
  if (pteScores.grammar === 2) {
    detailedBreakdown.grammar = 'Excellent grammar - complex structures used accurately.';
  } else if (pteScores.grammar === 1) {
    detailedBreakdown.grammar = `Generally accurate grammar but ${errors.filter(e => e.type === 'grammar').length} errors found. Focus on: ${getGrammarFocus(errors)}`;
  } else {
    detailedBreakdown.grammar = 'Frequent grammar errors affecting clarity. Fundamental review needed.';
  }
  
  // Vocabulary feedback
  if (pteScores.vocabulary === 2) {
    detailedBreakdown.vocabulary = 'Rich academic vocabulary used precisely throughout.';
  } else if (pteScores.vocabulary === 1) {
    detailedBreakdown.vocabulary = 'Adequate vocabulary but some basic words and repetition. Upgrade: ' + getBasicWords(errors);
  } else {
    detailedBreakdown.vocabulary = 'Limited vocabulary range. Focus on building academic word knowledge.';
  }
  
  // Coherence feedback
  if (pteScores.developmentCoherence === 2) {
    detailedBreakdown.developmentCoherence = 'Excellent organization with smooth transitions and logical flow.';
  } else if (pteScores.developmentCoherence === 1) {
    detailedBreakdown.developmentCoherence = 'Adequate organization but transitions could be smoother. Some ideas need better connection.';
  } else {
    detailedBreakdown.developmentCoherence = 'Poor organization. Learn paragraph structure and transition phrases.';
  }
  
  // Form feedback
  if (pteScores.form === 2) {
    detailedBreakdown.form = 'Perfect structure - intro, body paragraphs, conclusion, and correct word count.';
  } else if (pteScores.form === 1) {
    detailedBreakdown.form = 'Minor structural issues or slight word count deviation.';
  } else {
    detailedBreakdown.form = 'Major structural problems or significant word count issues.';
  }
  
  // Replace template variables with safety checks
  const executiveSummary = (template.executiveSummary || '').replace('{{SCORE}}', score.toString());
  const scoreAnalysis = (template.scoreAnalysis || '')
    .replace('{{SCORE}}', score.toString())
    .replace('{{ERROR_COUNT}}', errors.length.toString());
  
  // Update priority actions with actual error count
  const priorityActions = (template.priorityActions || []).map(action => 
    typeof action === 'string' ? action.replace('{{ERROR_COUNT}}', errors.length.toString()) : action
  );
  
  return {
    executiveSummary,
    scoreAnalysis,
    priorityActions,
    detailedBreakdown,
    studyPlan: template.studyPlan || 'Continue practicing PTE essays regularly.',
    realityCheck: template.realityCheck || 'Keep working to improve your score.'
  };
}

// Helper function to identify grammar focus areas
function getGrammarFocus(errors: any[]): string {
  const grammarErrors = errors.filter(e => e.type === 'grammar');
  const errorTypes = new Set(grammarErrors.map(e => {
    if (!e.suggestion) return 'sentence structure';
    if (e.suggestion.includes('article')) return 'articles';
    if (e.suggestion.includes('tense')) return 'verb tenses';
    if (e.suggestion.includes('agreement')) return 'subject-verb agreement';
    if (e.suggestion.includes('preposition')) return 'prepositions';
    return 'sentence structure';
  }));
  return Array.from(errorTypes).slice(0, 3).join(', ') || 'general accuracy';
}

// Helper function to identify basic vocabulary
function getBasicWords(errors: any[]): string {
  const vocabErrors = errors.filter(e => e.type === 'vocabulary');
  const basicWords = vocabErrors.map(e => e.text || '').filter(word => word).slice(0, 5);
  return basicWords.length > 0 ? basicWords.join(', ') : 'common words like get, make, good, bad';
}

// Realistic score projection
export function generateRealisticScoreProjection(
  currentScore: number,
  errorCount: number
): { potential: number; timeframe: string; confidence: string } {
  const band = getRealisticScoreBand(currentScore);
  
  // Realistic improvement potential based on current band
  let potentialImprovement = 0;
  let timeframe = '';
  let confidence = '';
  
  if (band === '0-30') {
    potentialImprovement = 20; // Can improve to 50
    timeframe = '6-12 months of intensive study';
    confidence = 'Requires fundamental English improvement';
  } else if (band === '31-50') {
    potentialImprovement = 15; // Can improve to 65
    timeframe = '3-6 months of dedicated practice';
    confidence = 'Achievable with consistent effort';
  } else if (band === '51-60') {
    potentialImprovement = 10; // Can improve to 70
    timeframe = '2-3 months of focused practice';
    confidence = 'Realistic with structured study';
  } else if (band === '61-70') {
    potentialImprovement = 8; // Can improve to 78
    timeframe = '6-8 weeks of targeted practice';
    confidence = 'Achievable with effort';
  } else if (band === '71-78') {
    potentialImprovement = 5; // Can improve to 83
    timeframe = '4-6 weeks of intensive practice';
    confidence = 'Challenging but possible';
  } else if (band === '79-84') {
    potentialImprovement = 3; // Can improve to 87
    timeframe = '8-12 weeks of perfection practice';
    confidence = 'Very difficult - requires exceptional consistency';
  } else {
    potentialImprovement = 0; // Already at top
    timeframe = 'Maintain current level';
    confidence = 'Already exceptional';
  }
  
  // Adjust based on error count
  if (errorCount > 15) {
    potentialImprovement = Math.min(potentialImprovement, 5);
    confidence = 'Many errors to address first';
  }
  
  const potentialScore = Math.min(currentScore + potentialImprovement, 87); // 87 is realistic max
  
  return {
    potential: potentialScore,
    timeframe,
    confidence
  };
}