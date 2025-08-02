'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface HighlightedError {
  text: string;
  type: 'grammar' | 'vocabulary' | 'coherence' | 'spelling';
  suggestion?: string;
  correction?: string; // Some errors use 'correction' instead of 'suggestion'
  explanation?: string;
  startIndex: number;
  endIndex: number;
  severity?: 'high' | 'medium' | 'low';
}

interface TextSegment {
  text: string;
  isError: boolean;
  error?: HighlightedError;
  key: string;
}

interface HighlightedEssayProps {
  content: string;
  errors?: HighlightedError[];
  className?: string;
}

// Error type styling configuration
const ERROR_STYLES = {
  grammar: {
    className: 'bg-red-100 dark:bg-red-900/30 border-b-2 border-red-400 text-red-800 dark:text-red-200',
    label: 'Grammar Error',
    color: 'red'
  },
  vocabulary: {
    className: 'bg-blue-100 dark:bg-blue-900/30 border-b-2 border-blue-400 text-blue-800 dark:text-blue-200',
    label: 'Vocabulary Enhancement',
    color: 'blue'
  },
  coherence: {
    className: 'bg-purple-100 dark:bg-purple-900/30 border-b-2 border-purple-400 text-purple-800 dark:text-purple-200',
    label: 'Coherence Issue',
    color: 'purple'
  },
  spelling: {
    className: 'bg-orange-100 dark:bg-orange-900/30 border-b-2 border-orange-400 text-orange-800 dark:text-orange-200',
    label: 'Spelling Error',
    color: 'orange'
  }
} as const;

// Tooltip component for error details
interface ErrorTooltipProps {
  error: HighlightedError;
  isVisible: boolean;
  position: { x: number; y: number };
}

function ErrorTooltip({ error, isVisible, position }: ErrorTooltipProps) {
  if (!isVisible) return null;

  const style = ERROR_STYLES[error.type];

  return (
    <div
      className="fixed z-50 max-w-xs p-4 rounded-lg shadow-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      style={{
        left: position.x,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-${style.color}-400`} />
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {style.label}
          </span>
        </div>
        
        <div className="text-sm">
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
            Error: "{error.text}"
          </p>
          <p className="text-green-600 dark:text-green-400 mb-2">
            <strong>Suggestion:</strong> {error.suggestion || error.correction || 'No suggestion available'}
          </p>
          {error.explanation && (
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              <strong>Why:</strong> {error.explanation}
            </p>
          )}
        </div>
      </div>
      
      {/* Tooltip arrow */}
      <div 
        className="absolute left-4 bottom-0 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800"
        style={{ transform: 'translateY(100%)' }}
      />
    </div>
  );
}

export function HighlightedEssay({ content, errors = [], className }: HighlightedEssayProps) {
  const [activeError, setActiveError] = useState<HighlightedError | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Process content into segments with error highlighting
  const segments = useMemo(() => {
    if (!errors.length) {
      return [{ text: content, isError: false, key: 'content-0' }];
    }

    // Sort errors by startIndex to process them in order
    const sortedErrors = [...errors]
      .filter(error => 
        error.startIndex >= 0 && 
        error.endIndex <= content.length && 
        error.startIndex < error.endIndex
      )
      .sort((a, b) => a.startIndex - b.startIndex);

    const segments: TextSegment[] = [];
    let currentIndex = 0;

    sortedErrors.forEach((error, errorIndex) => {
      // Skip if this error overlaps with a previous one
      if (error.startIndex < currentIndex) {
        return;
      }

      // Add text before the error
      if (currentIndex < error.startIndex) {
        segments.push({
          text: content.slice(currentIndex, error.startIndex),
          isError: false,
          key: `text-${errorIndex}-${currentIndex}`
        });
      }

      // Add the error segment
      segments.push({
        text: content.slice(error.startIndex, error.endIndex),
        isError: true,
        error,
        key: `error-${errorIndex}-${error.startIndex}`
      });

      currentIndex = error.endIndex;
    });

    // Add remaining text after all errors
    if (currentIndex < content.length) {
      segments.push({
        text: content.slice(currentIndex),
        isError: false,
        key: `text-final-${currentIndex}`
      });
    }

    console.log('[HighlightedEssay] Segments created:', {
      totalSegments: segments.length,
      errorSegments: segments.filter(s => s.isError).length,
      lastErrorEnd: sortedErrors[sortedErrors.length - 1]?.endIndex,
      contentLength: content.length,
      remainingText: currentIndex < content.length ? content.length - currentIndex : 0
    });

    return segments;
  }, [content, errors]);

  const handleErrorHover = (error: HighlightedError, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setActiveError(error);
  };

  const handleErrorLeave = () => {
    setActiveError(null);
  };

  if (!errors.length) {
    // Fallback to plain text if no errors
    return (
      <div className={cn("prose prose-lg dark:prose-invert max-w-none", className)}>
        <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
          {content}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative prose prose-lg dark:prose-invert max-w-none", className)}>
      <div className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
        {segments.map((segment) => {
          if (!segment.isError) {
            return (
              <span key={segment.key}>
                {segment.text}
              </span>
            );
          }

          const errorStyle = ERROR_STYLES[segment.error!.type];
          
          return (
            <span
              key={segment.key}
              className={cn(
                'cursor-help rounded-sm px-1 py-0.5 transition-all duration-200 hover:shadow-sm',
                errorStyle.className
              )}
              onMouseEnter={(e) => handleErrorHover(segment.error!, e)}
              onMouseLeave={handleErrorLeave}
              title={`${errorStyle.label}: ${segment.error!.suggestion || segment.error!.correction || 'View details'}`}
            >
              {segment.text}
            </span>
          );
        })}
      </div>

      {/* Error Tooltip */}
      {activeError && (
        <ErrorTooltip
          error={activeError}
          isVisible={!!activeError}
          position={tooltipPosition}
        />
      )}

      {/* Error Legend */}
      {errors.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Error Types Found ({errors.length} total)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(ERROR_STYLES).map(([type, style]) => {
              const count = errors.filter(e => e.type === type).length;
              if (count === 0) return null;
              
              return (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <div className={`w-3 h-3 rounded-full bg-${style.color}-400`} />
                  <span className="text-gray-700 dark:text-gray-300">
                    {style.label} ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default HighlightedEssay;