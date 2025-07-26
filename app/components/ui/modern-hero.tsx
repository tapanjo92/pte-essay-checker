"use client";

import { motion } from "framer-motion";
import { ModernButton } from "./modern-button";
import { GradientText } from "./modern-layout";
import { ArrowRight, Sparkles, Zap, Brain } from "lucide-react";

interface ModernHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function ModernHero({
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
}: ModernHeroProps) {
  return (
    <div className="relative px-6 py-24 mx-auto max-w-7xl">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-[120px]" />
        </div>
      </div>

      <div className="relative text-center">
        {/* Subtitle badge */}
        {subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-gray-800/50 rounded-full backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">{subtitle}</span>
            </div>
          </motion.div>
        )}

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
        >
          <GradientText>{title}</GradientText>
        </motion.h1>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto mb-12"
          >
            {description}
          </motion.p>
        )}

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            {primaryAction && (
              <ModernButton
                variant="glow"
                size="lg"
                onClick={primaryAction.onClick}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                {primaryAction.label}
              </ModernButton>
            )}
            {secondaryAction && (
              <ModernButton
                variant="secondary"
                size="lg"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </ModernButton>
            )}
          </motion.div>
        )}

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24"
        >
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Lightning Fast"
            description="Get instant feedback on your essays with our AI-powered analysis"
          />
          <FeatureCard
            icon={<Brain className="w-6 h-6" />}
            title="Smart Analysis"
            description="Advanced algorithms evaluate grammar, coherence, and task response"
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="PTE Optimized"
            description="Specifically designed for PTE Academic essay requirements"
          />
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative p-8 bg-gray-900/50 border border-gray-800/50 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center justify-center w-12 h-12 mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
          <div className="text-blue-400">{icon}</div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </motion.div>
  );
}