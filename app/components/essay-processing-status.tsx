"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ProcessingStatusProps {
  status: string;
  queuePosition?: number;
}

export function EssayProcessingStatus({ status, queuePosition }: ProcessingStatusProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(30);

  const steps = [
    { label: 'Essay submitted', status: 'PENDING' },
    { label: 'In queue', status: 'QUEUED' },
    { label: 'AI analysis in progress', status: 'PROCESSING' },
    { label: 'Generating feedback', status: 'PROCESSING' },
    { label: 'Complete', status: 'COMPLETED' }
  ];

  useEffect(() => {
    switch (status) {
      case 'PENDING':
        setCurrentStep(0);
        setProgress(20);
        break;
      case 'QUEUED':
        setCurrentStep(1);
        setProgress(40);
        break;
      case 'PROCESSING':
        setCurrentStep(2);
        setProgress(60);
        // Simulate progress
        const interval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 90));
        }, 2000);
        return () => clearInterval(interval);
      case 'COMPLETED':
        setCurrentStep(4);
        setProgress(100);
        break;
      case 'FAILED':
        setCurrentStep(-1);
        setProgress(0);
        break;
    }
  }, [status]);

  useEffect(() => {
    // Countdown timer
    if (status === 'PROCESSING' || status === 'QUEUED') {
      const timer = setInterval(() => {
        setEstimatedTime(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  if (status === 'FAILED') {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Processing Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            There was an error processing your essay. Please try submitting again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Processing Your Essay</span>
          {estimatedTime > 0 && status !== 'COMPLETED' && (
            <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              ~{estimatedTime}s remaining
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Progress value={progress} className="h-2" />
        
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep || status === 'COMPLETED';
            
            return (
              <div key={index} className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
                <span className={`text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                  {step.status === 'QUEUED' && queuePosition && queuePosition > 0 && (
                    <span className="ml-2 text-xs">
                      (Position {queuePosition} in queue)
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {status === 'PROCESSING' && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              Our AI is analyzing your essay for grammar, coherence, vocabulary, and task achievement. 
              This typically takes 20-40 seconds.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}