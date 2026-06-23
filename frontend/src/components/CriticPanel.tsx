"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, RefreshCw, Star } from "lucide-react";

interface CriticPanelProps {
  feedback: string;
  onReRun?: () => void;
  isLoading?: boolean;
}

export default function CriticPanel({ feedback, onReRun, isLoading = false }: CriticPanelProps) {
  const [parsed, setParsed] = useState({
    score: 0,
    strengths: [] as string[],
    improvements: [] as string[],
    verdict: "",
  });

  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    // Parse the feedback string
    const parseFeedback = (text: string) => {
      let score = 0;
      const strengths: string[] = [];
      const improvements: string[] = [];
      let verdict = "";

      if (!text) return { score, strengths, improvements, verdict };

      // Extract score
      const scoreMatch = text.match(/Score:\s*([\d\.]+)\/10/i);
      if (scoreMatch) {
        score = parseFloat(scoreMatch[1]);
      }

      const cleanText = text.replace(/\r\n/g, "\n");
      const strengthsMatch = cleanText.match(/Strengths:([\s\S]*?)(Areas to Improve:|One line verdict:|$)/i);
      const improvementsMatch = cleanText.match(/Areas to Improve:([\s\S]*?)(One line verdict:|Strengths:|$)/i);
      const verdictMatch = cleanText.match(/One line verdict:([\s\S]*)/i);

      const parseBullets = (sectionText: string) => {
        if (!sectionText) return [];
        return sectionText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("-") || line.startsWith("*"))
          .map((line) => line.replace(/^[\-\*\s]+/, "").trim());
      };

      if (strengthsMatch && strengthsMatch[1]) {
        strengths.push(...parseBullets(strengthsMatch[1]));
      }
      if (improvementsMatch && improvementsMatch[1]) {
        improvements.push(...parseBullets(improvementsMatch[1]));
      }
      if (verdictMatch && verdictMatch[1]) {
        verdict = verdictMatch[1].replace(/^[\-\*\s\r\n\:]+/, "").trim();
      }

      // Fallback
      if (strengths.length === 0 && improvements.length === 0 && !verdict) {
        verdict = text;
      }

      return { score, strengths, improvements, verdict };
    };

    const result = parseFeedback(feedback);
    setParsed(result);

    // Animate score number
    let start = 0;
    const target = result.score;
    const duration = 1200; // ms
    const interval = 25; // ms
    const steps = duration / interval;
    const increment = target / steps;

    if (target > 0) {
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCurrentScore(target);
          clearInterval(timer);
        } else {
          setCurrentScore(Math.round(start * 10) / 10);
        }
      }, interval);
      return () => clearInterval(timer);
    } else {
      setCurrentScore(0);
    }
  }, [feedback]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius; // 251.32
  const strokeDashoffset = circumference - (circumference * parsed.score) / 10;

  const listContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const listItem = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <div className="w-full bg-card border border-border-custom rounded-2xl p-6 shadow-md flex flex-col items-center">
      <div className="flex items-center space-x-2 self-start pb-4 border-b border-border-custom w-full mb-6">
        <Star className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-bold text-text">Critic Evaluation</h3>
      </div>

      {/* Circular Progress Ring */}
      <div className="relative flex items-center justify-center w-36 h-36 mb-6">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="var(--border-custom)"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Foreground circle */}
          <motion.circle
            cx="72"
            cy="72"
            r={radius}
            stroke="var(--accent)"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-3xl font-extrabold text-text"
          >
            {currentScore}
          </motion.span>
          <span className="text-[10px] uppercase font-bold text-text-muted">of 10 points</span>
        </div>
      </div>

      {/* Strengths */}
      {parsed.strengths.length > 0 && (
        <div className="w-full mb-5 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-success mb-2.5 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Strengths</span>
          </h4>
          <motion.ul
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {parsed.strengths.map((str, idx) => (
              <motion.li
                key={idx}
                variants={listItem}
                className="text-xs text-text/90 flex items-start space-x-2 leading-relaxed"
              >
                <span className="text-success select-none mt-1">•</span>
                <span>{str}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      )}

      {/* Areas to Improve */}
      {parsed.improvements.length > 0 && (
        <div className="w-full mb-6 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-2.5 flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Areas to Improve</span>
          </h4>
          <motion.ul
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {parsed.improvements.map((imp, idx) => (
              <motion.li
                key={idx}
                variants={listItem}
                className="text-xs text-text/90 flex items-start space-x-2 leading-relaxed"
              >
                <span className="text-orange-500 select-none mt-1">•</span>
                <span>{imp}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      )}

      {/* Verdict */}
      {parsed.verdict && (
        <div className="w-full bg-accent/5 border border-accent/10 rounded-xl p-4 mb-6 text-center shadow-inner">
          <p className="text-xs italic text-accent font-medium leading-relaxed">
            &ldquo;{parsed.verdict}&rdquo;
          </p>
        </div>
      )}

      {/* Action Button */}
      {onReRun && (
        <button
          onClick={onReRun}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl border border-border-custom bg-card hover:bg-bg text-xs font-bold text-text transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Re-running..." : "Re-run Critic"}</span>
        </button>
      )}
    </div>
  );
}
