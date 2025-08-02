"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Clock, Target, Brain, ArrowRight, CheckCircle, Zap } from "lucide-react";
import { Button } from "./button";
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
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-2xl"
          >
            <div className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden mx-4">
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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4"
                  >
                    <Zap className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome{userName ? `, ${userName}` : ''} to PTE Essay Checker! 🎉
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Your AI-powered companion for mastering PTE Academic essays
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
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
                    </motion.div>
                  ))}
                </div>

                {/* Quick Tips */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-6"
                >
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
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex justify-center"
                >
                  <Button
                    variant="glow"
                    size="lg"
                    onClick={onClose}
                    icon={<ArrowRight className="w-5 h-5" />}
                  >
                    Start Writing My First Essay
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}