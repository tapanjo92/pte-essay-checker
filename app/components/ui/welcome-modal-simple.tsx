"use client";

import { X, Sparkles, Clock, Target, Brain, ArrowRight, CheckCircle, Zap } from "lucide-react";
import { ModernButton } from "./modern-button";
import { useEffect } from "react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  essaysRemaining?: number;
}

export function WelcomeModal({ isOpen, onClose, userName, essaysRemaining = 5 }: WelcomeModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const features = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: "20-Minute Timer",
      description: "Simulates real PTE exam conditions with automatic submission"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "AI-Powered Analysis",
      description: "Get instant feedback on grammar, coherence, and task response"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "PTE Scoring Criteria",
      description: "Evaluation based on official PTE Academic standards"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: `${essaysRemaining} Free Essays`,
      description: "Start practicing immediately with your free evaluations"
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[2001] w-full max-w-2xl px-4">
        <div className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Gradient decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Content */}
          <div className="relative p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-2">
                Welcome{userName ? `, ${userName}` : ''} to PTE Essay Checker! 🎉
              </h2>
              <p className="text-gray-400 text-lg">
                Your AI-powered companion for mastering PTE Academic essays
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                      <div className="text-blue-400">{feature.icon}</div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Quick Tips for Success
              </h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Write 200-300 words for optimal scoring</li>
                <li>• The timer starts when you begin typing</li>
                <li>• You can save drafts and resume later</li>
                <li>• Review detailed feedback after submission</li>
              </ul>
            </div>

            {/* CTA */}
            <div className="flex justify-center">
              <ModernButton
                variant="glow"
                size="lg"
                onClick={onClose}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Start Writing My First Essay
              </ModernButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}