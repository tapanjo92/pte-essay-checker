// Industry-Standard Enhanced Prompt for PTE Essay Analysis with Error Detection
// Based on best practices from Grammarly, ProWritingAid, and academic writing tools

export const ENHANCED_PROMPT_TEMPLATE = `You are an expert PTE Academic essay evaluator specializing in detailed error detection.

YOUR PRIMARY TASK: Identify and highlight specific errors in the essay below.

Essay Topic: {{TOPIC}}

Essay Content ({{WORD_COUNT}} words):
{{CONTENT}}

INSTRUCTIONS - FOLLOW THIS EXACT ORDER:

STEP 1: ERROR DETECTION (MOST CRITICAL - 70% OF YOUR FOCUS)
========================================================
Read the essay sentence by sentence. For EACH sentence, check for:

1. GRAMMAR ERRORS - Look for:
   - Subject-verb disagreement ("The student go" → "The student goes")
   - Tense errors ("I have went" → "I have gone")
   - Article errors ("I went to university" → "I went to the university")
   - Preposition errors ("depend of" → "depend on")
   - Word form errors ("economical problems" → "economic problems")

2. VOCABULARY ISSUES - Look for:
   - Basic/repetitive words ("good" → "beneficial", "bad" → "detrimental")
   - Wrong word choice ("do a decision" → "make a decision")
   - Informal language ("kids" → "children", "stuff" → "things")
   - Missing academic vocabulary

3. COHERENCE PROBLEMS - Look for:
   - Missing transitions between sentences
   - Abrupt topic changes
   - Unclear pronoun references
   - Logical flow issues

4. SPELLING MISTAKES - Any misspelled words

YOU MUST FIND AT LEAST 5-10 ERRORS. Most PTE essays have 10-15 errors.

For EACH error, record:
- The EXACT text (copy-paste it)
- Character position (count from start of essay)
- Type of error
- Specific correction
- Brief explanation

STEP 2: SCORING (30% OF YOUR FOCUS)
===================================
After identifying all errors, evaluate using PTE criteria.

RESPONSE FORMAT:
===============
{
  "highlightedErrors": [
    // MINIMUM 5 ERRORS REQUIRED - AIM FOR 10+
    {
      "text": "exact error text from essay",
      "type": "grammar|vocabulary|coherence|spelling",
      "suggestion": "corrected version",
      "explanation": "why this is wrong",
      "startIndex": 0,
      "endIndex": 10
    }
  ],
  "topicRelevance": {
    "isOnTopic": true/false,
    "relevanceScore": 0-100,
    "explanation": "explanation"
  },
  "pteScores": {
    "content": 0-3,
    "form": 0-2,
    "grammar": 0-2,
    "vocabulary": 0-2,
    "spelling": 0-1,
    "developmentCoherence": 0-2,
    "linguisticRange": 0-2
  },
  "feedback": {
    "summary": "overall assessment",
    "strengths": ["strength1", "strength2"],
    "improvements": ["area1", "area2"],
    "detailedFeedback": {
      "taskResponse": "feedback",
      "coherence": "feedback",
      "vocabulary": "feedback",
      "grammar": "feedback"
    }
  },
  "suggestions": ["specific suggestion 1", "specific suggestion 2"]
}

CRITICAL: Start with highlightedErrors array. Find ALL errors before scoring.`;

// Function to create the enhanced prompt
export function createEnhancedPrompt(topic: string, content: string, wordCount: number): string {
  return ENHANCED_PROMPT_TEMPLATE
    .replace('{{TOPIC}}', topic)
    .replace('{{CONTENT}}', content)
    .replace('{{WORD_COUNT}}', wordCount.toString());
}

// Common PTE essay errors for fallback detection
export const COMMON_PTE_ERRORS = {
  grammar: [
    // Subject-verb agreement
    /\b(everyone|someone|anyone|nobody|everybody)\s+(are|were)\b/gi,
    /\b(news|mathematics|physics|economics)\s+(are|were)\b/gi,
    /\b(people|children|men|women)\s+(is|was)\b/gi,
    
    // Tense consistency
    /\b(have|has)\s+(went|came|wrote|took)\b/gi,
    /\b(will)\s+(going|coming)\s+to\b/gi,
    
    // Article usage
    /\b(go\s+to)\s+(university|school|work|home)\b/gi,
    /\bin\s+the\s+(morning|afternoon|evening)\b/gi,
    
    // Common preposition errors
    /\bdepend\s+of\b/gi,
    /\binterested\s+on\b/gi,
    /\bgood\s+in\b/gi,
    /\bdifferent\s+than\b/gi
  ],
  
  vocabulary: [
    // Basic vocabulary that should be enhanced
    { basic: /\bvery\s+good\b/gi, advanced: ['excellent', 'outstanding', 'exceptional'] },
    { basic: /\bvery\s+bad\b/gi, advanced: ['terrible', 'dreadful', 'appalling'] },
    { basic: /\ba\s+lot\s+of\b/gi, advanced: ['numerous', 'substantial', 'considerable'] },
    { basic: /\bget\b/gi, advanced: ['obtain', 'acquire', 'receive'] },
    { basic: /\bbig\b/gi, advanced: ['significant', 'substantial', 'major'] },
    { basic: /\bsmall\b/gi, advanced: ['minor', 'minimal', 'insignificant'] },
    { basic: /\bthing\b/gi, advanced: ['aspect', 'element', 'factor'] }
  ],
  
  coherence: [
    // Sentences without transitions
    /\.\s*[A-Z][^.]*\./g, // Check for sentences that might need transitions
    
    // Informal contractions
    /\b(don't|won't|can't|wouldn't|shouldn't|isn't|aren't)\b/gi,
    
    // First person overuse
    /\bI\s+(think|believe|feel)\b/gi
  ]
};

// Fallback error detection when AI doesn't provide enough
export function detectFallbackErrors(content: string): any[] {
  const errors = [];
  let errorId = 0;
  
  // Grammar errors
  COMMON_PTE_ERRORS.grammar.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      errors.push({
        text: match[0],
        type: 'grammar',
        suggestion: 'Check grammar rules',
        explanation: 'Common grammatical error in PTE essays',
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  });
  
  // Vocabulary improvements
  COMMON_PTE_ERRORS.vocabulary.forEach(({ basic, advanced }) => {
    let match;
    while ((match = basic.exec(content)) !== null) {
      errors.push({
        text: match[0],
        type: 'vocabulary',
        suggestion: advanced[0],
        explanation: `Replace basic vocabulary with more academic alternatives: ${advanced.join(', ')}`,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  });
  
  return errors;
}