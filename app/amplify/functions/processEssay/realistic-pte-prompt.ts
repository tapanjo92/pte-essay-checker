// Realistic PTE Academic Essay Evaluation System
// Based on actual PTE scoring patterns and real student score distributions

export const REALISTIC_PTE_CRITERIA = {
  // Actual PTE weight distribution based on official guidelines
  content: { maxPoints: 3, weight: 0.214 },      // 21.4%
  form: { maxPoints: 2, weight: 0.143 },         // 14.3%
  grammar: { maxPoints: 2, weight: 0.143 },      // 14.3%
  vocabulary: { maxPoints: 2, weight: 0.143 },   // 14.3%
  spelling: { maxPoints: 1, weight: 0.071 },     // 7.1%
  developmentCoherence: { maxPoints: 2, weight: 0.143 }, // 14.3%
  linguisticRange: { maxPoints: 2, weight: 0.143 }       // 14.3%
};

export const REALISTIC_SCORING_PROMPT = `You are an objective PTE Academic essay evaluator calibrated to match actual Pearson scoring patterns. Your scoring must reflect realistic distributions where most test-takers score between 50-75.

CRITICAL CALIBRATION FACTS:
- Only 15% of test-takers achieve 79+
- Most competent essays score 65-75
- Average essay scores cluster around 60-70
- Perfect or near-perfect scores (85+) are extremely rare (<2%)

Essay Topic: {{TOPIC}}
Word Count: {{WORD_COUNT}} words (Requirement: 200-300)

Essay Content:
{{CONTENT}}

EVALUATION PROTOCOL:
==================

STEP 1: TOPIC RELEVANCE CHECK
- Completely off-topic = Automatic failure (max score: 30/90)
- Partially addresses topic = Significant penalty
- Verify essay directly answers the specific question asked

STEP 2: SYSTEMATIC ERROR DETECTION
Count ALL errors without exception. Average PTE essays contain:
- 8-15 grammar errors
- 5-10 vocabulary issues
- 3-5 coherence problems
- 2-4 spelling mistakes

ERROR CATEGORIES TO CHECK:

Grammar Errors (Most Common):
- Subject-verb disagreement
- Incorrect tense usage
- Article errors (a/an/the)
- Preposition mistakes
- Word form errors
- Sentence fragments
- Run-on sentences
- Incorrect conditionals

Vocabulary Issues:
- Basic/repetitive vocabulary (get, give, make, good, bad)
- Incorrect collocations
- Informal language in formal context
- Word choice errors
- Lack of academic vocabulary
- Imprecise expressions

Coherence Problems:
- Missing or weak transitions
- Paragraph unity issues
- Illogical flow of ideas
- Lack of clear topic sentences
- Weak conclusion
- Repetitive ideas

Spelling Errors:
- Any misspelled words
- Inconsistent spelling (US/UK mixing)
- Typos that create non-words

STEP 3: STRICT SCORING GUIDELINES

Content (0-3 points):
- 3: Exceptional - Fully addresses topic with sophisticated analysis, specific examples, and nuanced arguments (RARE: <5% of essays)
- 2: Good - Addresses topic well with clear arguments and some examples (TOP 20% of essays)
- 1: Adequate - Basic coverage of topic with simple arguments (MOST essays: 60%)
- 0: Poor - Off-topic, severely underdeveloped, or missing key aspects

Form (0-2 points):
- 2: Perfect structure with clear intro, 2 body paragraphs, conclusion AND 200-300 words
- 1: Minor structural issues OR slight word count deviation (±10%)
- 0: Major structural problems OR significant word count issues

Grammar (0-2 points):
- 2: Near-perfect grammar with complex structures correctly used (RARE: <10%)
- 1: Generally accurate with 3-7 errors that don't impede understanding (MOST essays)
- 0: Frequent errors (8+) that affect comprehension

Vocabulary (0-2 points):
- 2: Rich academic vocabulary, precise word choice, no basic words (RARE: <10%)
- 1: Mix of good and basic vocabulary, some imprecision (MOST essays: 70%)
- 0: Predominantly basic vocabulary, frequent repetition

Spelling (0-1 point):
- 1: No spelling errors
- 0: Any spelling errors (even one)

Development & Coherence (0-2 points):
- 2: Excellent progression with sophisticated transitions and clear paragraph focus (RARE)
- 1: Adequate organization with basic transitions (MOST essays: 65%)
- 0: Poor organization, missing transitions, unclear progression

Linguistic Range (0-2 points):
- 2: Wide variety of complex structures used accurately (RARE: <15%)
- 1: Some variety but mostly simple/compound sentences (MOST essays: 70%)
- 0: Limited to simple sentences or severe accuracy issues

IMPORTANT SCORING PRINCIPLES:
1. Most criteria should score 1 out of 2 for average essays
2. Reserve 2/2 scores for truly exceptional performance
3. A score of 0 indicates serious deficiency
4. Total raw scores typically range 6-10 out of 14 (43-71%)

RESPONSE FORMAT:
{
  "topicRelevance": {
    "isOnTopic": boolean,
    "relevanceScore": 0-100,
    "explanation": "Specific assessment of how well essay addresses the prompt"
  },
  "errorAnalysis": {
    "grammarErrors": number,
    "vocabularyIssues": number,
    "coherenceProblems": number,
    "spellingMistakes": number,
    "totalErrors": number
  },
  "detailedErrors": [
    {
      "text": "exact text from essay",
      "type": "grammar|vocabulary|coherence|spelling",
      "correction": "corrected version",
      "explanation": "why this is incorrect",
      "severity": "high|medium|low"
    }
  ],
  "pteScores": {
    "content": 0-3,
    "form": 0-2,
    "grammar": 0-2,
    "vocabulary": 0-2,
    "spelling": 0-1,
    "developmentCoherence": 0-2,
    "linguisticRange": 0-2
  },
  "scoreJustification": {
    "content": "Specific reasons for score given",
    "form": "Specific reasons for score given",
    "grammar": "Number of errors found and impact",
    "vocabulary": "Assessment of range and accuracy",
    "spelling": "Number of spelling errors",
    "developmentCoherence": "Quality of organization and transitions",
    "linguisticRange": "Variety and complexity of structures"
  },
  "feedback": {
    "summary": "Overall performance assessment",
    "strengths": ["Maximum 2-3 genuine strengths"],
    "weaknesses": ["3-5 specific areas needing improvement"],
    "priorityImprovements": [
      "Most critical issue to address",
      "Second priority",
      "Third priority"
    ]
  },
  "realisticBand": {
    "rawScore": "X/14",
    "scaledScore": "X/90",
    "performanceLevel": "Below Average|Average|Above Average|High|Exceptional",
    "percentile": "Bottom 25%|25-50%|50-75%|Top 25%|Top 10%"
  }
}

CRITICAL REMINDERS:
- Average PTE essay scores 65-70/90
- Scores above 79 should be rare (top 15%)
- Find ALL errors - don't be lenient
- Most essays have significant room for improvement
- Be specific in feedback - vague praise doesn't help students`;

// Realistic score scaling function
export function getRealisticScaledScore(rawScore: number, maxScore: number): number {
  const percentage = rawScore / maxScore;
  
  // More realistic distribution
  if (percentage <= 0.2) {
    // 0-20% = 30-45 points (failing range)
    return Math.round(30 + (percentage / 0.2) * 15);
  } else if (percentage <= 0.4) {
    // 21-40% = 45-55 points (below average)
    return Math.round(45 + ((percentage - 0.2) / 0.2) * 10);
  } else if (percentage <= 0.6) {
    // 41-60% = 55-65 points (average)
    return Math.round(55 + ((percentage - 0.4) / 0.2) * 10);
  } else if (percentage <= 0.8) {
    // 61-80% = 65-75 points (above average)
    return Math.round(65 + ((percentage - 0.6) / 0.2) * 10);
  } else if (percentage <= 0.95) {
    // 81-95% = 75-83 points (high achieving)
    return Math.round(75 + ((percentage - 0.8) / 0.15) * 8);
  } else {
    // 96-100% = 83-87 points (exceptional - very rare)
    return Math.round(83 + ((percentage - 0.95) / 0.05) * 4);
  }
}

// Function to create realistic prompt
export function createRealisticPrompt(topic: string, content: string, wordCount: number): string {
  return REALISTIC_SCORING_PROMPT
    .replace('{{TOPIC}}', topic)
    .replace('{{CONTENT}}', content)
    .replace('{{WORD_COUNT}}', wordCount.toString());
}

// Strict fallback response for when AI analysis fails
export function createStrictFallbackResponse(reason: string): any {
  return {
    analysisStatus: 'failed',
    failureReason: reason,
    message: 'Unable to complete essay analysis. Please try again.',
    fallbackScores: null // Don't provide scores if analysis failed
  };
}

// Common PTE essay errors database
export const COMMON_PTE_ERRORS = {
  grammar: [
    { pattern: /\b(everyone|someone|anyone|nobody)\s+(are|were)\b/gi, error: 'Subject-verb disagreement with indefinite pronouns' },
    { pattern: /\b(have|has)\s+(went|came|wrote|took)\b/gi, error: 'Incorrect past participle usage' },
    { pattern: /\bthe\s+(life|death|love|nature)\b/gi, error: 'Unnecessary article with abstract nouns' },
    { pattern: /\b(discuss|emphasize|mention)\s+about\b/gi, error: 'Unnecessary preposition' },
    { pattern: /\b(despite|although|though)\s+of\b/gi, error: 'Incorrect preposition usage' }
  ],
  vocabulary: [
    { pattern: /\b(get|got|getting)\b/gi, level: 'basic', suggestion: 'Use: obtain, acquire, receive' },
    { pattern: /\b(good|bad)\b/gi, level: 'basic', suggestion: 'Use: beneficial/detrimental, positive/negative' },
    { pattern: /\b(big|small)\b/gi, level: 'basic', suggestion: 'Use: significant/minor, substantial/minimal' },
    { pattern: /\b(thing|things)\b/gi, level: 'basic', suggestion: 'Use: aspect, factor, element' },
    { pattern: /\ba lot of\b/gi, level: 'basic', suggestion: 'Use: numerous, considerable, substantial' }
  ],
  coherence: [
    { issue: 'Missing transition at paragraph start', impact: 'Reduces coherence score' },
    { issue: 'Repetitive sentence structures', impact: 'Limits linguistic range score' },
    { issue: 'Weak topic sentences', impact: 'Affects development score' },
    { issue: 'Abrupt ending', impact: 'Reduces coherence score' }
  ]
};

// Realistic score distribution for calibration
export const REALISTIC_SCORE_DISTRIBUTION = {
  '30-50': '15%', // Failing
  '51-60': '20%', // Below average
  '61-70': '35%', // Average (largest group)
  '71-78': '20%', // Above average
  '79-84': '8%',  // High achieving
  '85-90': '2%'   // Exceptional (very rare)
};