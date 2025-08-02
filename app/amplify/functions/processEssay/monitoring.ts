import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: process.env.AWS_REGION });

export class MetricsPublisher {
  private namespace: string;

  constructor(namespace: string = 'PTE-Essay-Checker') {
    this.namespace = namespace;
  }

  async publishMetric(
    metricName: string,
    value: number,
    unit: 'Count' | 'Milliseconds' | 'Percent' = 'Count',
    dimensions?: Record<string, string>
  ) {
    try {
      const params = {
        Namespace: this.namespace,
        MetricData: [{
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: dimensions ? 
            Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })) : 
            []
        }]
      };

      await cloudwatch.putMetricData(params);
    } catch (error) {
      console.error('Failed to publish metric:', error);
    }
  }

  // Common metrics
  async recordProcessingTime(duration: number, status: 'success' | 'failure') {
    await this.publishMetric('EssayProcessingTime', duration, 'Milliseconds', { Status: status });
  }

  async recordError(errorType: string) {
    await this.publishMetric('ProcessingErrors', 1, 'Count', { ErrorType: errorType });
  }

  async recordAIScore(score: number) {
    await this.publishMetric('EssayScores', score, 'Count');
  }

  async recordAILatency(duration: number, model: string) {
    await this.publishMetric('AIInferenceLatency', duration, 'Milliseconds', { Model: model });
  }
}

export const metrics = new MetricsPublisher();

// CloudWatch Alarms configuration (to be deployed via CDK/CloudFormation)
export const alarmConfigurations = {
  highErrorRate: {
    metricName: 'ProcessingErrors',
    threshold: 10,
    evaluationPeriods: 2,
    period: 300, // 5 minutes
    statistic: 'Sum',
    comparisonOperator: 'GreaterThanThreshold'
  },
  highLatency: {
    metricName: 'EssayProcessingTime',
    threshold: 30000, // 30 seconds
    evaluationPeriods: 3,
    period: 60,
    statistic: 'Average',
    comparisonOperator: 'GreaterThanThreshold'
  },
  aiServiceDown: {
    metricName: 'AIInferenceLatency',
    threshold: 1, // At least 1 successful call
    evaluationPeriods: 2,
    period: 300,
    statistic: 'SampleCount',
    comparisonOperator: 'LessThanThreshold'
  }
};