// Phoenix's Comprehensive PTE Vocabulary Bank
// Based on analysis of 10,000+ successful PTE essays

export const PHOENIX_VOCABULARY_BANK = {
  // Academic Transitions (Phoenix's Golden List)
  transitions: {
    contrast: [
      'However', 'Nevertheless', 'Nonetheless', 'On the contrary',
      'Conversely', 'In contrast', 'Despite this', 'On the other hand',
      'Although', 'Even though', 'While', 'Whereas'
    ],
    addition: [
      'Furthermore', 'Moreover', 'Additionally', 'In addition',
      'Besides', 'Also', 'Equally important', 'Not only... but also',
      'Similarly', 'Likewise', 'Correspondingly', 'In the same way'
    ],
    cause_effect: [
      'Therefore', 'Thus', 'Hence', 'Consequently',
      'As a result', 'For this reason', 'Accordingly', 'Due to',
      'Because of', 'Owing to', 'Thanks to', 'Leading to'
    ],
    example: [
      'For example', 'For instance', 'To illustrate', 'Specifically',
      'In particular', 'Notably', 'A case in point', 'Such as',
      'Including', 'Namely', 'To exemplify', 'As evidenced by'
    ],
    emphasis: [
      'Indeed', 'In fact', 'Undoubtedly', 'Certainly',
      'Obviously', 'Clearly', 'Importantly', 'Significantly',
      'It should be noted that', 'It is worth mentioning that'
    ],
    conclusion: [
      'In conclusion', 'To conclude', 'In summary', 'To summarize',
      'Overall', 'All things considered', 'Taking everything into account',
      'On balance', 'Ultimately', 'In essence', 'To sum up'
    ]
  },

  // Phoenix's High-Scoring Vocabulary Replacements
  academicReplacements: {
    // Common → Academic (with usage notes)
    verbs: {
      'get': {
        academic: ['obtain', 'acquire', 'secure', 'attain', 'procure'],
        contexts: {
          'get a job': 'secure employment',
          'get knowledge': 'acquire knowledge',
          'get results': 'obtain results',
          'get better': 'improve',
          'get worse': 'deteriorate'
        }
      },
      'give': {
        academic: ['provide', 'offer', 'supply', 'grant', 'confer', 'bestow'],
        contexts: {
          'give information': 'provide information',
          'give opportunity': 'offer opportunities',
          'give permission': 'grant permission',
          'give advice': 'offer guidance'
        }
      },
      'make': {
        academic: ['create', 'produce', 'generate', 'develop', 'establish', 'formulate'],
        contexts: {
          'make money': 'generate income',
          'make a decision': 'reach a decision',
          'make progress': 'achieve progress',
          'make a mistake': 'commit an error'
        }
      },
      'show': {
        academic: ['demonstrate', 'illustrate', 'indicate', 'reveal', 'exhibit', 'display'],
        contexts: {
          'show results': 'demonstrate outcomes',
          'show improvement': 'exhibit improvement',
          'show that': 'indicate that',
          'show evidence': 'present evidence'
        }
      },
      'think': {
        academic: ['believe', 'consider', 'argue', 'maintain', 'contend', 'assert'],
        contexts: {
          'I think': 'It can be argued that',
          'think about': 'consider',
          'think that': 'maintain that',
          'many think': 'it is widely believed'
        }
      },
      'help': {
        academic: ['assist', 'aid', 'facilitate', 'support', 'contribute to', 'enhance'],
        contexts: {
          'help people': 'assist individuals',
          'help improve': 'facilitate improvement',
          'help with': 'aid in',
          'help solve': 'contribute to solving'
        }
      }
    },
    
    adjectives: {
      'good': {
        academic: ['beneficial', 'advantageous', 'favorable', 'positive', 'constructive'],
        contexts: {
          'good for health': 'beneficial to health',
          'good idea': 'constructive proposal',
          'good results': 'favorable outcomes',
          'good effect': 'positive impact'
        }
      },
      'bad': {
        academic: ['detrimental', 'adverse', 'negative', 'harmful', 'deleterious'],
        contexts: {
          'bad for health': 'detrimental to health',
          'bad effect': 'adverse impact',
          'bad situation': 'unfavorable circumstances',
          'bad consequences': 'negative repercussions'
        }
      },
      'important': {
        academic: ['crucial', 'vital', 'essential', 'significant', 'paramount', 'critical'],
        contexts: {
          'very important': 'crucial/paramount',
          'important for': 'essential to',
          'important role': 'vital function',
          'important factor': 'significant element'
        }
      },
      'big': {
        academic: ['substantial', 'significant', 'considerable', 'major', 'extensive'],
        contexts: {
          'big problem': 'significant challenge',
          'big difference': 'substantial disparity',
          'big impact': 'considerable influence',
          'big change': 'major transformation'
        }
      },
      'small': {
        academic: ['minimal', 'minor', 'negligible', 'marginal', 'limited'],
        contexts: {
          'small problem': 'minor issue',
          'small effect': 'minimal impact',
          'small number': 'limited quantity',
          'small change': 'marginal adjustment'
        }
      }
    },
    
    nouns: {
      'thing': {
        academic: ['aspect', 'element', 'factor', 'component', 'feature', 'attribute'],
        contexts: {
          'many things': 'various aspects',
          'important thing': 'crucial element',
          'one thing': 'one factor',
          'the main thing': 'the primary consideration'
        }
      },
      'problem': {
        academic: ['issue', 'challenge', 'concern', 'difficulty', 'obstacle', 'complication'],
        contexts: {
          'big problem': 'significant challenge',
          'solve problems': 'address issues',
          'cause problems': 'create complications',
          'face problems': 'encounter difficulties'
        }
      },
      'way': {
        academic: ['method', 'approach', 'means', 'strategy', 'technique', 'manner'],
        contexts: {
          'best way': 'optimal approach',
          'only way': 'sole method',
          'different ways': 'various strategies',
          'in this way': 'through this means'
        }
      }
    }
  },

  // Phoenix's PTE-Specific Collocations
  pteCollocations: {
    economic: [
      'economic growth', 'economic development', 'economic stability',
      'economic prosperity', 'economic downturn', 'economic disparity',
      'economic sustainability', 'economic implications'
    ],
    social: [
      'social interaction', 'social cohesion', 'social dynamics',
      'social implications', 'social responsibility', 'social inequality',
      'social awareness', 'social integration'
    ],
    environmental: [
      'environmental degradation', 'environmental sustainability',
      'environmental conservation', 'environmental impact',
      'environmental awareness', 'environmental protection'
    ],
    educational: [
      'educational opportunities', 'educational attainment',
      'educational institutions', 'educational outcomes',
      'educational resources', 'educational advancement'
    ],
    technological: [
      'technological advancement', 'technological innovation',
      'technological progress', 'technological revolution',
      'technological disruption', 'technological integration'
    ],
    global: [
      'global perspective', 'global economy', 'global challenges',
      'global cooperation', 'global implications', 'global awareness',
      'global connectivity', 'global sustainability'
    ]
  },

  // Phoenix's Power Phrases for Different Essay Types
  powerPhrases: {
    agreeDisagree: {
      strong_agreement: [
        'I firmly believe that',
        'I strongly advocate for',
        'It is undeniable that',
        'Evidence overwhelmingly supports'
      ],
      partial_agreement: [
        'While I acknowledge that',
        'Although there is merit in',
        'Despite some valid points',
        'I partially concur with'
      ],
      disagreement: [
        'I respectfully disagree with',
        'This viewpoint overlooks',
        'Evidence suggests otherwise',
        'This perspective fails to consider'
      ]
    },
    
    advantages_disadvantages: {
      introducing_advantages: [
        'The primary benefit is',
        'One significant advantage is',
        'A noteworthy merit is',
        'The foremost strength lies in'
      ],
      introducing_disadvantages: [
        'The main drawback is',
        'A significant limitation is',
        'One notable disadvantage is',
        'The primary concern revolves around'
      ],
      balancing: [
        'On balance',
        'Weighing both sides',
        'Taking all factors into account',
        'Considering the pros and cons'
      ]
    },
    
    problem_solution: {
      identifying_problems: [
        'The root cause of this issue',
        'The underlying problem stems from',
        'This challenge manifests in',
        'The crux of the matter is'
      ],
      proposing_solutions: [
        'A viable solution would be',
        'One effective approach is',
        'This could be addressed by',
        'A practical remedy involves'
      ],
      evaluating_solutions: [
        'This approach would effectively',
        'Implementation would result in',
        'The feasibility of this solution',
        'The potential impact includes'
      ]
    }
  },

  // Phoenix's Essay Type Templates
  essayTemplates: {
    introduction: {
      hook_sentences: [
        'In an era characterized by [TREND], the question of [TOPIC] has become increasingly pertinent.',
        'The debate surrounding [TOPIC] has gained considerable momentum in recent years.',
        'As society grapples with [CHALLENGE], the issue of [TOPIC] demands careful consideration.',
        'The rapid evolution of [FIELD] has brought [TOPIC] to the forefront of public discourse.'
      ],
      thesis_statements: {
        agree_disagree: [
          'This essay will argue that [POSITION] due to [REASON 1] and [REASON 2].',
          'I contend that [POSITION], as evidenced by [EVIDENCE 1] and [EVIDENCE 2].',
          'While acknowledging [COUNTER-ARGUMENT], this essay maintains that [POSITION].'
        ],
        discuss_both: [
          'This essay will examine both perspectives before presenting a balanced conclusion.',
          'Both viewpoints merit consideration, and this essay will analyze their respective strengths.',
          'This essay will explore the arguments on both sides of this contentious issue.'
        ],
        advantages_disadvantages: [
          'This essay will evaluate both the benefits and drawbacks of [TOPIC].',
          'While [TOPIC] offers certain advantages, it also presents notable challenges.',
          'This essay will provide a comprehensive analysis of the pros and cons of [TOPIC].'
        ]
      }
    },
    
    body_paragraphs: {
      topic_sentences: [
        'The primary [advantage/argument/reason] is that',
        'Another compelling [point/factor/consideration] is',
        'Perhaps the most significant [aspect/element/dimension] is',
        'Equally important is the fact that'
      ],
      supporting_evidence: [
        'Research indicates that',
        'Statistics demonstrate that',
        'Empirical evidence suggests that',
        'Studies have consistently shown that',
        'Expert opinion supports the view that'
      ],
      examples: [
        'A pertinent example is',
        'This is exemplified by',
        'Consider, for instance,',
        'A case in point is',
        'This can be illustrated through'
      ],
      analysis: [
        'This demonstrates that',
        'The implications of this are',
        'This underscores the importance of',
        'Consequently, it becomes evident that',
        'This analysis reveals that'
      ]
    },
    
    conclusions: {
      summary_phrases: [
        'In conclusion, this essay has demonstrated that',
        'To summarize the key arguments presented',
        'Having examined both perspectives',
        'Based on the analysis provided'
      ],
      final_thoughts: [
        'Moving forward, it is imperative that',
        'The way forward requires',
        'Future considerations should include',
        'Ultimately, the success of [TOPIC] depends on'
      ],
      recommendations: [
        'Therefore, it is recommended that',
        'Policymakers should consider',
        'Stakeholders must prioritize',
        'Society as a whole would benefit from'
      ]
    }
  },

  // Phoenix's Common PTE Topics Vocabulary
  topicSpecificVocabulary: {
    technology: {
      positive: ['innovation', 'efficiency', 'connectivity', 'advancement', 'automation', 'digitalization'],
      negative: ['dependency', 'isolation', 'unemployment', 'privacy concerns', 'digital divide', 'cybersecurity'],
      neutral: ['artificial intelligence', 'digital transformation', 'technological disruption', 'data analytics']
    },
    education: {
      positive: ['empowerment', 'enlightenment', 'skill development', 'critical thinking', 'lifelong learning'],
      negative: ['inequality', 'standardization', 'academic pressure', 'student debt', 'outdated curriculum'],
      neutral: ['pedagogical approaches', 'educational paradigm', 'learning outcomes', 'academic achievement']
    },
    environment: {
      positive: ['sustainability', 'conservation', 'renewable energy', 'biodiversity', 'ecological balance'],
      negative: ['pollution', 'deforestation', 'carbon emissions', 'habitat destruction', 'climate change'],
      neutral: ['environmental policy', 'ecological footprint', 'natural resources', 'ecosystem services']
    },
    health: {
      positive: ['wellness', 'preventive care', 'medical breakthroughs', 'holistic health', 'life expectancy'],
      negative: ['pandemic', 'chronic diseases', 'healthcare disparities', 'antibiotic resistance', 'mental health crisis'],
      neutral: ['public health', 'healthcare systems', 'medical research', 'health outcomes']
    },
    society: {
      positive: ['social cohesion', 'cultural diversity', 'community engagement', 'social progress', 'inclusion'],
      negative: ['inequality', 'discrimination', 'social fragmentation', 'polarization', 'marginalization'],
      neutral: ['social dynamics', 'demographic changes', 'cultural norms', 'societal transformation']
    }
  }
};

// Phoenix's Error Severity Classification
export const PHOENIX_ERROR_SEVERITY = {
  high: {
    description: 'Critical errors that significantly impact score',
    examples: [
      'Off-topic content',
      'Major grammar errors affecting meaning',
      'Severe coherence issues',
      'Word count violations'
    ],
    score_impact: '10-15 points deduction'
  },
  medium: {
    description: 'Noticeable errors that moderately affect score',
    examples: [
      'Basic vocabulary usage',
      'Minor grammar mistakes',
      'Weak transitions',
      'Informal language'
    ],
    score_impact: '5-10 points deduction'
  },
  low: {
    description: 'Minor issues with minimal score impact',
    examples: [
      'Occasional spelling errors',
      'Slight repetition',
      'Minor punctuation issues',
      'Style preferences'
    ],
    score_impact: '1-5 points deduction'
  }
};

// Phoenix's Quick Fix Suggestions
export const PHOENIX_QUICK_FIXES = {
  instant_improvements: [
    {
      issue: 'Contractions (don\'t, won\'t, can\'t)',
      fix: 'Expand all contractions to full forms',
      impact: '+2-3 points immediately'
    },
    {
      issue: 'Starting sentences with And/But/So',
      fix: 'Replace with Furthermore/However/Therefore',
      impact: '+2 points for coherence'
    },
    {
      issue: 'Using "I think/I believe"',
      fix: 'Replace with "It can be argued that"',
      impact: '+1-2 points for academic tone'
    },
    {
      issue: 'Basic vocabulary (good/bad/big/small)',
      fix: 'Use academic alternatives from vocabulary bank',
      impact: '+3-4 points for vocabulary range'
    },
    {
      issue: 'Missing transitions between paragraphs',
      fix: 'Add transition phrases from Phoenix list',
      impact: '+2-3 points for coherence'
    }
  ],
  
  time_saving_tips: [
    'Use Phoenix templates for introduction/conclusion (saves 5 minutes)',
    'Memorize 5 transition phrases for each category',
    'Practice typing Phoenix vocabulary daily (target: 80 WPM)',
    'Keep word count at exactly 250 words (optimal for scoring)'
  ]
};