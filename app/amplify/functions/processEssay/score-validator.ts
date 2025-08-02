// Score Distribution Validation System
// Ensures scores follow realistic PTE distributions

interface ScoreDistribution {
  '0-30': number;    // Failed
  '31-50': number;   // Poor
  '51-60': number;   // Below Average
  '61-70': number;   // Average
  '71-78': number;   // Above Average
  '79-84': number;   // High
  '85-90': number;   // Exceptional
}

// Expected realistic PTE score distribution based on actual test data
const EXPECTED_DISTRIBUTION: ScoreDistribution = {
  '0-30': 0.05,    // 5% complete failures
  '31-50': 0.15,   // 15% poor performance
  '51-60': 0.20,   // 20% below average
  '61-70': 0.35,   // 35% average (largest group)
  '71-78': 0.17,   // 17% above average
  '79-84': 0.07,   // 7% high achieving
  '85-90': 0.01    // 1% exceptional (very rare)
};

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  scoreAdjustment?: number;
  distribution: ScoreDistribution;
  deviationFromExpected: number;
}

export class ScoreValidator {
  private recentScores: number[] = [];
  private readonly windowSize = 100; // Track last 100 scores
  
  constructor() {
    this.loadHistoricalScores();
  }
  
  private loadHistoricalScores(): void {
    // In production, this would load from DynamoDB
    // For now, initialize with a realistic distribution
    this.recentScores = this.generateRealisticScores(50);
  }
  
  private generateRealisticScores(count: number): number[] {
    const scores: number[] = [];
    const ranges = [
      { min: 0, max: 30, weight: 0.05 },
      { min: 31, max: 50, weight: 0.15 },
      { min: 51, max: 60, weight: 0.20 },
      { min: 61, max: 70, weight: 0.35 },
      { min: 71, max: 78, weight: 0.17 },
      { min: 79, max: 84, weight: 0.07 },
      { min: 85, max: 90, weight: 0.01 }
    ];
    
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let cumulative = 0;
      
      for (const range of ranges) {
        cumulative += range.weight;
        if (rand <= cumulative) {
          scores.push(
            Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
          );
          break;
        }
      }
    }
    
    return scores;
  }
  
  validateScore(score: number, essayQualityIndicators: {
    errorCount: number;
    vocabularyLevel: 'basic' | 'intermediate' | 'advanced';
    coherenceLevel: 'poor' | 'adequate' | 'good' | 'excellent';
    topicRelevance: number;
  }): ValidationResult {
    const warnings: string[] = [];
    let adjustedScore = score;
    
    // 1. Check if score is suspiciously high given quality indicators
    if (score >= 85) {
      if (essayQualityIndicators.errorCount > 5) {
        warnings.push(`Score ${score} seems too high for ${essayQualityIndicators.errorCount} errors`);
        adjustedScore = Math.min(score, 78);
      }
      if (essayQualityIndicators.vocabularyLevel !== 'advanced') {
        warnings.push('Scores 85+ require advanced vocabulary throughout');
        adjustedScore = Math.min(adjustedScore, 82);
      }
      if (essayQualityIndicators.coherenceLevel !== 'excellent') {
        warnings.push('Scores 85+ require excellent coherence');
        adjustedScore = Math.min(adjustedScore, 82);
      }
    }
    
    // 2. Check topic relevance impact
    if (essayQualityIndicators.topicRelevance < 80 && score > 70) {
      warnings.push(`Topic relevance ${essayQualityIndicators.topicRelevance}% limits max score`);
      adjustedScore = Math.min(adjustedScore, 70);
    }
    
    // 3. Update recent scores and check distribution
    this.recentScores.push(adjustedScore);
    if (this.recentScores.length > this.windowSize) {
      this.recentScores.shift();
    }
    
    const currentDistribution = this.calculateDistribution();
    const deviation = this.calculateDeviation(currentDistribution);
    
    // 4. Warn if distribution is skewing too high
    if (currentDistribution['79-84'] + currentDistribution['85-90'] > 0.15) {
      warnings.push('Warning: Recent scores show grade inflation (>15% scoring 79+)');
    }
    
    // 5. Additional validation for extreme scores
    if (score >= 87) {
      warnings.push('Score 87+ is extremely rare (<1% of test takers) - verify exceptional quality');
    }
    
    return {
      isValid: warnings.length === 0,
      warnings,
      scoreAdjustment: adjustedScore !== score ? adjustedScore - score : undefined,
      distribution: currentDistribution,
      deviationFromExpected: deviation
    };
  }
  
  private calculateDistribution(): ScoreDistribution {
    const distribution: ScoreDistribution = {
      '0-30': 0,
      '31-50': 0,
      '51-60': 0,
      '61-70': 0,
      '71-78': 0,
      '79-84': 0,
      '85-90': 0
    };
    
    this.recentScores.forEach(score => {
      if (score <= 30) distribution['0-30']++;
      else if (score <= 50) distribution['31-50']++;
      else if (score <= 60) distribution['51-60']++;
      else if (score <= 70) distribution['61-70']++;
      else if (score <= 78) distribution['71-78']++;
      else if (score <= 84) distribution['79-84']++;
      else distribution['85-90']++;
    });
    
    // Convert to percentages
    const total = this.recentScores.length;
    Object.keys(distribution).forEach(key => {
      distribution[key as keyof ScoreDistribution] = 
        distribution[key as keyof ScoreDistribution] / total;
    });
    
    return distribution;
  }
  
  private calculateDeviation(current: ScoreDistribution): number {
    let totalDeviation = 0;
    
    Object.keys(current).forEach(key => {
      const k = key as keyof ScoreDistribution;
      totalDeviation += Math.abs(current[k] - EXPECTED_DISTRIBUTION[k]);
    });
    
    return totalDeviation;
  }
  
  getDistributionReport(): string {
    const distribution = this.calculateDistribution();
    const deviation = this.calculateDeviation(distribution);
    
    let report = 'Score Distribution Analysis:\n';
    report += '===========================\n';
    report += 'Range    | Actual | Expected | Status\n';
    report += '---------|--------|----------|-------\n';
    
    Object.keys(distribution).forEach(key => {
      const k = key as keyof ScoreDistribution;
      const actual = (distribution[k] * 100).toFixed(1);
      const expected = (EXPECTED_DISTRIBUTION[k] * 100).toFixed(1);
      const diff = distribution[k] - EXPECTED_DISTRIBUTION[k];
      const status = Math.abs(diff) > 0.05 ? '⚠️' : '✓';
      
      report += `${k.padEnd(8)} | ${actual.padStart(5)}% | ${expected.padStart(7)}% | ${status}\n`;
    });
    
    report += '\n';
    report += `Overall Deviation: ${(deviation * 100).toFixed(1)}%\n`;
    report += deviation > 0.2 ? '⚠️ Distribution shows signs of grade inflation\n' : '✓ Distribution appears normal\n';
    
    return report;
  }
  
  suggestScoreAdjustment(currentScore: number, targetPercentile: number): number {
    // Convert percentile to score based on realistic distribution
    if (targetPercentile <= 5) return Math.floor(Math.random() * 31); // 0-30
    if (targetPercentile <= 20) return 31 + Math.floor(Math.random() * 20); // 31-50
    if (targetPercentile <= 40) return 51 + Math.floor(Math.random() * 10); // 51-60
    if (targetPercentile <= 75) return 61 + Math.floor(Math.random() * 10); // 61-70
    if (targetPercentile <= 92) return 71 + Math.floor(Math.random() * 8); // 71-78
    if (targetPercentile <= 99) return 79 + Math.floor(Math.random() * 6); // 79-84
    return 85 + Math.floor(Math.random() * 6); // 85-90
  }
}

// Export singleton instance
export const scoreValidator = new ScoreValidator();

// Validation helper for Lambda
export function validateAndAdjustScore(
  rawScore: number,
  essayAnalysis: any
): { finalScore: number; validationWarnings: string[] } {
  const qualityIndicators = {
    errorCount: essayAnalysis.highlightedErrors?.length || 0,
    vocabularyLevel: determineVocabularyLevel(essayAnalysis),
    coherenceLevel: determineCoherenceLevel(essayAnalysis),
    topicRelevance: essayAnalysis.topicRelevance?.relevanceScore || 100
  };
  
  const validation = scoreValidator.validateScore(rawScore, qualityIndicators);
  
  return {
    finalScore: validation.scoreAdjustment ? rawScore + validation.scoreAdjustment : rawScore,
    validationWarnings: validation.warnings
  };
}

function determineVocabularyLevel(analysis: any): 'basic' | 'intermediate' | 'advanced' {
  const vocabScore = analysis.pteScores?.vocabulary || 0;
  if (vocabScore >= 2) return 'advanced';
  if (vocabScore >= 1) return 'intermediate';
  return 'basic';
}

function determineCoherenceLevel(analysis: any): 'poor' | 'adequate' | 'good' | 'excellent' {
  const coherenceScore = analysis.pteScores?.developmentCoherence || 0;
  if (coherenceScore >= 2) return 'excellent';
  if (coherenceScore >= 1.5) return 'good';
  if (coherenceScore >= 1) return 'adequate';
  return 'poor';
}