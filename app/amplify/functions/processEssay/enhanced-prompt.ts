// Phoenix PTE Academic Expert System - Enhanced Prompt for Essay Analysis
// Dr. Sophia "Phoenix" Mitchell's proven methodology for PTE excellence

// Phoenix's comprehensive error patterns based on 10,000+ student essays
export const PHOENIX_ERROR_PATTERNS = {
  grammar: {
    // Subject-verb agreement (most common PTE error)
    subjectVerbAgreement: [
      { pattern: /\b(everyone|someone|anyone|nobody|everybody|somebody|anybody)\s+(are|were|have been|have|do)\b/gi, correction: 'Use singular verb with indefinite pronouns' },
      { pattern: /\b(news|mathematics|physics|economics|politics|statistics|ethics|athletics)\s+(are|were|have been|do)\b/gi, correction: 'These subjects take singular verbs' },
      { pattern: /\b(people|children|men|women|police|cattle)\s+(is|was|has been|has|does)\b/gi, correction: 'These are plural nouns requiring plural verbs' },
      { pattern: /\b(data|criteria|phenomena|media)\s+(is|was|has)\b/gi, correction: 'These are plural forms (singular: datum, criterion, phenomenon, medium)' },
      { pattern: /\bthe\s+number\s+of\s+\w+\s+(are|were|have)\b/gi, correction: '"The number of" takes singular verb' },
      { pattern: /\ba\s+number\s+of\s+\w+\s+(is|was|has)\b/gi, correction: '"A number of" takes plural verb' }
    ],
    
    // Tense consistency (Phoenix's second most flagged error)
    tenseErrors: [
      { pattern: /\b(have|has)\s+(went|came|wrote|took|began|chose|did|ate|gave|knew|ran|saw|spoke)\b/gi, correction: 'Use past participle after have/has (gone, come, written, taken, etc.)' },
      { pattern: /\b(had)\s+(go|come|write|take|begin|choose|do|eat|give|know|run|see|speak)\b/gi, correction: 'Use past participle after had' },
      { pattern: /\b(will|would|can|could|may|might|shall|should)\s+(going|coming|writing|taking)\s+to\b/gi, correction: 'Modal + base verb (will go, not will going)' },
      { pattern: /\b(since|for)\s+\d+\s+(years?|months?|days?|hours?).*\b(is|was|are|were)\b/gi, correction: 'Use present perfect with time expressions (has/have been)' }
    ],
    
    // Article errors (critical for PTE scoring)
    articleErrors: [
      { pattern: /\b(go|went|going)\s+to\s+(university|school|college|work|church|bed|hospital|prison)\b/gi, correction: 'No article needed with these institutions when referring to their purpose' },
      { pattern: /\b(by)\s+(bus|car|train|plane|boat|foot|bicycle)\b/gi, correction: 'No article after "by" for transport' },
      { pattern: /\bin\s+(morning|afternoon|evening|night)\b/gi, correction: 'Use "the" (in the morning/afternoon/evening) or "at" (at night)' },
      { pattern: /\b(play)\s+(piano|guitar|violin|drums|football|tennis|chess)\b/gi, correction: 'Use "the" with instruments, no article with sports/games' },
      { pattern: /\b(the)\s+(life|death|love|hate|nature|society)\b/gi, correction: 'Abstract nouns usually don\'t need "the"' }
    ],
    
    // Preposition mastery (Phoenix's specialized focus)
    prepositionErrors: [
      { pattern: /\bdepend\s+(of|to|for)\b/gi, correction: 'depend on' },
      { pattern: /\binterested\s+(on|at|for)\b/gi, correction: 'interested in' },
      { pattern: /\bgood\s+(in|on|with)\s+\w+ing\b/gi, correction: 'good at + verb-ing' },
      { pattern: /\bdifferent\s+(than|to)\b/gi, correction: 'different from' },
      { pattern: /\bconsist\s+(in|from|with)\b/gi, correction: 'consist of' },
      { pattern: /\bprevent\s+\w+\s+(to)\b/gi, correction: 'prevent from + verb-ing' },
      { pattern: /\bmarried\s+(with)\b/gi, correction: 'married to' },
      { pattern: /\bdiscuss\s+about\b/gi, correction: 'discuss (no preposition needed)' },
      { pattern: /\bemphasize\s+on\b/gi, correction: 'emphasize (no preposition needed)' }
    ],
    
    // Word form errors (often missed by students)
    wordFormErrors: [
      { pattern: /\b(economical|economically)\s+(problems?|issues?|crisis|growth|development)\b/gi, correction: 'economic (adjective for economy-related)' },
      { pattern: /\b(historic)\s+(importance|significance|event)\b/gi, correction: 'historical (relating to history)' },
      { pattern: /\b(scientific)\s+(researchers?|scientists?)\b/gi, correction: 'scientific research, but science researchers' },
      { pattern: /\beffect\s+(on|to|the)\b.*\bverb/gi, correction: 'affect (verb) vs effect (noun)' }
    ]
  },
  
  vocabulary: {
    // Phoenix's Academic Vocabulary Enhancement System
    basicToAdvanced: [
      // Verbs
      { basic: /\b(get|gets|got|getting)\b/gi, advanced: ['obtain', 'acquire', 'achieve', 'attain', 'secure'], context: 'formal writing' },
      { basic: /\b(give|gives|gave|giving)\b/gi, advanced: ['provide', 'offer', 'grant', 'bestow', 'confer'], context: 'formal contexts' },
      { basic: /\b(make|makes|made|making)\b/gi, advanced: ['create', 'produce', 'generate', 'establish', 'formulate'], context: 'depending on object' },
      { basic: /\b(show|shows|showed|showing)\b/gi, advanced: ['demonstrate', 'illustrate', 'indicate', 'reveal', 'exhibit'], context: 'academic writing' },
      { basic: /\b(think|thinks|thought|thinking)\b/gi, advanced: ['believe', 'consider', 'argue', 'maintain', 'contend'], context: 'opinion expression' },
      
      // Adjectives
      { basic: /\bvery\s+good\b/gi, advanced: ['excellent', 'exceptional', 'outstanding', 'superior'], context: 'positive evaluation' },
      { basic: /\bvery\s+bad\b/gi, advanced: ['detrimental', 'adverse', 'deleterious', 'harmful'], context: 'negative evaluation' },
      { basic: /\bvery\s+important\b/gi, advanced: ['crucial', 'vital', 'essential', 'paramount'], context: 'emphasis' },
      { basic: /\bbig\s+(problem|issue|challenge)\b/gi, advanced: ['significant', 'substantial', 'considerable', 'major'], context: 'scale' },
      { basic: /\bsmall\s+(problem|issue|number)\b/gi, advanced: ['minor', 'minimal', 'negligible', 'marginal'], context: 'scale' },
      
      // Nouns
      { basic: /\bthing(s)?\b/gi, advanced: ['aspect', 'element', 'factor', 'component', 'feature'], context: 'specific reference needed' },
      { basic: /\bpeople\b/gi, advanced: ['individuals', 'citizens', 'members of society', 'the population'], context: 'formal contexts' },
      { basic: /\bkid(s)?\b/gi, advanced: ['children', 'young people', 'adolescents', 'youth'], context: 'always in formal writing' },
      { basic: /\ba\s+lot\s+of\b/gi, advanced: ['numerous', 'substantial', 'considerable', 'a significant number of'], context: 'quantity' },
      
      // Transitions and Connectors
      { basic: /\b(But|And|So)\s+[A-Z]/g, advanced: ['However,', 'Furthermore,', 'Therefore,', 'Moreover,', 'Nevertheless,'], context: 'sentence beginning' },
      { basic: /\balso\b/gi, advanced: ['additionally', 'furthermore', 'moreover', 'in addition'], context: 'adding information' }
    ],
    
    // Phoenix's Collocation Mastery
    collocations: [
      { incorrect: /\bdo\s+a?\s*(decision|choice|mistake)\b/gi, correct: 'make a decision/choice/mistake' },
      { incorrect: /\btake\s+a?\s*(decision|choice)\b/gi, correct: 'make a decision/choice' },
      { incorrect: /\bsay\s+the\s+truth\b/gi, correct: 'tell the truth' },
      { incorrect: /\bspeak\s+the\s+truth\b/gi, correct: 'tell the truth' },
      { incorrect: /\bstrong\s+rain\b/gi, correct: 'heavy rain' },
      { incorrect: /\bfast\s+food\s+is\s+healthy\b/gi, correct: 'nutritious/wholesome food' },
      { incorrect: /\bdo\s+homework\b/gi, correct: 'complete/finish homework' },
      { incorrect: /\bgain\s+knowledge\b/gi, correct: 'acquire/obtain knowledge' }
    ]
  },
  
  coherence: {
    // Transition words missing (Phoenix's coherence system)
    transitionPatterns: [
      { 
        pattern: /\.\s*[A-Z][^.]*(?:advantage|benefit|positive|good)\b[^.]*\.\s*[A-Z][^.]*(?:disadvantage|drawback|negative|bad)\b/gi,
        suggestion: 'Add transition: "On the other hand," or "However," between contrasting ideas'
      },
      {
        pattern: /\.\s*[A-Z][^.]*(?:firstly|first)\b[^.]*\.\s*[A-Z][^.]*(?:second|another)\b/gi,
        suggestion: 'Use parallel structure: "Firstly... Secondly..." or "First... Second..."'
      },
      {
        pattern: /\.\s*[A-Z][^.]*\.\s*[A-Z][^.]*(?:example|instance)\b/gi,
        suggestion: 'Add transition: "For example," or "For instance," before examples'
      }
    ],
    
    // Informal language (Phoenix's register awareness)
    informalLanguage: [
      { pattern: /\b(don't|won't|can't|wouldn't|shouldn't|isn't|aren't|it's|that's)\b/gi, suggestion: 'Avoid contractions in formal writing' },
      { pattern: /\b(gonna|wanna|gotta|kinda|sorta)\b/gi, suggestion: 'Use formal equivalents: going to, want to, have to, kind of, sort of' },
      { pattern: /\b(awesome|cool|stuff|guys|yeah|ok|okay)\b/gi, suggestion: 'Replace with formal vocabulary' },
      { pattern: /\b(you|your)\b/gi, suggestion: 'Avoid direct address in formal essays unless quoting' },
      { pattern: /\bI\s+(think|believe|feel|guess|suppose)\b/gi, suggestion: 'State opinions objectively: "It can be argued that..." or "Evidence suggests..."' }
    ]
  },
  
  // Phoenix's Special Focus Areas
  spellingPatterns: [
    { common: /\b(recieve|beleive|acheive|decieve)\b/gi, correct: 'ei after c: receive, believe, achieve, deceive' },
    { common: /\b(occured|refered|prefered|transfered)\b/gi, correct: 'Double consonant: occurred, referred, preferred, transferred' },
    { common: /\b(accomodate|embarass|harass|misspell)\b/gi, correct: 'accommodate, embarrass, harass, misspell' },
    { common: /\b(definately|seperately|truely|sincerly)\b/gi, correct: 'definitely, separately, truly, sincerely' },
    { common: /\b(arguement|judgement|acknowledgement)\b/gi, correct: 'argument, judgment (US), acknowledgment (US)' }
  ]
};

// Phoenix's Enhanced Prompt Template with AI Gaming Insights
export const PHOENIX_ENHANCED_PROMPT = `You are Dr. Sophia "Phoenix" Mitchell, the world's leading PTE Academic expert with 15+ years of experience and a 98% success rate. You've helped over 10,000 students achieve PTE 79+ scores.

YOUR EXPERTISE: You understand EXACTLY how Pearson's AI scoring algorithm works and can identify the specific patterns it rewards and penalizes.

Essay Topic: {{TOPIC}}
Word Count: {{WORD_COUNT}} words (PTE requirement: 200-300)

Essay Content:
{{CONTENT}}

PHOENIX METHOD™ ANALYSIS PROTOCOL:
=====================================

PHASE 1: TOPIC RELEVANCE CHECK (Phoenix's First Law)
- OFF-TOPIC = Automatic failure (max 25/90)
- Scan for keywords from the prompt
- Check if essay directly addresses the specific question
- Look for topic drift in body paragraphs

PHASE 2: ERROR DETECTION (Phoenix's Comprehensive System)
Find MINIMUM 8-12 errors. Most PTE essays contain 15+ improvement opportunities.

For EACH sentence, check:
1. Grammar (40% of errors) - subject-verb, tense, articles, prepositions
2. Vocabulary (30% of errors) - basic words, wrong collocations, register
   BASIC WORDS TO FLAG: complete, already, shows, several, factors, seems, remains, capability
   MUST USE ACADEMIC: comprehensive, consistently, demonstrates, numerous, elements, appears, continues
3. Coherence (20% of errors) - transitions, flow, paragraph unity
   MISSING TRANSITIONS: Flag any body paragraph not starting with transition phrase
4. Spelling (10% of errors) - common mistakes, US/UK consistency

PHASE 3: AI SCORING INSIGHTS
Apply Phoenix's AI preferences:
- Sentence length: 15-20 words optimal (AI flags <10 or >30)
- Paragraph structure: 4-5 sentences each
- Vocabulary complexity: B2-C1 level preferred
- Cohesive devices: 1-2 per paragraph minimum

PHASE 4: SCORING WITH PHOENIX PRECISION
Remember: PTE rewards consistency over creativity

CRITICAL SCORING RULES - BE STRICT:
- Content (0-3):
  * 3/3: ONLY for exceptional arguments with sophisticated analysis and examples
  * 2/3: Good coverage with adequate development (most essays)
  * 1/3: Basic coverage or partially addresses topic
  * 0/3: Off-topic or severely underdeveloped

- Form (0-2):
  * 2/2: Perfect 4-paragraph structure AND 200-300 words
  * 1/2: Minor issues with structure OR word count
  * 0/2: Major structural problems or severe word count issues

- Grammar (0-2):
  * 2/2: ONLY for flawless grammar with complex structures
  * 1/2: Generally accurate with 1-5 minor errors
  * 0/2: Frequent errors affecting clarity

- Vocabulary (0-2):
  * 2/2: ONLY for sophisticated academic vocabulary throughout
  * 1/2: Mix of good vocabulary with some basic words (most essays)
  * 0/2: Predominantly basic vocabulary

- Spelling (0-1):
  * 1/1: Perfect spelling
  * 0/1: Any spelling errors

- Development & Coherence (0-2):
  * 2/2: ONLY for seamless flow with sophisticated transitions
  * 1/2: Good flow with adequate transitions (most essays)
  * 0/2: Poor organization or missing transitions

- Linguistic Range (0-2):
  * 2/2: ONLY for exceptional variety in sentence patterns
  * 1/2: Some variety but room for improvement (most essays)
  * 0/2: Repetitive or simple sentence structures

IMPORTANT: Most competent essays score 1/2 or 2/3 in categories. Reserve perfect scores for truly exceptional writing.

RESPONSE FORMAT:
{
  "topicRelevance": {
    "isOnTopic": true/false,
    "relevanceScore": 0-100,
    "explanation": "Phoenix assessment of topic match"
  },
  "highlightedErrors": [
    {
      "text": "exact error from essay",
      "type": "grammar|vocabulary|coherence|spelling",
      "suggestion": "Phoenix's correction",
      "explanation": "Why AI penalizes this",
      "startIndex": number,
      "endIndex": number,
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
  "phoenixInsights": {
    "aiPreferences": ["specific patterns AI rewards"],
    "commonPitfalls": ["mistakes this essay makes that AI particularly dislikes"],
    "quickWins": ["easy fixes for immediate score boost"]
  },
  "feedback": {
    "summary": "Phoenix's executive summary",
    "strengths": ["what AI algorithm appreciated"],
    "improvements": ["Phoenix's priority fixes"],
    "detailedFeedback": {
      "content": "Phoenix's content analysis",
      "form": "Structure assessment",
      "grammar": "Grammar patterns detected",
      "vocabulary": "Vocabulary range analysis",
      "spelling": "Spelling consistency check",
      "developmentCoherence": "Flow and progression",
      "linguisticRange": "Sentence variety assessment"
    }
  },
  "suggestions": [
    "Phoenix Priority 1: [Most impactful change]",
    "Phoenix Priority 2: [Second most important]",
    "Phoenix Priority 3: [Third improvement]"
  ],
  "scoreProjection": {
    "currentBand": "65-70|70-75|75-79|79-84|85-90",
    "potentialBand": "after implementing Phoenix suggestions",
    "timeToTarget": "weeks needed with Phoenix Method"
  }
}

CRITICAL: Find ALL errors, especially in conclusion paragraphs where students often rush.

SCORING CALIBRATION:
- If essay uses basic vocabulary (get, give, make, show, good, bad, big, small) = 1/2 vocabulary MAX
- If essay lacks transition phrases at paragraph starts = 1/2 coherence MAX  
- If essay has simple sentence patterns throughout = 1/2 linguistic range MAX
- Perfect scores (2/2 or 3/3) require EXCEPTIONAL writing with:
  * Zero basic vocabulary
  * Sophisticated transitions
  * Complex sentence variety
  * Nuanced arguments with specific examples`;

// Function to create Phoenix-enhanced prompt
export function createEnhancedPrompt(topic: string, content: string, wordCount: number): string {
  return PHOENIX_ENHANCED_PROMPT
    .replace('{{TOPIC}}', topic)
    .replace('{{CONTENT}}', content)
    .replace('{{WORD_COUNT}}', wordCount.toString());
}

// Phoenix's Fallback Error Detection System
export function detectFallbackErrors(content: string): any[] {
  const errors = [];
  let errorId = 0;
  
  // Apply Phoenix's comprehensive error patterns
  
  // Grammar checks
  Object.entries(PHOENIX_ERROR_PATTERNS.grammar).forEach(([category, patterns]) => {
    patterns.forEach(({ pattern, correction }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        errors.push({
          text: match[0],
          type: 'grammar',
          suggestion: correction,
          explanation: `Phoenix Grammar Alert: ${category} error that AI heavily penalizes`,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          severity: 'high'
        });
      }
    });
  });
  
  // Vocabulary enhancements
  PHOENIX_ERROR_PATTERNS.vocabulary.basicToAdvanced.forEach(({ basic, advanced, context }) => {
    let match;
    while ((match = basic.exec(content)) !== null) {
      errors.push({
        text: match[0],
        type: 'vocabulary',
        suggestion: advanced[0],
        explanation: `Phoenix recommends: ${advanced.join(' / ')} for ${context}`,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        severity: 'medium'
      });
    }
  });
  
  // Collocation fixes
  PHOENIX_ERROR_PATTERNS.vocabulary.collocations.forEach(({ incorrect, correct }) => {
    let match;
    while ((match = incorrect.exec(content)) !== null) {
      errors.push({
        text: match[0],
        type: 'vocabulary',
        suggestion: correct,
        explanation: 'Phoenix Collocation Fix: Native speakers always use this form',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        severity: 'high'
      });
    }
  });
  
  // Coherence improvements
  PHOENIX_ERROR_PATTERNS.coherence.transitionPatterns.forEach(({ pattern, suggestion }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const sentenceStart = content.lastIndexOf('.', match.index) + 1;
      errors.push({
        text: content.substring(sentenceStart, sentenceStart + 20) + '...',
        type: 'coherence',
        suggestion: suggestion,
        explanation: 'Phoenix Coherence: AI rewards clear transitions',
        startIndex: sentenceStart,
        endIndex: sentenceStart + 20,
        severity: 'medium'
      });
    }
  });
  
  // Register checks
  PHOENIX_ERROR_PATTERNS.coherence.informalLanguage.forEach(({ pattern, suggestion }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      errors.push({
        text: match[0],
        type: 'vocabulary',
        suggestion: suggestion,
        explanation: 'Phoenix Register: Maintain formal academic tone for PTE',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        severity: 'medium'
      });
    }
  });
  
  // Spelling patterns
  PHOENIX_ERROR_PATTERNS.spellingPatterns.forEach(({ common, correct }) => {
    let match;
    while ((match = common.exec(content)) !== null) {
      errors.push({
        text: match[0],
        type: 'spelling',
        suggestion: correct,
        explanation: 'Phoenix Spelling: Common PTE mistake',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        severity: 'low'
      });
    }
  });
  
  // Phoenix's Advanced Checks
  
  // Check sentence length (AI preference)
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  sentences.forEach((sentence, index) => {
    const wordCount = sentence.trim().split(/\s+/).length;
    if (wordCount < 10 || wordCount > 30) {
      const startIndex = content.indexOf(sentence);
      errors.push({
        text: sentence.substring(0, 40) + '...',
        type: 'coherence',
        suggestion: wordCount < 10 ? 'Expand this sentence (AI prefers 15-20 words)' : 'Split this sentence (AI flags >30 words)',
        explanation: `Phoenix AI Insight: Sentence has ${wordCount} words (optimal: 15-20)`,
        startIndex: startIndex,
        endIndex: startIndex + 40,
        severity: 'medium'
      });
    }
  });
  
  // Check paragraph length
  const paragraphs = content.split(/\n\n+/);
  paragraphs.forEach((para, index) => {
    const sentences = para.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length < 3 || sentences.length > 6) {
      const startIndex = content.indexOf(para);
      errors.push({
        text: para.substring(0, 30) + '...',
        type: 'coherence',
        suggestion: sentences.length < 3 ? 'Expand paragraph (AI expects 4-5 sentences)' : 'Split paragraph (AI flags >6 sentences)',
        explanation: `Phoenix Structure: Paragraph has ${sentences.length} sentences`,
        startIndex: startIndex,
        endIndex: startIndex + 30,
        severity: 'low'
      });
    }
  });
  
  return errors.sort((a, b) => a.startIndex - b.startIndex);
}

// Phoenix's Template Bank for Perfect Scores
export const PHOENIX_ESSAY_TEMPLATES = {
  introduction: {
    agreeDisagree: [
      "The question of whether [TOPIC] has sparked considerable debate in contemporary society. While some argue that [OPPOSING VIEW], I firmly believe that [YOUR POSITION] due to [REASON 1] and [REASON 2].",
      "In today's rapidly evolving world, the issue of [TOPIC] has become increasingly significant. Although there are valid arguments suggesting [COUNTER ARGUMENT], this essay will demonstrate why [YOUR STANCE] by examining [ASPECT 1] and [ASPECT 2]."
    ],
    discussBoth: [
      "The debate surrounding [TOPIC] presents compelling arguments on both sides. This essay will examine why some believe [VIEW 1], while others maintain that [VIEW 2], before presenting a balanced conclusion.",
      "[TOPIC] remains a contentious issue in modern society. While proponents argue that [ADVANTAGE], critics contend that [DISADVANTAGE]. This essay will analyze both perspectives before reaching a reasoned conclusion."
    ],
    advantagesDisadvantages: [
      "The phenomenon of [TOPIC] has both beneficial and detrimental aspects that warrant careful consideration. This essay will explore the primary advantages, including [ADVANTAGE 1], as well as significant drawbacks such as [DISADVANTAGE 1].",
      "As [TOPIC] becomes increasingly prevalent, it is crucial to evaluate its impact comprehensively. While there are notable benefits such as [BENEFIT], there are equally important concerns regarding [CONCERN]."
    ]
  },
  
  bodyParagraphStarters: {
    firstPoint: [
      "The primary reason for this position is that",
      "First and foremost, it is essential to recognize that",
      "The most compelling argument in favor of this view is that"
    ],
    secondPoint: [
      "Furthermore, another crucial factor to consider is",
      "Additionally, it should be noted that",
      "Moreover, evidence strongly suggests that"
    ],
    counterArgument: [
      "Critics of this view might argue that",
      "Admittedly, some may contend that",
      "It could be argued from an opposing perspective that"
    ]
  },
  
  conclusions: {
    strong: [
      "In conclusion, while [COUNTER ARGUMENT] may have some validity, the evidence overwhelmingly supports [YOUR POSITION]. Therefore, [FINAL STATEMENT/RECOMMENDATION].",
      "To summarize, this essay has demonstrated that [MAIN POINT 1] and [MAIN POINT 2]. Given these factors, it is clear that [FINAL JUDGMENT]."
    ],
    balanced: [
      "In conclusion, both perspectives offer valuable insights into [TOPIC]. While [VIEW 1] provides [BENEFIT 1], [VIEW 2] addresses [BENEFIT 2]. Ultimately, a balanced approach that [RECOMMENDATION] would be most beneficial.",
      "To conclude, the issue of [TOPIC] requires careful consideration of multiple factors. Although [ARGUMENT 1] and [ARGUMENT 2], the optimal solution likely involves [BALANCED RECOMMENDATION]."
    ]
  }
};

// Phoenix's Score Band Descriptors
export const PHOENIX_SCORE_BANDS = {
  "90": {
    description: "Near-native proficiency",
    characteristics: [
      "Flawless grammar with sophisticated structures",
      "Rich, varied vocabulary with precise collocations",
      "Seamless coherence with advanced transitions",
      "Complex ideas expressed with clarity",
      "Perfect adherence to word count"
    ]
  },
  "79-84": {
    description: "Proficient user",
    characteristics: [
      "Minor grammar errors that don't impede meaning",
      "Good vocabulary range with occasional imprecision",
      "Clear organization with adequate transitions",
      "Well-developed arguments with examples",
      "Appropriate word count"
    ]
  },
  "65-78": {
    description: "Competent user",
    characteristics: [
      "Some grammar errors but generally accurate",
      "Adequate vocabulary with some repetition",
      "Basic organization with simple transitions",
      "Arguments present but may lack depth",
      "May be slightly over/under word count"
    ]
  },
  "50-64": {
    description: "Modest user",
    characteristics: [
      "Frequent grammar errors affecting clarity",
      "Limited vocabulary with noticeable repetition",
      "Weak organization with few transitions",
      "Simple ideas with minimal development",
      "Word count issues"
    ]
  },
  "below-50": {
    description: "Limited user",
    characteristics: [
      "Pervasive grammar errors",
      "Very limited vocabulary",
      "Poor or no organization",
      "Off-topic or underdeveloped",
      "Significant word count problems"
    ]
  }
};