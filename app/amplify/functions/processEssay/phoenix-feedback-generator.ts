// Phoenix's Template-Based Feedback Generation System
// Personalized, actionable feedback based on score bands

import { PHOENIX_SCORE_BANDS } from './enhanced-prompt';
import { PHOENIX_VOCABULARY_BANK, PHOENIX_QUICK_FIXES } from './phoenix-vocabulary-bank';

interface PhoenixFeedback {
  executiveSummary: string;
  scoreAnalysis: string;
  priorityActions: string[];
  detailedBreakdown: {
    [key: string]: string;
  };
  studyPlan: string;
  motivationalNote: string;
}

// Determine score band
function getScoreBand(score: number): string {
  if (score >= 85) return '85-90';
  if (score >= 79) return '79-84';
  if (score >= 65) return '65-78';
  if (score >= 50) return '50-64';
  return 'below-50';
}

// Phoenix's Feedback Templates by Score Band
const FEEDBACK_TEMPLATES = {
  '85-90': {
    executiveSummary: `🌟 PHOENIX EXCELLENCE ACHIEVED! Your essay demonstrates near-native proficiency with sophisticated language use and exceptional coherence. You're in the top 5% of PTE test-takers.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 places you in the elite band. You've mastered:
    ✓ Complex grammatical structures
    ✓ Advanced vocabulary with precise collocations
    ✓ Seamless paragraph transitions
    ✓ Compelling argument development`,
    
    priorityActions: [
      'Maintain consistency in this performance level',
      'Consider varying sentence openers for even more sophistication',
      'Practice under timed conditions to ensure reliability'
    ],
    
    studyPlan: `Phoenix recommends: 2-3 mock tests weekly to maintain peak performance. Focus on:
    • Speed writing to save time for review
    • Memorizing Phoenix's advanced collocations
    • Reading academic journals for vocabulary expansion`,
    
    motivationalNote: `You're Phoenix-certified ready for PTE success! Your writing demonstrates the precision and clarity that AI scoring algorithms reward highly.`
  },
  
  '79-84': {
    executiveSummary: `💪 PHOENIX PROFICIENT LEVEL! Your essay shows strong command of English with minor areas for refinement. You're well-positioned to achieve your target score with focused practice.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 indicates proficient writing ability. Strengths include:
    ✓ Good grammatical accuracy
    ✓ Appropriate vocabulary range
    ✓ Clear essay structure
    Areas for improvement:
    • {{WEAK_AREA_1}}
    • {{WEAK_AREA_2}}`,
    
    priorityActions: [
      'Eliminate remaining basic vocabulary (check Phoenix replacements)',
      'Add 1-2 more sophisticated transitions per paragraph',
      'Ensure zero grammar errors in introduction and conclusion'
    ],
    
    studyPlan: `Phoenix 2-week intensive plan:
    Week 1: Daily grammar drills + vocabulary enhancement
    Week 2: Full essays with Phoenix template implementation
    Target: 85+ in your next attempt`,
    
    motivationalNote: `You're just 5-6 points away from the elite band! Phoenix has seen hundreds of students make this jump with focused effort.`
  },
  
  '65-78': {
    executiveSummary: `📈 PHOENIX COMPETENT LEVEL! Your essay shows good foundational skills with clear opportunities for score improvement. With Phoenix Method implementation, expect 10-15 point gains.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 reflects competent writing with room for growth:
    Strengths:
    ✓ Basic essay structure maintained
    ✓ Topic generally addressed
    Priority improvements needed:
    • {{WEAK_AREA_1}} (High impact)
    • {{WEAK_AREA_2}} (High impact)
    • {{WEAK_AREA_3}} (Medium impact)`,
    
    priorityActions: [
      'Implement Phoenix essay templates immediately',
      'Replace ALL basic vocabulary with academic alternatives',
      'Add transition phrase at the start of EVERY paragraph',
      'Expand sentences to 15-20 word optimal length',
      'Eliminate contractions and informal language'
    ],
    
    studyPlan: `Phoenix 4-week transformation plan:
    Week 1: Grammar foundations + Phoenix error patterns
    Week 2: Vocabulary building (memorize 10 academic words daily)
    Week 3: Essay structure + Phoenix templates
    Week 4: Daily practice essays with timer
    Expected outcome: 79+ score`,
    
    motivationalNote: `Phoenix has guided thousands from your current level to 79+. The key? Consistent daily practice with the right strategies.`
  },
  
  '50-64': {
    executiveSummary: `⚡ PHOENIX FOUNDATION LEVEL! Your essay shows developing skills that need systematic improvement. Good news: This score range typically sees the fastest improvements with proper guidance.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 indicates foundation-level writing:
    Current challenges:
    • {{WEAK_AREA_1}} (Critical)
    • {{WEAK_AREA_2}} (Critical)
    • {{WEAK_AREA_3}} (Important)
    Quick wins available:
    • Fixing basic grammar = +5-7 points
    • Using templates = +3-5 points
    • Academic vocabulary = +3-5 points`,
    
    priorityActions: [
      'URGENT: Fix subject-verb agreement errors',
      'URGENT: Ensure 200-300 word count',
      'Copy Phoenix introduction template word-for-word',
      'Use Phoenix transition list for every paragraph',
      'Replace these words immediately: get→obtain, give→provide, make→create'
    ],
    
    studyPlan: `Phoenix 6-week intensive transformation:
    Weeks 1-2: Grammar basics (focus on Phoenix error patterns)
    Weeks 3-4: Essay structure (memorize templates)
    Weeks 5-6: Vocabulary + practice essays
    Daily commitment: 2 hours
    Expected outcome: 70-75 score`,
    
    motivationalNote: `Phoenix started with students at your level and helped them achieve 79+. Your journey begins with fixing the basics - each small improvement compounds!`
  },
  
  'below-50': {
    executiveSummary: `🚀 PHOENIX STARTER LEVEL! Your essay indicates you're at the beginning of your PTE journey. With Phoenix Method, expect dramatic improvements - some students gain 30+ points in 8 weeks.`,
    
    scoreAnalysis: `Your score of {{SCORE}}/90 suggests fundamental areas need attention:
    Immediate focus areas:
    • {{CRITICAL_ISSUE_1}}
    • {{CRITICAL_ISSUE_2}}
    • Basic essay structure
    
    Phoenix detection: {{SPECIAL_ISSUE}}`,
    
    priorityActions: [
      'CRITICAL: Ensure essay is ON TOPIC (reread prompt twice)',
      'CRITICAL: Write exactly 4 paragraphs',
      'CRITICAL: Count words (must be 200-300)',
      'Start EVERY essay with Phoenix introduction template',
      'End EVERY paragraph with a period (check punctuation)'
    ],
    
    studyPlan: `Phoenix 8-week foundation program:
    Weeks 1-2: Basic grammar (subject-verb, articles)
    Weeks 3-4: Essay structure (intro-body-body-conclusion)
    Weeks 5-6: Phoenix templates + transitions
    Weeks 7-8: Vocabulary building + daily essays
    
    Start with: 30 minutes grammar, 30 minutes vocabulary daily`,
    
    motivationalNote: `Every Phoenix success story started somewhere. You've taken the first step by getting feedback. Now, commit to daily practice and watch your scores climb!`
  }
};

// Generate personalized feedback based on Phoenix analysis
export function generatePhoenixFeedback(
  score: number,
  pteScores: any,
  topicRelevance: any,
  errors: any[],
  strengths: string[],
  weaknesses: string[]
): PhoenixFeedback {
  const band = getScoreBand(score);
  const template = FEEDBACK_TEMPLATES[band];
  
  // Identify specific weak areas
  const weakAreas = identifyWeakAreas(pteScores, errors);
  
  // Generate executive summary
  let executiveSummary = template.executiveSummary;
  if (topicRelevance && topicRelevance.relevanceScore < 50) {
    executiveSummary = `🚨 CRITICAL: OFF-TOPIC ESSAY DETECTED! ` + executiveSummary;
  }
  
  // Generate score analysis
  let scoreAnalysis = template.scoreAnalysis
    .replace('{{SCORE}}', score.toString())
    .replace('{{WEAK_AREA_1}}', weakAreas[0] || 'Grammar accuracy')
    .replace('{{WEAK_AREA_2}}', weakAreas[1] || 'Vocabulary range')
    .replace('{{WEAK_AREA_3}}', weakAreas[2] || 'Coherence');
  
  // Add special issues for low scores
  if (band === 'below-50') {
    const specialIssue = topicRelevance?.relevanceScore < 50 
      ? 'Essay appears to be off-topic - this is an automatic failure in PTE'
      : errors.length > 20 
      ? 'Multiple fundamental errors detected across all criteria'
      : 'Essay structure needs complete reorganization';
    
    scoreAnalysis = scoreAnalysis
      .replace('{{CRITICAL_ISSUE_1}}', weakAreas[0] || 'Topic relevance')
      .replace('{{CRITICAL_ISSUE_2}}', weakAreas[1] || 'Basic grammar')
      .replace('{{SPECIAL_ISSUE}}', specialIssue);
  }
  
  // Generate detailed breakdown
  const detailedBreakdown = generateDetailedBreakdown(pteScores, errors);
  
  // Add quick wins based on errors
  const priorityActions = [...template.priorityActions];
  if (errors.some(e => e.type === 'grammar' && e.severity === 'high')) {
    priorityActions.unshift('🔴 Fix high-severity grammar errors immediately');
  }
  
  return {
    executiveSummary,
    scoreAnalysis,
    priorityActions,
    detailedBreakdown,
    studyPlan: template.studyPlan,
    motivationalNote: template.motivationalNote
  };
}

// Identify weak areas based on scores and errors
function identifyWeakAreas(pteScores: any, errors: any[]): string[] {
  const weakAreas = [];
  
  // Check each scoring criterion
  if (pteScores) {
    if (pteScores.grammar < 2) weakAreas.push('Grammar accuracy needs improvement');
    if (pteScores.vocabulary < 2) weakAreas.push('Vocabulary range is limited');
    if (pteScores.developmentCoherence < 2) weakAreas.push('Essay coherence and flow');
    if (pteScores.content < 2) weakAreas.push('Content development and relevance');
    if (pteScores.form < 2) weakAreas.push('Essay structure and word count');
    if (pteScores.spelling < 1) weakAreas.push('Spelling accuracy');
    if (pteScores.linguisticRange < 2) weakAreas.push('Sentence variety');
  }
  
  // Analyze error patterns
  const errorTypes = errors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1;
    return acc;
  }, {} as any);
  
  if (errorTypes.grammar > 5) weakAreas.push('Frequent grammar mistakes');
  if (errorTypes.vocabulary > 5) weakAreas.push('Basic vocabulary usage');
  if (errorTypes.coherence > 3) weakAreas.push('Paragraph transitions');
  
  return weakAreas.slice(0, 3); // Return top 3 weak areas
}

// Generate detailed breakdown by criterion
function generateDetailedBreakdown(pteScores: any, errors: any[]): { [key: string]: string } {
  const breakdown: { [key: string]: string } = {};
  
  // Content (Task Response)
  breakdown.content = pteScores.content >= 3 
    ? `Excellent topic coverage with fully developed arguments. Your ideas directly address the prompt with relevant examples.`
    : pteScores.content >= 2
    ? `Good topic coverage but some arguments could be more fully developed. Consider adding specific examples.`
    : pteScores.content >= 1
    ? `Basic topic coverage but lacking depth. Phoenix recommends: Use the PEEL structure (Point-Evidence-Explanation-Link) for each paragraph.`
    : `Limited topic relevance detected. URGENT: Always underline keywords in the prompt and ensure each paragraph relates to them.`;
  
  // Form (Structure)
  breakdown.form = pteScores.form >= 2
    ? `Perfect essay structure with appropriate paragraphing and word count. Well done!`
    : pteScores.form >= 1
    ? `Essay structure is present but could be improved. Phoenix tip: Use exactly 4 paragraphs with clear topic sentences.`
    : `Essay structure needs work. MUST HAVE: Introduction (40-50 words) + Body 1 (70-80 words) + Body 2 (70-80 words) + Conclusion (40-50 words).`;
  
  // Grammar
  const grammarErrors = errors.filter(e => e.type === 'grammar').length;
  breakdown.grammar = grammarErrors === 0
    ? `Excellent grammatical accuracy with sophisticated structures. Phoenix approved!`
    : grammarErrors <= 3
    ? `Generally good grammar with ${grammarErrors} errors detected. Focus on: ${getTopGrammarIssues(errors).join(', ')}.`
    : grammarErrors <= 7
    ? `Multiple grammar errors (${grammarErrors}) affecting clarity. Priority fixes: ${getTopGrammarIssues(errors).join(', ')}. Use Phoenix grammar patterns.`
    : `Frequent grammar errors (${grammarErrors}) significantly impact score. URGENT: Review Phoenix's common PTE grammar errors and practice daily.`;
  
  // Vocabulary
  const vocabErrors = errors.filter(e => e.type === 'vocabulary').length;
  breakdown.vocabulary = vocabErrors === 0
    ? `Impressive vocabulary range with precise word choice and collocations.`
    : vocabErrors <= 3
    ? `Good vocabulary with some basic words. Replace: ${getBasicVocab(errors).slice(0, 3).join(', ')} with Phoenix alternatives.`
    : vocabErrors <= 7
    ? `Limited vocabulary range. Found ${vocabErrors} basic words. Study Phoenix Academic Vocabulary Bank daily.`
    : `Very limited vocabulary. Phoenix quick fix: Memorize 5 academic words daily from each category (verbs, adjectives, nouns).`;
  
  // Coherence
  breakdown.developmentCoherence = pteScores.developmentCoherence >= 2
    ? `Excellent flow with smooth transitions and logical progression. Your ideas connect seamlessly.`
    : pteScores.developmentCoherence >= 1
    ? `Adequate coherence but needs more transition phrases. Add Phoenix transitions at the start of each paragraph.`
    : `Weak coherence affecting readability. MUST DO: Start each paragraph with a transition phrase from Phoenix's list.`;
  
  // Linguistic Range
  breakdown.linguisticRange = pteScores.linguisticRange >= 2
    ? `Excellent variety in sentence structures showing sophisticated command of English.`
    : pteScores.linguisticRange >= 1
    ? `Some variety in sentences but could be improved. Mix simple, compound, and complex sentences.`
    : `Limited sentence variety. Phoenix tip: Use these patterns - Simple + Complex + Compound in each paragraph.`;
  
  return breakdown;
}

// Extract top grammar issues from errors
function getTopGrammarIssues(errors: any[]): string[] {
  const grammarErrors = errors.filter(e => e.type === 'grammar');
  const issues = new Set<string>();
  
  grammarErrors.forEach(error => {
    if (error.explanation.includes('subject-verb')) issues.add('subject-verb agreement');
    else if (error.explanation.includes('article')) issues.add('article usage');
    else if (error.explanation.includes('tense')) issues.add('tense consistency');
    else if (error.explanation.includes('preposition')) issues.add('prepositions');
  });
  
  return Array.from(issues).slice(0, 3);
}

// Extract basic vocabulary from errors
function getBasicVocab(errors: any[]): string[] {
  return errors
    .filter(e => e.type === 'vocabulary')
    .map(e => e.text)
    .filter((text, index, self) => self.indexOf(text) === index) // unique only
    .slice(0, 5);
}

// Generate Phoenix score projection
export function generateScoreProjection(
  currentScore: number,
  errorCount: number,
  implementedSuggestions: number = 0
): { potential: number; timeframe: string; confidence: string } {
  const band = getScoreBand(currentScore);
  
  // Calculate potential score based on fixing errors
  const errorImpact = Math.min(errorCount * 1.5, 20); // Max 20 points from error fixes
  const suggestionImpact = implementedSuggestions * 2; // 2 points per suggestion
  const potentialScore = Math.min(currentScore + errorImpact + suggestionImpact, 90);
  
  // Estimate timeframe
  const pointsToGain = potentialScore - currentScore;
  const weeksNeeded = Math.ceil(pointsToGain / 5); // Average 5 points per week with intensive practice
  
  // Confidence level
  const confidence = pointsToGain <= 10 ? 'High' : pointsToGain <= 20 ? 'Medium' : 'Moderate';
  
  return {
    potential: Math.round(potentialScore),
    timeframe: `${weeksNeeded} weeks`,
    confidence
  };
}

// Generate personalized study plan
export function generatePersonalizedStudyPlan(
  score: number,
  weakAreas: string[],
  targetScore: number
): string {
  const currentBand = getScoreBand(score);
  const gap = targetScore - score;
  
  if (gap <= 0) {
    return `Congratulations! You've already achieved your target score. Focus on maintaining consistency through regular practice.`;
  }
  
  const weeksNeeded = Math.ceil(gap / 5);
  const hoursPerDay = gap > 20 ? 3 : gap > 10 ? 2 : 1;
  
  let plan = `📋 PHOENIX PERSONALIZED ${weeksNeeded}-WEEK PLAN\n\n`;
  plan += `Current Score: ${score} | Target: ${targetScore} | Gap: ${gap} points\n`;
  plan += `Daily Commitment: ${hoursPerDay} hours\n\n`;
  
  // Week-by-week breakdown
  for (let week = 1; week <= weeksNeeded; week++) {
    plan += `WEEK ${week}:\n`;
    
    if (week <= 2) {
      plan += `• Grammar: Fix ${weakAreas[0] || 'basic errors'} (30 min/day)\n`;
      plan += `• Vocabulary: Learn 10 academic words daily (30 min/day)\n`;
      plan += `• Practice: Write 1 paragraph daily using Phoenix templates\n`;
    } else if (week <= 4) {
      plan += `• Structure: Master Phoenix essay templates (30 min/day)\n`;
      plan += `• Coherence: Practice paragraph transitions (20 min/day)\n`;
      plan += `• Practice: Write 1 full essay every 2 days\n`;
    } else {
      plan += `• Mock Tests: Full essay under timed conditions (daily)\n`;
      plan += `• Review: Analyze errors using Phoenix patterns\n`;
      plan += `• Refine: Focus on remaining weak areas\n`;
    }
    
    plan += `Expected Progress: +${Math.min(5, gap - (week - 1) * 5)} points\n\n`;
  }
  
  plan += `💡 Phoenix Success Tips:\n`;
  plan += `1. Use Phoenix templates until they become automatic\n`;
  plan += `2. Track errors in a notebook - review daily\n`;
  plan += `3. Time every practice essay (20 minutes max)\n`;
  plan += `4. Join Phoenix PTE study groups for motivation\n`;
  
  return plan;
}